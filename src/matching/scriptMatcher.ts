import type { MatchResult, ScriptToken } from '../lib/types';

/** Strip punctuation while keeping letters from Latin and Cyrillic scripts. */
const PUNCT_RE = /[^\p{L}\p{N}']/gu;

export function normalizeWord(word: string): string {
  return word.replace(PUNCT_RE, '').toLowerCase();
}

/**
 * Split script into word tokens with character offsets for scroll anchoring.
 * Whitespace-separated; empty tokens are skipped.
 */
export function tokenizeScript(script: string): ScriptToken[] {
  const tokens: ScriptToken[] = [];
  const re = /\S+/g;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = re.exec(script)) !== null) {
    const raw = match[0];
    const normalized = normalizeWord(raw);
    if (!normalized) continue;
    tokens.push({
      index: index++,
      raw,
      normalized,
      startChar: match.index,
      endChar: match.index + raw.length,
    });
  }
  return tokens;
}

/** Tokenize a recognition transcript (may be partial). */
export function tokenizeTranscript(transcript: string): string[] {
  return transcript
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);
}

function wordSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const maxLen = Math.max(a.length, b.length);
  let matches = 0;
  const minLen = Math.min(a.length, b.length);
  for (let i = 0; i < minLen; i++) {
    if (a[i] === b[i]) matches++;
  }
  let dist = maxLen - matches;
  for (let i = minLen; i < a.length; i++) dist++;
  for (let i = minLen; i < b.length; i++) dist++;
  return 1 - dist / maxLen;
}

const MIN_WORD_SCORE = 0.55;
const LOOK_AHEAD = 150;
const MIN_ANCHOR_WORDS = 2;

function clampHighlightFrom(from: number, to: number): number {
  return Math.max(0, Math.min(from, to));
}

/** Match the last spoken word at the nearest token at/after `fromIndex`. */
function matchLastWordForward(
  scriptTokens: ScriptToken[],
  lastWord: string,
  fromIndex: number,
): MatchResult | null {
  const end = Math.min(
    scriptTokens.length - 1,
    fromIndex + LOOK_AHEAD,
  );
  for (let i = fromIndex; i <= end; i++) {
    const sim = wordSimilarity(lastWord, scriptTokens[i].normalized);
    if (sim >= MIN_WORD_SCORE) {
      return {
        tokenIndex: i,
        highlightFrom: clampHighlightFrom(i - 1, i),
        confidence: sim,
      };
    }
  }
  return null;
}

/**
 * Find the best forward position in the script that aligns with spoken words.
 * Searches from lastKnownIndex forward only (no backward jumps from duplicates).
 */
export function matchSpokenWords(
  scriptTokens: ScriptToken[],
  spokenWords: string[],
  lastKnownIndex: number,
): MatchResult | null {
  if (!spokenWords.length || !scriptTokens.length) return null;

  const tailWords = spokenWords.slice(-6);
  const startSearch = Math.max(0, lastKnownIndex);
  const endSearch = Math.min(
    scriptTokens.length - 1,
    startSearch + LOOK_AHEAD,
  );
  const minAnchor = lastKnownIndex <= 0 ? 1 : MIN_ANCHOR_WORDS;

  let bestIndex = -1;
  let bestFrom = 0;
  let bestScore = 0;

  for (let scriptPos = startSearch; scriptPos <= endSearch; scriptPos++) {
    let score = 0;
    let matched = 0;
    for (let k = 0; k < tailWords.length; k++) {
      const scriptIdx = scriptPos + k;
      if (scriptIdx >= scriptTokens.length) break;
      const sim = wordSimilarity(
        tailWords[k],
        scriptTokens[scriptIdx].normalized,
      );
      if (sim >= MIN_WORD_SCORE) {
        score += sim;
        matched++;
      }
    }
    if (matched < minAnchor) continue;

    const tailStart = Math.max(0, tailWords.length - MIN_ANCHOR_WORDS);
    let tailMatched = 0;
    for (let k = tailStart; k < tailWords.length; k++) {
      const scriptIdx = scriptPos + k;
      if (scriptIdx >= scriptTokens.length) break;
      if (
        wordSimilarity(tailWords[k], scriptTokens[scriptIdx].normalized) >=
        MIN_WORD_SCORE
      ) {
        tailMatched++;
      }
    }
    if (tailMatched < 1) continue;

    const normalizedScore = score / tailWords.length + tailMatched * 0.12;
    if (normalizedScore > bestScore) {
      bestScore = normalizedScore;
      bestIndex = scriptPos + tailWords.length - 1;
      bestFrom = scriptPos;
    }
  }

  if (bestIndex >= 0) {
    const confidence = Math.min(1, bestScore);
    const minConfidence = lastKnownIndex <= 0 ? 0.22 : 0.3;
    if (confidence >= minConfidence) {
      const clampedIndex =
        lastKnownIndex > 0 && bestIndex < lastKnownIndex
          ? lastKnownIndex
          : bestIndex;
      const clampedFrom =
        lastKnownIndex > 0 && bestFrom < lastKnownIndex
          ? lastKnownIndex
          : bestFrom;
      return {
        tokenIndex: clampedIndex,
        highlightFrom: clampHighlightFrom(clampedFrom, clampedIndex),
        confidence,
      };
    }
  }

  const lastWord = tailWords[tailWords.length - 1];
  if (lastWord) {
    const fallback = matchLastWordForward(
      scriptTokens,
      lastWord,
      startSearch,
    );
    if (fallback && fallback.tokenIndex >= lastKnownIndex) {
      return fallback;
    }
  }

  return null;
}

/** Rolling buffer of recent final + interim words for matching. */
export class TranscriptBuffer {
  private finals: string[] = [];
  private interim = '';

  pushFinal(text: string): void {
    const words = tokenizeTranscript(text);
    if (words.length) this.finals.push(...words);
    this.interim = '';
    const maxKeep = 32;
    if (this.finals.length > maxKeep) {
      this.finals = this.finals.slice(-maxKeep);
    }
  }

  setInterim(text: string): void {
    this.interim = text;
  }

  /** Words used for position matching (recent finals + interim). */
  getMatchWords(): string[] {
    const interimWords = tokenizeTranscript(this.interim);
    const recentFinals = this.finals.slice(-16);
    const combined = [...recentFinals, ...interimWords];
    return combined.slice(-10);
  }

  reset(): void {
    this.finals = [];
    this.interim = '';
  }
}
