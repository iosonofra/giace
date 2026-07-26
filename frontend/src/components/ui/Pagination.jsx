import React from 'react';

function getVisiblePages(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'end-ellipsis', totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [
      1,
      'start-ellipsis',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [
    1,
    'start-ellipsis',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'end-ellipsis',
    totalPages,
  ];
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  limit,
  onLimitChange,
  limitOptions = [10, 25, 50, 100],
  allowAll = false,
  totalItems,
  disabled = false,
  showPageNumbers = false,
}) {
  if (totalPages <= 1 && !onLimitChange) return null;
  const allSelected = limit === 'all';
  const numericLimit = Number(limit) || 0;
  const firstItem = totalItems > 0 && !allSelected
    ? ((currentPage - 1) * numericLimit) + 1
    : totalItems > 0 ? 1 : 0;
  const lastItem = totalItems > 0 && !allSelected
    ? Math.min(currentPage * numericLimit, totalItems)
    : totalItems || 0;
  const options = allowAll
    ? ['all', ...limitOptions]
    : limitOptions;
  const visiblePages = showPageNumbers && !allSelected
    ? getVisiblePages(currentPage, totalPages)
    : [];

  return (
    <div className="pagination-bar">
      <div className="pagination-summary" aria-live="polite">
        {totalItems !== undefined ? (
          <>
            <span className="pagination-range">
              <strong>{firstItem}–{lastItem}</strong> di <strong>{totalItems}</strong>
            </span>
            {!allSelected && (
              <span className="pagination-page-count">
                Pagina {currentPage} di {totalPages || 1}
              </span>
            )}
          </>
        ) : (
          <span className="pagination-page-count">
            Pagina <strong>{currentPage}</strong> di <strong>{totalPages || 1}</strong>
          </span>
        )}
      </div>

      <div className="pagination-controls">
        <button
          type="button"
          className="btn btn-neutral btn-sm pagination-direction"
          disabled={allSelected || currentPage === 1 || disabled}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Vai alla pagina precedente"
        >
          <span aria-hidden="true">←</span>
          Indietro
        </button>

        {showPageNumbers && visiblePages.length > 0 && (
          <div className="pagination-pages" aria-label="Seleziona pagina">
            {visiblePages.map(page => (
              typeof page === 'number' ? (
                <button
                  key={page}
                  type="button"
                  className={`pagination-page-button ${page === currentPage ? 'active' : ''}`}
                  aria-current={page === currentPage ? 'page' : undefined}
                  aria-label={`Vai alla pagina ${page}`}
                  disabled={disabled}
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </button>
              ) : (
                <span key={page} className="pagination-ellipsis" aria-hidden="true">
                  …
                </span>
              )
            ))}
          </div>
        )}

        <button
          type="button"
          className="btn btn-neutral btn-sm pagination-direction"
          disabled={
            allSelected
            || currentPage === totalPages
            || totalPages === 0
            || disabled
          }
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Vai alla pagina successiva"
        >
          Avanti
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {onLimitChange && limit !== undefined && (
        <label className="pagination-limit-control">
          <span>Righe per pagina</span>
          <select
            className="settings-input pagination-limit-select"
            value={limit}
            disabled={disabled}
            onChange={(event) => {
              onLimitChange(
                event.target.value === 'all'
                  ? 'all'
                  : parseInt(event.target.value, 10),
              );
              onPageChange(1);
            }}
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'Tutte' : option}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
