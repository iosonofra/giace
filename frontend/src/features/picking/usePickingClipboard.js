import { useEffect, useRef, useState } from 'react';
import { buildPickingClipboardText } from './pickingPresentation';

export function usePickingClipboard({ results, viewMode, notify }) {
  const [pickingCopyState, setPickingCopyState] = useState('idle');
  const copyTimeoutRef = useRef(null);

  useEffect(() => () => {
    if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
  }, []);

  const handleCopyPickingList = async () => {
    const clipboardText = buildPickingClipboardText(results, viewMode);
    if (!clipboardText) return;

    try {
      await navigator.clipboard.writeText(clipboardText);
      setPickingCopyState('copied');
      if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = window.setTimeout(() => {
        setPickingCopyState('idle');
        copyTimeoutRef.current = null;
      }, 2000);
      notify('Lista prelievo copiata negli appunti con successo!');
    } catch {
      notify('Errore durante la copia negli appunti.', 'danger');
    }
  };

  return { handleCopyPickingList, pickingCopyState };
}
