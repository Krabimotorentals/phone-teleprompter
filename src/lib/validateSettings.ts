import { DEFAULT_WORDS_PER_MINUTE } from '../scroll/scrollSpeed';
import { FONT_OPTIONS } from './textAppearance';
import { DEFAULT_SETTINGS, type AppSettings, type TextRotation } from './types';

const ROTATIONS = new Set<TextRotation>([0, 90, -90, 180]);
const FONT_IDS = new Set(FONT_OPTIONS.map((f) => f.id));

type LegacySettings = Partial<AppSettings> & { manualScrollSpeed?: number };

export function normalizeSettings(raw: LegacySettings): AppSettings {
  const merged = { ...DEFAULT_SETTINGS, ...raw } as AppSettings & LegacySettings;
  if (merged.scrollWordsPerMinute == null) {
    merged.scrollWordsPerMinute =
      typeof merged.manualScrollSpeed === 'number'
        ? DEFAULT_WORDS_PER_MINUTE
        : DEFAULT_SETTINGS.scrollWordsPerMinute;
  }
  merged.scrollWordsPerMinute = Math.min(
    220,
    Math.max(70, merged.scrollWordsPerMinute),
  );
  if (!FONT_IDS.has(merged.fontFamily)) {
    merged.fontFamily = DEFAULT_SETTINGS.fontFamily;
  }
  if (!ROTATIONS.has(merged.textRotation)) {
    merged.textRotation = 0;
  }
  return merged;
}
