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


export function usePickingSheetWrite({ notify, refresh, results, sourceType = 'simulation' }) {
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const [targetDate, setTargetDate] = useState(todayInRome);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [session, setSession] = useState(null);
  const [draftItems, setDraftItems] = useState([]);
  const [sessionLoading, setSessionLoading] = useState(false);

  const items = useMemo(() => (
    (results?.sku_requirements || [])
      .map(item => ({
        sku: item.sku,
        quantity: Number(item.qty_required || 0),
      }))
      .filter(item => item.sku && item.quantity > 0)
  ), [results]);

  useEffect(() => {
    setSession(null);
    setPreview(null);
    setReceipt(null);
    setDraftItems(items.map(item => ({ ...item, plannedQuantity: item.quantity })));
  }, [items, sourceType]);

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

  const createSession = useCallback(async () => {
    setSessionLoading(true);
    try {
      const response = await apiFetch('/api/picking/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_type: results?.source_state ? 'order_state' : sourceType,
          source: {
            state: results?.source_state || null,
            missing_orders: results?.orders_missing || [],
          },
          results,
        }),
      });
      const created = await readApiJson(response);
      setSession(created);
      setDraftItems(created.requirements.map(item => ({
        sku: item.sku,
        quantity: Number(item.actual_qty),
        plannedQuantity: Number(item.planned_qty),
        description: item.description || '',
      })));
      return created;
    } finally {
      setSessionLoading(false);
    }
  }, [results, sourceType]);

  const ensureSession = useCallback(async () => {
    if (session && session.status !== 'recorded') return session;
    return createSession();
  }, [createSession, session]);

  const generatePreview = useCallback(async (date = targetDate) => {
    setLoading(true);
    setError('');
    setReceipt(null);
    setPreview(null);
    try {
      const activeSession = await ensureSession();
      const quantityResponse = await apiFetch(
        `/api/picking/sessions/${activeSession.session_id}/quantities`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: draftItems.map(item => ({ sku: item.sku, quantity: item.quantity })),
          }),
        },
      );
      const updatedSession = await readApiJson(quantityResponse);
      setSession(updatedSession);
      const response = await apiFetch('/api/picking/sheet-write/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_date: date,
          session_id: activeSession.session_id,
        }),
      });
      const previewData = await readApiJson(response);
      setPreview(previewData);
      setSession(current => current ? { ...current, status: 'verified' } : current);
    } catch (requestError) {
      const message = requestError.message || 'Impossibile generare l’anteprima.';
      setError(message);
      if (message.includes('non è più aggiornata')) {
        setSession(current => current ? { ...current, status: 'stale' } : current);
      }
    } finally {
      setLoading(false);
    }
  }, [draftItems, ensureSession, targetDate]);

  const show = useCallback(async () => {
    setOpen(true);
    setReceipt(null);
    setPreview(null);
    setError('');
    try {
      if (session?.status === 'recorded') {
        setSession(null);
        await createSession();
      } else {
        await ensureSession();
      }
    } catch (requestError) {
      setError(requestError.message || 'Impossibile creare la sessione di prelievo.');
    }
  }, [createSession, ensureSession, session?.status]);

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

  const changeQuantity = (sku, value) => {
    const parsed = value === '' ? '' : Number(value);
    setDraftItems(current => current.map(item => (
      item.sku === sku ? { ...item, quantity: parsed } : item
    )));
    setPreview(null);
    setReceipt(null);
    setError('');
  };

  const editDraft = () => {
    if (applying) return;
    setPreview(null);
    setReceipt(null);
    setError('');
    setSession(current => current ? { ...current, status: 'draft' } : current);
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
      setSession(current => current ? { ...current, status: 'recorded' } : current);
      notify(
        `${data.total_quantity} unità registrate in ${data.target_header}.`,
        'success',
      );
      refresh?.();
    } catch (requestError) {
      const message = requestError.message || 'Registrazione non riuscita.';
      setError(message);
      if (message.includes('non è più aggiornata')) {
        setSession(current => current ? { ...current, status: 'stale' } : current);
      }
    } finally {
      setApplying(false);
    }
  };

  return {
    apply,
    applying,
    changeQuantity,
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
    session,
    sessionLoading,
    draftItems,
    editDraft,
    sheetName: status?.sheet_name || '',
    show,
    targetDate,
  };
}
