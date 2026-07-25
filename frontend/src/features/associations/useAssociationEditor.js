import { useState } from 'react';

import { apiFetch } from '../../api/client';


const EMPTY_COMPONENT = { sku: '', qty_required: 1 };


export function useAssociationEditor({ notify, refresh }) {
  const [isAssociationModalOpen, setIsAssociationModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState('');
  const [isNewAssociation, setIsNewAssociation] = useState(false);
  const [associationModalMode, setAssociationModalMode] = useState('guided');
  const [guidedComponents, setGuidedComponents] = useState([EMPTY_COMPONENT]);
  const [rawAssociationText, setRawAssociationText] = useState('');
  const [activeAutocompleteIndex, setActiveAutocompleteIndex] = useState(null);

  const closeAssociationEditor = () => setIsAssociationModalOpen(false);

  const handleOpenEditAssociation = async (productId = null) => {
    if (!productId) {
      setIsNewAssociation(true);
      setEditingProductId('');
      setAssociationModalMode('guided');
      setGuidedComponents([EMPTY_COMPONENT]);
      setRawAssociationText('');
      setActiveAutocompleteIndex(null);
      setIsAssociationModalOpen(true);
      return;
    }

    setIsNewAssociation(false);
    setEditingProductId(String(productId));
    setAssociationModalMode('guided');
    try {
      const response = await apiFetch(`/api/associations/${productId}`);
      const data = await response.json();
      if (!response.ok) {
        notify(`Errore nel caricamento dell'associazione: ${data.detail}`, 'danger');
        return;
      }
      const components = data.components?.length > 0
        ? data.components.map(component => ({
            sku: component.sku,
            qty_required: component.qty_required,
          }))
        : [EMPTY_COMPONENT];
      setGuidedComponents(components);
      setRawAssociationText(
        components
          .filter(component => component.sku.trim())
          .map(component => Array(component.qty_required).fill(component.sku).join(','))
          .filter(Boolean)
          .join(',')
      );
      setActiveAutocompleteIndex(null);
      setIsAssociationModalOpen(true);
    } catch (error) {
      notify(`Errore di connessione: ${error.message}`, 'danger');
    }
  };

  const handleSaveAssociation = async event => {
    event?.preventDefault();
    if (!editingProductId || Number.isNaN(Number(editingProductId))) {
      notify('Il Product ID deve essere un numero valido.', 'danger');
      return;
    }

    let components;
    if (associationModalMode === 'guided') {
      components = guidedComponents.filter(component => component.sku.trim());
    } else {
      const counts = {};
      rawAssociationText.split(',').map(value => value.trim()).filter(Boolean).forEach(sku => {
        counts[sku] = (counts[sku] || 0) + 1;
      });
      components = Object.entries(counts).map(([sku, quantity]) => ({
        sku,
        qty_required: quantity,
      }));
    }

    if (components.length === 0) {
      notify('Inserisci almeno un componente SKU valido.', 'danger');
      return;
    }

    try {
      const response = await apiFetch('/api/associations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: Number.parseInt(editingProductId, 10),
          components,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        notify(`Errore nel salvataggio: ${data.detail}`, 'danger');
        return;
      }
      notify('Associazione salvata con successo!');
      closeAssociationEditor();
      refresh();
    } catch (error) {
      notify(`Errore: ${error.message}`, 'danger');
    }
  };

  return {
    isAssociationModalOpen,
    setIsAssociationModalOpen,
    closeAssociationEditor,
    editingProductId,
    setEditingProductId,
    isNewAssociation,
    setIsNewAssociation,
    associationModalMode,
    setAssociationModalMode,
    guidedComponents,
    setGuidedComponents,
    rawAssociationText,
    setRawAssociationText,
    activeAutocompleteIndex,
    setActiveAutocompleteIndex,
    handleOpenEditAssociation,
    handleSaveAssociation,
  };
}
