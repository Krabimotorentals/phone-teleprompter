export type SpeechLanguage = 'en-US' | 'ru-RU';

export type TextAlignment = 'left' | 'center';

/** Degrees: 90 = clockwise, -90 = counter-clockwise */
export type TextRotation = 0 | 90 | -90 | 180;

export type FontFamilyId =
  | 'system'
  | 'roboto'
  | 'open-sans'
  | 'lato'
  | 'inter'
  | 'georgia'
  | 'merriweather'
  | 'arial'
  | 'verdana'
  | 'times';

export type VoiceStatusType =
  | 'idle'
  | 'listening'
  | 'paused'
  | 'mic-unavailable'
  | 'speech-unavailable'
  | 'finding-position';

export type TeleprompterMode = 'voice' | 'manual';

export interface AppSettings {
  speechLanguage: SpeechLanguage;
  fontSize: number;
  fontColor: string;
  highlightColor: string;
  backgroundColor: string;
  lineHeight: number;
  textWidthPercent: number;
  textAlignment: TextAlignment;
  fontFamily: FontFamilyId;
  mirror: boolean;
  textRotation: TextRotation;
  manualScrollSpeed: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  speechLanguage: 'en-US',
  fontSize: 36,
  fontColor: '#ffffff',
  highlightColor: '#ca8a04',
  backgroundColor: '#000000',
  lineHeight: 1.5,
  textWidthPercent: 90,
  textAlignment: 'left',
  fontFamily: 'system',
  mirror: false,
  textRotation: 0,
  manualScrollSpeed: 40,
};

export interface ScriptToken {
  index: number;
  raw: string;
  normalized: string;
  startChar: number;
  endChar: number;
}

export interface MatchResult {
  tokenIndex: number;
  highlightFrom: number;
  confidence: number;
}
