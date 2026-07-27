import React from 'react';

import { useExitPresence } from './useExitPresence';


export function ConfirmModal({
  isOpen,
  title,
  message,
  warningText,
  onCancel,
  onConfirm,
  confirmText,
  variant = 'danger',
}) {
  const contentRef = React.useRef({
    confirmText,
    message,
    title,
    variant,
    warningText,
  });
  if (isOpen) {
    contentRef.current = {
      confirmText,
      message,
      title,
      variant,
      warningText,
    };
  }
  const presence = useExitPresence(isOpen);
  if (!presence.shouldRender) return null;

  const displayed = contentRef.current;
  const icon = displayed.variant === 'danger' ? (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ) : (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  return (
    <>
      <div
        className={`modal-overlay ${presence.isExiting ? 'is-exiting' : ''}`}
        onClick={onCancel}
      />
      <div
        className={`confirm-modal confirm-modal-variant-${displayed.variant} ${
          presence.isExiting ? 'is-exiting' : ''
        }`}
      >
        <div className="confirm-modal-heading">
          <div className="confirm-modal-icon">
            {icon}
          </div>
          <div className="confirm-modal-copy">
            <h3 className="confirm-modal-title">{displayed.title}</h3>
            <p className="confirm-modal-message">
              {displayed.message}
            </p>
          </div>
        </div>

        {displayed.warningText && (
          <div className="confirm-modal-warning">
            {displayed.warningText}
          </div>
        )}

        <div className="confirm-modal-actions">
          <button type="button" className="btn btn-neutral" onClick={onCancel}>
            Annulla
          </button>
          <button
            type="button"
            className={`btn btn-${displayed.variant}`}
            onClick={onConfirm}
          >
            {displayed.confirmText}
          </button>
        </div>
      </div>
    </>
  );
}
