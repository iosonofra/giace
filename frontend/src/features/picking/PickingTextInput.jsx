export function PickingTextInput({
  value,
  onChange,
  onSubmit,
  error,
  loading,
  hasResults,
  detectedOrderCount,
  onReset,
}) {
  return (
    <form onSubmit={onSubmit} className="picking-workflow-form">
      <div className="picking-text-editor">
        <div className="picking-text-editor-head">
          <div>
            <label htmlFor="picking-order-text">Elenco ordini</label>
            <small id="picking-order-text-help">Incolla il testo ricevuto: gli ID vengono riconosciuti automaticamente.</small>
          </div>
          <span className={detectedOrderCount > 0 ? 'has-orders' : ''}>
            {detectedOrderCount > 0
              ? `${detectedOrderCount} ${detectedOrderCount === 1 ? 'ordine rilevato' : 'ordini rilevati'}`
              : 'Nessun ordine rilevato'}
          </span>
        </div>
        <textarea
          id="picking-order-text"
          className="settings-input picking-textarea"
          placeholder={`Esempio di testo incollato:
206542 > Meesseman
206794 > Wallbruch
208927 > BV FRE
209465 > Herting`}
          value={value}
          onChange={event => onChange(event.target.value)}
          aria-describedby="picking-order-text-help"
        />
      </div>

      {error && (
        <div className="picking-alert picking-alert-danger">
          <strong>Input non valido.</strong>
          <span>{error}</span>
        </div>
      )}

      <div className="picking-text-footer">
        <div className="picking-format-hint">
          <strong>Formato riconosciuto</strong>
          <span>ID numerici da 4 a 8 cifre, anche accompagnati dal nome cliente.</span>
        </div>
        <div className="picking-form-actions">
          {hasResults && (
            <button type="button" className="btn btn-neutral" onClick={onReset}>
              Nuovo calcolo
            </button>
          )}
          <button type="submit" className="btn btn-primary picking-calculate-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner picking-inline-spinner" />
                Elaborazione in corso...
              </>
            ) : 'Calcola fabbisogno'}
          </button>
        </div>
      </div>
    </form>
  );
}
