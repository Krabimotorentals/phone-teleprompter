import { en } from '../i18n/en';
import type { VoiceStatusType } from '../lib/types';
import styles from './VoiceStatus.module.css';

interface Props {
  status: VoiceStatusType;
}

export function VoiceStatus({ status }: Props) {
  const label = en.voiceStatus[mapStatusKey(status)];
  return (
    <div className={styles.wrap} data-status={status} aria-live="polite">
      <span className={styles.dot} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}

function mapStatusKey(
  status: VoiceStatusType,
): keyof typeof en.voiceStatus {
  switch (status) {
    case 'mic-unavailable':
      return 'micUnavailable';
    case 'speech-unavailable':
      return 'speechUnavailable';
    case 'finding-position':
      return 'findingPosition';
    case 'scrolling':
      return 'scrolling';
    case 'listening':
      return 'listening';
    case 'paused':
      return 'paused';
    default:
      return 'idle';
  }
}
