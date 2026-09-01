function DisclosureChevron() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8 10 4 4 4-4" />
    </svg>
  );
}

export function ProgressiveSettingsOverview({ activeSection, items, onSelect, label }) {
  return (
    <div className="settings-progressive-overview integration-settings-overview" aria-label={label}>
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          className={`settings-progressive-overview-item integration-settings-overview-item ${item.tone || 'neutral'} ${activeSection === item.id ? 'active' : ''}`}
          aria-pressed={activeSection === item.id}
          onClick={() => onSelect(item.id)}
        >
          <span className="settings-status-dot" />
          <span>
            <small>{item.label}</small>
            <strong>{item.value}</strong>
          </span>
        </button>
      ))}
    </div>
  );
}

export function SettingsLinearSection({
  actions,
  children,
  description,
  id,
  status,
  title,
}) {
  const titleId = `${id}-title`;
  return (
    <section className="settings-linear-section" aria-labelledby={titleId}>
      <header className="settings-linear-section-header">
        <div>
          <h3 id={titleId}>{title}</h3>
          {description && <p>{description}</p>}
        </div>
        {(status || actions) && (
          <div className="settings-linear-section-meta">
            {status && <span className="settings-linear-status">{status}</span>}
            {actions}
          </div>
        )}
      </header>
      <div className="settings-linear-section-body">{children}</div>
    </section>
  );
}

export function ProgressiveSettingsDisclosure({
  active,
  children,
  description,
  id,
  namespace,
  onToggle,
  summary,
  title,
}) {
  const panelId = `${namespace}-settings-panel-${id}`;
  const triggerId = `${namespace}-settings-trigger-${id}`;
  return (
    <section className={`settings-progressive-disclosure integration-settings-disclosure ${active ? 'active' : ''}`}>
      <button
        type="button"
        id={triggerId}
        className="settings-progressive-disclosure-trigger integration-settings-disclosure-trigger"
        aria-expanded={active}
        aria-controls={panelId}
        onClick={() => onToggle(id)}
      >
        <span className="integration-settings-disclosure-copy">
          <strong>{title}</strong>
          <small>{description}</small>
        </span>
        <span className="integration-settings-disclosure-meta">
          <span className="integration-settings-disclosure-summary">{summary}</span>
          <span className="integration-settings-disclosure-chevron"><DisclosureChevron /></span>
        </span>
      </button>
      {active && (
        <div
          id={panelId}
          className="settings-progressive-disclosure-panel integration-settings-disclosure-panel"
          role="region"
          aria-labelledby={triggerId}
        >
          {children}
        </div>
      )}
    </section>
  );
}
