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
  file: 'Excel', automatic: 'Automatica', gaer: 'Gaer', legacy: 'Precedente',
};
const FOCUSABLE_SELECTOR = [
  'button:not([disabled])', '[href]', 'input:not([disabled])', 'select:not([disabled])',
  'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

function formatQuantity(value) {
  return new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function countLabel(value, singular, plural) {
  const count = Number(value || 0);
  return `${formatQuantity(count)} ${count === 1 ? singular : plural}`;
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}
function formatTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
function dateKey(value) {
  if (!value) return 'unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'unknown' : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
function dateGroupLabel(value) {
  if (!value) return 'Data non disponibile';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data non disponibile';
  const today = new Date();
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((todayStart - dayStart) / 86400000);
  if (days === 0) return 'Oggi';
  if (days === 1) return 'Ieri';
  return new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(date);
}
function orderLabel(order, index) {
  if (order == null) return `Ordine ${index + 1}`;
  if (typeof order !== 'object') return `Ordine ${order}`;
  const id = order.id_order ?? order.order_id ?? order.id ?? order.reference;
  return id == null ? `Ordine ${index + 1}` : `Ordine ${id}`;
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
  const orders = detail?.orders || [];
  const receipt = detail?.receipt || {};

  return <div className="picking-history-detail">
    <div className="picking-history-detail-head">
      <div className="picking-history-detail-title">
        <button type="button" className="btn btn-neutral btn-icon-text" onClick={onBack}><BackIcon /> Storico</button>
        {detail && <div><strong>{formatDateTime(detail.applied_at || detail.created_at)}</strong><span>{detail.sheet_name} · {detail.target_header || 'Colonna non disponibile'}</span></div>}
      </div>
      {detail && <span className={`picking-history-status is-${meta.tone}`}>{meta.label}</span>}
    </div>
    {loading && <div className="picking-history-state" aria-live="polite"><span className="spinner" /><strong>Caricamento dettaglio…</strong></div>}
    {error && <div className="picking-history-recovery"><div className="picking-alert picking-alert-danger" role="alert">{error}</div><button type="button" className="btn btn-neutral" onClick={onRetry}>Riprova</button></div>}
    {!loading && !error && detail && <>
      <div className="picking-history-detail-meta" aria-label="Riepilogo operazione">
        <span><strong>{SOURCE[detail.source_type] || detail.source_type}</strong><small>origine</small></span>
        <span><strong>{detail.orders_count || orders.length || '—'}</strong><small>ordini</small></span>
        <span><strong>{detail.sku_count}</strong><small>SKU</small></span>
        <span><strong>{formatQuantity(detail.total_quantity)}</strong><small>unità</small></span>
      </div>
      {failureMessages.length > 0 && <div className="picking-alert picking-alert-danger" role="alert"><strong>Motivo dell’errore</strong><ul>{failureMessages.map(message => <li key={message}>{message}</li>)}</ul></div>}
      {!detail.detail_available && <div className="picking-alert picking-alert-info">Operazione precedente allo storico dettagliato: sono mostrati i dati ancora disponibili.</div>}
      <section className="picking-history-detail-section">
        <div className="picking-history-section-heading"><div><h3>Variazioni su Google Sheets</h3><p>{items.length ? `${items.length} SKU elaborati nell’operazione.` : 'Nessuna variazione dettagliata disponibile.'}</p></div></div>
        {items.length ? <div className="picking-history-detail-table-wrap">
          <table className="custom-table picking-history-detail-table">
            <thead><tr><th>SKU / riga</th><th className="num-col">Prelevato</th><th className="num-col">Prima</th><th className="num-col">Dopo</th><th className="num-col">Residuo</th></tr></thead>
            <tbody>{items.map((item, index) => <tr key={`${item.sku}-${item.row || index}`}>
              <td data-label="SKU / riga"><strong>{item.sku}</strong>{item.row && <small>Riga {item.row}</small>}</td>
              <td data-label="Prelevato" className="num-col picking-history-quantity-change">+{formatQuantity(item.quantity)}</td>
              <td data-label="Prima" className="num-col">{item.current_value == null ? '—' : formatQuantity(item.current_value)}</td>
              <td data-label="Dopo" className="num-col"><strong>{item.new_value == null ? '—' : formatQuantity(item.new_value)}</strong></td>
              <td data-label="Residuo" className={`num-col ${Number(item.remaining_after) < 0 ? 'danger-text' : ''}`}>{item.remaining_after == null ? '—' : formatQuantity(item.remaining_after)}</td>
            </tr>)}</tbody>
          </table>
        </div> : <div className="picking-history-empty picking-history-empty-compact"><strong>Dettaglio SKU non disponibile</strong><span>Il riepilogo dell’operazione resta consultabile.</span></div>}
      </section>
      {(detail.skipped || []).length > 0 && <details className="picking-skipped-notice">
        <summary><span className="picking-skipped-icon" aria-hidden="true">!</span><span><strong>{detail.skipped.length} SKU ignorati</strong><small>Non sono stati modificati nel foglio.</small></span><span className="picking-skipped-disclosure"><span className="when-closed">Mostra dettagli</span><span className="when-open">Nascondi dettagli</span></span></summary>
        <ul>{detail.skipped.map(item => <li key={item.sku}><strong>{item.sku}</strong><span>{item.reason}</span></li>)}</ul>
      </details>}
      {orders.length > 0 && <details className="picking-history-orders" open={orders.length <= 6}>
        <summary><span><strong>Ordini inclusi</strong><small>{orders.length} riferimenti collegati al prelievo.</small></span><span>{orders.length}</span></summary>
        <div>{orders.map((order, index) => <span key={`${orderLabel(order, index)}-${index}`}>{orderLabel(order, index)}</span>)}</div>
      </details>}
      <details className="picking-history-technical">
        <summary><span><strong>Dettagli tecnici</strong><small>ID operazione, revisione e ricevuta di scrittura.</small></span></summary>
        <div className="picking-history-operation-id"><span>ID operazione</span><div><code>{detail.operation_id}</code><button type="button" className="btn btn-neutral btn-small" onClick={copyId}>{copied ? 'Copiato' : 'Copia'}</button></div>{detail.sheet_revision && <><span>Revisione foglio</span><code>{detail.sheet_revision}</code></>}{receipt.updated_cells != null && <><span>Celle aggiornate</span><code>{receipt.updated_cells}</code></>}</div>
      </details>
    </>}
  </div>;
}

function CompactHistoryList({ items, selected, onSelect }) {
  const groups = [];
  items.forEach(item => {
    const value = item.applied_at || item.created_at;
    const key = dateKey(value);
    let group = groups.find(entry => entry.key === key);
    if (!group) { group = { key, label: dateGroupLabel(value), items: [] }; groups.push(group); }
    group.items.push(item);
  });
  return <div className="picking-history-compact-list" aria-label="Operazioni nella pagina">{groups.map(group => <section key={group.key}>
    <h3>{group.label}</h3>
    <div>{group.items.map(item => {
      const meta = statusMeta(item.status);
      const selectedItem = selected === item.operation_id;
      return <button key={item.operation_id} type="button" className={selectedItem ? 'is-selected' : ''} aria-current={selectedItem ? 'true' : undefined} onClick={() => onSelect(item.operation_id)}>
        <span className="picking-history-compact-main"><span><strong>{formatTime(item.applied_at || item.created_at)}</strong><span className={`picking-history-status is-${meta.tone}`}>{meta.label}</span></span><b>{item.sheet_name} · {item.target_header || '—'}</b><small>{SOURCE[item.source_type] || item.source_type}{item.orders_count > 0 ? ` · ${item.orders_count} ordini` : ''}</small></span>
        <span className="picking-history-compact-totals"><strong>{item.sku_count} SKU</strong><small>{formatQuantity(item.total_quantity)} unità</small></span>
      </button>;
    })}</div>
  </section>)}</div>;
}

export function PickingHistoryDialog() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({
    items: [], page: 1, pages: 1, total: 0,
    summary: { operations: 0, total_quantity: 0, sku_count: 0, applied: 0, failed: 0, pending: 0 },
  });
  const [page, setPage] = useState(1);
  const emptyFilters = { status: 'all', query: '', dateFrom: '', dateTo: '' };
  const [filters, setFilters] = useState(emptyFilters);
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [filterError, setFilterError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
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
  const removeFilter = key => {
    const emptyValue = key === 'status' ? 'all' : '';
    const next = { ...filters, [key]: emptyValue };
    setDraftFilters(next); setFilters(next); setFilterError(''); setPage(1);
  };
  const activeFilters = Number(filters.status !== 'all') + Number(Boolean(filters.query)) + Number(Boolean(filters.dateFrom)) + Number(Boolean(filters.dateTo));
  const draftHasValues = draftFilters.status !== 'all' || Boolean(draftFilters.query || draftFilters.dateFrom || draftFilters.dateTo);
  const filterChips = [
    filters.query && { key: 'query', label: `Ricerca: ${filters.query}` },
    filters.status !== 'all' && { key: 'status', label: `Stato: ${statusMeta(filters.status).label}` },
    filters.dateFrom && { key: 'dateFrom', label: `Dal ${filters.dateFrom.split('-').reverse().join('/')}` },
    filters.dateTo && { key: 'dateTo', label: `Al ${filters.dateTo.split('-').reverse().join('/')}` },
  ].filter(Boolean);
  const summary = data.summary || {};

  return <>
    <button ref={triggerRef} type="button" className="btn btn-neutral picking-history-trigger" onClick={() => setOpen(true)}><HistoryIcon /> Storico prelievi</button>
    {presence.shouldRender && createPortal(<div className={`modal-overlay picking-history-overlay ${presence.isExiting ? 'is-exiting' : ''}`} role="presentation">
      <section ref={dialogRef} className={`picking-history-dialog ${presence.isExiting ? 'is-exiting' : 'motion-dialog-enter'}`} role="dialog" aria-modal="true" aria-labelledby="picking-history-title" tabIndex={-1} onTransitionEnd={presence.completeExit}>
        <header className="picking-history-header">
          <div><h2 id="picking-history-title">Storico prelievi</h2><p>Controlla le registrazioni effettuate su Google Sheets e il relativo dettaglio.</p></div>
          <button ref={closeRef} type="button" className="modal-close picking-write-close" onClick={close} aria-label="Chiudi storico"><CloseIcon /></button>
        </header>
        <div className="picking-history-content">
          <form className="picking-history-toolbar" onSubmit={applyFilters}>
            <div className="picking-history-toolbar-main">
              <label className="picking-history-search"><SearchIcon /><input value={draftFilters.query} onChange={event => setDraftFilters(value => ({ ...value, query: event.target.value }))} placeholder="Cerca SKU o ID operazione" aria-label="Cerca nello storico" /></label>
              <button type="submit" className="btn btn-primary">Cerca</button>
              <button type="button" className={`btn btn-neutral picking-history-filter-toggle ${filtersOpen ? 'is-open' : ''}`} aria-expanded={filtersOpen} aria-controls="picking-history-filter-panel" onClick={() => setFiltersOpen(value => !value)}>Filtri{activeFilters > 0 && <span>{activeFilters}</span>}</button>
              <button type="button" className="btn btn-neutral btn-icon-text" onClick={loadHistory} disabled={loading}><RefreshIcon /> Aggiorna</button>
            </div>
            {filtersOpen && <div id="picking-history-filter-panel" className="picking-history-filter-panel">
              <label><span>Stato</span><select value={draftFilters.status} onChange={event => setDraftFilters(value => ({ ...value, status: event.target.value }))}><option value="all">Tutti</option><option value="applied">Registrate</option><option value="failed">Non confermate</option><option value="pending">In corso</option></select></label>
              <label><span>Data iniziale</span><input type="date" value={draftFilters.dateFrom} max={draftFilters.dateTo || undefined} onChange={event => setDraftFilters(value => ({ ...value, dateFrom: event.target.value }))} /></label>
              <label><span>Data finale</span><input type="date" value={draftFilters.dateTo} min={draftFilters.dateFrom || undefined} onChange={event => setDraftFilters(value => ({ ...value, dateTo: event.target.value }))} /></label>
              <div className="picking-history-filter-actions"><button type="submit" className="btn btn-primary">Applica filtri</button><button type="button" className="btn btn-neutral" onClick={clearFilters} disabled={!draftHasValues && !activeFilters}>Reimposta</button></div>
            </div>}
          </form>
          {filterError && <div className="picking-alert picking-alert-danger" role="alert">{filterError}</div>}
          {filterChips.length > 0 && <div className="picking-history-active-filters" aria-label="Filtri applicati"><span>Filtri applicati</span>{filterChips.map(chip => <button key={chip.key} type="button" onClick={() => removeFilter(chip.key)}>{chip.label}<span aria-hidden="true">×</span></button>)}<button type="button" className="picking-history-clear-filters" onClick={clearFilters}>Rimuovi tutti</button></div>}
          <div className="picking-history-list-head" aria-live="polite"><div className="picking-history-inline-summary"><strong>{countLabel(summary.operations ?? data.total, 'operazione', 'operazioni')}</strong><span className={summary.applied ? 'is-success' : ''}>{countLabel(summary.applied, 'registrata', 'registrate')}</span><span className={summary.failed ? 'is-danger' : ''}>{countLabel(summary.failed, 'non confermata', 'non confermate')}</span>{summary.pending > 0 && <span>{summary.pending} in corso</span>}<span>{formatQuantity(summary.total_quantity)} unità</span></div><span>{lastUpdated ? `Aggiornato ${formatDateTime(lastUpdated)}` : 'Dalla più recente'}</span></div>
          {error && <div className="picking-history-recovery"><div className="picking-alert picking-alert-danger" role="alert">{error}</div><button type="button" className="btn btn-neutral" onClick={loadHistory}>Riprova</button></div>}
          <div className={`picking-history-workspace ${selected ? 'has-detail' : ''}`}>
            <div className="picking-history-list-pane">
              {loading ? <div className="picking-history-state" aria-live="polite"><span className="spinner" /><strong>Caricamento storico…</strong></div> : data.items.length ? selected ? <CompactHistoryList items={data.items} selected={selected} onSelect={showDetail} /> : <div className="picking-history-table-wrap">
                <table className="custom-table picking-history-table"><thead><tr><th>Data e ora</th><th>Destinazione</th><th>Origine</th><th className="num-col">Ordini</th><th className="num-col">SKU</th><th className="num-col">Unità</th><th>Esito</th></tr></thead>
                  <tbody>{data.items.map(item => { const meta = statusMeta(item.status); return <tr key={item.operation_id} tabIndex="0" onClick={() => showDetail(item.operation_id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showDetail(item.operation_id); } }}>
                    <td data-label="Data e ora"><strong>{formatDateTime(item.applied_at || item.created_at)}</strong><small>{item.target_date}</small></td><td data-label="Destinazione"><strong>{item.sheet_name}</strong><small>{item.target_header || 'Colonna non disponibile'}</small></td><td data-label="Origine"><strong>{SOURCE[item.source_type] || item.source_type}</strong></td><td data-label="Ordini" className="num-col">{item.orders_count || '—'}</td><td data-label="SKU" className="num-col">{item.sku_count}</td><td data-label="Unità" className="num-col">{formatQuantity(item.total_quantity)}</td><td data-label="Esito"><div className="picking-history-outcome-cell"><span className={`picking-history-status is-${meta.tone}`}>{meta.label}</span><button type="button" className="btn btn-neutral btn-small picking-history-row-action" aria-label={`Apri dettaglio registrazione del ${formatDateTime(item.applied_at || item.created_at)}`} onClick={event => { event.stopPropagation(); showDetail(item.operation_id); }}><ForwardIcon /></button></div></td>
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
