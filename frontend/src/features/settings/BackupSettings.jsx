export function BackupSettings({ settings }) {
  const {
    backupLoading,
    handleDownloadBackup,
    handleRestoreDatabase,
    restoreCountdown,
    restoreLoading,
  } = settings;

  return (
    <div className="glass-panel widget-card">
                      <h2 className="backup-page-title" style={{ marginBottom: '8px' }}>Backup & Ripristino Database</h2>
                      <p className="backup-page-description" style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        Salva una copia completa dell'intero database locale (ordini, giacenze, associazioni, impostazioni) oppure ripristina un backup precedente.
                        Il ripristino sovrascrive tutti i dati correnti e riavvia automaticamente il server.
                      </p>

                      {/* Restore countdown overlay */}
                      {restoreCountdown !== null && (
                        <div style={{
                          padding: '20px',
                          borderRadius: '12px',
                          background: 'rgba(99,102,241,0.07)',
                          border: '1px solid rgba(99,102,241,0.25)',
                          marginBottom: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '12px',
                          textAlign: 'center'
                        }}>
                          <div className="backup-restore-countdown" style={{ color: 'var(--color-primary)' }}>
                            {restoreCountdown}
                          </div>
                          <div className="backup-restore-success" style={{ color: 'var(--text-primary)' }}>
                            Database ripristinato con successo!
                          </div>
                          <div className="backup-restore-message" style={{ color: 'var(--text-secondary)' }}>
                            Il server si sta riavviando… la pagina si aggiornerà automaticamente tra {restoreCountdown} secondi.
                          </div>
                          <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        {/* Download Backup */}
                        <div style={{ padding: '20px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(16, 185, 129, 0.03)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <svg width="22" height="22" fill="none" stroke="var(--color-success)" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span className="backup-card-title" style={{ color: 'var(--text-primary)' }}>Scarica Backup</span>
                          </div>
                          <p className="backup-card-description" style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            Scarica una copia del database SQLite (<code>.db</code>). Contiene tutti i tuoi dati, pronto per il ripristino.
                          </p>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px' }}
                            onClick={handleDownloadBackup}
                            disabled={backupLoading || restoreLoading}
                          >
                            {backupLoading ? (
                              <>
                                <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(16,185,129,0.3)', borderTopColor: 'var(--color-success)' }}></div>
                                Preparazione...
                              </>
                            ) : (
                              'Scarica Backup (.db)'
                            )}
                          </button>
                        </div>

                        {/* Restore Database */}
                        <div style={{ padding: '20px', borderRadius: '10px', border: restoreLoading ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border-color)', backgroundColor: restoreLoading ? 'rgba(239,68,68,0.03)' : 'rgba(239, 68, 68, 0.02)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <svg width="22" height="22" fill="none" stroke="var(--color-danger)" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span className="backup-card-title" style={{ color: 'var(--text-primary)' }}>Ripristina Database</span>
                          </div>
                          <p className="backup-card-description" style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            Carica un file <code>.db</code> precedentemente scaricato. <strong className="backup-danger-copy">Sovrascrive tutti i dati correnti.</strong>
                            Prima del ripristino viene salvata una copia di emergenza automatica.
                          </p>
                          <label
                            className={`backup-restore-action ${
                              restoreLoading || backupLoading ? 'is-disabled' : ''
                            }`}
                            aria-busy={restoreLoading}
                          >
                            {restoreLoading ? (
                              <>
                                <span className="spinner spinner-inline spinner-danger" />
                                {restoreCountdown !== null ? `Riavvio in ${restoreCountdown}s...` : 'Ripristino in corso...'}
                              </>
                            ) : (
                              'Scegli file .db e Ripristina'
                            )}
                            <input
                              type="file"
                              accept=".db"
                              className="backup-file-input"
                              onChange={handleRestoreDatabase}
                              disabled={restoreLoading || backupLoading}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
  );
}
