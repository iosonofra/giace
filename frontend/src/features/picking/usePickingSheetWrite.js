import { useCallback, useEffect, useMemo, useState } from 'react';

import { apiFetch, readApiJson } from '../../api/client';


function todayInRome() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}


export function usePickingSheetWrite({ notify, refresh, results }) {
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const [targetDate, setTargetDate] = useState(todayInRome);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  const items = useMemo(() => (
    (results?.sku_requirements || [])
      .map(item => ({
        sku: item.sku,
        quantity: Number(item.qty_required || 0),
      }))
      .filter(item => item.sku && item.quantity > 0)
  ), [results]);

  useEffect(() => {
    if (!results) {
      setStatus(null);
      return undefined;
    }
    let cancelled = false;
    apiFetch('/api/picking/sheet-write/status')
      .then(readApiJson)
      .then(data => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus({ enabled: false, configured: false });
      });
    return () => { cancelled = true; };
  }, [results]);

  const generatePreview = useCallback(async (date = targetDate) => {
    setLoading(true);
    setError('');
    setReceipt(null);
    setPreview(null);
    try {
      const response = await apiFetch('/api/picking/sheet-write/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_date: date, items }),
      });
      setPreview(await readApiJson(response));
    } catch (requestError) {
      setError(requestError.message || 'Impossibile generare l’anteprima.');
    } finally {
      setLoading(false);
    }
  }, [items, targetDate]);

  const show = useCallback(() => {
    setOpen(true);
    setReceipt(null);
    generatePreview(targetDate);
  }, [generatePreview, targetDate]);

  const close = () => {
    if (applying) return;
    setOpen(false);
  };

  const changeDate = (value) => {
    setTargetDate(value);
    setPreview(null);
    setReceipt(null);
    setError('');
  };

  const apply = async () => {
    if (!preview?.plan?.can_apply) return;
    setApplying(true);
    setError('');
    try {
      const response = await apiFetch('/api/picking/sheet-write/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: preview.plan,
          preview_token: preview.preview_token,
        }),
      });
      const data = await readApiJson(response);
      setReceipt(data);
      setPreview(null);
      notify(
        `${data.total_quantity} unità registrate in ${data.target_header}.`,
        'success',
      );
      refresh?.();
    } catch (requestError) {
      setError(requestError.message || 'Registrazione non riuscita.');
    } finally {
      setApplying(false);
    }
  };

  return {
    apply,
    applying,
    changeDate,
    close,
    dayMapping: status?.day_mapping || {},
    enabled: Boolean(status?.enabled && status?.configured && items.length),
    error,
    generatePreview,
    itemsCount: items.length,
    loading,
    open,
    preview,
    receipt,
    sheetName: status?.sheet_name || '',
    show,
    targetDate,
  };
}
