import React from 'react';

import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Icons } from '../../components/ui/Icons';
import { AssociationEditorModal } from '../associations/AssociationEditorModal';
import { formatPickingQty } from '../picking/pickingUtils';
import { StockOrdersDrawer } from '../stock/StockOrdersDrawer';
import { StockProductsDrawer } from '../stock/StockProductsDrawer';
import { AssociatedProductStockDrawer } from '../stock/AssociatedProductStockDrawer';


export function AppOverlays({
  associationEditor,
  associations,
  anomalies,
  backup,
  stockData,
  stockUi,
}) {
  return (
    <>
      <AssociatedProductStockDrawer stock={stockUi} />
      <StockProductsDrawer stock={stockUi} />
      <StockOrdersDrawer stock={stockUi} />

      <AssociationEditorModal
        {...associationEditor}
        stockData={stockData}
        formatPickingQty={formatPickingQty}
        plusIcon={<Icons.Plus />}
      />

      <ConfirmModal
        isOpen={backup.showRestoreConfirm && !!backup.pendingRestoreFile}
        title="Conferma Ripristino"
        message={backup.pendingRestoreFile ? `Stai per ripristinare il database dal file ${backup.pendingRestoreFile.name}.` : ''}
        warningText="ATTENZIONE: questa operazione sovrascriverà irrevocabilmente tutti i dati attuali (ordini, giacenze, associazioni, impostazioni). Viene effettuato comunque un salvataggio automatico di emergenza."
        onCancel={backup.cancelRestore}
        onConfirm={backup.executeRestoreDatabase}
        confirmText="Conferma e Ripristina"
        variant="danger"
      />

      <ConfirmModal
        isOpen={anomalies.showClearAnomaliesConfirm}
        title="Svuota Registro Anomalie"
        message="Sei sicuro di voler eliminare tutte le anomalie registrate?"
        warningText="Questa azione cancellerà permanentemente tutti gli avvisi del log corrente. Gli errori verranno comunque rilevati nuovamente al prossimo import o ricalcolo se non risolti."
        onCancel={() => anomalies.setShowClearAnomaliesConfirm(false)}
        onConfirm={anomalies.executeClearAnomalies}
        confirmText="Svuota Registro"
        variant="danger"
      />

      <ConfirmModal
        isOpen={associations.showDeleteAssociationConfirm && !!associations.associationToDelete}
        title="Elimina Associazione"
        message={associations.associationToDelete
          ? `Sei sicuro di voler eliminare l'associazione per il prodotto composto ${associations.associationToDelete}?`
          : ''}
        warningText="Questa operazione rimuoverà la distinta base. Il prodotto non potrà essere esploso in SKU nel calcolo delle giacenze fino a una nuova associazione."
        onCancel={associations.cancelDeleteAssociation}
        onConfirm={associations.executeDeleteAssociation}
        confirmText="Elimina Associazione"
        variant="danger"
      />
    </>
  );
}
