import { FONT_OPTIONS } from './textAppearance';
import { DEFAULT_SETTINGS, type AppSettings, type TextRotation } from './types';

const ROTATIONS = new Set<TextRotation>([0, 90, -90, 180]);
const FONT_IDS = new Set(FONT_OPTIONS.map((f) => f.id));

export function normalizeSettings(raw: Partial<AppSettings>): AppSettings {
  const merged = { ...DEFAULT_SETTINGS, ...raw };
  if (!FONT_IDS.has(merged.fontFamily)) {
    merged.fontFamily = DEFAULT_SETTINGS.fontFamily;
  }
  if (!ROTATIONS.has(merged.textRotation)) {
    merged.textRotation = 0;
  }
  return merged;
}
