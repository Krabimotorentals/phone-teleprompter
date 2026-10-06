export type SpeechLangCode = 'en-US' | 'ru-RU';

export interface SpeechRecognitionCallbacks {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (message: string) => void;
  onEnd: () => void;
  onStart: () => void;
}

export function isSpeechRecognitionSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
}

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export class VoiceRecognizer {
  private recognition: SpeechRecognition | null = null;
  private lang: SpeechLangCode = 'en-US';
  private active = false;
  private paused = false;
  private callbacks: SpeechRecognitionCallbacks | null = null;

  constructor(lang: SpeechLangCode) {
    this.lang = lang;
  }

  setLanguage(lang: SpeechLangCode): void {
    this.lang = lang;
    if (this.recognition) this.recognition.lang = lang;
  }

  start(callbacks: SpeechRecognitionCallbacks): boolean {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return false;

    this.callbacks = callbacks;
    this.paused = false;
    this.active = true;

    this.recognition = new Ctor();
    this.recognition.lang = this.lang;
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.callbacks?.onStart();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) {
          this.callbacks?.onFinal(text);
        } else {
          interim += text;
        }
      }
      if (interim) this.callbacks?.onInterim(interim);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted' || event.error === 'no-speech') return;
      this.callbacks?.onError(event.error);
    };

    this.recognition.onend = () => {
      if (this.active && !this.paused) {
        try {
          this.recognition?.start();
        } catch {
          this.callbacks?.onEnd();
        }
      } else {
        this.callbacks?.onEnd();
      }
    };

    try {
      this.recognition.start();
      return true;
    } catch {
      return false;
    }
  }

  pause(): void {
    this.paused = true;
    this.active = false;
    try {
      this.recognition?.stop();
    } catch {
      /* ignore */
    }
  }

  stop(): void {
    this.paused = true;
    this.active = false;
    try {
      this.recognition?.abort();
    } catch {
      try {
        this.recognition?.stop();
      } catch {
        /* ignore */
      }
    }
    this.recognition = null;
    this.callbacks = null;
  }
}
