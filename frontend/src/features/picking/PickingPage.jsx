import { PickingAutomaticPlanner } from './PickingAutomaticPlanner';
import { PickingFileInput } from './PickingFileInput';
import { PickingResultsPanel } from './PickingResultsPanel';
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
  automaticPlannerProps,
  resultsProps,
  LoadingSkeleton,
}) {
  const selectMode = (mode) => {
    setInputMode(mode);
    setError(null);
  };

  return (
    <div className="picking-page">
      <div className="glass-panel widget-card picking-input-panel">
        <div className="picking-section-head">
          <div>
            <span className="widget-title">Pianificazione Prelievo</span>
            <p>Inserisci ordini da testo oppure importa uno o più Excel di prelievo.</p>
          </div>
        </div>

        <div
          className="picking-mode-switch"
          role="tablist"
          aria-label="Modalità inserimento lista prelievo"
        >
          <button
            type="button"
            className={`picking-mode-btn ${inputMode === 'text' ? 'active' : ''}`}
            role="tab"
            aria-selected={inputMode === 'text'}
            onClick={() => selectMode('text')}
          >
            Incolla ID
          </button>
          <button
            type="button"
            className={`picking-mode-btn ${inputMode === 'file' ? 'active' : ''}`}
            role="tab"
            aria-selected={inputMode === 'file'}
            onClick={() => selectMode('file')}
          >
            Carica Excel
          </button>
          <button
            type="button"
            className={`picking-mode-btn ${inputMode === 'automatic' ? 'active' : ''}`}
            role="tab"
            aria-selected={inputMode === 'automatic'}
            onClick={() => selectMode('automatic')}
          >
            Automatica
          </button>
        </div>

        <div key={inputMode} className="picking-mode-content">
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
          ) : (
            <PickingAutomaticPlanner {...automaticPlannerProps} />
          )}
        </div>
      </div>

      {loading && !results && (
        <div
          className="glass-panel widget-card picking-loading-panel"
          aria-live="polite"
        >
          <div className="picking-loading-header">
            <span className="widget-title picking-loading-title">
              Analisi del fabbisogno in corso
            </span>
            <span className="badge badge-neutral">Caricamento</span>
          </div>
          <LoadingSkeleton rows={6} cols={5} />
        </div>
      )}

      <PickingResultsPanel {...resultsProps} />
    </div>
  );
}
