import { useCallback, useState } from 'react';

import { apiFetch } from '../../api/client';


function downloadFilename(response, fallback) {
  const disposition = response.headers.get('Content-Disposition') || '';
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (!encoded) return fallback;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return fallback;
  }
}


export function useStockVerification({ notify }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [columns, setColumns] = useState([]);
  const [mappingRequired, setMappingRequired] = useState(false);
  const [skuColumn, setSkuColumn] = useState('');
  const [quantityColumn, setQuantityColumn] = useState('');
  const [headerRow, setHeaderRow] = useState(null);

  const reset = useCallback(() => {
    setFile(null);
    setLoading(false);
    setExporting(false);
    setError('');
    setResult(null);
    setColumns([]);
    setMappingRequired(false);
    setSkuColumn('');
    setQuantityColumn('');
    setHeaderRow(null);
  }, []);

  const selectFile = (nextFile) => {
    setFile(nextFile);
    setError('');
    setResult(null);
    setColumns([]);
    setMappingRequired(false);
    setSkuColumn('');
    setQuantityColumn('');
    setHeaderRow(null);
  };

  const requestForm = () => {
    const formData = new FormData();
    formData.append('file', file);
    if (skuColumn) formData.append('sku_column', skuColumn);
    if (quantityColumn) formData.append('quantity_column', quantityColumn);
    if (headerRow) formData.append('header_row', String(headerRow));
    return formData;
  };

  const analyze = async (event) => {
    event?.preventDefault();
    if (!file) {
      setError('Seleziona il file Excel ricevuto dal magazzino esterno.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await apiFetch('/api/stock-verification/analyze', {
        method: 'POST',
        body: requestForm(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Verifica giacenze non riuscita.');
      if (data.mapping_required) {
        setColumns(data.columns || []);
        setMappingRequired(true);
        setHeaderRow(data.header_row || null);
        setSkuColumn(data.suggested_mapping?.sku || '');
        setQuantityColumn(data.suggested_mapping?.quantity || '');
        return;
      }
      setMappingRequired(false);
      setSkuColumn(data.file?.mapping?.sku || skuColumn);
      setQuantityColumn(data.file?.mapping?.quantity || quantityColumn);
      setHeaderRow(data.file?.header_row || headerRow);
      setResult(data);
    } catch (requestError) {
      setError(requestError.message || 'Verifica giacenze non riuscita.');
    } finally {
      setLoading(false);
    }
  };

  const exportFile = async () => {
    if (!file || !result || !skuColumn || !quantityColumn || !headerRow) return;
    setExporting(true);
    setError('');
    try {
      const response = await apiFetch('/api/stock-verification/export', {
        method: 'POST',
        body: requestForm(),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Esportazione non riuscita.');
      }
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFilename(response, `verifica_giacenze_${file.name}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
      notify('File di verifica giacenze esportato.', 'success');
    } catch (requestError) {
      setError(requestError.message || 'Esportazione non riuscita.');
    } finally {
      setExporting(false);
    }
  };

  return {
    analyze,
    columns,
    error,
    exporting,
    exportFile,
    file,
    headerRow,
    loading,
    mappingRequired,
    quantityColumn,
    reset,
    result,
    selectFile,
    setQuantityColumn,
    setSkuColumn,
    skuColumn,
  };
}
