import { useMemo, useState } from 'react';

import { apiFetch, readApiJson } from '../../api/client';
import {
  createGuidedComponent,
  rawAssociationToGuided,
} from './associationEditorModel';


function normalizedComponents(components) {
  return components
    .filter(component => String(component.sku || '').trim())
    .map(component => ({
      sku: String(component.sku).trim().toUpperCase(),
      qty_required: Math.max(1, Number(component.qty_required) || 1),
    }))
    .sort((left, right) => left.sku.localeCompare(right.sku));
}

function editorSignature(productId, components) {
  return JSON.stringify({
    productId: String(productId || '').trim(),
    components: normalizedComponents(components),
  });
}


export function useAssociationEditor({ notify, refresh }) {
  const [isAssociationModalOpen, setIsAssociationModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState('');
  const [editingProductMetadata, setEditingProductMetadata] = useState(null);
  const [isNewAssociation, setIsNewAssociation] = useState(false);
  const [associationModalMode, setAssociationModalMode] = useState('guided');
  const [guidedComponents, setGuidedComponents] = useState([createGuidedComponent()]);
  const [rawAssociationText, setRawAssociationText] = useState('');
  const [activeAutocompleteIndex, setActiveAutocompleteIndex] = useState(null);
  const [associationEditorBaseline, setAssociationEditorBaseline] = useState(
    editorSignature('', []),
  );
  const [associationEditorError, setAssociationEditorError] = useState('');
  const [associationEditorLoading, setAssociationEditorLoading] = useState(false);
  const [associationEditorSaving, setAssociationEditorSaving] = useState(false);
  const [showAssociationDiscardConfirm, setShowAssociationDiscardConfirm] = useState(false);

  const currentComponents = useMemo(
    () => associationModalMode === 'guided'
      ? guidedComponents
      : rawAssociationToGuided(rawAssociationText),
    [associationModalMode, guidedComponents, rawAssociationText],
  );
  const associationEditorDirty = useMemo(
    () => editorSignature(editingProductId, currentComponents) !== associationEditorBaseline,
    [associationEditorBaseline, currentComponents, editingProductId],
  );

  const closeAssociationEditor = () => {
    setIsAssociationModalOpen(false);
    setShowAssociationDiscardConfirm(false);
    setAssociationEditorError('');
    setActiveAutocompleteIndex(null);
  };

  const requestCloseAssociationEditor = () => {
    if (associationEditorSaving) return;
    if (associationEditorDirty) {
      setShowAssociationDiscardConfirm(true);
      return;
    }
    closeAssociationEditor();
  };

  const openNewAssociation = (productId = '') => {
    const normalizedProductId = String(productId || '');
    const emptyComponents = [createGuidedComponent()];
    setShowAssociationDiscardConfirm(false);
    setAssociationEditorError('');
    setAssociationModalMode('guided');
    setActiveAutocompleteIndex(null);
    setIsNewAssociation(true);
    setEditingProductId(normalizedProductId);
    setEditingProductMetadata(null);
    setGuidedComponents(emptyComponents);
    setRawAssociationText('');
    setAssociationEditorBaseline(editorSignature(normalizedProductId, emptyComponents));
    setIsAssociationModalOpen(true);
  };

  const handleOpenEditAssociation = async (productId = null) => {
    if (!productId) {
      openNewAssociation();
      return;
    }
    setShowAssociationDiscardConfirm(false);
    setAssociationEditorError('');
    setAssociationModalMode('guided');
    setActiveAutocompleteIndex(null);
    setIsAssociationModalOpen(true);

    setIsNewAssociation(false);
    setEditingProductId(String(productId));
    setEditingProductMetadata(null);
    setGuidedComponents([]);
    setRawAssociationText('');
    setAssociationEditorBaseline(editorSignature(productId, []));
    setAssociationEditorLoading(true);
    try {
      const [data, metadataResult] = await Promise.all([
        apiFetch(`/api/associations/${productId}`).then(readApiJson),
        apiFetch(`/api/product-catalog/search?query=${encodeURIComponent(productId)}&limit=8`)
          .then(readApiJson)
          .catch(() => ({ products: [] })),
      ]);
      const components = data.components?.length > 0
        ? data.components.map(component => createGuidedComponent(component))
        : [createGuidedComponent()];
      setGuidedComponents(components);
      setEditingProductMetadata(
        metadataResult.products?.find(product => String(product.product_id) === String(productId)) || null,
      );
      setRawAssociationText(
        components
          .filter(component => component.sku.trim())
          .map(component => Array(Math.min(999, component.qty_required)).fill(component.sku).join(','))
          .filter(Boolean)
          .join(','),
      );
      setAssociationEditorBaseline(editorSignature(productId, components));
    } catch (error) {
      setAssociationEditorError(
        `Impossibile caricare l'associazione. ${error.message}`,
      );
    } finally {
      setAssociationEditorLoading(false);
    }
  };

  const handleSaveAssociation = async event => {
    event?.preventDefault();
    if (associationEditorSaving) return;
    if (!editingProductId || Number.isNaN(Number(editingProductId))) {
      setAssociationEditorError('Seleziona un prodotto PrestaShop oppure inserisci un Product ID valido.');
      return;
    }

    const components = normalizedComponents(currentComponents);
    if (components.length === 0) {
      setAssociationEditorError('Inserisci almeno un componente SKU prima di salvare.');
      return;
    }

    setAssociationEditorError('');
    setAssociationEditorSaving(true);
    try {
      const response = await apiFetch('/api/associations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: Number.parseInt(editingProductId, 10),
          components,
        }),
      });
      await readApiJson(response);
      notify('Associazione salvata con successo!');
      setAssociationEditorBaseline(editorSignature(editingProductId, components));
      closeAssociationEditor();
      refresh();
    } catch (error) {
      setAssociationEditorError(`Salvataggio non riuscito. ${error.message}`);
      notify(`Errore nel salvataggio: ${error.message}`, 'danger');
    } finally {
      setAssociationEditorSaving(false);
    }
  };

  return {
    activeAutocompleteIndex,
    associationEditorDirty,
    associationEditorError,
    associationEditorLoading,
    associationEditorSaving,
    associationModalMode,
    closeAssociationEditor,
    confirmCloseAssociationEditor: closeAssociationEditor,
    editingProductId,
    editingProductMetadata,
    guidedComponents,
    handleOpenEditAssociation,
    handleSaveAssociation,
    isAssociationModalOpen,
    isNewAssociation,
    openNewAssociation,
    rawAssociationText,
    requestCloseAssociationEditor,
    setActiveAutocompleteIndex,
    setAssociationEditorError,
    setAssociationModalMode,
    setEditingProductId,
    setEditingProductMetadata,
    setGuidedComponents,
    setIsAssociationModalOpen,
    setIsNewAssociation,
    setRawAssociationText,
    setShowAssociationDiscardConfirm,
    showAssociationDiscardConfirm,
  };
}
