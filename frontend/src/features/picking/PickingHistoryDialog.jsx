import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { apiFetch, readApiJson } from '../../api/client';
import { useExitPresence } from '../../components/ui/useExitPresence';

const STATUS = {
  applied: { label: 'Registrata', tone: 'success' },
  failed: { label: 'Non confermata', tone: 'danger' },
  pending: { label: 'In corso', tone: 'warning' },
};
const SOURCE = {
  order_state: 'Stato ordine', simulation: 'Simulazione', text: 'ID incollati',
  file: 'Excel', automatic: 'Automatica', legacy: 'Precedente',
};
const FOCUSABLE_SELECTOR = [
  'button:not([disabled])', '[href]', 'input:not([disabled])', 'select:not([disabled])',
  'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

function formatQuantity(value) {
  return new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 }).format(Number(value || 0));
}
function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}
function statusMeta(status) {
  return STATUS[status] || { label: status || 'Sconosciuta', tone: 'neutral' };
}
function CloseIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>; }
function HistoryIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.6M4 4v4.6h4.6M12 7.5V12l3 2" /></svg>; }
function SearchIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>; }
function RefreshIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M6.1 9a7 7 0 0 1 11.7-2L20 9M4 15l2.2 2a7 7 0 0 0 11.7-2" /></svg>; }
function BackIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>; }
function ForwardIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>; }

function HistoryDetail({ detail, loading, error, onBack, onRetry }) {
  const [copied, setCopied] = useState(false);
  const copyId = async () => {
    if (!detail?.operation_id) return;
    try {
      await navigator.clipboard.writeText(detail.operation_id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  const meta = statusMeta(detail?.status);
  const fallbackItems = detail && !detail.items?.length ? (detail.requirements || []).map(item => ({
    sku: item.sku, quantity: item.actual_qty, current_value: null, new_value: null, remaining_after: null,
  })) : [];
  const items = detail?.items?.length ? detail.items : fallbackItems;
  const failureMessages = detail ? [...(detail.errors || []), detail.error].filter(Boolean) : [];

  return <div className="picking-history-detail">
    <div className="picking-history-detail-head">
      <button type="button" className="btn btn-neutral btn-icon-text" onClick={onBack}><BackIcon /> Storico</button>
      {detail && <span className={`picking-history-status is-${meta.tone}`}>{meta.label}</span>}
    </div>
    {loading && <div className="picking-history-state" aria-live="polite"><span className="spinner" /><strong>Caricamento dettaglio…</strong></div>}
    {error && <div className="picking-history-recovery"><div className="picking-alert picking-alert-danger" role="alert">{error}</div><button type="button" className="btn btn-neutral" onClick={onRetry}>Riprova</button></div>}
    {!loading && !error && detail && <>
      <div className="picking-history-detail-summary">
        <div><span>Registrazione</span><strong>{formatDateTime(detail.applied_at || detail.created_at)}</strong></div>
        <div><span>Destinazione</span><strong>{detail.sheet_name} · {detail.target_header || '—'}</strong></div>
        <div><span>Quantità</span><strong>{formatQuantity(detail.total_quantity)} unità</strong></div>
        <div><span>Origine</span><strong>{SOURCE[detail.source_type] || detail.source_type}</strong></div>
      </div>
      {failureMessages.length > 0 && <div className="picking-alert picking-alert-danger" role="alert"><strong>Motivo dell’errore</strong><ul>{failureMessages.map(message => <li key={message}>{message}</li>)}</ul></div>}
      {!detail.detail_available && <div className="picking-alert picking-alert-info">Operazione precedente allo storico dettagliato: sono mostrati i dati ancora disponibili.</div>}
      {items.length ? <div className="picking-history-detail-table-wrap">
        <table className="custom-table picking-history-detail-table">
          <thead><tr><th>SKU</th><th className="num-col">Quantità</th><th className="num-col">Valore precedente</th><th className="num-col">Nuovo valore</th><th className="num-col">Residuo previsto</th></tr></thead>
          <tbody>{items.map(item => <tr key={item.sku}>
            <td data-label="SKU"><strong>{item.sku}</strong>{item.row && <small>Riga {item.row}</small>}</td>
            <td data-label="Quantità" className="num-col">{formatQuantity(item.quantity)}</td>
            <td data-label="Valore precedente" className="num-col">{item.current_value == null ? '—' : formatQuantity(item.current_value)}</td>
            <td data-label="Nuovo valore" className="num-col">{item.new_value == null ? '—' : formatQuantity(item.new_value)}</td>
            <td data-label="Residuo previsto" className={`num-col ${Number(item.remaining_after) < 0 ? 'danger-text' : ''}`}>{item.remaining_after == null ? '—' : formatQuantity(item.remaining_after)}</td>
          </tr>)}</tbody>
        </table>
      </div> : <div className="picking-history-empty"><strong>Dettaglio SKU non disponibile</strong><span>Il riepilogo dell’operazione resta consultabile.</span></div>}
      {(detail.skipped || []).length > 0 && <details className="picking-skipped-notice">
        <summary><span className="picking-skipped-icon" aria-hidden="true">!</span><span><strong>{detail.skipped.length} SKU ignorati</strong><small>Non sono stati modificati nel foglio.</small></span><span className="picking-skipped-disclosure"><span className="when-closed">Mostra dettagli</span><span className="when-open">Nascondi dettagli</span></span></summary>
        <ul>{detail.skipped.map(item => <li key={item.sku}><strong>{item.sku}</strong><span>{item.reason}</span></li>)}</ul>
      </details>}
      <div className="picking-history-operation-id"><span>ID operazione</span><div><code>{detail.operation_id}</code><button type="button" className="btn btn-neutral btn-small" onClick={copyId}>{copied ? 'Copiato' : 'Copia'}</button></div>{detail.sheet_revision && <><span>Revisione foglio</span><code>{detail.sheet_revision}</code></>}</div>
    </>}
  </div>;
}

function CompactHistoryList({ items, selected, onSelect }) {
  return <div className="picking-history-compact-list" aria-label="Operazioni nella pagina">{items.map(item => {
    const meta = statusMeta(item.status);
    return <button key={item.operation_id} type="button" className={selected === item.operation_id ? 'is-selected' : ''} onClick={() => onSelect(item.operation_id)}>
      <span><strong>{formatDateTime(item.applied_at || item.created_at)}</strong><small>{item.sheet_name} · {item.target_header || '—'}</small></span>
      <span><span className={`picking-history-status is-${meta.tone}`}>{meta.label}</span><small>{item.sku_count} SKU · {formatQuantity(item.total_quantity)} unità</small></span>
    </button>;
  })}</div>;
}

export function PickingHistoryDialog() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const emptyFilters = { status: 'all', query: '', dateFrom: '', dateTo: '' };
  const [filters, setFilters] = useState(emptyFilters);
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [filterError, setFilterError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  const historyRequestRef = useRef(0);
  const detailRequestRef = useRef(0);
  const presence = useExitPresence(open, 180);

  const loadHistory = useCallback(async () => {
    const requestId = ++historyRequestRef.current;
    setLoading(true); setError('');
    const params = new URLSearchParams({ page: String(page), page_size: '25', status: filters.status });
    if (filters.query) params.set('query', filters.query);
    if (filters.dateFrom) params.set('date_from', filters.dateFrom);
    if (filters.dateTo) params.set('date_to', filters.dateTo);
    try {
      const response = await apiFetch(`/api/picking/history?${params}`);
      const nextData = await readApiJson(response);
      if (historyRequestRef.current === requestId) { setData(nextData); setLastUpdated(new Date().toISOString()); }
    } catch (requestError) {
      if (historyRequestRef.current === requestId) setError(requestError.message || 'Impossibile caricare lo storico.');
    } finally {
      if (historyRequestRef.current === requestId) setLoading(false);
    }
  }, [filters, page]);

  const showDetail = useCallback(async operationId => {
    const requestId = ++detailRequestRef.current;
    setSelected(operationId); setDetail(null); setDetailError(''); setDetailLoading(true);
    try {
      const response = await apiFetch(`/api/picking/history/${encodeURIComponent(operationId)}`);
      const nextDetail = await readApiJson(response);
      if (detailRequestRef.current === requestId) setDetail(nextDetail);
    } catch (requestError) {
      if (detailRequestRef.current === requestId) setDetailError(requestError.message || 'Impossibile caricare il dettaglio.');
    } finally {
      if (detailRequestRef.current === requestId) setDetailLoading(false);
    }
  }, []);

  useEffect(() => { if (open) loadHistory(); }, [loadHistory, open]);
  useEffect(() => {
    const onOpenHistory = () => setOpen(true);
    window.addEventListener('giac:open-picking-history', onOpenHistory);
    return () => window.removeEventListener('giac:open-picking-history', onOpenHistory);
  }, []);
  useEffect(() => {
    if (!presence.shouldRender) return undefined;
    const app = document.querySelector('.app-container');
    const trigger = triggerRef.current;
    const previousAriaHidden = app?.getAttribute('aria-hidden');
    if (app) { app.inert = true; app.setAttribute('aria-hidden', 'true'); }
    const focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = event => {
      if (event.key === 'Escape') { event.preventDefault(); setSelected(null); setDetail(null); setOpen(false); return; }
      if (event.key !== 'Tab') return;
      const focusable = [...(dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || [])].filter(element => element.getClientRects().length > 0);
      if (!focusable.length) { event.preventDefault(); dialogRef.current?.focus(); return; }
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame); window.removeEventListener('keydown', onKeyDown);
      if (app) { app.inert = false; if (previousAriaHidden === null) app.removeAttribute('aria-hidden'); else app.setAttribute('aria-hidden', previousAriaHidden); }
      trigger?.focus();
    };
  }, [presence.shouldRender]);

  const close = () => {
    historyRequestRef.current += 1; detailRequestRef.current += 1;
    setSelected(null); setDetail(null); setOpen(false);
  };
  const applyFilters = event => {
    event.preventDefault();
    if (draftFilters.dateFrom && draftFilters.dateTo && draftFilters.dateFrom > draftFilters.dateTo) {
      setFilterError('La data iniziale non può essere successiva alla data finale.'); return;
    }
    setFilterError(''); setPage(1); setFilters({ ...draftFilters, query: draftFilters.query.trim() });
  };
  const clearFilters = () => {
    const empty = { status: 'all', query: '', dateFrom: '', dateTo: '' };
    setDraftFilters(empty); setFilters(empty); setFilterError(''); setPage(1);
  };
  const activeFilters = Number(filters.status !== 'all') + Number(Boolean(filters.query)) + Number(Boolean(filters.dateFrom)) + Number(Boolean(filters.dateTo));
  const draftHasValues = draftFilters.status !== 'all' || Boolean(draftFilters.query || draftFilters.dateFrom || draftFilters.dateTo);

  return <>
    <button ref={triggerRef} type="button" className="btn btn-neutral picking-history-trigger" onClick={() => setOpen(true)}><HistoryIcon /> Storico prelievi</button>
    {presence.shouldRender && createPortal(<div className={`modal-overlay picking-history-overlay ${presence.isExiting ? 'is-exiting' : ''}`} role="presentation">
      <section ref={dialogRef} className={`picking-history-dialog ${presence.isExiting ? 'is-exiting' : 'motion-dialog-enter'}`} role="dialog" aria-modal="true" aria-labelledby="picking-history-title" tabIndex={-1} onTransitionEnd={presence.completeExit}>
        <header className="picking-history-header">
          <div><h2 id="picking-history-title">Storico prelievi</h2><p>Controlla le registrazioni effettuate su Google Sheets e il relativo dettaglio.</p></div>
          <button ref={closeRef} type="button" className="modal-close picking-write-close" onClick={close} aria-label="Chiudi storico"><CloseIcon /></button>
        </header>
        <div className="picking-history-content">
          <form className="picking-history-filters" onSubmit={applyFilters}>
            <label className="picking-history-search"><SearchIcon /><input value={draftFilters.query} onChange={event => setDraftFilters(value => ({ ...value, query: event.target.value }))} placeholder="Cerca SKU o ID operazione" aria-label="Cerca nello storico" /></label>
            <label><span>Stato</span><select value={draftFilters.status} onChange={event => setDraftFilters(value => ({ ...value, status: event.target.value }))}><option value="all">Tutti</option><option value="applied">Registrate</option><option value="failed">Non confermate</option><option value="pending">In corso</option></select></label>
            <label><span>Dal</span><input type="date" value={draftFilters.dateFrom} max={draftFilters.dateTo || undefined} onChange={event => setDraftFilters(value => ({ ...value, dateFrom: event.target.value }))} /></label>
            <label><span>Al</span><input type="date" value={draftFilters.dateTo} min={draftFilters.dateFrom || undefined} onChange={event => setDraftFilters(value => ({ ...value, dateTo: event.target.value }))} /></label>
            <div className="picking-history-filter-actions"><button type="submit" className="btn btn-primary">Applica filtri</button><button type="button" className="btn btn-neutral" onClick={clearFilters} disabled={!draftHasValues && !activeFilters}>Reimposta</button></div>
          </form>
          {filterError && <div className="picking-alert picking-alert-danger" role="alert">{filterError}</div>}
          <div className="picking-history-list-head" aria-live="polite"><div><strong>{data.total} operazioni</strong>{activeFilters > 0 && <span>{activeFilters} filtri attivi</span>}</div><div><span>{lastUpdated ? `Aggiornato ${formatDateTime(lastUpdated)}` : 'Ordinate dalla più recente'}</span><button type="button" className="btn btn-neutral btn-small btn-icon-text" onClick={loadHistory} disabled={loading}><RefreshIcon /> Aggiorna</button></div></div>
          {error && <div className="picking-history-recovery"><div className="picking-alert picking-alert-danger" role="alert">{error}</div><button type="button" className="btn btn-neutral" onClick={loadHistory}>Riprova</button></div>}
          <div className={`picking-history-workspace ${selected ? 'has-detail' : ''}`}>
            <div className="picking-history-list-pane">
              {loading ? <div className="picking-history-state" aria-live="polite"><span className="spinner" /><strong>Caricamento storico…</strong></div> : data.items.length ? selected ? <CompactHistoryList items={data.items} selected={selected} onSelect={showDetail} /> : <div className="picking-history-table-wrap">
                <table className="custom-table picking-history-table"><thead><tr><th>Data</th><th>Destinazione</th><th>Origine</th><th className="num-col">SKU</th><th className="num-col">Unità</th><th>Esito</th><th><span className="sr-only">Azioni</span></th></tr></thead>
                  <tbody>{data.items.map(item => { const meta = statusMeta(item.status); return <tr key={item.operation_id} tabIndex="0" onClick={() => showDetail(item.operation_id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showDetail(item.operation_id); } }}>
                    <td data-label="Data"><strong>{formatDateTime(item.applied_at || item.created_at)}</strong><small>{item.target_date}</small></td><td data-label="Destinazione"><strong>{item.sheet_name}</strong><small>{item.target_header || 'Colonna non disponibile'}</small></td><td data-label="Origine">{SOURCE[item.source_type] || item.source_type}{item.orders_count > 0 && <small>{item.orders_count} ordini</small>}</td><td data-label="SKU" className="num-col">{item.sku_count}</td><td data-label="Unità" className="num-col">{formatQuantity(item.total_quantity)}</td><td data-label="Esito"><span className={`picking-history-status is-${meta.tone}`}>{meta.label}</span></td><td><button type="button" className="btn btn-neutral btn-small btn-icon-text" aria-label={`Apri dettaglio registrazione del ${formatDateTime(item.applied_at || item.created_at)}`} onClick={event => { event.stopPropagation(); showDetail(item.operation_id); }}>Dettagli <ForwardIcon /></button></td>
                  </tr>; })}</tbody></table>
              </div> : <div className="picking-history-empty"><strong>Nessuna registrazione trovata</strong><span>{activeFilters ? 'Prova a modificare o reimpostare i filtri.' : 'Le operazioni registrate compariranno qui.'}</span>{activeFilters > 0 && <button type="button" className="btn btn-neutral" onClick={clearFilters}>Reimposta filtri</button>}</div>}
              {data.pages > 1 && <nav className="picking-history-pagination" aria-label="Paginazione storico"><button type="button" className="btn btn-neutral btn-icon-text" disabled={page <= 1} onClick={() => setPage(value => value - 1)}><BackIcon /> Indietro</button><span>Pagina {data.page} di {data.pages}</span><button type="button" className="btn btn-neutral btn-icon-text" disabled={page >= data.pages} onClick={() => setPage(value => value + 1)}>Avanti <ForwardIcon /></button></nav>}
            </div>
            {selected && <aside className="picking-history-detail-pane"><HistoryDetail detail={detail} loading={detailLoading} error={detailError} onBack={() => { detailRequestRef.current += 1; setSelected(null); setDetail(null); setDetailError(''); }} onRetry={() => showDetail(selected)} /></aside>}
          </div>
        </div>
        <footer className="picking-history-footer"><span>Lo storico è incluso nei backup della webapp.</span><button type="button" className="btn btn-neutral" onClick={close}>Chiudi</button></footer>
      </section>
    </div>, document.body)}
  </>;
}
