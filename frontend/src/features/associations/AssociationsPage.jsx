import { useRef, useState } from 'react';

import { useExitPresence } from '../../components/ui/useExitPresence';
import {
  ASSOCIATION_FILTERS,
  associationAvailability,
  parseAssociationComponents,
} from './associationPresentation';


function SortLabel({
  activeField,
  children,
  direction,
  field,
  onSort,
}) {
  const active = activeField === field;
  return (
    <button
      type="button"
      className={`association-sort-button ${active ? 'active' : ''}`}
      aria-pressed={active}
      onClick={() => onSort(field)}
    >
      {children}
      <span aria-hidden="true">
        {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  );
}


function AssociationImportDialog({
  file,
  loading,
  onCancel,
  onConfirm,
}) {
  const presence = useExitPresence(file);
  if (!presence.shouldRender) return null;

  const renderedFile = presence.renderedValue;
  return (
    <>
      <div
        className={`modal-overlay ${presence.isExiting ? 'is-exiting' : ''}`}
        onClick={onCancel}
      />
      <div
        className={`custom-modal association-import-modal ${
          presence.isExiting ? 'is-exiting' : ''
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="association-import-title"
      >
        <div className="association-import-icon" aria-hidden="true">⇧</div>
        <span className="association-editor-eyebrow">Importazione associazioni</span>
        <h3 id="association-import-title">Sostituire le associazioni attuali?</h3>
        <p>
          Il file <strong>{renderedFile.name}</strong> diventerà la nuova sorgente attiva.
          Prima dell’importazione verranno validate tutte le righe e le quantità.
        </p>
        <div className="association-import-warning">
          Le associazioni correnti verranno sostituite. In caso di errore il database
          resterà invariato.
        </div>
        <div className="association-import-actions">
          <button type="button" className="btn btn-neutral" onClick={onCancel}>
            Annulla
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Importazione…' : 'Importa e sostituisci'}
          </button>
        </div>
      </div>
    </>
  );
}


export function AssociationsPage({ associations }) {
  const {
    associationSummary,
    availabilityFilter,
    handleDeleteAssociation,
    handleFileUpload,
    handleOpenEditAssociation,
    handleSortProduct,
    highlightText,
    Icons,
    loading,
    paginatedProducts,
    Pagination,
    productData,
    productsLimit,
    productsPage,
    productSort,
    searchProduct,
    setAvailabilityFilter,
    setProductsLimit,
    setProductsPage,
    setSearchProduct,
    sortedProducts,
    TableSkeleton,
    tabLoading,
    totalProductsPages,
  } = associations;
  const fileInputRef = useRef(null);
  const [pendingImportFile, setPendingImportFile] = useState(null);

  const cancelImport = () => {
    setPendingImportFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmImport = async () => {
    if (!pendingImportFile) return;
    const selectedFile = pendingImportFile;
    setPendingImportFile(null);
    await handleFileUpload(
      { target: { files: [selectedFile] } },
      'associations',
    );
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const summaryItems = [
    { label: 'Associazioni', value: associationSummary.total, tone: 'neutral' },
    { label: 'Disponibili', value: associationSummary.available, tone: 'success' },
    { label: 'Disponibilità bassa', value: associationSummary.critical, tone: 'warning' },
    { label: 'Esaurite', value: associationSummary.unavailable, tone: 'danger' },
  ];

  return (
    <section className="associations-workbench">
      <div className="associations-command-bar">
        <div>
          <span className="associations-kicker">Catalogo kit</span>
          <h2>Associazioni prodotto-componenti</h2>
          <p>Controlla composizione, disponibilità risultante e collo di bottiglia di ogni kit.</p>
        </div>
        <div className="associations-command-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="association-file-input"
            onChange={event => {
              const file = event.target.files?.[0];
              if (file) setPendingImportFile(file);
            }}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            <Icons.Upload /> Importa Excel
          </button>
          <a
            className="btn btn-secondary"
            href="/api/associations/export"
            download="associazioni.xlsx"
          >
            <Icons.Download /> Esporta Excel
          </a>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenEditAssociation(null)}
          >
            <Icons.Plus /> Nuova associazione
          </button>
        </div>
      </div>

      <div className="associations-summary-strip" aria-label="Riepilogo associazioni">
        {summaryItems.map(item => (
          <div key={item.label} className={`association-summary-item ${item.tone}`}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="associations-toolbar">
        <label className="association-search">
          <span className="sr-only">Cerca associazioni</span>
          <svg className="search-icon-svg" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z" />
          </svg>
          <input
            type="search"
            className="search-input"
            placeholder="Cerca Product ID, componente o SKU limitante"
            value={searchProduct}
            onChange={event => setSearchProduct(event.target.value)}
          />
        </label>
        <div className="association-filter-group" role="group" aria-label="Filtra per disponibilità">
          {ASSOCIATION_FILTERS.map(filter => (
            <button
              key={filter.id}
              type="button"
              className={availabilityFilter === filter.id ? 'active' : ''}
              aria-pressed={availabilityFilter === filter.id}
              onClick={() => setAvailabilityFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <span className="association-result-count">
          {sortedProducts.length} di {productData.length}
        </span>
      </div>

      <div className="associations-table-shell">
        {tabLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : sortedProducts.length > 0 ? (
          <>
            <div className="table-container associations-table-scroll">
              <table className="custom-table associations-table">
                <thead>
                  <tr>
                    <th>
                      <SortLabel
                        activeField={productSort.field}
                        direction={productSort.direction}
                        field="product_id"
                        onSort={handleSortProduct}
                      >
                        Prodotto
                      </SortLabel>
                    </th>
                    <th>Componenti del kit</th>
                    <th>
                      <SortLabel
                        activeField={productSort.field}
                        direction={productSort.direction}
                        field="qty_available"
                        onSort={handleSortProduct}
                      >
                        Disponibilità finale
                      </SortLabel>
                    </th>
                    <th>
                      <SortLabel
                        activeField={productSort.field}
                        direction={productSort.direction}
                        field="limiting_sku"
                        onSort={handleSortProduct}
                      >
                        SKU limitante
                      </SortLabel>
                    </th>
                    <th className="association-actions-heading">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map(association => {
                    const availability = associationAvailability(association);
                    const components = parseAssociationComponents(
                      association.components_str,
                    );
                    const visibleComponents = components.slice(0, 4);
                    return (
                      <tr
                        key={association.product_id}
                        className={`association-row ${availability.tone}`}
                      >
                        <td>
                          <span className="association-product-label">Prodotto PrestaShop</span>
                          <strong className="association-product-id">
                            {highlightText(association.product_id, searchProduct)}
                          </strong>
                        </td>
                        <td>
                          <div className="association-component-list">
                            {visibleComponents.map(component => (
                              <span key={`${component.sku}-${component.quantity}`}>
                                <code>{highlightText(component.sku, searchProduct)}</code>
                                <b>×{component.quantity}</b>
                              </span>
                            ))}
                            {components.length > visibleComponents.length && (
                              <span className="association-components-more">
                                +{components.length - visibleComponents.length} altri
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className={`association-availability ${availability.tone}`}>
                            <strong>{availability.quantity}</strong>
                            <span>
                              <b>{availability.label}</b>
                              <small>kit vendibili</small>
                            </span>
                          </div>
                        </td>
                        <td>
                          {association.limiting_sku ? (
                            <div className="association-limiting-sku">
                              <code>
                                {highlightText(association.limiting_sku, searchProduct)}
                              </code>
                              <small>Collo di bottiglia del kit</small>
                            </div>
                          ) : (
                            <span className="association-no-limit">Nessuna SKU limitante</span>
                          )}
                        </td>
                        <td>
                          <div className="association-row-actions">
                            <button
                              className="btn btn-neutral btn-sm"
                              onClick={() => handleOpenEditAssociation(association.product_id)}
                              type="button"
                            >
                              <Icons.Edit /> Modifica
                            </button>
                            <button
                              className="association-delete-action"
                              onClick={() => handleDeleteAssociation(association.product_id)}
                              title="Elimina associazione"
                              aria-label={`Elimina associazione ${association.product_id}`}
                              type="button"
                            >
                              <Icons.Delete />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={productsPage}
              totalPages={totalProductsPages}
              onPageChange={setProductsPage}
              limit={productsLimit}
              limitOptions={[25, 50, 100]}
              onLimitChange={setProductsLimit}
              showPageNumbers
              totalItems={sortedProducts.length}
              disabled={tabLoading}
            />
          </>
        ) : (
          <div className="associations-empty-state">
            <div aria-hidden="true">⇄</div>
            <strong>
              {productData.length ? 'Nessuna associazione corrisponde ai filtri' : 'Nessuna associazione configurata'}
            </strong>
            <p>
              {productData.length
                ? 'Modifica la ricerca o seleziona un altro stato di disponibilità.'
                : 'Crea manualmente la prima associazione oppure importa un file Excel.'}
            </p>
          </div>
        )}
      </div>

      <AssociationImportDialog
        file={pendingImportFile}
        loading={loading}
        onCancel={cancelImport}
        onConfirm={confirmImport}
      />
    </section>
  );
}
