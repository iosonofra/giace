import React from 'react';

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  limit,
  onLimitChange,
  limitOptions = [10, 25, 50, 100],
  disabled = false,
}) {
  if (totalPages <= 1 && !onLimitChange) return null;

  return (
    <div className="pagination-bar">
      <button
        type="button"
        className="btn btn-neutral btn-sm"
        disabled={currentPage === 1 || disabled}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Indietro
      </button>

      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Pagina <strong>{currentPage}</strong> di <strong>{totalPages || 1}</strong>
      </span>

      <button
        type="button"
        className="btn btn-neutral btn-sm"
        disabled={currentPage === totalPages || totalPages === 0 || disabled}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Avanti
      </button>

      {onLimitChange && limit !== undefined && (
        <select
          className="settings-input"
          style={{ width: '90px', height: '30px', padding: '0 8px', margin: '0 0 0 8px', fontSize: '0.8rem' }}
          value={limit}
          disabled={disabled}
          onChange={(event) => {
            onLimitChange(parseInt(event.target.value, 10));
            onPageChange(1);
          }}
        >
          {limitOptions.map((option) => (
            <option key={option} value={option}>{option} / pag</option>
          ))}
        </select>
      )}
    </div>
  );
}
