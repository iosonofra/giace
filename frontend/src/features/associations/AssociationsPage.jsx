import { useEffect, useRef, useState } from 'react';

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
      aria-label={`${children}, ordinamento ${active ? (direction === 'asc' ? 'crescente' : 'decrescente') : 'non attivo'}`}
      onClick={() => onSort(field)}
    >
      {children}
      <span aria-hidden="true">
        {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  );
}

function ProductIdentity({ association, highlightText, searchProduct }) {
  return (
    <div className="association-product-identity-cell">
      <strong>{highlightText(association.product_name || `Prodotto ${association.product_id}`, searchProduct)}</strong>
      <span>
        ID {highlightText(association.product_id, searchProduct)}
        {association.product_reference && <> · Rif. {highlightText(association.product_reference, searchProduct)}</>}
      </span>
    </div>
  );
}

function ComponentList({ components, expanded, highlightText, onToggle, searchProduct }) {
  const visibleComponents = expanded ? components : components.slice(0, 4);
  const remaining = components.length - visibleComponents.length;
  return (
    <div className="association-component-list">
      {visibleComponents.map(component => (
        <span key={`${component.sku}-${component.quantity}`}>
          <code>{highlightText(component.sku, searchProduct)}</code><b>×{component.quantity}</b>
        </span>
      ))}
      {(remaining > 0 || expanded && components.length > 4) && (
        <button type="button" className="association-components-toggle" onClick={onToggle} aria-expanded={expanded}>
          {expanded ? 'Mostra meno' : `+${remaining} altri`}
        </button>
      )}
    </div>
  );
}

function AssociationMobileCard({ association, expanded, handleDeleteAssociation, handleOpenEditAssociation, highlightText, Icons, onToggle, searchProduct }) {
  const availability = associationAvailability(association);
  const components = parseAssociationComponents(association.components_str);
  return (
    <article className={`association-mobile-card ${availability.tone}`}>
      <header><ProductIdentity association={association} highlightText={highlightText} searchProduct={searchProduct} /><div className={`association-availability ${availability.tone}`}><strong>{availability.quantity}</strong><span><b>{availability.label}</b><small>kit disponibili</small></span></div></header>
      <section><span className="association-mobile-label">Componenti del kit</span><ComponentList components={components} expanded={expanded} highlightText={highlightText} onToggle={onToggle} searchProduct={searchProduct} /></section>
      <footer><div>{association.limiting_sku ? <><span className="association-mobile-label">SKU limitante</span><code>{association.limiting_sku}</code></> : <span className="association-no-limit">Nessuna SKU limitante</span>}</div><div className="association-row-actions"><button className="btn btn-neutral btn-sm" onClick={() => handleOpenEditAssociation(association.product_id)} type="button"><Icons.Edit /> Modifica</button><button className="association-delete-action" onClick={() => handleDeleteAssociation(association.product_id)} aria-label={`Elimina associazione ${association.product_id}`} type="button"><Icons.Delete /></button></div></footer>
    </article>
  );
}


function AssociationImportDialog({
  file,
  loading,
  onCancel,
  onConfirm,
}) {
  const presence = useExitPresence(file);
  const modalRef = useRef(null);
  useEffect(() => {
    if (!file) return undefined;
    const timeoutId = setTimeout(() => modalRef.current?.querySelector('button')?.focus(), 0);
    return () => clearTimeout(timeoutId);
  }, [file]);
  if (!presence.shouldRender) return null;

  const renderedFile = presence.renderedValue;
  return (
    <>
      <div
        className={`modal-overlay ${presence.isExiting ? 'is-exiting' : ''}`}
      />
      <div
        ref={modalRef}
        className={`custom-modal association-import-modal ${
          presence.isExiting ? 'is-exiting' : ''
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="association-import-title"
        aria-describedby="association-import-description"
        onKeyDown={event => {
          if (event.key === 'Escape' && !loading) {
            event.preventDefault();
            event.stopPropagation();
            onCancel();
          } else if (event.key === 'Tab') {
            const focusable = Array.from(modalRef.current?.querySelectorAll('button:not([disabled])') || []);
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first.focus();
            }
          }
        }}
        onTransitionEnd={presence.completeExit}
      >
        <button type="button" className="modal-close association-import-close" onClick={onCancel} disabled={loading} aria-label="Chiudi importazione">×</button>
        <div className="association-import-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L7 9m5-5 5 5M5 20h14" /></svg></div>
        <h3 id="association-import-title">Sostituire le associazioni attuali?</h3>
        <p id="association-import-description">
          Il file <strong>{renderedFile.name}</strong> diventerà la nuova sorgente attiva.
          Prima dell’importazione verranno validate tutte le righe e le quantità.
        </p>
        <div className="association-import-warning">
          Le associazioni correnti verranno sostituite. In caso di errore il database
          resterà invariato.
        </div>
        <div className="association-import-actions">
          <button type="button" className="btn btn-neutral" onClick={onCancel} disabled={loading}>
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
    associationsError,
    associationsRefreshing,
    availabilityFilter,
    clearAssociationFilters,
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
    retryAssociations,
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
  const [expandedProducts, setExpandedProducts] = useState(() => new Set());

  const cancelImport = () => {
    setPendingImportFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmImport = async () => {
    if (!pendingImportFile) return;
    const selectedFile = pendingImportFile;
    const succeeded = await handleFileUpload(
      { target: { files: [selectedFile] } },
      'associations',
    );
    if (succeeded) cancelImport();
  };

  const toggleExpandedProduct = productId => {
    setExpandedProducts(current => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const summaryItems = [
    { filter: 'all', label: 'Prodotti associati', value: associationSummary.total, tone: 'neutral' },
    { filter: 'available', label: 'Disponibilità regolare', value: associationSummary.available, tone: 'success' },
    { filter: 'critical', label: 'Disponibilità bassa', value: associationSummary.critical, tone: 'warning' },
    { filter: 'unavailable', label: 'Esauriti', value: associationSummary.unavailable, tone: 'danger' },
  ];
  const filtersActive = Boolean(searchProduct || availabilityFilter !== 'all');

  return (
    <section className="associations-workbench">
      <div className="associations-command-bar">
        <div>
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
          <button key={item.label} type="button" className={`association-summary-item ${item.tone} ${availabilityFilter === item.filter ? 'active' : ''}`} aria-pressed={availabilityFilter === item.filter} onClick={() => setAvailabilityFilter(item.filter)}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </button>
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
            placeholder="Cerca prodotto, riferimento, ID o componente"
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
        {filtersActive && <button type="button" className="association-clear-filters" onClick={clearAssociationFilters}>Azzera filtri</button>}
        <span className="association-result-count">
          {associationsRefreshing ? 'Aggiornamento…' : `${sortedProducts.length} di ${productData.length}`}
        </span>
      </div>

      {associationsError && <div className="associations-error-banner" role="alert"><div><strong>Associazioni non aggiornate</strong><span>{associationsError}</span></div><button type="button" className="btn btn-neutral btn-sm" onClick={retryAssociations}>Riprova</button></div>}

      <div className="associations-table-shell">
        {tabLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : sortedProducts.length > 0 ? (
          <>
            <div className="table-container associations-table-scroll">
              <table className="custom-table associations-table">
                <caption className="sr-only">Prodotti associati, componenti del kit e disponibilità risultante</caption>
                <thead>
                  <tr>
                    <th aria-sort={productSort.field === 'product_name' ? (productSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <SortLabel
                        activeField={productSort.field}
                        direction={productSort.direction}
                        field="product_name"
                        onSort={handleSortProduct}
                      >
                        Prodotto
                      </SortLabel>
                    </th>
                    <th>Componenti del kit</th>
                    <th aria-sort={productSort.field === 'qty_available' ? (productSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <SortLabel
                        activeField={productSort.field}
                        direction={productSort.direction}
                        field="qty_available"
                        onSort={handleSortProduct}
                      >
                        Disponibilità finale
                      </SortLabel>
                    </th>
                    <th aria-sort={productSort.field === 'limiting_sku' ? (productSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
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
                    const isExpanded = expandedProducts.has(association.product_id);
                    return (
                      <tr
                        key={association.product_id}
                        className={`association-row ${availability.tone}`}
                      >
                        <td>
                          <ProductIdentity association={association} highlightText={highlightText} searchProduct={searchProduct} />
                        </td>
                        <td>
                          <ComponentList components={components} expanded={isExpanded} highlightText={highlightText} onToggle={() => toggleExpandedProduct(association.product_id)} searchProduct={searchProduct} />
                        </td>
                        <td>
                          <div className={`association-availability ${availability.tone}`}>
                            <strong>{availability.quantity}</strong>
                            <span>
                              <b>{availability.label}</b>
                              <small>kit disponibili</small>
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
            <div className="associations-mobile-list">
              {paginatedProducts.map(association => (
                <AssociationMobileCard key={association.product_id} association={association} expanded={expandedProducts.has(association.product_id)} handleDeleteAssociation={handleDeleteAssociation} handleOpenEditAssociation={handleOpenEditAssociation} highlightText={highlightText} Icons={Icons} onToggle={() => toggleExpandedProduct(association.product_id)} searchProduct={searchProduct} />
              ))}
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
            <strong>
              {productData.length ? 'Nessuna associazione corrisponde ai filtri' : 'Nessuna associazione configurata'}
            </strong>
            <p>
              {productData.length
                ? 'Modifica la ricerca o seleziona un altro stato di disponibilità.'
                : 'Crea manualmente la prima associazione oppure importa un file Excel.'}
            </p>
            <div className="associations-empty-actions">
              {productData.length ? (
                <button type="button" className="btn btn-neutral" onClick={clearAssociationFilters}>Azzera filtri</button>
              ) : (
                <>
                  <button type="button" className="btn btn-primary" onClick={() => handleOpenEditAssociation(null)}><Icons.Plus /> Nuova associazione</button>
                  <button type="button" className="btn btn-neutral" onClick={() => fileInputRef.current?.click()}><Icons.Upload /> Importa Excel</button>
                </>
              )}
            </div>
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
