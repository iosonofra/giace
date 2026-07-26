import { EXTENSION_DISTRIBUTIONS } from './settingsConstants';

const BROWSERS = [
  {
    id: 'chrome',
    label: 'Chrome',
    mark: 'C',
    subtitle: 'Manifest V3 · locale',
    version: EXTENSION_DISTRIBUTIONS.chrome.version,
  },
  {
    id: 'firefox',
    label: 'Firefox',
    mark: 'F',
    subtitle: 'Firmata Mozilla · permanente',
    version: EXTENSION_DISTRIBUTIONS.firefox.version,
  },
  {
    id: 'userscript',
    label: 'Userscript',
    mark: 'U',
    subtitle: 'Tampermonkey · Violentmonkey',
    version: EXTENSION_DISTRIBUTIONS.userscript.version,
  },
];

function BrowserActions({ browser }) {
  if (browser === 'chrome') {
    return (
      <a className="btn btn-primary extension-browser-download" href="/api/extension/download" download>
        ↓ Scarica ZIP Chrome
      </a>
    );
  }
  if (browser === 'firefox') {
    return (
      <>
        <a className="btn btn-primary extension-browser-download" href="/api/extension/firefox/install">
          Installa versione firmata
        </a>
        <a className="btn btn-secondary extension-browser-download" href="/api/extension/firefox/download" download>
          ↓ ZIP beta v0.1.6
        </a>
      </>
    );
  }
  return (
    <a
      className="btn btn-primary extension-browser-download"
      href="/api/extension/userscript/giac-feedback-ordini.user.js"
      target="_blank"
      rel="noopener noreferrer"
    >
      Installa userscript
    </a>
  );
}

function InstallationSteps({ browser }) {
  if (browser === 'chrome') {
    return (
      <>
        <li><span>1</span><div><strong>Estrai lo ZIP</strong><small>Conserva la cartella in una posizione stabile.</small></div></li>
        <li><span>2</span><div><strong>Apri <code>chrome://extensions</code></strong><small>Attiva la modalità sviluppatore.</small></div></li>
        <li><span>3</span><div><strong>Carica la cartella</strong><small>Usa “Carica estensione non pacchettizzata”.</small></div></li>
      </>
    );
  }
  if (browser === 'firefox') {
    return (
      <>
        <li><span>1</span><div><strong>Avvia l’installazione</strong><small>Premi “Installa versione firmata”.</small></div></li>
        <li><span>2</span><div><strong>Conferma i permessi</strong><small>Controlla i dati dichiarati da Firefox.</small></div></li>
        <li><span>3</span><div><strong>Configura l’estensione</strong><small>Inserisci URL webapp, dominio e token.</small></div></li>
      </>
    );
  }
  return (
    <>
      <li><span>1</span><div><strong>Installa un gestore</strong><small>Usa Tampermonkey o Violentmonkey.</small></div></li>
      <li><span>2</span><div><strong>Installa lo userscript</strong><small>Premi il pulsante e conferma il codice mostrato.</small></div></li>
      <li><span>3</span><div><strong>Completa la configurazione</strong><small>Nel menu del gestore scegli “Giac · Apri configurazione” e inserisci il token.</small></div></li>
    </>
  );
}

export function ExtensionBrowserSetup({
  extensionBrowserGuide,
  extensionDistribution,
  setExtensionBrowserGuide,
}) {
  const packageDescription = extensionBrowserGuide === 'chrome'
    ? 'Scarica lo ZIP ed estrai la cartella prima dell’installazione.'
    : extensionBrowserGuide === 'firefox'
      ? 'Installa direttamente la versione firmata oppure conserva lo ZIP beta.'
      : 'Installa il file nel gestore userscript già presente nel browser.';
  const instructionDescription = extensionBrowserGuide === 'chrome'
    ? 'Tre passaggi per caricare la cartella estratta.'
    : extensionBrowserGuide === 'firefox'
      ? 'Tre passaggi per completare l’installazione firmata.'
      : 'Tre passaggi per attivarlo nel gestore userscript.';

  return (
    <section className="extension-workbench-section" aria-labelledby="extension-step-browser">
      <div className="extension-section-heading">
        <div>
          <h3 id="extension-step-browser">Scegli il formato</h3>
          <p>Seleziona una delle tre distribuzioni e consulta le istruzioni dedicate.</p>
        </div>
      </div>

      <div className="extension-browser-grid" role="group" aria-label="Browser disponibili">
        {BROWSERS.map(browser => (
          <button
            key={browser.id}
            type="button"
            id={`extension-browser-${browser.id}`}
            className={`extension-browser-select ${extensionBrowserGuide === browser.id ? 'active' : ''}`}
            aria-pressed={extensionBrowserGuide === browser.id}
            aria-controls="extension-browser-guide"
            onClick={() => setExtensionBrowserGuide(browser.id)}
          >
            <span className={`extension-browser-mark ${browser.id}`} aria-hidden="true">
              {browser.mark}
            </span>
            <span>
              <strong>{browser.label}</strong>
              <small>{browser.subtitle}</small>
            </span>
            <span className="extension-version-badge">{browser.version}</span>
          </button>
        ))}
      </div>

      <div className="extension-browser-primary-action">
        <div>
          <strong>
            {extensionBrowserGuide === 'userscript'
              ? 'Userscript universale'
              : `Pacchetto per ${extensionDistribution.label}`}
          </strong>
          <span>{packageDescription}</span>
        </div>
        <div className="extension-browser-actions">
          <BrowserActions browser={extensionBrowserGuide} />
        </div>
      </div>

      <div
        id="extension-browser-guide"
        className="extension-browser-instructions"
        role="region"
        aria-labelledby={`extension-browser-${extensionBrowserGuide}`}
      >
        <div className="extension-guide-heading">
          <strong>Installazione {extensionDistribution.label}</strong>
          <span>{instructionDescription}</span>
        </div>
        <ol className="extension-install-steps">
          <InstallationSteps browser={extensionBrowserGuide} />
        </ol>
      </div>
    </section>
  );
}
