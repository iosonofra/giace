import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../../api/client';

export function useBackupRestore({ showActionMsg }) {
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreCountdown, setRestoreCountdown] = useState(null);
  const [pendingRestoreFile, setPendingRestoreFile] = useState(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const restoreIntervalRef = useRef(null);

  useEffect(() => () => {
    if (restoreIntervalRef.current) {
      clearInterval(restoreIntervalRef.current);
    }
  }, []);

  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const response = await apiFetch('/api/backup');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        showActionMsg(
          data.detail || 'Errore durante il download del backup.',
          'danger',
        );
        return;
      }

      const blob = await response.blob();
      const today = new Date().toISOString().slice(0, 10);
      const filename = `inventory_backup_${today}.db`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showActionMsg(`Backup scaricato con successo: ${filename}`);
    } catch (error) {
      showActionMsg(
        `Errore nel download del backup: ${error.message}`,
        'danger',
      );
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreDatabase = event => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPendingRestoreFile(file);
    setShowRestoreConfirm(true);
    event.target.value = '';
  };

  const cancelRestore = () => {
    setShowRestoreConfirm(false);
    setPendingRestoreFile(null);
  };

  const executeRestoreDatabase = async () => {
    if (!pendingRestoreFile) return;

    const file = pendingRestoreFile;
    cancelRestore();
    setRestoreLoading(true);
    setRestoreCountdown(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiFetch('/api/restore', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        showActionMsg(
          data.detail || 'Errore durante il ripristino del database.',
          'danger',
        );
        setRestoreLoading(false);
        return;
      }

      let count = 6;
      setRestoreCountdown(count);
      restoreIntervalRef.current = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(restoreIntervalRef.current);
          restoreIntervalRef.current = null;
          setRestoreCountdown(null);
          setRestoreLoading(false);
          window.location.reload();
        } else {
          setRestoreCountdown(count);
        }
      }, 1000);
    } catch (error) {
      showActionMsg(
        `Errore di connessione durante il ripristino: ${error.message}`,
        'danger',
      );
      setRestoreLoading(false);
    }
  };

  return {
    backupLoading,
    cancelRestore,
    executeRestoreDatabase,
    handleDownloadBackup,
    handleRestoreDatabase,
    pendingRestoreFile,
    restoreCountdown,
    restoreLoading,
    setShowRestoreConfirm,
    showRestoreConfirm,
  };
}
