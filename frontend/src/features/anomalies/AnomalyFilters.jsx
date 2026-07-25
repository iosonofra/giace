export function AnomalyFilters({
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
      >
        {onlyActionable ? 'Mostra tutte' : 'Solo risolvibili'}
      </button>
    </div>
  );
}
