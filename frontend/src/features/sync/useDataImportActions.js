import { apiFetch } from '../../api/client';


export function useDataImportActions({
  refresh,
  selectedSheet,
  setLoading,
  setSyncingStock,
  showActionMsg,
}) {
  const importData = async ({ file, fileType, useLocal }) => {
    setLoading(true);
    setSyncingStock(true);
    try {
      const formData = new FormData();
      if (useLocal) formData.append('use_local', 'true');
      else formData.append('file', file);
      if (fileType === 'warehouse') formData.append('sheet_name', selectedSheet);

      const endpoint = fileType === 'warehouse'
        ? '/api/import/warehouse'
        : '/api/import/associations';
      const response = await apiFetch(endpoint, { method: 'POST', body: formData });
      const data = await response.json();
      if (response.ok) {
        const prefix = useLocal ? `Importato ${fileType}` : `Caricato ${file.name}`;
        showActionMsg(
          `${prefix} con successo! Record: ${data.records_imported}, Anomalie: ${data.anomalies_found}`,
        );
        refresh();
      } else {
        showActionMsg(
          `${useLocal ? "Errore nell'importazione" : 'Errore caricamento'}: ${data.detail}`,
          'danger',
        );
      }
    } catch (error) {
      showActionMsg(
        `${useLocal ? 'Errore' : 'Errore caricamento'}: ${error.message}`,
        'danger',
      );
    } finally {
      setSyncingStock(false);
      setLoading(false);
    }
  };

  const handleLocalImport = fileType => importData({ fileType, useLocal: true });
  const handleFileUpload = async (event, fileType) => {
    const file = event.target.files?.[0];
    if (file) await importData({ file, fileType, useLocal: false });
  };

  return { handleFileUpload, handleLocalImport };
}
