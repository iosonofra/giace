import React, { useRef } from 'react';


const isExcelFile = (file) => (
  file.name.toLowerCase().endsWith('.xlsx')
  || file.name.toLowerCase().endsWith('.xls')
);


export function PickingFileInput({
  files,
  onFilesChange,
  onSubmit,
  onReset,
  error,
  loading,
  hasResults,
}) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = React.useState(false);

  const addFiles = (incomingFiles) => {
    const excelFiles = Array.from(incomingFiles || []).filter(isExcelFile);
    if (excelFiles.length > 0) {
      onFilesChange((currentFiles) => [...currentFiles, ...excelFiles]);
    }
  };

  return (
    <div className="picking-workflow-form">
      <div
        className={`picking-upload-target ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragOver(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          addFiles(event.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <svg width="24" height="24" fill="none" stroke="var(--color-primary)" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div>
          <span>Trascina o clicca per caricare Excel</span>
          <small>File .xlsx o .xls, anche multipli</small>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          multiple
          hidden
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="picking-file-list">
          <span className="picking-list-label">
            File Selezionati ({files.length})
          </span>
          <div className="picking-file-stack">
            {files.map((file, index) => (
              <div key={`${file.name}-${file.size}-${index}`} className="picking-file-row">
                <div className="picking-file-name">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{file.name}</span>
                  <small>({(file.size / 1024).toFixed(1)} KB)</small>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onFilesChange((currentFiles) => (
                      currentFiles.filter((_, fileIndex) => fileIndex !== index)
                    ));
                  }}
                  className="btn btn-neutral picking-file-remove"
                >
                  Rimuovi
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="picking-alert picking-alert-danger">
          <strong>File non elaborato.</strong>
          <span>{error}</span>
        </div>
      )}

      <div className="picking-form-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={loading || files.length === 0}
          onClick={onSubmit}
        >
          {loading ? (
            <>
              <span className="spinner picking-inline-spinner" aria-hidden="true" />
              Elaborazione in corso...
            </>
          ) : (
            'Calcola Fabbisogno da File'
          )}
        </button>

        {(hasResults || files.length > 0) && (
          <button type="button" className="btn btn-neutral" onClick={onReset}>
            Nuovo Calcolo
          </button>
        )}
      </div>
    </div>
  );
}
