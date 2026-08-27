export function resolveSyncActionPhase({
  busy,
  successKey,
  successKeyAtStart,
  wasBusy,
}) {
  if (busy) return 'busy';
  if (wasBusy && successKey !== successKeyAtStart) return 'success';
  return 'idle';
}
