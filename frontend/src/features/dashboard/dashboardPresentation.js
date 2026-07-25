export function deriveDashboardPresentation({
  dashboardData,
  onNavigate,
  onRunCalculation,
  onSyncAll,
  status,
}) {
  const hasStock = (dashboardData?.sku_count || 0) > 0;
  const hasAssociations = (
    dashboardData?.product_count || 0
  ) > 0;
  const hasAnomalies = (
    dashboardData?.anomalies_count || 0
  ) > 0;
  const hasCalculation = Boolean(
    dashboardData?.latest_calculation_run,
  );
  const hasOrdersSync = Boolean(status?.last_orders_sync);
  const healthTone = (
    !hasStock || !hasAssociations || hasAnomalies
  )
    ? 'danger'
    : (
      !hasCalculation || !hasOrdersSync
        ? 'warning'
        : 'success'
    );
  const healthLabel = {
    success: 'Sistema operativo',
    warning: 'Da aggiornare',
    danger: 'Richiede attenzione',
  }[healthTone];

  let healthText;
  let nextAction;
  if (!hasStock) {
    healthText = (
      'Manca il file giacenze: importa o collega la '
      + 'sorgente prima di lavorare sulla disponibilita.'
    );
    nextAction = {
      label: 'Importa giacenze',
      action: () => onNavigate('stock'),
    };
  } else if (!hasAssociations) {
    healthText = (
      'Mancano le associazioni kit: carica la '
      + 'composizione dei prodotti composti.'
    );
    nextAction = {
      label: 'Carica associazioni',
      action: () => onNavigate('associations'),
    };
  } else if (hasAnomalies) {
    healthText = (
      `${dashboardData.anomalies_count} anomalie `
      + 'aperte richiedono verifica.'
    );
    nextAction = {
      label: (
        `Risolvi ${dashboardData.anomalies_count} anomalie`
      ),
      action: () => onNavigate('anomalies'),
    };
  } else if (!hasCalculation) {
    healthText = (
      'Dati presenti: esegui il primo ricalcolo '
      + 'per aggiornare la disponibilita.'
    );
    nextAction = {
      label: 'Esegui ricalcolo',
      action: onRunCalculation,
    };
  } else if (!hasOrdersSync) {
    healthText = (
      'Dati presenti: sincronizza gli ordini PrestaShop '
      + "per aggiornare l'impegnato."
    );
    nextAction = {
      label: 'Aggiorna tutto',
      action: onSyncAll,
    };
  } else {
    healthText = (
      'Giacenze, associazioni, ordini e calcolo '
      + 'risultano aggiornati.'
    );
    nextAction = {
      label: 'Aggiorna tutto',
      action: onSyncAll,
    };
  }

  return {
    dashboardHasAssociations: hasAssociations,
    dashboardHasOrdersSync: hasOrdersSync,
    dashboardHasStock: hasStock,
    dashboardHealthLabel: healthLabel,
    dashboardHealthText: healthText,
    dashboardHealthTone: healthTone,
    dashboardNextAction: nextAction,
  };
}
