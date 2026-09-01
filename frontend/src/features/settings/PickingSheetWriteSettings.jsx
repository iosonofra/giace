import { useState } from 'react';

const DAYS = [
  ['monday', 'Lunedì'],
  ['tuesday', 'Martedì'],
  ['wednesday', 'Mercoledì'],
  ['thursday', 'Giovedì'],
  ['friday', 'Venerdì'],
  ['saturday', 'Sabato'],
  ['sunday', 'Domenica'],
];


export function PickingSheetWriteSettings({ settings, embedded = false }) {
  const [secretCopied, setSecretCopied] = useState(false);
  const {
    generatePickingSheetSecret,
    handleTestPickingSheetConnection,
    pickingSheetDayMapping,
    pickingSheetSecretConfigured,
    pickingSheetSharedSecret,
    pickingSheetRemainingHeader,
    pickingSheetTesting,
    pickingSheetWebappUrl,
    pickingSheetWriteEnabled,
    setPickingSheetDayMapping,
    setPickingSheetSharedSecret,
    setPickingSheetRemainingHeader,
    setPickingSheetWebappUrl,
    setPickingSheetWriteEnabled,
    stockSource,
    stockSettingsErrorField,
    stockSettingsErrorSection,
  } = settings;
  const writebackError = stockSettingsErrorSection === 'writeback';
  const getErrorProps = fieldId => ({
    'aria-invalid': writebackError && stockSettingsErrorField === fieldId,
    'aria-describedby': writebackError && stockSettingsErrorField === fieldId
      ? 'stock-writeback-error'
      : undefined,
  });

  const updateDay = (key, value) => {
    setPickingSheetDayMapping(current => ({ ...current, [key]: value }));
  };

  const copySecret = async () => {
    if (!pickingSheetSharedSecret) return;
    await navigator.clipboard.writeText(pickingSheetSharedSecret);
    setSecretCopied(true);
    window.setTimeout(() => setSecretCopied(false), 1800);
  };

  return (
    <section
      className={`stock-config-section picking-sheet-write-settings ${embedded ? 'embedded' : ''}`}
      aria-labelledby={embedded ? undefined : 'picking-sheet-write-title'}
      aria-label={embedded ? 'Configurazione registrazione prelievi' : undefined}
    >
      <div className="stock-section-heading picking-sheet-write-heading">
        {!embedded && (
          <div>
            <h3 id="picking-sheet-write-title">Registrazione prelievi su Google Sheets</h3>
            <p>
              Dopo la simulazione, somma le quantità nella colonna della data
              selezionata senza modificare direttamente totale e formule.
            </p>
          </div>
        )}
        <label className={`settings-switch-card picking-sheet-enable-card ${pickingSheetWriteEnabled ? 'active' : ''}`}>
          <span className="picking-sheet-enable-copy">
            <strong>{pickingSheetWriteEnabled ? 'Funzione attiva' : 'Funzione disattivata'}</strong>
            <small>Ogni scrittura richiede una conferma manuale</small>
          </span>
          <span className="settings-switch">
            <input
              type="checkbox"
              checked={pickingSheetWriteEnabled}
              onChange={event => setPickingSheetWriteEnabled(event.target.checked)}
              disabled={stockSource !== 'google_sheets'}
              aria-label="Attiva registrazione prelievi su Google Sheets"
            />
            <span aria-hidden="true" />
          </span>
        </label>
      </div>

      {stockSource !== 'google_sheets' && (
        <div className="settings-inline-note warning">
          Seleziona Google Sheets come sorgente giacenze per attivare la scrittura.
        </div>
      )}

      {pickingSheetWriteEnabled && (
        <div className="picking-sheet-write-body">
          <section className="picking-sheet-setup-block" aria-labelledby="picking-sheet-connection-title">
            <div className="picking-sheet-block-heading">
              <span className="picking-sheet-step" aria-hidden="true">1</span>
              <div>
                <h4 id="picking-sheet-connection-title">Collegamento Apps Script</h4>
                <p>Inserisci endpoint e credenziale condivisa usati dalla web app.</p>
              </div>
            </div>

            <div className="picking-sheet-connection-grid">
              <div className="form-group stock-field-wide">
                <label className="settings-label" htmlFor="picking-sheet-webapp-url">
                  URL Web App Apps Script
                </label>
                <input
                  id="picking-sheet-webapp-url"
                  type="url"
                  className="settings-input"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={pickingSheetWebappUrl}
                  onChange={event => setPickingSheetWebappUrl(event.target.value)}
                  required
                  {...getErrorProps('picking-sheet-webapp-url')}
                />
                <small className="settings-help">Usa l’URL del deployment che termina con /exec.</small>
              </div>
              <div className="form-group picking-sheet-secret-field">
                <label className="settings-label" htmlFor="picking-sheet-secret">
                  Secret condiviso
                  {pickingSheetSecretConfigured && <span className="badge badge-success">Configurato</span>}
                </label>
                <div className="settings-inline-control">
                  <input
                    id="picking-sheet-secret"
                    type="password"
                    className="settings-input"
                    autoComplete="new-password"
                    placeholder={pickingSheetSecretConfigured ? 'Lascia vuoto per mantenere quello attuale' : 'Minimo 32 caratteri'}
                    value={pickingSheetSharedSecret}
                    onChange={event => setPickingSheetSharedSecret(event.target.value)}
                    {...getErrorProps('picking-sheet-secret')}
                  />
                  <button type="button" className="btn btn-neutral" onClick={generatePickingSheetSecret}>
                    Genera
                  </button>
                  {pickingSheetSharedSecret && (
                    <button type="button" className="btn btn-neutral" onClick={copySecret}>
                      {secretCopied ? 'Copiato' : 'Copia'}
                    </button>
                  )}
                </div>
                <small className="settings-help">
                  Copialo nelle Proprietà script prima di salvare; successivamente resterà nascosto.
                </small>
              </div>
              <div className="form-group picking-sheet-residual-field">
                <label className="settings-label" htmlFor="picking-sheet-remaining-header">
                  Colonna residuo
                </label>
                <input
                  id="picking-sheet-remaining-header"
                  type="text"
                  className="settings-input"
                  value={pickingSheetRemainingHeader}
                  onChange={event => setPickingSheetRemainingHeader(event.target.value)}
                  placeholder="RIMANENTI"
                  required
                  {...getErrorProps('picking-sheet-remaining-header')}
                />
                <small className="settings-help">Usata nell’anteprima per calcolare il residuo previsto.</small>
              </div>
            </div>
          </section>

          <section className="picking-sheet-setup-block" aria-labelledby="picking-sheet-days-title">
            <div className="picking-day-mapping-head">
              <div className="picking-sheet-block-heading">
                <span className="picking-sheet-step" aria-hidden="true">2</span>
                <div>
                  <h4 id="picking-sheet-days-title">Mappatura giorni</h4>
                  <p>Abbina il nome del giorno alle intestazioni del foglio, ad esempio “Giovedì 27”.</p>
                </div>
              </div>
              <span className="badge badge-neutral">Data scelta nel prelievo</span>
            </div>
            <div className="picking-day-mapping-grid">
              {DAYS.map(([key, label]) => {
                const optional = key === 'saturday' || key === 'sunday';
                return (
                  <label key={key} className={`picking-day-field ${optional ? 'optional' : ''}`}>
                    <span>{label}{optional && <small>Opzionale</small>}</span>
                    <input
                      type="text"
                      className="settings-input"
                      value={pickingSheetDayMapping[key] || ''}
                      placeholder={optional ? 'Non utilizzato' : label}
                      onChange={event => updateDay(key, event.target.value)}
                      required={!optional}
                    />
                  </label>
                );
              })}
            </div>
          </section>

          <div className="picking-sheet-test-row">
            <div className="picking-sheet-test-copy">
              <span className="picking-sheet-step" aria-hidden="true">3</span>
              <span>
                <strong>Verifica configurazione</strong>
                <small>Salva le modifiche, poi controlla autorizzazione, foglio e intestazioni.</small>
              </span>
            </div>
            <button
              type="button"
              className="btn btn-neutral"
              onClick={handleTestPickingSheetConnection}
              disabled={pickingSheetTesting || !pickingSheetSecretConfigured}
              title={!pickingSheetSecretConfigured ? 'Salva prima un secret condiviso per abilitare la verifica.' : undefined}
            >
              {pickingSheetTesting ? 'Verifica in corso…' : 'Verifica collegamento'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
