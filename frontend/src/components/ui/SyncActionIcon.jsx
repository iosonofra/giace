import { useEffect, useRef, useState } from 'react';

import { Icons } from './Icons';
import { resolveSyncActionPhase } from './syncActionIconState';


const SYNC_SUCCESS_VISIBLE_MS = 800;


export function SyncActionIcon({ busy, successKey }) {
  const [showSuccess, setShowSuccess] = useState(false);
  const successKeyAtStartRef = useRef(successKey);
  const timerRef = useRef(null);
  const wasBusyRef = useRef(false);

  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const phase = resolveSyncActionPhase({
      busy,
      successKey,
      successKeyAtStart: successKeyAtStartRef.current,
      wasBusy: wasBusyRef.current,
    });

    if (busy && !wasBusyRef.current) {
      successKeyAtStartRef.current = successKey;
    }

    wasBusyRef.current = busy;
    setShowSuccess(phase === 'success');

    if (phase === 'success') {
      timerRef.current = window.setTimeout(() => {
        setShowSuccess(false);
        timerRef.current = null;
      }, SYNC_SUCCESS_VISIBLE_MS);
    }
  }, [busy, successKey]);

  useEffect(() => () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
  }, []);

  if (busy) {
    return (
      <span className="sync-action-icon" aria-hidden="true">
        <Icons.Sync spinning />
      </span>
    );
  }

  if (showSuccess) {
    return (
      <span
        key="success"
        className="sync-action-icon sync-action-icon-success"
        aria-hidden="true"
      >
        <Icons.Check />
      </span>
    );
  }

  return (
    <span className="sync-action-icon" aria-hidden="true">
      <Icons.Sync />
    </span>
  );
}
