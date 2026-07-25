export function PickingPlanSummary({
  excludedSkus,
  limit,
  loading,
  minResidual,
  onReset,
  skuFilter,
  strategy,
  strict,
}) {
  return (
    <aside className="picking-plan-summary" aria-live="polite" aria-atomic="true">
      <div className="picking-plan-summary-head">
        <span>Riepilogo piano</span>
        <strong>Pronto per la simulazione</strong>
      </div>
      <dl className="picking-plan-facts">
        <div>
          <dt>Ordini proposti</dt>
          <dd>{limit || 0}</dd>
        </div>
        <div>
          <dt>Priorità</dt>
          <dd>{strategy === 'maximize_orders' ? 'Minore consumo' : 'Cronologica'}</dd>
        </div>
        {strategy === 'chronological' && (
          <div>
            <dt>Ordini bloccati</dt>
            <dd>{strict ? 'Ferma la coda' : 'Continua oltre'}</dd>
          </div>
        )}
        <div>
          <dt>Scorta protetta</dt>
          <dd>{Number(minResidual || 0) > 0 ? `${minResidual} unità` : 'Nessuna'}</dd>
        </div>
        <div>
          <dt>Filtro SKU</dt>
          <dd>{skuFilter.length > 0 ? `${skuFilter.length} configurati` : 'Tutte le SKU'}</dd>
        </div>
        <div>
          <dt>SKU escluse</dt>
          <dd>{excludedSkus.length > 0 ? excludedSkus.length : 'Nessuna'}</dd>
        </div>
      </dl>
      <p className="picking-plan-note">
        {strategy === 'chronological'
          ? (strict
            ? 'La coda si fermerà al primo ordine non preparabile.'
            : 'Gli ordini non preparabili saranno saltati senza consumare giacenza.')
          : 'La cronologia sarà utilizzata come criterio di spareggio.'}
      </p>
      <span className="picking-plan-simulation-note">
        Solo simulazione: nessuna giacenza verrà modificata.
      </span>
      <button
        type="submit"
        className="btn btn-primary picking-auto-submit"
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner picking-inline-spinner" aria-hidden="true" />
            Simulazione in corso...
          </>
        ) : (
          <>Simula preparazione <span aria-hidden="true">→</span></>
        )}
      </button>
      <button
        type="button"
        className="picking-reset-action"
        onClick={onReset}
        disabled={loading}
      >
        Ripristina parametri
      </button>
    </aside>
  );
}
