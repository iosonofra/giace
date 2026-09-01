import React, { useCallback, useEffect, useRef, useState } from 'react';


const AUTO_DISMISS_DELAY = {
  success: 5000,
  warning: 7000,
  info: 5000,
};

const EXIT_DURATION = 180;


function getToastContent(text, type = 'success') {
  const normalized = String(text || '').trim();
  const fallbackTitle = type === 'danger'
    ? 'Operazione non riuscita'
    : type === 'warning'
      ? 'Attenzione'
      : type === 'info'
        ? 'Informazione'
        : 'Operazione completata';

  if (!normalized) return { title: fallbackTitle, detail: '' };

  if (type === 'danger') {
    const detail = normalized.replace(/^Errore(?:\s+(?:nel|durante|di))?[^:]*:\s*/i, '');
    return { title: fallbackTitle, detail: detail || normalized };
  }

  const sentence = normalized.match(/^(.{1,72}?)[!.:]\s+(.+)$/);
  if (sentence) {
    return {
      title: sentence[1].trim(),
      detail: sentence[2].trim(),
    };
  }

  return { title: fallbackTitle, detail: normalized };
}


function ToastIcon({ type }) {
  if (type === 'danger') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5.25" />
        <path d="M12 16.5h.01" />
      </svg>
    );
  }

  if (type === 'warning') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10.3 4.7 2.8 17.8A2 2 0 0 0 4.5 21h15a2 2 0 0 0 1.7-3.2L13.7 4.7a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 16.5h.01" />
      </svg>
    );
  }

  if (type === 'info') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 7.5h.01" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.2 2.6 2.6 5.6-6" />
    </svg>
  );
}


function ToastItem({ toast, onDismiss }) {
  const [isExiting, setIsExiting] = useState(false);
  const dismissTimerRef = useRef(null);
  const exitTimerRef = useRef(null);
  const startedAtRef = useRef(0);
  const remainingRef = useRef(toast.duration ?? AUTO_DISMISS_DELAY[toast.type]);
  const content = getToastContent(toast.text, toast.type);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current) window.clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = null;
  }, []);

  const requestClose = useCallback(() => {
    if (isExiting) return;
    clearDismissTimer();
    setIsExiting(true);
    exitTimerRef.current = window.setTimeout(() => onDismiss(toast.id), EXIT_DURATION);
  }, [clearDismissTimer, isExiting, onDismiss, toast.id]);

  const startDismissTimer = useCallback(() => {
    if (!Number.isFinite(remainingRef.current) || isExiting) return;
    if (remainingRef.current <= 0) {
      requestClose();
      return;
    }
    clearDismissTimer();
    startedAtRef.current = Date.now();
    dismissTimerRef.current = window.setTimeout(requestClose, remainingRef.current);
  }, [clearDismissTimer, isExiting, requestClose]);

  const pauseDismissTimer = useCallback(() => {
    if (!dismissTimerRef.current) return;
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current));
    clearDismissTimer();
  }, [clearDismissTimer]);

  useEffect(() => {
    startDismissTimer();
    return clearDismissTimer;
  }, [clearDismissTimer, startDismissTimer]);

  useEffect(() => () => {
    if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
  }, []);

  const handleAction = () => {
    toast.action?.onClick?.();
    requestClose();
  };

  return (
    <div
      className={`toast-alert toast-${toast.type} ${isExiting ? 'is-exiting' : ''}`}
      role={toast.type === 'danger' ? 'alert' : 'status'}
      aria-live={toast.type === 'danger' ? 'assertive' : 'polite'}
      aria-atomic="true"
      onMouseEnter={pauseDismissTimer}
      onMouseLeave={startDismissTimer}
      onFocusCapture={pauseDismissTimer}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) startDismissTimer();
      }}
    >
      <span className="toast-icon"><ToastIcon type={toast.type} /></span>
      <span className="toast-copy">
        <strong>{content.title}</strong>
        {content.detail && <span>{content.detail}</span>}
      </span>
      {toast.action?.label && (
        <button type="button" className="toast-action" onClick={handleAction}>
          {toast.action.label}
        </button>
      )}
      <button type="button" className="toast-close" onClick={requestClose} aria-label="Chiudi notifica">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
      </button>
    </div>
  );
}


export function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-container" aria-label="Notifiche">
      {toasts.map(toast => (
        <ToastItem key={toast.instanceId} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
