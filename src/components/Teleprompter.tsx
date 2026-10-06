import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { en } from '../i18n/en';
import { useFullscreen } from '../hooks/useFullscreen';
import { useWakeLock } from '../hooks/useWakeLock';
import {
  getScriptTypographyStyle,
  isRotatedSideways,
} from '../lib/textAppearance';
import type { AppSettings, TeleprompterMode, VoiceStatusType } from '../lib/types';
import {
  matchSpokenWords,
  tokenizeScript,
  TranscriptBuffer,
} from '../matching/scriptMatcher';
import {
  getReadingLineY,
  ManualScroller,
  scrollToTokenElement,
} from '../scroll/scrollController';
import {
  MAX_WORDS_PER_MINUTE,
  MIN_WORDS_PER_MINUTE,
  wordsPerMinuteToPixelsPerSecond,
} from '../scroll/scrollSpeed';
import {
  isSpeechRecognitionSupported,
  VoiceRecognizer,
} from '../speech/speechRecognition';
import { VoiceStatus } from './VoiceStatus';
import styles from './Teleprompter.module.css';

interface Props {
  script: string;
  settings: AppSettings;
  onExit: () => void;
}

const CONTROLS_HIDE_MS = 4000;
const WPM_STEP = 5;

export function Teleprompter({ script, settings, onExit }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const manualScroller = useRef(new ManualScroller());
  const recognizerRef = useRef<VoiceRecognizer | null>(null);
  const transcriptRef = useRef(new TranscriptBuffer());
  const tokenIndexRef = useRef(0);
  const hideTimerRef = useRef<number | null>(null);
  const listeningRef = useRef(false);
  const applyMatchRef = useRef<(text?: string) => void>(() => {});
  const manualRunningRef = useRef(false);

  const tokens = useMemo(() => tokenizeScript(script), [script]);
  const speechSupported = isSpeechRecognitionSupported();

  const [mode, setMode] = useState<TeleprompterMode>('manual');
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatusType>('idle');
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
  const [highlightFromIndex, setHighlightFromIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [listening, setListening] = useState(false);
  const [manualRunning, setManualRunning] = useState(false);
  const [sessionWpm, setSessionWpm] = useState(settings.scrollWordsPerMinute);
  const [awaitingListenTap, setAwaitingListenTap] = useState(false);
  const [lastHeard, setLastHeard] = useState('');
  const [speechHint, setSpeechHint] = useState<string | null>(null);

  const { toggle: toggleFullscreen } = useFullscreen();
  const wakeLock = useWakeLock();

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, CONTROLS_HIDE_MS);
  }, []);

  useEffect(() => {
    showControls();
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [showControls]);

  const scrollToIndex = useCallback((index: number, smooth = true) => {
    const container = containerRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(
      `[data-token-index="${index}"]`,
    );
    if (el) scrollToTokenElement(container, el, smooth);
  }, []);

  const syncHighlightFromScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const guideY = getReadingLineY(container);
    const containerRect = container.getBoundingClientRect();
    const wordEls = container.querySelectorAll<HTMLElement>('[data-token-index]');
    let bestIdx = tokenIndexRef.current;
    let bestDist = Infinity;
    wordEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const centerY = rect.top - containerRect.top + rect.height / 2;
      const dist = Math.abs(centerY - guideY);
      const idx = Number(el.dataset.tokenIndex);
      if (!Number.isNaN(idx) && dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });
    if (bestIdx !== tokenIndexRef.current) {
      tokenIndexRef.current = bestIdx;
      setCurrentTokenIndex(bestIdx);
      setHighlightFromIndex(Math.max(0, bestIdx - 2));
    }
  }, []);

  const pixelsPerSecond = useCallback(() => {
    const width = containerRef.current?.clientWidth ?? window.innerWidth;
    return wordsPerMinuteToPixelsPerSecond(
      sessionWpm,
      settings.fontSize,
      settings.lineHeight,
      settings.textWidthPercent,
      width,
    );
  }, [
    sessionWpm,
    settings.fontSize,
    settings.lineHeight,
    settings.textWidthPercent,
  ]);

  const applyMatch = useCallback(
    (heardText?: string) => {
      if (heardText !== undefined) {
        setLastHeard(heardText);
      }
      const words = transcriptRef.current.getMatchWords();
      if (!words.length) return;
      setVoiceStatus('finding-position');
      const result = matchSpokenWords(tokens, words, tokenIndexRef.current);
      if (!result) {
        if (listeningRef.current) setVoiceStatus('listening');
        return;
      }
      if (result.tokenIndex >= tokenIndexRef.current) {
        tokenIndexRef.current = result.tokenIndex;
        setCurrentTokenIndex(result.tokenIndex);
        setHighlightFromIndex(result.highlightFrom);
        scrollToIndex(result.tokenIndex);
      }
      setVoiceStatus('listening');
    },
    [tokens, scrollToIndex],
  );

  useEffect(() => {
    applyMatchRef.current = applyMatch;
  }, [applyMatch]);

  const stopManual = useCallback(() => {
    manualScroller.current.stop();
    manualRunningRef.current = false;
    setManualRunning(false);
    if (mode === 'manual') setVoiceStatus('paused');
  }, [mode]);

  const stopVoice = useCallback(() => {
    recognizerRef.current?.stop();
    recognizerRef.current = null;
    listeningRef.current = false;
    setListening(false);
    if (mode === 'voice') setVoiceStatus('paused');
  }, [mode]);

  const startVoice = useCallback((): boolean => {
    if (!speechSupported) {
      setVoiceStatus('speech-unavailable');
      setSpeechHint(en.speechUnavailableHint);
      return false;
    }

    stopManual();
    if (recognizerRef.current) stopVoice();
    setSpeechHint(null);
    const rec = new VoiceRecognizer(settings.speechLanguage);
    recognizerRef.current = rec;
    const started = rec.start({
      onStart: () => {
        listeningRef.current = true;
        setListening(true);
        setVoiceStatus('listening');
        setAwaitingListenTap(false);
      },
      onInterim: (text) => {
        transcriptRef.current.setInterim(text);
        applyMatchRef.current(text);
      },
      onFinal: (text) => {
        transcriptRef.current.pushFinal(text);
        applyMatchRef.current(text);
      },
      onError: (err) => {
        if (err === 'aborted' || err === 'no-speech') return;
        if (err === 'not-allowed') {
          setVoiceStatus('mic-unavailable');
          setSpeechHint(en.micDeniedHint);
          setAwaitingListenTap(true);
          stopVoice();
          return;
        }
        if (err === 'network') {
          setSpeechHint(en.speechErrorNetwork);
        } else {
          setSpeechHint(`${en.speechErrorGeneric} (${err})`);
        }
        setVoiceStatus('paused');
        setAwaitingListenTap(true);
        stopVoice();
      },
      onEnd: () => {
        if (recognizerRef.current === rec && listeningRef.current) {
          setVoiceStatus('listening');
        }
      },
    });

    if (!started) {
      setVoiceStatus('speech-unavailable');
      setSpeechHint(en.speechUnavailableHint);
      setAwaitingListenTap(true);
      return false;
    }
    setMode('voice');
    return true;
  }, [settings.speechLanguage, speechSupported, stopManual, stopVoice]);

  const startManual = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    stopVoice();
    stopManual();
    manualScroller.current.start(
      container,
      pixelsPerSecond(),
      () => {
        showControls();
        syncHighlightFromScroll();
      },
    );
    manualRunningRef.current = true;
    setManualRunning(true);
    setMode('manual');
    setVoiceStatus('scrolling');
  }, [pixelsPerSecond, showControls, stopManual, stopVoice, syncHighlightFromScroll]);

  const adjustWpm = useCallback(
    (delta: number) => {
      setSessionWpm((wpm) => {
        const next = Math.min(
          MAX_WORDS_PER_MINUTE,
          Math.max(MIN_WORDS_PER_MINUTE, wpm + delta),
        );
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    if (manualRunningRef.current) {
      startManual();
    }
    // Re-start scroller when speed changes mid-session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionWpm]);

  const restart = useCallback(() => {
    tokenIndexRef.current = 0;
    setCurrentTokenIndex(0);
    setHighlightFromIndex(0);
    transcriptRef.current.reset();
    containerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    if (mode === 'manual') startManual();
  }, [mode, startManual]);

  const stopTeleprompter = useCallback(() => {
    stopVoice();
    stopManual();
    void wakeLock.release();
    onExit();
  }, [onExit, stopManual, stopVoice, wakeLock]);

  useLayoutEffect(() => {
    void wakeLock.request();
    startManual();
  }, []);

  useEffect(() => {
    return () => {
      stopVoice();
      stopManual();
      void wakeLock.release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- session lifecycle
  }, []);

  const renderScript = () => {
    if (!tokens.length) {
      return <p className={styles.empty}>{script}</p>;
    }
    const parts: ReactNode[] = [];
    let lastEnd = 0;
    tokens.forEach((t, i) => {
      if (t.startChar > lastEnd) {
        parts.push(
          <span key={`ws-${i}`}>{script.slice(lastEnd, t.startChar)}</span>,
        );
      }
      const inHighlight =
        i >= highlightFromIndex && i <= currentTokenIndex;
      const isCurrent = i === currentTokenIndex;
      parts.push(
        <span
          key={`t-${i}`}
          data-token-index={i}
          className={
            isCurrent
              ? styles.wordCurrent
              : inHighlight
                ? styles.wordHighlighted
                : styles.word
          }
          style={
            inHighlight
              ? {
                  backgroundColor: settings.highlightColor,
                  color: settings.fontColor,
                }
              : { color: settings.fontColor }
          }
        >
          {t.raw}
        </span>,
      );
      lastEnd = t.endChar;
    });
    if (lastEnd < script.length) {
      parts.push(<span key="tail">{script.slice(lastEnd)}</span>);
    }
    return parts;
  };

  const textStyle = {
    ...getScriptTypographyStyle(settings),
    color: settings.fontColor,
  };
  const sideways = isRotatedSideways(settings.textRotation);
  const showReadingGuide = settings.textRotation === 0;

  return (
    <div
      ref={rootRef}
      className={styles.root}
      style={{ backgroundColor: settings.backgroundColor }}
      onPointerDown={showControls}
    >
      {awaitingListenTap && mode === 'voice' && !listening && (
        <div className={styles.listenOverlay}>
          <button
            type="button"
            className={styles.listenOverlayBtn}
            onClick={() => startVoice()}
          >
            {en.tapToListen}
          </button>
          <p className={styles.listenOverlayHint}>{en.tapToListenHint}</p>
        </div>
      )}

      {showReadingGuide && (
        <div className={styles.readingGuide} aria-hidden />
      )}

      <div
        ref={containerRef}
        className={`${styles.scrollContainer} ${sideways ? styles.scrollSideways : ''}`}
      >
        <div className={sideways ? styles.padTopSideways : styles.padTop} />
        <div className={styles.scriptStage}>
          <div
            className={`${styles.scriptColumn} ${sideways ? styles.scriptSideways : ''} ${settings.textRotation === 180 ? styles.scriptUpsideDown : ''}`}
            style={textStyle}
          >
            {renderScript()}
          </div>
        </div>
        <div className={sideways ? styles.padBottomSideways : styles.padBottom} />
      </div>

      <div
        className={`${styles.toolbar} ${controlsVisible ? styles.toolbarVisible : ''}`}
      >
        <VoiceStatus status={voiceStatus} />
        {mode === 'manual' ? (
          <p className={styles.heardHint}>
            {manualRunning ? en.autoScrolling : en.scrollPaused} —{' '}
            <strong>{sessionWpm} wpm</strong>
          </p>
        ) : (
          <p className={styles.heardHint}>
            {listening ? en.voiceFollowHint : en.tapToListenHint}
            {lastHeard ? ` Heard: “${lastHeard.trim()}”` : ''}
          </p>
        )}

        <div className={styles.toolbarRow}>
          {mode === 'manual' ? (
            <>
              {!manualRunning ? (
                <button type="button" onClick={startManual}>
                  {en.resume}
                </button>
              ) : (
                <button type="button" onClick={stopManual}>
                  {en.pause}
                </button>
              )}
              <button type="button" onClick={() => adjustWpm(-WPM_STEP)}>
                {en.scrollSlower}
              </button>
              <button type="button" onClick={() => adjustWpm(WPM_STEP)}>
                {en.scrollFaster}
              </button>
            </>
          ) : (
            <>
              {!listening ? (
                <button type="button" onClick={() => startVoice()}>
                  {en.listen}
                </button>
              ) : (
                <button type="button" onClick={stopVoice}>
                  {en.pause}
                </button>
              )}
            </>
          )}

          <button type="button" onClick={restart}>
            {en.restart}
          </button>
        </div>

        <div className={styles.toolbarRow}>
          <button
            type="button"
            onClick={() => {
              if (mode === 'voice') {
                stopVoice();
                startManual();
              } else {
                stopManual();
                setAwaitingListenTap(true);
                startVoice();
              }
            }}
          >
            {mode === 'manual' ? en.voiceMode : en.manualMode}
          </button>
          <button
            type="button"
            onClick={() => {
              containerRef.current &&
                (containerRef.current.scrollTop -= 80);
            }}
          >
            {en.scrollUp}
          </button>
          <button
            type="button"
            onClick={() => {
              containerRef.current &&
                (containerRef.current.scrollTop += 80);
            }}
          >
            {en.scrollDown}
          </button>
          <button
            type="button"
            onClick={() => rootRef.current && void toggleFullscreen(rootRef.current)}
          >
            {en.fullscreen}
          </button>
        </div>

        {speechHint && <p className={styles.hint}>{speechHint}</p>}
      </div>

      <div className={styles.stopBar}>
        <button
          type="button"
          className={styles.stopTeleprompterBtn}
          onClick={stopTeleprompter}
        >
          {en.stopTeleprompter}
        </button>
      </div>
    </div>
  );
}
