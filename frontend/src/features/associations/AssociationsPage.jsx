export function AssociationsPage({ associations }) {
  const {
    handleDeleteAssociation,
    handleOpenEditAssociation,
    handleSortProduct,
    highlightText,
    Icons,
    paginatedProducts,
    Pagination,
    productData,
    productsPage,
    productSort,
    searchProduct,
    setProductsPage,
    setSearchProduct,
    sortedProducts,
    TableSkeleton,
    tabLoading,
    totalProductsPages,
  } = associations;

  return (
    <div className="glass-panel widget-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
        <div className="search-wrapper" style={{ flexGrow: 1, maxWidth: '400px' }}>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Cerca Product ID, SKU o SKU limitante..." 
            value={searchProduct} 
            onChange={(e) => setSearchProduct(e.target.value)} 
          />
          <svg className="search-icon-svg" viewBox="0 0 20 20"><path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"/></svg>
        </div>

        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Visualizzate: {sortedProducts.length} di {productData.length} Associazioni
        </span>

        <button 
          className="btn btn-primary" 
          onClick={() => handleOpenEditAssociation(null)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Icons.Plus /> Nuova Associazione
        </button>
      </div>
      <div className="table-container">
        {tabLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : sortedProducts.length > 0 ? (
          <>
            <table className="custom-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSortProduct('product_id')}>
                    Product ID {productSort.field === 'product_id' && (productSort.direction === 'asc' ? '▲' : '▼')}
                  </th>
                  <th>Componenti SKU (Quantità)</th>
                  <th className="sortable" style={{ textAlign: 'right' }} onClick={() => handleSortProduct('qty_available')}>
                    Disponibilità Finale {productSort.field === 'qty_available' && (productSort.direction === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="sortable" onClick={() => handleSortProduct('limiting_sku')}>
                    SKU Limitante (Bloccante) {productSort.field === 'limiting_sku' && (productSort.direction === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ textAlign: 'center', width: '100px' }}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map(assoc => (
                  <tr key={assoc.product_id} style={assoc.qty_available === 0 ? { backgroundColor: 'rgba(239, 68, 68, 0.02)' } : {}}>
                    <td style={{ fontWeight: '700' }}>{highlightText(assoc.product_id, searchProduct)}</td>
                    <td style={{ maxWidth: '380px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {assoc.components_str.split(',').map((compStr, idx) => {
                          const trimmed = compStr.trim();
                          return (
                            <span 
                              key={idx} 
                              className="badge badge-neutral" 
                              style={{ 
                                fontSize: '0.72rem', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)',
                                display: 'inline-block',
                                fontFamily: 'monospace'
                              }}
                            >
                              {highlightText(trimmed, searchProduct)}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '1.05rem', color: assoc.qty_available === 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      {assoc.qty_available}
                    </td>
                    <td>
                      {assoc.limiting_sku ? (
                        <span className={`badge ${assoc.qty_available === 0 ? 'badge-danger' : 'badge-warning'}`} style={{ fontFamily: 'monospace' }}>
                          {highlightText(assoc.limiting_sku, searchProduct)}
                        </span>
                      ) : (
                        <span className="badge badge-neutral">-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button 
                          className="btn btn-neutral btn-sm" 
                          onClick={() => handleOpenEditAssociation(assoc.product_id)}
                          title="Modifica associazione"
                          style={{ padding: '6px' }}
                          type="button"
                        >
                          <Icons.Edit />
                        </button>
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => handleDeleteAssociation(assoc.product_id)}
                          title="Elimina associazione"
                          style={{ padding: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)' }}
                          type="button"
                        >
                          <Icons.Delete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination 
              currentPage={productsPage}
              totalPages={totalProductsPages}
              onPageChange={setProductsPage}
              disabled={tabLoading}
            />
          </>
        ) : (
          <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
            Nessuna associazione trovata. Clicca su "+ Nuova Associazione" per inserirne una.
          </p>
        )}
      </div>
    </div>
  );
}
