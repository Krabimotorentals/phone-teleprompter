import { useEffect, useState } from 'react';
import { en } from '../i18n/en';
import { loadScript, loadSettings, saveScript, saveSettings } from '../lib/storage';
import { getScriptTypographyStyle } from '../lib/textAppearance';
import { APP_VERSION } from '../lib/appVersion';
import { markVoicePrimedFromGesture } from '../lib/voiceGesture';
import type { AppSettings } from '../lib/types';
import { LanguageSelector, SettingsPanel } from './SettingsPanel';
import styles from './Editor.module.css';

interface Props {
  onStart: (script: string, settings: AppSettings) => void;
}

export function Editor({ onStart }: Props) {
  const [script, setScript] = useState(() => loadScript());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveScript(script);
  }, [script]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const handleStart = () => {
    if (!script.trim()) {
      setError(en.emptyScript);
      return;
    }
    setError(null);
    // Prime mic in the same tap as Start (browser user-gesture rules).
    markVoicePrimedFromGesture();
    if (navigator.mediaDevices?.getUserMedia) {
      void navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {});
    }
    onStart(script, settings);
  };

  const previewStyle = {
    ...getScriptTypographyStyle(settings),
    backgroundColor: settings.backgroundColor,
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{en.appTitle}</h1>
        <span className={styles.buildTag} aria-label="App version">
          v{APP_VERSION}
        </span>
      </header>


      <label className={styles.scriptLabel} htmlFor="script-input">
        Script
      </label>
      <textarea
        id="script-input"
        className={styles.textarea}
        placeholder={en.scriptPlaceholder}
        value={script}
        onChange={(e) => setScript(e.target.value)}
        rows={8}
        spellCheck
      />

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => setScript('')}
        >
          {en.clearScript}
        </button>
        <button type="button" className={styles.primary} onClick={handleStart}>
          {en.startTeleprompter}
        </button>
      </div>
      <p className={styles.voiceHint}>{en.startTeleprompterHint}</p>

      {error && <p className={styles.error}>{error}</p>}

      <LanguageSelector
        value={settings.speechLanguage}
        onChange={(speechLanguage) => setSettings({ ...settings, speechLanguage })}
      />

      <SettingsPanel settings={settings} onChange={setSettings} />

      <section className={styles.previewSection} aria-label="Preview">
        <p className={styles.previewHint}>Preview</p>
        <div className={styles.previewBox} style={{ background: settings.backgroundColor }}>
          <p className={styles.previewText} style={previewStyle}>
            {script.trim() || en.scriptPlaceholder}
          </p>
        </div>
      </section>
    </div>
  );
}
