import React from 'react';

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
  if (!isOpen) return null;

  const icon = variant === 'danger' ? (
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
      <div className="modal-overlay" onClick={onCancel}></div>
      <div className="confirm-modal">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: '50%',
              background: variant === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              color: variant === 'danger' ? 'var(--color-danger)' : 'var(--color-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{title}</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {message}
            </p>
          </div>
        </div>

        {warningText && (
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: variant === 'danger' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)',
              border: variant === 'danger' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)',
              fontSize: '0.8rem',
              color: variant === 'danger' ? '#fca5a5' : '#fde68a',
              lineHeight: '1.5',
            }}
          >
            {warningText}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button type="button" className="btn btn-neutral" onClick={onCancel}>
            Annulla
          </button>
          <button
            type="button"
            className={`btn btn-${variant}`}
            style={variant === 'danger' ? { backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)', color: 'white' } : {}}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </>
  );
}
