export function SettingsPreflightPanel({ preflight, onSelectSection }) {
  const findings = [...preflight.issues, ...preflight.warnings];
  return (
    <details className={`settings-preflight ${preflight.ready ? 'ready' : 'attention'}`}>
      <summary>
        <span className="settings-preflight-icon" aria-hidden="true">{preflight.ready ? '✓' : '!'}</span>
        <span>
          <strong>{preflight.ready ? 'Configurazione pronta' : `${preflight.issues.length} problemi da correggere`}</strong>
          <small>{preflight.warnings.length > 0 ? `${preflight.warnings.length} avvisi non bloccanti` : 'Nessun avviso rilevato'}</small>
        </span>
        <span className="settings-preflight-action">{findings.length > 0 ? 'Mostra dettagli' : 'Controllo completato'}</span>
      </summary>
      {findings.length > 0 && (
        <div className="settings-preflight-body">
          {findings.map((finding, index) => (
            <button key={`${finding.section}-${finding.field}-${index}`} type="button" onClick={() => onSelectSection(finding.section, finding.field)}>
              <span className={index < preflight.issues.length ? 'danger' : 'warning'} aria-hidden="true" />
              <span><strong>{finding.sectionLabel}</strong><small>{finding.message}</small></span>
              <span aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      )}
    </details>
  );
}
