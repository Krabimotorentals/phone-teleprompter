import { en } from '../i18n/en';
import { FONT_OPTIONS } from '../lib/textAppearance';
import type {
  AppSettings,
  SpeechLanguage,
  TextAlignment,
  TextRotation,
} from '../lib/types';
import orient from './TextOrientationPanel.module.css';
import styles from './SettingsPanel.module.css';

const FONT_PRESETS = ['#ffffff', '#ffff00', '#86efac', '#d1d5db'];
const BG_PRESETS = ['#000000', '#1f2937', '#ffffff', '#0f172a'];

const ROTATION_OPTIONS: { value: TextRotation; label: string }[] = [
  { value: 0, label: en.rotationNormal },
  { value: 90, label: en.rotation90Right },
  { value: -90, label: en.rotation90Left },
  { value: 180, label: en.rotation180 },
];

interface Props {
  settings: AppSettings;
  onChange: (next: AppSettings) => void;
}

export function SettingsPanel({ settings, onChange }: Props) {
  const patch = (partial: Partial<AppSettings>) =>
    onChange({ ...settings, ...partial });

  return (
    <section className={styles.panel} aria-label={en.settings}>
      <h2 className={styles.heading}>{en.settings}</h2>

      <div className={styles.orientationBlock}>
        <h3 className={styles.subHeading}>{en.textOrientation}</h3>
        <p className={orient.hint}>{en.textOrientationHint}</p>

        <label className={orient.checkRow}>
          <input
            type="checkbox"
            checked={settings.mirror}
            onChange={(e) => patch({ mirror: e.target.checked })}
          />
          {en.mirror}
        </label>

        <p className={orient.subLabel}>{en.rotationLabel}</p>
        <div
          className={orient.segmentRow}
          role="radiogroup"
          aria-label={en.rotationLabel}
        >
          {ROTATION_OPTIONS.map((opt) => (
            <button
              key={`rot-${opt.value}`}
              type="button"
              role="radio"
              aria-checked={settings.textRotation === opt.value}
              className={
                settings.textRotation === opt.value
                  ? orient.segmentActive
                  : orient.segment
              }
              onClick={() => patch({ textRotation: opt.value })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <label className={styles.row}>
        <span>{en.fontFamily}</span>
        <select
          className={styles.fontSelect}
          value={settings.fontFamily}
          onChange={(e) =>
            patch({
              fontFamily: e.target.value as AppSettings['fontFamily'],
            })
          }
        >
          {FONT_OPTIONS.map((font) => (
            <option
              key={font.id}
              value={font.id}
              style={{ fontFamily: font.stack }}
            >
              {font.label}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.row}>
        <span>{en.fontSize}</span>
        <div className={styles.sliderRow}>
          <input
            type="range"
            min={20}
            max={100}
            value={settings.fontSize}
            onChange={(e) => patch({ fontSize: Number(e.target.value) })}
          />
          <output>{settings.fontSize}px</output>
        </div>
      </label>

      <div className={styles.row}>
        <span>{en.fontColor}</span>
        <div className={styles.colorRow}>
          {FONT_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              className={styles.swatch}
              style={{ background: c }}
              aria-label={c}
              onClick={() => patch({ fontColor: c })}
            />
          ))}
          <input
            type="color"
            value={settings.fontColor}
            onChange={(e) => patch({ fontColor: e.target.value })}
          />
        </div>
      </div>

      <div className={styles.row}>
        <span>{en.backgroundColor}</span>
        <div className={styles.colorRow}>
          {BG_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              className={styles.swatch}
              style={{ background: c }}
              aria-label={c}
              onClick={() => patch({ backgroundColor: c })}
            />
          ))}
          <input
            type="color"
            value={settings.backgroundColor}
            onChange={(e) => patch({ backgroundColor: e.target.value })}
          />
        </div>
      </div>

      <label className={styles.row}>
        <span>{en.lineSpacing}</span>
        <div className={styles.sliderRow}>
          <input
            type="range"
            min={1}
            max={2.5}
            step={0.05}
            value={settings.lineHeight}
            onChange={(e) => patch({ lineHeight: Number(e.target.value) })}
          />
          <output>{settings.lineHeight.toFixed(2)}</output>
        </div>
      </label>

      <label className={styles.row}>
        <span>{en.textWidth}</span>
        <div className={styles.sliderRow}>
          <input
            type="range"
            min={60}
            max={100}
            value={settings.textWidthPercent}
            onChange={(e) =>
              patch({ textWidthPercent: Number(e.target.value) })
            }
          />
          <output>{settings.textWidthPercent}%</output>
        </div>
      </label>

      <fieldset className={styles.fieldset}>
        <legend>{en.alignment}</legend>
        {(['left', 'center'] as TextAlignment[]).map((a) => (
          <label key={a} className={styles.radio}>
            <input
              type="radio"
              name="align"
              checked={settings.textAlignment === a}
              onChange={() => patch({ textAlignment: a })}
            />
            {a === 'left' ? en.alignLeft : en.alignCenter}
          </label>
        ))}
      </fieldset>

      <label className={styles.row}>
        <span>{en.manualSpeed}</span>
        <div className={styles.sliderRow}>
          <input
            type="range"
            min={10}
            max={120}
            value={settings.manualScrollSpeed}
            onChange={(e) =>
              patch({ manualScrollSpeed: Number(e.target.value) })
            }
          />
          <output>{settings.manualScrollSpeed}</output>
        </div>
      </label>
    </section>
  );
}

export function LanguageSelector({
  value,
  onChange,
}: {
  value: SpeechLanguage;
  onChange: (lang: SpeechLanguage) => void;
}) {
  return (
    <fieldset className={styles.langField}>
      <legend>{en.language}</legend>
      <label className={styles.radio}>
        <input
          type="radio"
          name="speechLang"
          checked={value === 'en-US'}
          onChange={() => onChange('en-US')}
        />
        {en.languageEn}
      </label>
      <label className={styles.radio}>
        <input
          type="radio"
          name="speechLang"
          checked={value === 'ru-RU'}
          onChange={() => onChange('ru-RU')}
        />
        {en.languageRu}
      </label>
    </fieldset>
  );
}
