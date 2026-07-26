export function AnomalyFilters({
  filteredCount,
  getAnomalySourceLabel,
  getAnomalyTypeLabel,
  onlyActionable,
  orderState,
  orderStates,
  search,
  setOnlyActionable,
  setOrderState,
  setSearch,
  setSource,
  setType,
  source,
  sources,
  type,
  types,
  totalCount,
}) {
  return (
    <div className="anomaly-filter-panel">
      <div className="search-wrapper anomaly-search">
        <input
          type="text"
          className="search-input"
          placeholder="Cerca ID, nome prodotto, SKU, problema o dettaglio..."
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
        <svg className="search-icon-svg" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z" />
        </svg>
      </div>
      <select
        className="select-control"
        value={source}
        onChange={event => setSource(event.target.value)}
      >
        <option value="all">Tutte le origini</option>
        {sources.map(value => (
          <option key={value} value={value}>{getAnomalySourceLabel(value)}</option>
        ))}
      </select>
      <select
        className="select-control"
        value={type}
        onChange={event => setType(event.target.value)}
      >
        <option value="all">Tutti i problemi</option>
        {types.map(value => (
          <option key={value} value={value}>{getAnomalyTypeLabel(value)}</option>
        ))}
      </select>
      <select
        className="select-control"
        aria-label="Filtra anomalie per stato ordine attuale PrestaShop"
        value={orderState}
        onChange={event => setOrderState(event.target.value)}
      >
        <option value="all">Tutti gli stati ordine</option>
        {orderStates.map(state => (
          <option key={state.id} value={state.id}>
            {state.label} ({state.count})
          </option>
        ))}
      </select>
      <button
        type="button"
        className={`btn-small-link anomaly-toggle ${onlyActionable ? 'active' : ''}`}
        onClick={() => setOnlyActionable(!onlyActionable)}
        aria-pressed={onlyActionable}
      >
        <span className="anomaly-toggle-indicator" aria-hidden="true" />
        Solo risolvibili
      </button>
      <span className="anomaly-filter-count" aria-live="polite">
        {filteredCount} di {totalCount}
      </span>
    </div>
  );
}
