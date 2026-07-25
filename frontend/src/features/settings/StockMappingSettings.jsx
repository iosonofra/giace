export function StockMappingSettings({ settings }) {
  const fields = [
    ['mapping-sku', 'Nome colonna SKU', settings.mappingSku, settings.setMappingSku, 'Es: Sku', true],
    ['mapping-qty', 'Nome colonna quantità', settings.mappingQty, settings.setMappingQty, 'Es: Qta Tot.', true],
    ['mapping-description', 'Colonna descrizione', settings.mappingDesc, settings.setMappingDesc, 'Es: Descrizione Sku', false],
    ['mapping-lotto', 'Colonna lotto', settings.mappingLotto, settings.setMappingLotto, 'Es: Lotto', false],
  ];

  return (
    <section className="stock-config-section" aria-labelledby="stock-mapping-title">
      <div className="stock-section-heading">
        <h3 id="stock-mapping-title">Mappatura colonne</h3>
        <p>Indica le intestazioni utilizzate nel file Excel o nel foglio Google Sheets.</p>
      </div>
      <div className="stock-mapping-grid">
        {fields.map(([id, label, value, setter, placeholder, required]) => (
          <div className="form-group" key={id}>
            <label className="settings-label" htmlFor={id}>
              {label} {!required && <span>(opzionale)</span>}
            </label>
            <input
              id={id}
              type="text"
              className="settings-input"
              placeholder={placeholder}
              value={value}
              onChange={event => setter(event.target.value)}
              required={required}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
