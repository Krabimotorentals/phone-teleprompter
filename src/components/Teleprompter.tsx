import {
  type ReactNode,
  useCallback,
  useEffect,
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
import { consumeVoicePrimedFromGesture } from '../lib/voiceGesture';
import type { AppSettings, TeleprompterMode, VoiceStatusType } from '../lib/types';
import {
  matchSpokenWords,
  tokenizeScript,
  TranscriptBuffer,
} from '../matching/scriptMatcher';
import { ManualScroller, scrollToTokenElement } from '../scroll/scrollController';
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

export function Teleprompter({ script, settings, onExit }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const manualScroller = useRef(new ManualScroller());
  const recognizerRef = useRef<VoiceRecognizer | null>(null);
  const transcriptRef = useRef(new TranscriptBuffer());
  const tokenIndexRef = useRef(0);
  const hideTimerRef = useRef<number | null>(null);
  const listeningRef = useRef(false);

  const tokens = useMemo(() => tokenizeScript(script), [script]);
  const speechSupported = isSpeechRecognitionSupported();

  const [mode, setMode] = useState<TeleprompterMode>(() =>
    speechSupported ? 'voice' : 'manual',
  );
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatusType>(() =>
    speechSupported ? 'idle' : 'speech-unavailable',
  );
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [listening, setListening] = useState(false);
  const [manualRunning, setManualRunning] = useState(false);
  const [awaitingListenTap, setAwaitingListenTap] = useState(
    () => speechSupported,
  );
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

  const applyMatch = useCallback(() => {
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
      scrollToIndex(result.tokenIndex);
    }
    setVoiceStatus('listening');
  }, [tokens, scrollToIndex]);

  const stopVoice = useCallback(() => {
    recognizerRef.current?.stop();
    recognizerRef.current = null;
    listeningRef.current = false;
    setListening(false);
    setVoiceStatus('paused');
  }, []);

  const startVoice = useCallback((): boolean => {
    if (!speechSupported) {
      setVoiceStatus('speech-unavailable');
      setMode('manual');
      setAwaitingListenTap(false);
      return false;
    }

    stopVoice();
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
        setLastHeard(text);
        transcriptRef.current.setInterim(text);
        applyMatch();
      },
      onFinal: (text) => {
        setLastHeard(text);
        transcriptRef.current.pushFinal(text);
        applyMatch();
      },
      onError: (err) => {
        if (err === 'aborted' || err === 'no-speech') return;
        if (err === 'not-allowed') {
          setVoiceStatus('mic-unavailable');
          setSpeechHint(en.micDeniedHint);
          setMode('manual');
          setAwaitingListenTap(true);
          stopVoice();
          return;
        }
        if (err === 'network') {
          setSpeechHint(en.speechErrorNetwork);
        } else {
          setSpeechHint(en.speechErrorGeneric);
        }
        setVoiceStatus('paused');
        setAwaitingListenTap(true);
        stopVoice();
      },
      onEnd: () => {
        if (recognizerRef.current === rec && listeningRef.current) {
          setVoiceStatus('paused');
        }
      },
    });

    if (!started) {
      setVoiceStatus('speech-unavailable');
      setMode('manual');
      setAwaitingListenTap(false);
      return false;
    }

    return true;
  }, [applyMatch, settings.speechLanguage, speechSupported, stopVoice]);

  const stopManual = useCallback(() => {
    manualScroller.current.stop();
    setManualRunning(false);
  }, []);

  const startManual = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    stopManual();
    manualScroller.current.start(
      container,
      settings.manualScrollSpeed,
      showControls,
    );
    setManualRunning(true);
    setVoiceStatus('paused');
  }, [settings.manualScrollSpeed, showControls, stopManual]);

  const restart = useCallback(() => {
    tokenIndexRef.current = 0;
    setCurrentTokenIndex(0);
    transcriptRef.current.reset();
    containerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    void wakeLock.request();
    if (mode === 'voice' && speechSupported) {
      consumeVoicePrimedFromGesture();
      const started = startVoice();
      if (!started) setAwaitingListenTap(true);
    } else {
      setAwaitingListenTap(false);
    }
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
      const isCurrent =
        i === currentTokenIndex ||
        (i >= currentTokenIndex - 2 && i <= currentTokenIndex);
      parts.push(
        <span
          key={`t-${i}`}
          data-token-index={i}
          className={isCurrent ? styles.wordCurrent : styles.word}
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

  const textStyle = getScriptTypographyStyle(settings);
  const sideways = isRotatedSideways(settings.textRotation);
  const showReadingGuide = settings.textRotation === 0;

  return (
    <div
      ref={rootRef}
      className={styles.root}
      style={{ backgroundColor: settings.backgroundColor }}
      onPointerDown={showControls}
    >
      {awaitingListenTap && mode === 'voice' && (
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
        {mode === 'voice' && listening && (
          <p className={styles.heardHint}>
            {en.voiceFollowHint}
            {lastHeard ? ` Heard: “${lastHeard.trim()}”` : ''}
          </p>
        )}

        <div className={styles.toolbarRow}>
          {mode === 'voice' ? (
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
          ) : (
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
            </>
          )}

          <button type="button" onClick={restart}>
            {en.restart}
          </button>
          <button type="button" onClick={onExit}>
            {en.backToEditor}
          </button>
        </div>

        <div className={styles.toolbarRow}>
          <button
            type="button"
            onClick={() => {
              if (mode === 'voice') {
                stopVoice();
                setMode('manual');
              } else {
                stopManual();
                setMode('voice');
                startVoice();
              }
            }}
          >
            {mode === 'voice' ? en.manualMode : en.voiceMode}
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

        {!speechSupported && (
          <p className={styles.hint}>{en.speechUnavailableHint}</p>
        )}
        {voiceStatus === 'mic-unavailable' && (
          <p className={styles.hint}>{en.micDeniedHint}</p>
        )}
        {speechHint && <p className={styles.hint}>{speechHint}</p>}
      </div>
    </div>
  );
}
