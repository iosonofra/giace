import { useEffect, useRef, useState } from 'react';
import { PickingAutomaticPlanner } from './PickingAutomaticPlanner';
import { PickingFileInput } from './PickingFileInput';
import { PickingHistoryDialog } from './PickingHistoryDialog';
import { PickingResultsPanel } from './PickingResultsPanel';
import { PickingStateInput } from './PickingStateInput';
import { PickingTextInput } from './PickingTextInput';


export function PickingPage({
  inputMode,
  setInputMode,
  error,
  setError,
  loading,
  results,
  setResults,
  rawText,
  setRawText,
  detectedOrderCount,
  onCalculateText,
  selectedFiles,
  setSelectedFiles,
  onUploadFiles,
  setFileAnomalies,
  setFileSummary,
  onNewOperation,
  stateInputProps,
  automaticPlannerProps,
  resultsProps,
  LoadingSkeleton,
}) {
  const [inputExpanded, setInputExpanded] = useState(!results);
  const [resultSourceMode, setResultSourceMode] = useState(inputMode);
  const inputModeRef = useRef(inputMode);
  inputModeRef.current = inputMode;
  const inputModes = ['text', 'file', 'state', 'automatic'];
  const inputModeLabels = {
    text: 'ID incollati',
    file: 'File Excel',
    state: 'Stato ordine',
    automatic: 'Proposta automatica',
  };

  useEffect(() => {
    setInputExpanded(!results);
    if (results) setResultSourceMode(inputModeRef.current);
    // La modalità sorgente viene catturata quando cambia il risultato, non quando si esplorano i tab.
  }, [results]);

  const selectMode = (mode) => {
    setInputMode(mode);
    setError(null);
  };

  const handleModeKeyDown = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = inputModes.indexOf(inputMode);
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? inputModes.length - 1
        : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + inputModes.length)
          % inputModes.length;
    const nextMode = inputModes[nextIndex];
    selectMode(nextMode);
    requestAnimationFrame(() => {
      document.getElementById(`picking-mode-tab-${nextMode}`)?.focus();
    });
  };

  return (
    <div className="picking-page">
      <div className="glass-panel widget-card picking-input-panel">
        <div className="picking-section-head">
          <div>
            <h2 className="widget-title">Pianificazione prelievo</h2>
            <p>Inserisci gli ordini da testo, Excel, stato PrestaShop o proposta automatica.</p>
          </div>
          <PickingHistoryDialog />
        </div>

        {results && !inputExpanded ? (
          <div className="picking-source-summary">
            <div>
              <span>Origine del calcolo</span>
              <strong>{inputModeLabels[resultSourceMode]}</strong>
              <small>
                {results.orders_found?.length || 0} ordini · {results.sku_requirements?.length || 0} SKU
              </small>
            </div>
            <div className="picking-source-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onNewOperation}
              >
                Nuova operazione
              </button>
              <button
                type="button"
                className="btn btn-neutral"
                onClick={() => setInputExpanded(true)}
              >
                Modifica origine
              </button>
            </div>
          </div>
        ) : (
          <>
            {results && (
              <div className="picking-input-collapse-actions">
                <span>Modifica la sorgente o avvia un nuovo calcolo.</span>
                <button
                  type="button"
                  className="btn btn-neutral"
                  onClick={() => setInputExpanded(false)}
                >
                  Nascondi configurazione
                </button>
              </div>
            )}
            <div
              className="picking-mode-switch"
              role="tablist"
              aria-label="Modalità inserimento lista prelievo"
              onKeyDown={handleModeKeyDown}
            >
          <button
            id="picking-mode-tab-text"
            type="button"
            className={`picking-mode-btn ${inputMode === 'text' ? 'active' : ''}`}
            role="tab"
            aria-selected={inputMode === 'text'}
            aria-controls="picking-mode-panel"
            tabIndex={inputMode === 'text' ? 0 : -1}
            onClick={() => selectMode('text')}
          >
            Incolla ID
          </button>
          <button
            id="picking-mode-tab-file"
            type="button"
            className={`picking-mode-btn ${inputMode === 'file' ? 'active' : ''}`}
            role="tab"
            aria-selected={inputMode === 'file'}
            aria-controls="picking-mode-panel"
            tabIndex={inputMode === 'file' ? 0 : -1}
            onClick={() => selectMode('file')}
          >
            Carica Excel
          </button>
          <button
            id="picking-mode-tab-state"
            type="button"
            className={`picking-mode-btn ${inputMode === 'state' ? 'active' : ''}`}
            role="tab"
            aria-selected={inputMode === 'state'}
            aria-controls="picking-mode-panel"
            tabIndex={inputMode === 'state' ? 0 : -1}
            onClick={() => selectMode('state')}
          >
            Stato ordine
          </button>
          <button
            id="picking-mode-tab-automatic"
            type="button"
            className={`picking-mode-btn ${inputMode === 'automatic' ? 'active' : ''}`}
            role="tab"
            aria-selected={inputMode === 'automatic'}
            aria-controls="picking-mode-panel"
            tabIndex={inputMode === 'automatic' ? 0 : -1}
            onClick={() => selectMode('automatic')}
          >
            Automatica
          </button>
            </div>

            <div
              id="picking-mode-panel"
              key={inputMode}
              className="picking-mode-content"
              role="tabpanel"
              aria-labelledby={`picking-mode-tab-${inputMode}`}
            >
          {inputMode === 'text' ? (
            <PickingTextInput
              value={rawText}
              onChange={setRawText}
              onSubmit={onCalculateText}
              error={error}
              loading={loading}
              hasResults={Boolean(results)}
              detectedOrderCount={detectedOrderCount}
              onReset={() => {
                setRawText('');
                setResults(null);
                setError(null);
              }}
            />
          ) : inputMode === 'file' ? (
            <PickingFileInput
              files={selectedFiles}
              onFilesChange={setSelectedFiles}
              onSubmit={onUploadFiles}
              onReset={() => {
                setSelectedFiles([]);
                setResults(null);
                setError(null);
                setFileAnomalies([]);
                setFileSummary([]);
              }}
              error={error}
              loading={loading}
              hasResults={Boolean(results)}
            />
          ) : inputMode === 'state' ? (
            <PickingStateInput {...stateInputProps} />
          ) : (
            <PickingAutomaticPlanner {...automaticPlannerProps} />
          )}
            </div>
          </>
        )}
      </div>

      {loading && !results && (
        <div
          className="glass-panel widget-card picking-loading-panel"
          aria-live="polite"
        >
          <div className="picking-loading-header">
            <h2 className="widget-title picking-loading-title">
              Analisi del fabbisogno in corso
            </h2>
            <span className="badge badge-neutral">Caricamento</span>
          </div>
          <LoadingSkeleton rows={6} cols={5} />
        </div>
      )}

      <PickingResultsPanel {...resultsProps} />
    </div>
  );
}
