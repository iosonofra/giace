import { useEffect, useMemo, useState } from 'react';
import { useSingleFileDrop } from './useSingleFileDrop';


function quantity(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 }).format(value);
}

function sourceLabel(source) {
  return source === 'file' ? 'File esterno' : 'Google Sheets';
}


export function StockVerificationWorkflow({ verification }) {
  const [filter, setFilter] = useState('all');
  const fileDrop = useSingleFileDrop(verification.selectFile);
  const result = verification.result;
  useEffect(() => {
    setFilter('all');
  }, [result]);
  const visibleRows = useMemo(() => (
    (result?.rows || []).filter(item => {
      if (item.is_spacer) return filter === 'all';
      if (filter === 'file') return item.source === 'file';
      if (filter === 'retained') return item.source === 'google_sheets';
      return true;
    })
  ), [filter, result?.rows]);
  const canAnalyze = verification.file && (
    !verification.mappingRequired
    || (
      verification.skuColumn
      && verification.quantityColumn
      && verification.skuColumn !== verification.quantityColumn
    )
  );

  return (
    <div className="stock-verification-workflow">
      <form className="picking-workflow-form" onSubmit={verification.analyze}>
        <div className="stock-verification-intro">
          <div>
            <h3>Verifica le quantità del magazzino esterno</h3>
            <p>
              Il file esportato mantiene ordine, descrizioni e lotti della giacenza
              Google Sheets, sostituendo le quantità trovate nel file caricato.
            </p>
          </div>
          <span className="badge badge-neutral">Nessuna modifica ai dati</span>
        </div>

        <label
          className={`stock-verification-picker ${verification.file ? 'has-file' : ''} ${fileDrop.dragOver ? 'is-dragging' : ''}`}
          role="button"
          tabIndex={0}
          aria-label="Carica il file Excel delle giacenze esterne"
          {...fileDrop.dropTargetProps}
        >
          <input
            ref={fileDrop.inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={fileDrop.handleInputChange}
          />
          <span className="stock-verification-picker-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></svg>
          </span>
          <span>
            <strong aria-live="polite">{fileDrop.dragOver ? 'Rilascia il file per caricarlo' : verification.file ? verification.file.name : 'Trascina qui il file delle giacenze esterne'}</strong>
            <small>
              {verification.file
                ? `${Math.max(1, Math.round(verification.file.size / 1024))} KB · Trascina un altro file per sostituirlo`
                : 'Oppure clicca per selezionarlo · Excel .xlsx'}
            </small>
          </span>
        </label>

        {verification.mappingRequired && (
          <section className="stock-verification-mapping" role="status">
            <div>
              <h3>Indica le colonne da confrontare</h3>
              <p>Le intestazioni non sono state riconosciute automaticamente.</p>
            </div>
            <div className="stock-verification-mapping-fields">
              <label>
                <span>Colonna SKU</span>
                <select value={verification.skuColumn} onChange={event => verification.setSkuColumn(event.target.value)}>
                  <option value="">Seleziona colonna</option>
                  {verification.columns.map(column => <option key={column.key} value={column.key}>{column.label} ({column.key})</option>)}
                </select>
              </label>
              <label>
                <span>Colonna quantità</span>
                <select value={verification.quantityColumn} onChange={event => verification.setQuantityColumn(event.target.value)}>
                  <option value="">Seleziona colonna</option>
                  {verification.columns.map(column => <option key={column.key} value={column.key}>{column.label} ({column.key})</option>)}
                </select>
              </label>
            </div>
          </section>
        )}

        {verification.error && (
          <div className="picking-alert picking-alert-danger" role="alert">
            <strong>Verifica non completata.</strong>
            <span>{verification.error}</span>
          </div>
        )}

        <div className="picking-form-actions">
          {(verification.file || result) && <button type="button" className="btn btn-neutral" onClick={verification.reset}>Azzera</button>}
          <button type="submit" className="btn btn-primary" disabled={!canAnalyze || verification.loading} aria-busy={verification.loading}>
            {verification.loading ? <><span className="spinner picking-inline-spinner" /> Confronto in corso…</> : result ? 'Aggiorna confronto' : 'Verifica giacenze'}
          </button>
        </div>
      </form>

      {result && (
        <section className="stock-verification-results" aria-labelledby="stock-verification-results-title">
          <header className="stock-verification-results-head">
            <div>
              <h3 id="stock-verification-results-title">Anteprima dell’esportazione</h3>
              <p>
                Ordinamento da {result.source.sheet_name || 'Google Sheets'} · {result.summary.reference_rows} righe
              </p>
            </div>
            <button type="button" className="btn btn-primary" onClick={verification.exportFile} disabled={verification.exporting} aria-busy={verification.exporting}>
              {verification.exporting ? 'Esportazione…' : 'Esporta file Excel'}
            </button>
          </header>

          <div className="stock-verification-summary" aria-label="Riepilogo del confronto">
            <div><span>Abbinate dal file</span><strong>{result.summary.matched_rows}</strong></div>
            <div><span>Quantità mantenute</span><strong>{result.summary.retained_rows}</strong></div>
            <div><span>Solo nel file</span><strong>{result.summary.extra_rows}</strong></div>
            <div><span>SKU duplicati</span><strong>{result.summary.duplicate_skus}</strong></div>
          </div>

          <div className="stock-verification-toolbar">
            <div className="stock-verification-filters" role="group" aria-label="Filtra righe di verifica">
              <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Tutte</button>
              <button type="button" className={filter === 'file' ? 'active' : ''} onClick={() => setFilter('file')}>Dal file</button>
              <button type="button" className={filter === 'retained' ? 'active' : ''} onClick={() => setFilter('retained')}>Mantenute</button>
            </div>
            <span>{visibleRows.filter(item => !item.is_spacer).length} righe visibili</span>
          </div>

          <div className="table-container stock-verification-table-wrap">
            <table className="custom-table stock-verification-table">
              <thead>
                <tr><th>#</th><th>SKU</th><th>Descrizione Google Sheets</th><th>Lotto</th><th className="num-col">Quantità Google</th><th className="num-col">Quantità esportata</th><th>Origine</th></tr>
              </thead>
              <tbody>
                {visibleRows.map(item => (
                  item.is_spacer ? (
                    <tr key={`spacer-${item.position}`} className="stock-verification-spacer" aria-hidden="true"><td colSpan="7" /></tr>
                  ) : (
                    <tr key={`${item.position}-${item.sku}`} className={item.source === 'google_sheets' ? 'is-retained' : ''}>
                      <td data-label="#">{item.position}</td>
                      <td data-label="SKU"><strong>{item.sku}</strong></td>
                      <td data-label="Descrizione">{item.description || '—'}</td>
                      <td data-label="Lotto">{item.lotto || '—'}</td>
                      <td data-label="Quantità Google" className="num-col">{quantity(item.google_quantity)}</td>
                      <td data-label="Quantità esportata" className="num-col"><strong>{quantity(item.quantity)}</strong></td>
                      <td data-label="Origine"><span className={`stock-verification-source is-${item.source}`}>{sourceLabel(item.source)}</span></td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>

          {result.anomalies.length > 0 && (
            <details className="stock-verification-anomalies">
              <summary>{result.anomalies.length} anomalie incluse nel secondo foglio Excel</summary>
              <ul>
                {result.anomalies.slice(0, 20).map((item, index) => (
                  <li key={`${item.type}-${item.sku}-${item.row}-${index}`}><strong>{item.sku || `Riga ${item.row}`}</strong><span>{item.message}</span></li>
                ))}
              </ul>
              {result.anomalies.length > 20 && <p>Altre {result.anomalies.length - 20} anomalie saranno disponibili nel file esportato.</p>}
            </details>
          )}
        </section>
      )}
    </div>
  );
}
