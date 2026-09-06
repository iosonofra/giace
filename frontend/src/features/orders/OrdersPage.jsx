import React from 'react';

function WarningIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M10 2.5 18 17H2L10 2.5Zm0 4.2v5.1m0 2.5v.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function OrdersSummaryItem({ label, value, tone = 'neutral' }) {
  return <div className={`orders-summary-item ${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

function SortableHeader({ active, children, column, direction, onSort, className }) {
  const ariaSort = active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none';
  return (
    <th className={className} aria-sort={ariaSort}>
      <button type="button" className={`orders-sort-button ${active ? 'active' : ''}`} onClick={() => onSort(column)}>
        {children}<span aria-hidden="true">{active ? (direction === 'asc' ? '↑' : '↓') : '↕'}</span>
      </button>
    </th>
  );
}

function MissingAssociation({ line, onResolve }) {
  return (
    <div className="order-association-missing">
      <span className="order-association-warning"><WarningIcon />Nessuna associazione</span>
      <button type="button" className="order-association-action" onClick={() => onResolve(line.product_id)}>Crea associazione</button>
    </div>
  );
}

function OrderMobileCard({ copiedOrderId, copyFeedbackKey, formatDate, getOrderStateBadgeClass, handleCopyOrderId, highlightText, onResolve, order, searchOrder }) {
  const hasMissingAssociation = order.lines.some(line => !line.has_association);
  return (
    <article className={`order-mobile-card ${hasMissingAssociation ? 'has-warning' : ''}`}>
      <header>
        <div className="order-id-stack">
          <button type="button" className="order-id-copy-button" onClick={() => handleCopyOrderId(order.order_id)} aria-label={`Copia ID ordine ${order.order_id}`}>
            Ordine {highlightText(order.order_id, searchOrder)} <span aria-hidden="true">⧉</span>
          </button>
          {copiedOrderId === order.order_id && <span key={copyFeedbackKey} className="order-copy-confirmation" role="status">Copiato</span>}
        </div>
        <span className={`badge ${getOrderStateBadgeClass(order.current_state_label)}`}>{highlightText(order.current_state_label, searchOrder)}</span>
        <time dateTime={order.date_add || undefined}>{formatDate(order.date_add)}</time>
      </header>
      <div className="order-mobile-lines">
        {order.lines.map((line, index) => (
          <section key={`${order.order_id}-${line.product_id}-${index}`}>
            <div className="order-product-cell">
              <strong>{highlightText(line.product_name || 'Nome prodotto non disponibile', searchOrder)}</strong>
              <span>Product ID: {highlightText(line.product_id, searchOrder)} · Quantità: <b>{line.product_quantity}</b></span>
            </div>
            {line.has_association ? <span className="order-generated-skus">{line.skus_generated}</span> : <MissingAssociation line={line} onResolve={onResolve} />}
          </section>
        ))}
      </div>
    </article>
  );
}

export function OrdersPage({ orders }) {
  const {
    clearOrderFilters, copiedOrderId, copyFeedbackKey, filteredOrders, formatDate,
    getOrderStateBadgeClass, handleCopyOrderId, handleOrdersSort,
    handleResolveMissingAssociation, highlightText, loading, onlyMissingAssociations,
    ordersAvailableStates, ordersError, ordersLimit, ordersPage, ordersRefreshing,
    ordersSortBy, ordersSortDirection, ordersWithoutAssociations, orderStateFilter,
    Pagination, retryOrders, searchOrder, setOnlyMissingAssociations,
    setOrderStateFilter, setOrdersLimit, setOrdersPage, setSearchOrder,
    TableSkeleton, tabLoading, totalOrders, totalOrdersPages, totalProductLines,
  } = orders;
  const filtersActive = Boolean(searchOrder || orderStateFilter !== 'all' || onlyMissingAssociations);
  const resolveMissingAssociation = productId => handleResolveMissingAssociation?.(productId);

  return (
    <div className="glass-panel widget-card orders-workbench">
      <div className="orders-summary-strip" aria-label="Riepilogo ordini sincronizzati">
        <OrdersSummaryItem label={filtersActive ? 'Ordini trovati' : 'Ordini totali'} value={totalOrders} />
        <OrdersSummaryItem label="In questa pagina" value={filteredOrders.length} />
        <OrdersSummaryItem label="Righe prodotto" value={totalProductLines} />
        <OrdersSummaryItem label="Senza associazione" value={ordersWithoutAssociations} tone={ordersWithoutAssociations > 0 ? 'danger' : 'success'} />
      </div>

      <div className="orders-toolbar">
        <label className="search-wrapper orders-search" htmlFor="orders-search-input">
          <span className="sr-only">Cerca negli ordini sincronizzati</span>
          <input id="orders-search-input" type="search" className="search-input" placeholder="Cerca ordine, stato, prodotto, riferimento o SKU" value={searchOrder} onChange={(event) => { setSearchOrder(event.target.value); setOrdersPage(1); }} />
          <svg className="search-icon-svg" viewBox="0 0 20 20" aria-hidden="true"><path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z" /></svg>
        </label>
        <select className="select-control order-state-filter" aria-label="Filtra ordini per stato attuale PrestaShop" value={orderStateFilter} onChange={(event) => { setOrderStateFilter(event.target.value); setOrdersPage(1); }}>
          <option value="all">Tutti gli stati attuali</option>
          {ordersAvailableStates.map(state => <option key={state.id} value={state.id}>{state.name} ({state.count})</option>)}
        </select>
        <button type="button" className={`btn btn-neutral btn-sm orders-filter-toggle ${onlyMissingAssociations ? 'active' : ''}`} aria-pressed={onlyMissingAssociations} onClick={() => { setOnlyMissingAssociations(current => !current); setOrdersPage(1); }}>
          <WarningIcon />Solo senza associazione
        </button>
        {filtersActive && <button type="button" className="orders-clear-filters" onClick={clearOrderFilters}>Azzera filtri</button>}
        <span className="orders-result-count" aria-live="polite">{ordersRefreshing ? 'Aggiornamento…' : `${totalOrders} ${totalOrders === 1 ? 'ordine' : 'ordini'}`}</span>
      </div>

      {ordersError && <div className="orders-error-banner" role="alert"><div><strong>Ordini non aggiornati</strong><span>{ordersError}</span></div><button type="button" className="btn btn-neutral btn-sm" onClick={retryOrders}>Riprova</button></div>}

      <div className="table-container orders-table-shell">
        {tabLoading ? <TableSkeleton rows={6} cols={5} /> : filteredOrders.length > 0 ? (
          <table className="custom-table orders-table">
            <caption className="sr-only">Ordini sincronizzati con righe prodotto e SKU generate dalle associazioni</caption>
            <thead><tr>
              <SortableHeader className="orders-col-id" column="order_id" active={ordersSortBy === 'order_id'} direction={ordersSortDirection} onSort={handleOrdersSort}>Order ID</SortableHeader>
              <SortableHeader className="orders-col-state" column="state" active={ordersSortBy === 'state'} direction={ordersSortDirection} onSort={handleOrdersSort}>Stato ordine</SortableHeader>
              <SortableHeader className="orders-col-date" column="date_add" active={ordersSortBy === 'date_add'} direction={ordersSortDirection} onSort={handleOrdersSort}>Data creazione</SortableHeader>
              <th className="orders-col-product">Linee prodotto</th><th className="orders-col-sku">SKU generate dal bundle</th>
            </tr></thead>
            <tbody>{filteredOrders.map(order => {
              const orderHasMissingAssociation = order.lines.some(line => !line.has_association);
              return <React.Fragment key={order.order_id}>{order.lines.map((line, index) => (
                <tr key={`${order.order_id}-${line.product_id}-${index}`} className={['orders-line-row', index === 0 ? 'orders-group-start' : 'orders-group-continuation', index === order.lines.length - 1 ? 'orders-group-end' : '', orderHasMissingAssociation ? 'order-row-missing-association' : '', !line.has_association ? 'order-line-missing-association' : ''].filter(Boolean).join(' ')}>
                  {index === 0 && <td rowSpan={order.lines.length} className="orders-order-cell"><div className="order-id-stack">
                    <button type="button" className="order-id-copy-button" onClick={() => handleCopyOrderId(order.order_id)} title="Copia ID ordine" aria-label={`Copia ID ordine ${order.order_id}`}><span>{highlightText(order.order_id, searchOrder)}</span><span aria-hidden="true">⧉</span></button>
                    {copiedOrderId === order.order_id && <span key={copyFeedbackKey} className="order-copy-confirmation" role="status">Copiato</span>}
                    {orderHasMissingAssociation && <span className="order-missing-label"><WarningIcon />Associazione mancante</span>}
                  </div></td>}
                  {index === 0 && <td rowSpan={order.lines.length} className="orders-order-cell"><span className={`badge ${getOrderStateBadgeClass(order.current_state_label)}`}>{highlightText(order.current_state_label, searchOrder)}</span></td>}
                  {index === 0 && <td rowSpan={order.lines.length} className="orders-order-cell orders-date-cell"><time dateTime={order.date_add || undefined}>{formatDate(order.date_add)}</time></td>}
                  <td><div className="order-product-cell"><strong>{highlightText(line.product_name || 'Nome prodotto non disponibile', searchOrder)}</strong><span>Product ID: {highlightText(line.product_id, searchOrder)} · Quantità: <b>{line.product_quantity}</b></span></div></td>
                  <td>{line.has_association ? <span className="order-generated-skus">{line.skus_generated}</span> : <MissingAssociation line={line} onResolve={resolveMissingAssociation} />}</td>
                </tr>
              ))}</React.Fragment>;
            })}</tbody>
          </table>
        ) : <div className="orders-empty-state"><strong>{filtersActive ? 'Nessun ordine corrisponde ai filtri' : 'Nessun ordine sincronizzato'}</strong><p>{filtersActive ? 'Modifica la ricerca o azzera i filtri per visualizzare altri ordini.' : 'Seleziona gli stati nelle impostazioni e sincronizza gli ordini dalla Dashboard.'}</p>{filtersActive && <button type="button" className="btn btn-neutral btn-sm" onClick={clearOrderFilters}>Azzera filtri</button>}</div>}
      </div>

      {!tabLoading && filteredOrders.length > 0 && <div className="orders-mobile-list">{filteredOrders.map(order => <OrderMobileCard key={order.order_id} copiedOrderId={copiedOrderId} copyFeedbackKey={copyFeedbackKey} formatDate={formatDate} getOrderStateBadgeClass={getOrderStateBadgeClass} handleCopyOrderId={handleCopyOrderId} highlightText={highlightText} onResolve={resolveMissingAssociation} order={order} searchOrder={searchOrder} />)}</div>}

      <Pagination currentPage={ordersPage} totalPages={totalOrdersPages} onPageChange={setOrdersPage} limit={ordersLimit} limitOptions={[25, 50, 100]} onLimitChange={setOrdersLimit} totalItems={totalOrders} showPageNumbers disabled={loading || ordersRefreshing} />
    </div>
  );
}
