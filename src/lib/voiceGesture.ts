/** Set when user taps Start Teleprompter (same user gesture chain). */
let voicePrimedFromGesture = false;

export function markVoicePrimedFromGesture(): void {
  voicePrimedFromGesture = true;
}

export function consumeVoicePrimedFromGesture(): boolean {
  const v = voicePrimedFromGesture;
  voicePrimedFromGesture = false;
  return v;
}
