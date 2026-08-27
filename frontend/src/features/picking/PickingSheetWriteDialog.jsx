import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';

import { useExitPresence } from '../../components/ui/useExitPresence';
import { PickingSheetDatePicker } from './PickingSheetDatePicker';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])', '[href]', 'input:not([disabled])', 'select:not([disabled])',
  'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

function quantity(value) {
  return new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function formatDate(value) {
  const [year, month, day] = String(value || '').split('-').map(Number);
  if (!year || !month || !day) return value || '';
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(year, month - 1, day, 12));
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>;
}

function SuccessIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 12.5 3.2 3.2L17.5 8.5" /></svg>;
}

export function PickingSheetWriteDialog({ sheetWrite }) {
  const open = Boolean(sheetWrite?.open);
  const applying = Boolean(sheetWrite?.applying);
  const close = sheetWrite?.close;
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const closeRef = useRef(close);
  const presence = useExitPresence(open, 220);
  closeRef.current = close;

  useEffect(() => {
    if (!presence.shouldRender) return undefined;
    const previouslyFocused = document.activeElement;
    const app = document.querySelector('.app-container');
    const previousAriaHidden = app?.getAttribute('aria-hidden');
    if (app) {
      app.inert = true;
      app.setAttribute('aria-hidden', 'true');
    }
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const handleKeyDown = event => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        closeRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...(dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || [])]
        .filter(element => element.getClientRects().length > 0);
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', handleKeyDown);
      if (app) {
        app.inert = false;
        if (previousAriaHidden === null) app.removeAttribute('aria-hidden');
        else app.setAttribute('aria-hidden', previousAriaHidden);
      }
      previouslyFocused?.focus?.();
    };
  }, [presence.shouldRender]);

  const plan = sheetWrite.preview?.plan;
  const errors = plan?.errors || [];
  const skipped = plan?.skipped || [];
  const negativeResiduals = useMemo(
    () => (plan?.items || []).filter(item => Number(item.remaining_after) < 0).length,
    [plan?.items],
  );

  if (!presence.shouldRender) return null;

  const receipt = sheetWrite.receipt;
  const sheetName = receipt?.sheet_name || plan?.sheet_name || sheetWrite.sheetName || 'Google Sheets';
  const targetHeader = receipt?.target_header || plan?.target_header || '';

  return createPortal(
    <div className={`modal-overlay picking-write-overlay ${presence.isExiting ? 'is-exiting' : ''}`} role="presentation">
      <section
        ref={dialogRef}
        className={`picking-write-dialog ${presence.isExiting ? 'is-exiting' : 'motion-dialog-enter'} ${receipt ? 'is-complete' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="picking-write-title"
        aria-describedby="picking-write-description"
        tabIndex={-1}
        onTransitionEnd={presence.completeExit}
      >
        <header className="picking-write-header">
          <div>
            <div className="picking-write-title-line">
              <h2 id="picking-write-title">{receipt ? 'Prelievo registrato' : 'Registra il prelievo'}</h2>
              <span className="picking-beta-badge">Beta</span>
            </div>
            <p id="picking-write-description">
              {receipt
                ? 'La scrittura su Google Sheets è stata completata.'
                : 'Controlla data e quantità: nulla viene scritto senza la tua conferma.'}
            </p>
          </div>
          <button ref={closeButtonRef} type="button" className="modal-close picking-write-close" onClick={close} aria-label="Chiudi finestra" disabled={applying}>
            <CloseIcon />
          </button>
        </header>

        {!receipt && (
          <div className="picking-write-date-bar">
            <PickingSheetDatePicker value={sheetWrite.targetDate} onChange={sheetWrite.changeDate} dayMapping={sheetWrite.dayMapping} disabled={applying} />
            <div className="picking-write-target">
              <span>Destinazione</span>
              <strong>{sheetName}</strong>
              {targetHeader && <small>Colonna {targetHeader}</small>}
            </div>
            <button type="button" className="btn btn-neutral" onClick={() => sheetWrite.generatePreview()} disabled={sheetWrite.loading || applying}>
              {sheetWrite.loading ? 'Verifica…' : plan ? 'Aggiorna anteprima' : 'Genera anteprima'}
            </button>
          </div>
        )}

        <div className="picking-write-content">
          {receipt ? (
            <div className="picking-write-success" role="status">
              <span className="picking-write-success-icon"><SuccessIcon /></span>
              <div className="picking-write-success-copy">
                <strong>Prelievo registrato correttamente</strong>
                <p>{quantity(receipt.total_quantity)} unità distribuite su {receipt.sku_count} SKU.</p>
                <dl>
                  <div><dt>Foglio</dt><dd>{sheetName}</dd></div>
                  <div><dt>Colonna</dt><dd>{targetHeader}</dd></div>
                  <div><dt>Celle aggiornate</dt><dd>{receipt.updated_cells}</dd></div>
                  <div><dt>Operazione</dt><dd>{receipt.operation_id}</dd></div>
                </dl>
              </div>
            </div>
          ) : (
            <>
              {sheetWrite.loading && (
                <div className="picking-write-loading" aria-live="polite">
                  <span className="spinner" aria-hidden="true" />
                  <div><strong>Lettura del foglio in corso</strong><p>Verifico intestazioni, SKU e valori attuali.</p></div>
                </div>
              )}
              {sheetWrite.error && <div className="picking-alert picking-alert-danger" role="alert">{sheetWrite.error}</div>}
              {errors.length > 0 && (
                <div className="picking-alert picking-alert-danger" role="alert">
                  <strong>La registrazione è bloccata.</strong>
                  <ul>{errors.map(message => <li key={message}>{message}</li>)}</ul>
                </div>
              )}
              {skipped.length > 0 && (
                <details className="picking-skipped-notice">
                  <summary>
                    <span className="picking-skipped-icon" aria-hidden="true">!</span>
                    <span>
                      <strong>{skipped.length === 1 ? '1 SKU sarà ignorato' : `${skipped.length} SKU saranno ignorati`}</strong>
                      <small>Gli altri verranno registrati normalmente.</small>
                    </span>
                    <span className="picking-skipped-disclosure">
                      <span className="when-closed">Mostra dettagli</span>
                      <span className="when-open">Nascondi dettagli</span>
                    </span>
                  </summary>
                  <ul>{skipped.map(item => <li key={item.sku}><strong>{item.sku}</strong><span>{item.reason}</span></li>)}</ul>
                </details>
              )}
              {plan && !plan.can_apply && errors.length === 0 && plan.items.length === 0 && (
                <div className="picking-alert picking-alert-danger" role="alert">
                  <strong>Nessuno SKU può essere registrato.</strong>
                  <span>Correggi gli SKU indicati oppure aggiorna il foglio.</span>
                </div>
              )}
              {plan && (
                <>
                  <div className="picking-write-summary">
                    <div><strong>{sheetWrite.preview.sku_count}</strong><span>SKU registrabili</span></div>
                    <div><strong>{quantity(sheetWrite.preview.total_quantity)}</strong><span>unità</span></div>
                    <div className={skipped.length ? 'warning' : ''}><strong>{skipped.length}</strong><span>SKU ignorati</span></div>
                    <div className={negativeResiduals ? 'danger' : ''}><strong>{negativeResiduals}</strong><span>residui negativi</span></div>
                  </div>
                  <div className="picking-write-table-wrap">
                    <table className="custom-table picking-write-table">
                      <thead><tr><th>SKU</th><th className="num-col">Già registrato</th><th className="num-col">Da aggiungere</th><th className="num-col">Nuovo valore</th><th className="num-col">Residuo previsto</th></tr></thead>
                      <tbody>
                        {plan.items.map(item => (
                          <tr key={item.sku}>
                            <td data-label="SKU"><strong>{item.sku}</strong><small>Riga {item.row}{Number(item.excluded_rows_skipped) > 0 ? ` · ${quantity(item.excluded_rows_skipped)} ${Number(item.excluded_rows_skipped) === 1 ? 'riga esclusa ignorata' : 'righe escluse ignorate'}` : ''}</small></td>
                            <td data-label="Già registrato" className="num-col">{quantity(item.current_value)}</td>
                            <td data-label="Da aggiungere" className="num-col picking-write-increment">+{quantity(item.quantity)}</td>
                            <td data-label="Nuovo valore" className="num-col"><strong>{quantity(item.new_value)}</strong></td>
                            <td data-label="Residuo previsto" className={`num-col ${Number(item.remaining_after) < 0 ? 'danger-text' : ''}`}>{item.remaining_after === null ? '—' : quantity(item.remaining_after)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <footer className="picking-write-footer">
          {receipt ? (
            <><span>La cronologia delle modifiche resta disponibile in Google Fogli.</span><button type="button" className="btn btn-primary" onClick={close}>Chiudi</button></>
          ) : (
            <>
              <div className="picking-write-commit-summary">
                {plan ? (
                  <><strong>{quantity(sheetWrite.preview.total_quantity)} unità · {sheetWrite.preview.sku_count} SKU</strong><span>{formatDate(sheetWrite.targetDate)} · {sheetName} / {targetHeader}{skipped.length > 0 ? ` · ${skipped.length} ignorati` : ''}</span></>
                ) : <span>La cronologia delle modifiche resta disponibile in Google Fogli.</span>}
              </div>
              <div className="picking-write-actions">
                <button type="button" className="btn btn-neutral" onClick={close} disabled={applying}>Annulla</button>
                {plan && <button type="button" className="btn btn-primary" onClick={sheetWrite.apply} disabled={!plan.can_apply || applying} aria-busy={applying}>{applying ? 'Registrazione…' : 'Registra prelievo'}</button>}
              </div>
            </>
          )}
        </footer>
      </section>
    </div>,
    document.body,
  );
}
