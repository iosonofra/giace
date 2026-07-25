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
                      <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Backup & Ripristino Database</h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.6' }}>
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
                          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-primary)' }}>
                            {restoreCountdown}
                          </div>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                            Database ripristinato con successo!
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
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
                            <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>Scarica Backup</span>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
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
                            <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>Ripristina Database</span>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                            Carica un file <code>.db</code> precedentemente scaricato. <strong style={{ color: 'var(--color-danger)' }}>Sovrascrive tutti i dati correnti.</strong>
                            Prima del ripristino viene salvata una copia di emergenza automatica.
                          </p>
                          <label
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '9px 16px',
                              borderRadius: '8px',
                              border: '1px solid rgba(239,68,68,0.3)',
                              backgroundColor: restoreLoading ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.08)',
                              color: 'var(--color-danger)',
                              fontWeight: '600',
                              fontSize: '0.88rem',
                              cursor: restoreLoading || backupLoading ? 'not-allowed' : 'pointer',
                              opacity: restoreLoading || backupLoading ? 0.6 : 1,
                              transition: 'all 0.2s'
                            }}
                          >
                            {restoreLoading ? (
                              <>
                                <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(239,68,68,0.3)', borderTopColor: 'var(--color-danger)' }}></div>
                                {restoreCountdown !== null ? `Riavvio in ${restoreCountdown}s...` : 'Ripristino in corso...'}
                              </>
                            ) : (
                              'Scegli file .db e Ripristina'
                            )}
                            <input
                              type="file"
                              accept=".db"
                              style={{ display: 'none' }}
                              onChange={handleRestoreDatabase}
                              disabled={restoreLoading || backupLoading}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
  );
}
