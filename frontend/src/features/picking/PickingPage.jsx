import { useEffect, useRef, useState } from 'react';
import { Icons } from '../../components/ui/Icons';
import { PickingAutomaticPlanner } from './PickingAutomaticPlanner';
import { PickingFileInput } from './PickingFileInput';
import { PickingHistoryDialog } from './PickingHistoryDialog';
import { PickingGaerInput } from './PickingGaerInput';
import { PickingResultsPanel } from './PickingResultsPanel';
import { PickingStateInput } from './PickingStateInput';
import { PickingTextInput } from './PickingTextInput';
import { StockVerificationWorkflow } from './StockVerificationWorkflow';


const PICKING_SOURCE_MODES = [
  {
    id: 'text',
    label: 'ID ordine',
    summaryLabel: 'ID incollati',
    description: 'Incolla uno o più ID ordine da elaborare.',
    Icon: Icons.Picking,
  },
  {
    id: 'file',
    label: 'File Excel',
    description: 'Carica uno o più file contenenti gli ordini.',
    Icon: Icons.Upload,
  },
  {
    id: 'state',
    label: 'Stato PrestaShop',
    summaryLabel: 'Stato ordine',
    description: 'Seleziona gli ordini partendo dai loro stati.',
    Icon: Icons.Orders,
  },
  {
    id: 'gaer',
    label: 'Disponibilità Gaer',
    summaryLabel: 'Gaer',
    description: 'Calcola il prelievo usando la disponibilità EAN del file Gaer.',
    Icon: Icons.Stock,
  },
  {
    id: 'automatic',
    label: 'Proposta automatica',
    description: 'Lascia che il sistema proponga gli ordini preparabili.',
    Icon: Icons.Check,
  },
];

const PICKING_TOOL_MODES = [
  {
    id: 'stock_verification',
    label: 'Verifica giacenze',
    description: 'Confronta un file esterno con l’ordine corrente di Google Sheets.',
    Icon: Icons.Search,
  },
];

const PICKING_MODES = [...PICKING_SOURCE_MODES, ...PICKING_TOOL_MODES];


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
  gaerInputProps,
  automaticPlannerProps,
  stockVerificationProps,
  resultsProps,
  LoadingSkeleton,
}) {
  const [inputExpanded, setInputExpanded] = useState(!results);
  const [resultSourceMode, setResultSourceMode] = useState(inputMode);
  const inputModeRef = useRef(inputMode);
  inputModeRef.current = inputMode;
  const inputModes = PICKING_MODES.map(mode => mode.id);
  const activeMode = PICKING_MODES.find(mode => mode.id === inputMode) || PICKING_MODES[0];
  const inputModeLabels = Object.fromEntries(
    PICKING_MODES.map(mode => [mode.id, mode.summaryLabel || mode.label]),
  );

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
            <p>Inserisci gli ordini da testo, Excel, stato PrestaShop, disponibilità Gaer o proposta automatica.</p>
          </div>
          <PickingHistoryDialog />
        </div>

        {results && !inputExpanded ? (
          <div className="picking-source-summary">
            <div>
              <span>Origine del calcolo</span>
              <strong>{inputModeLabels[resultSourceMode]}</strong>
              <small>
                {results.orders_found?.length || 0} ordini · {results.sku_requirements?.length || 0} {results.mode === 'gaer' ? 'EAN' : 'SKU'}
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
            <div className="picking-mode-selector">
              <div
                className="picking-mode-switch"
                role="tablist"
                aria-label="Origine della lista prelievo e strumenti"
                onKeyDown={handleModeKeyDown}
              >
                <div className="picking-mode-source-group" role="presentation">
                  <div className="picking-mode-selector-head">
                    <strong>Origine della lista</strong>
                    <span>Scegli come individuare gli ordini da preparare.</span>
                  </div>
                  <div className="picking-mode-source-list" role="presentation">
                    {PICKING_SOURCE_MODES.map(mode => {
                      const ModeIcon = mode.Icon;
                      const selected = inputMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          id={`picking-mode-tab-${mode.id}`}
                          type="button"
                          className={`picking-mode-btn ${selected ? 'active' : ''}`}
                          role="tab"
                          aria-selected={selected}
                          aria-controls="picking-mode-panel"
                          aria-describedby={selected ? 'picking-mode-description' : undefined}
                          tabIndex={selected ? 0 : -1}
                          onClick={() => selectMode(mode.id)}
                        >
                          <ModeIcon />
                          <span>{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="picking-mode-tools" role="presentation">
                  <div className="picking-mode-tools-head">
                    <strong>Strumenti</strong>
                    <span>Controlli separati dalla pianificazione.</span>
                  </div>
                  {PICKING_TOOL_MODES.map(mode => {
                    const ModeIcon = mode.Icon;
                    const selected = inputMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        id={`picking-mode-tab-${mode.id}`}
                        type="button"
                        className={`picking-mode-btn picking-mode-tool-btn ${selected ? 'active' : ''}`}
                        role="tab"
                        aria-selected={selected}
                        aria-controls="picking-mode-panel"
                        aria-describedby={selected ? 'picking-mode-description' : undefined}
                        tabIndex={selected ? 0 : -1}
                        onClick={() => selectMode(mode.id)}
                      >
                        <ModeIcon />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <p id="picking-mode-description" className="picking-mode-description" aria-live="polite">
                <strong>{activeMode.label}</strong>
                <span>{activeMode.description}</span>
              </p>
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
          ) : inputMode === 'gaer' ? (
            <PickingGaerInput {...gaerInputProps} />
          ) : inputMode === 'stock_verification' ? (
            <StockVerificationWorkflow verification={stockVerificationProps} />
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
