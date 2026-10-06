/** UI strings — add ru.ts later with same keys */
export const en = {
  appTitle: 'Voice Teleprompter',
  scriptPlaceholder: 'Paste or type your script here…',
  clearScript: 'Clear Script',
  startTeleprompter: 'Start Teleprompter',
  startTeleprompterHint:
    'Voice mode listens and scrolls as you read the script aloud (Chrome recommended).',
  language: 'Language',
  languageEn: 'English',
  languageRu: 'Русский',
  settings: 'Settings',
  fontSize: 'Font size',
  fontFamily: 'Font type',
  fontColor: 'Font color',
  backgroundColor: 'Background',
  lineSpacing: 'Line spacing',
  textWidth: 'Text width',
  alignment: 'Alignment',
  alignLeft: 'Left',
  alignCenter: 'Center',
  textOrientation: 'Mirror & rotate',
  textOrientationHint:
    'Use these with a physical teleprompter mirror. Preview updates below.',
  rotationLabel: 'Rotate text',
  mirror: 'Mirror text (horizontal flip)',
  rotationNormal: 'Normal',
  rotation90Right: '90° right',
  rotation90Left: '90° left',
  rotation180: '180° upside down',
  tapToListen: 'Tap to start listening',
  tapToListenHint:
    'Your browser needs one tap here to start the microphone and speech tracking. Then read your script aloud from the beginning.',
  voiceFollowHint:
    'Read the script aloud from the first line. Scrolling follows your voice and stops when you pause.',
  speechErrorNetwork:
    'Speech recognition needs an internet connection (Chrome uses Google speech services).',
  speechErrorGeneric: 'Speech recognition error. Tap Listen to try again.',
  manualSpeed: 'Manual scroll speed',
  backToEditor: 'Editor',
  restart: 'Restart',
  pause: 'Pause',
  resume: 'Resume',
  listen: 'Listen',
  fullscreen: 'Full screen',
  manualMode: 'Manual scroll',
  voiceMode: 'Voice follow',
  scrollUp: 'Up',
  scrollDown: 'Down',
  voiceStatus: {
    idle: 'Ready',
    listening: 'Listening',
    paused: 'Paused',
    micUnavailable: 'Microphone unavailable',
    speechUnavailable: 'Speech recognition unavailable',
    findingPosition: 'Finding position…',
  },
  speechUnavailableHint:
    'Your browser does not support speech recognition. Use manual scroll mode.',
  micDeniedHint:
    'Microphone access was denied. You can still use manual scroll mode.',
  emptyScript: 'Add a script before starting.',
} as const;

export type UiStrings = typeof en;
