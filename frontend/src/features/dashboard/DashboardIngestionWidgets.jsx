function UploadCard({ description, label, onChange, uploadIcon = 'cloud' }) {
  return (
    <label className="upload-card" style={{ cursor: 'pointer', width: '100%' }}>
      <svg width="28" height="28" fill="none" stroke="var(--color-primary)" strokeWidth="2" viewBox="0 0 24 24">
        {uploadIcon === 'cloud' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        )}
      </svg>
      <span style={{ fontSize: '0.85rem', fontWeight: '600', marginTop: '4px' }}>
        {label}
      </span>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
        {description}
      </span>
      <input
        type="file"
        className="file-input"
        accept=".xlsx"
        style={{ display: 'none' }}
        onChange={onChange}
      />
    </label>
  );
}

function ActiveBatch({ batch, association = false }) {
  if (!batch) return null;
  return (
    <p style={{
      color: 'var(--text-secondary)',
      fontSize: '0.75rem',
      marginBottom: 0,
      marginTop: '4px',
    }}>
      Batch attivo: <strong>{batch.filename}</strong>
      {!association && <> (Foglio: {batch.sheet_name})</>}
      {' '}con {batch.record_count} {association ? 'associazioni' : 'SKU'}.
    </p>
  );
}

export function DashboardIngestionWidgets({ dashboard }) {
  const {
    availableSheets,
    googleSheetLastSync,
    handleFileUpload,
    handleLocalImport,
    handleSyncGoogleSheetsNow,
    loading,
    selectedSheet,
    setSelectedSheet,
    status,
    stockSource,
    syncingGoogleSheets,
  } = dashboard;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel widget-card" style={{ gap: '16px' }}>
        <span className="widget-title">Ingestione Inventario Fisico (Giacenze)</span>

        {stockSource === 'google_sheets' ? (
          <div style={{
            background: 'rgba(5, 150, 105, 0.045)',
            border: '1px solid rgba(5, 150, 105, 0.18)',
            borderRadius: '8px',
            padding: '16px',
          }}>
            <h3 style={{
              alignItems: 'center',
              display: 'flex',
              fontSize: '0.95rem',
              gap: '8px',
              marginBottom: '6px',
            }}>
              <span style={{
                backgroundColor: 'var(--color-success)',
                borderRadius: '50%',
                display: 'inline-block',
                height: '8px',
                width: '8px',
              }} />
              Sincronizzazione Google Sheets Attiva
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.82rem',
              marginBottom: '12px',
            }}>
              L'inventario è collegato al foglio di calcolo remoto.
            </p>
            <div style={{
              alignItems: 'center',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <button
                className="btn btn-primary"
                disabled={syncingGoogleSheets}
                onClick={handleSyncGoogleSheetsNow}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                {syncingGoogleSheets ? 'Sincronizzazione...' : 'Sincronizza Ora'}
              </button>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                Verificato: {googleSheetLastSync
                  ? new Date(googleSheetLastSync).toLocaleString('it-IT')
                  : 'Mai'}
              </span>
            </div>
            <ActiveBatch batch={status?.active_warehouse_batch} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {status?.local_files?.giacenza_exists && (
              <div style={{
                alignItems: 'center',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                justifyContent: 'space-between',
                padding: '12px',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                  }}>
                    Foglio Excel Attivo
                  </label>
                  <select
                    className="select-control"
                    style={{ fontSize: '0.82rem', height: '32px', width: '180px' }}
                    value={selectedSheet}
                    onChange={event => setSelectedSheet(event.target.value)}
                  >
                    {availableSheets.map(sheet => (
                      <option key={sheet} value={sheet}>{sheet}</option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ fontSize: '0.82rem', height: '32px', padding: '0 12px' }}
                  onClick={() => handleLocalImport('warehouse')}
                  disabled={loading}
                >
                  Importa da [{selectedSheet}]
                </button>
              </div>
            )}
            <UploadCard
              description="Carica il file delle giacenze fisiche in formato Excel (.xlsx)"
              label="Sfoglia o trascina giacenza.xlsx"
              onChange={event => handleFileUpload(event, 'warehouse')}
            />
            <ActiveBatch batch={status?.active_warehouse_batch} />
          </div>
        )}
      </div>

      <div className="glass-panel widget-card" style={{ gap: '16px' }}>
        <span className="widget-title">Carica Esplosione Distinte (Associazioni)</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {status?.local_files?.associazione_exists && (
            <div style={{
              alignItems: 'center',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'space-between',
              padding: '12px',
            }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                Trovato file <code>associazione.xlsx</code> in locale.
              </span>
              <button
                className="btn btn-primary"
                style={{ fontSize: '0.82rem', height: '32px', padding: '0 12px' }}
                onClick={() => handleLocalImport('associations')}
                disabled={loading}
              >
                Importa File Local
              </button>
            </div>
          )}
          <UploadCard
            description="Carica il file con l'esplosione dei kit in SKU (.xlsx)"
            label="Sfoglia o trascina associazione.xlsx"
            onChange={event => handleFileUpload(event, 'associations')}
            uploadIcon="document"
          />
          <ActiveBatch batch={status?.active_associations_batch} association />
        </div>
      </div>
    </div>
  );
}
