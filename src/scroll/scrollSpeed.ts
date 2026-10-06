/** Typical conversational / presentation speaking rate. */
export const DEFAULT_WORDS_PER_MINUTE = 140;
export const MIN_WORDS_PER_MINUTE = 70;
export const MAX_WORDS_PER_MINUTE = 220;

/**
 * Convert words-per-minute into vertical scroll speed (px/s) from typography.
 * Estimates words per line from column width and font size.
 */
export function wordsPerMinuteToPixelsPerSecond(
  wpm: number,
  fontSize: number,
  lineHeight: number,
  textWidthPercent: number,
  viewportWidth: number,
): number {
  const columnWidth = viewportWidth * (textWidthPercent / 100);
  const avgCharWidth = fontSize * 0.52;
  const charsPerLine = Math.max(16, columnWidth / avgCharWidth);
  const avgWordChars = 5.5;
  const wordsPerLine = Math.max(2.5, charsPerLine / avgWordChars);
  const linePx = fontSize * lineHeight;
  const pxPerWord = linePx / wordsPerLine;
  return (wpm / 60) * pxPerWord;
}
