export function emailRetryDelayMs(attemptCount: number) {
  const safeAttempt = Math.max(1, Math.floor(attemptCount));
  return Math.min(60, 2 ** safeAttempt) * 60_000;
}
