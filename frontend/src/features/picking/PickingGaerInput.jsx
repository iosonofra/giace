export function PickingGaerInput({
  columns,
  eanColumn,
  error,
  file,
  loading,
  mappingRequired,
  onFileChange,
  onReloadStates,
  onReset,
  onStateToggle,
  onSubmit,
  quantityColumn,
  setEanColumn,
  setQuantityColumn,
  selectedStateIds,
  states,
  statesError,
  statesLoading,
}) {
  const canSubmit = file && selectedStateIds.length > 0 && (
    !mappingRequired || (eanColumn && quantityColumn && eanColumn !== quantityColumn)
  );

  return (
    <form className="picking-workflow-form gaer-workflow" onSubmit={onSubmit}>
      <section className="gaer-intro-card">
        <div>
          <span className="picking-state-eyebrow">Disponibilità temporanea</span>
          <h3>Prelievo Gaer per EAN13</h3>
          <p>
            Carica l’esportazione DDT e proponi gli ordini completamente preparabili,
            dal più vecchio al più recente.
          </p>
        </div>
        <span className="badge badge-neutral">Solo consultazione</span>
      </section>

      <div className="gaer-config-grid">
        <section className="gaer-config-card">
          <div className="gaer-card-heading">
            <span>1</span>
            <div><strong>File disponibilità</strong><small>Formato Excel .xlsx</small></div>
          </div>
          <label className={`gaer-file-picker ${file ? 'has-file' : ''}`}>
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={event => onFileChange(event.target.files?.[0] || null)}
            />
            <strong>{file ? file.name : 'Seleziona esportazione DDT'}</strong>
            <span>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB` : 'Cercheremo CODICE A BARRE e QUANTITA'}</span>
          </label>
        </section>

        <section className="gaer-config-card">
          <div className="gaer-card-heading">
            <span>2</span>
            <div><strong>Stati degli ordini</strong><small>{selectedStateIds.length} selezionati</small></div>
          </div>
          {statesLoading ? (
            <div className="gaer-inline-state"><span className="spinner" /> Caricamento stati…</div>
          ) : statesError ? (
            <div className="gaer-inline-state is-error">
              <span>{statesError}</span>
              <button type="button" className="btn btn-neutral btn-sm" onClick={onReloadStates}>Riprova</button>
            </div>
          ) : (
            <div className="gaer-state-list" aria-label="Stati ordine Gaer">
              {states.map(state => {
                const selected = selectedStateIds.includes(Number(state.id));
                return (
                  <label key={state.id} className={selected ? 'is-selected' : ''}>
                    <input type="checkbox" checked={selected} onChange={() => onStateToggle(Number(state.id))} />
                    <span>{state.name}</span><small>ID {state.id}</small>
                  </label>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {mappingRequired && (
        <section className="gaer-mapping-card" role="status">
          <div>
            <span className="picking-state-eyebrow">Mappatura richiesta</span>
            <h3>Indica le colonne da utilizzare</h3>
            <p>Le intestazioni standard non sono state riconosciute. Il file resta selezionato.</p>
          </div>
          <div className="gaer-mapping-fields">
            <label>
              <span>Colonna EAN</span>
              <select value={eanColumn} onChange={event => setEanColumn(event.target.value)}>
                <option value="">Seleziona colonna</option>
                {columns.map(column => <option key={column.key} value={column.key}>{column.label} ({column.key})</option>)}
              </select>
            </label>
            <label>
              <span>Colonna quantità</span>
              <select value={quantityColumn} onChange={event => setQuantityColumn(event.target.value)}>
                <option value="">Seleziona colonna</option>
                {columns.map(column => <option key={column.key} value={column.key}>{column.label} ({column.key})</option>)}
              </select>
            </label>
          </div>
        </section>
      )}

      {error && <div className="picking-alert picking-alert-danger" role="alert"><strong>Analisi Gaer non eseguita.</strong><span>{error}</span></div>}

      <div className="picking-form-actions">
        {(file || selectedStateIds.length > 0) && <button type="button" className="btn btn-neutral" onClick={onReset}>Azzera</button>}
        <button type="submit" className="btn btn-primary" disabled={loading || !canSubmit} aria-busy={loading}>
          {loading ? <><span className="spinner picking-inline-spinner" /> Analisi EAN in corso…</> : 'Calcola prelievo Gaer'}
        </button>
      </div>
    </form>
  );
}
