import { type AppSettings } from './types';
import { normalizeSettings } from './validateSettings';

const SCRIPT_KEY = 'teleprompter.script';
const SETTINGS_KEY = 'teleprompter.settings';

export function loadScript(): string {
  try {
    return localStorage.getItem(SCRIPT_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveScript(script: string): void {
  try {
    localStorage.setItem(SCRIPT_KEY, script);
  } catch {
    /* quota or private mode */
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return normalizeSettings({});
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return normalizeSettings(parsed);
  } catch {
    return normalizeSettings({});
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}
