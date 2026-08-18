export function PickingStateInput({
  states,
  selectedStateId,
  onStateChange,
  onSubmit,
  onReset,
  onReloadStates,
  error,
  statesError,
  loading,
  statesLoading,
  hasResults,
}) {
  const selectedState = states.find(
    state => String(state.id) === String(selectedStateId),
  );
  const unavailable = statesLoading || !selectedState;

  return (
    <form onSubmit={onSubmit} className="picking-workflow-form">
      <div className="picking-state-importer">
        <div className="picking-state-importer-head">
          <div>
            <span className="picking-state-eyebrow">Stati ordine abilitati</span>
            <h3>Importa da stato ordine</h3>
            <p>
              Seleziona uno degli stati abilitati nelle Impostazioni per
              calcolare il fabbisogno degli ordini sincronizzati.
            </p>
          </div>
          <span className="badge badge-success">Sync incrementale</span>
        </div>

        <div className="picking-state-layout">
          <label className="picking-state-field" htmlFor="picking-order-state">
            <span>Stato ordine PrestaShop</span>
            <select
              id="picking-order-state"
              className="select-control"
              value={selectedStateId}
              onChange={event => onStateChange(event.target.value)}
              disabled={statesLoading}
            >
              <option value="">
                {statesLoading
                  ? 'Caricamento stati...'
                  : 'Seleziona uno stato ordine'}
              </option>
              {states.map(state => (
                <option key={state.id} value={state.id}>
                  {state.name} ({state.count})
                </option>
              ))}
            </select>
            <small>
              Il menu rispetta gli stati inclusi nelle Impostazioni; il numero
              indica gli ordini presenti dopo l’ultima sincronizzazione.
            </small>
          </label>

          <div
            className={`picking-state-preview ${selectedState ? 'has-selection' : ''}`}
            aria-live="polite"
          >
            <span>Ordini da importare</span>
            <strong>
              {selectedState
                ? `${selectedState.count} ${selectedState.count === 1 ? 'ordine' : 'ordini'}`
                : '—'}
            </strong>
            <p>
              {selectedState
                ? selectedState.name
                : 'Il riepilogo apparirà dopo la selezione.'}
            </p>
          </div>
        </div>

        <div className="picking-state-note">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Zm0-10v3.75m0 2.25v.1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <span>
            Verifichiamo PrestaShop e scarichiamo solo gli ordini nuovi o
            modificati, poi li elaboriamo dal più vecchio al più recente.
          </span>
        </div>
      </div>

      {(error || statesError) && (
        <div className="picking-alert picking-alert-danger">
          <strong>
            {statesError ? 'Stati non disponibili.' : 'Calcolo non eseguito.'}
          </strong>
          <span>{statesError || error}</span>
          {statesError && (
            <button
              type="button"
              className="btn btn-neutral btn-sm"
              onClick={onReloadStates}
              disabled={statesLoading}
            >
              Riprova
            </button>
          )}
        </div>
      )}

      {!statesLoading && states.length === 0 && !statesError && (
        <div className="picking-state-empty">
          <strong>Nessuno stato ordine abilitato</strong>
          <span>
            Seleziona e salva almeno uno stato nelle Impostazioni Ordini.
          </span>
          <button
            type="button"
            className="btn btn-neutral btn-sm"
            onClick={onReloadStates}
          >
            Aggiorna stati
          </button>
        </div>
      )}

      <div className="picking-form-actions picking-state-actions">
        {(hasResults || selectedStateId) && (
          <button type="button" className="btn btn-neutral" onClick={onReset}>
            Nuovo calcolo
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary picking-calculate-btn"
          disabled={loading || unavailable || !selectedStateId}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <span className="spinner picking-inline-spinner" aria-hidden="true" />
              Verifica e calcolo...
            </>
          ) : 'Importa e calcola fabbisogno'}
        </button>
      </div>
    </form>
  );
}
