import { useEffect, useState } from 'react';

import { apiFetch } from '../../api/client';
import { EXTENSION_DISTRIBUTIONS } from './settingsConstants';
import { deriveExtensionStatus } from './settingsPresentation';


export function useExtensionSettings({
  currentSettings,
  setSettingsError,
  showActionMsg,
}) {
  const [extensionApiToken, setExtensionApiToken] = useState('');
  const [savedExtensionApiToken, setSavedExtensionApiToken] = useState('');
  const [showExtensionToken, setShowExtensionToken] = useState(false);
  const [savingExtensionSettings, setSavingExtensionSettings] = useState(false);
  const [testingExtensionConnection, setTestingExtensionConnection] = useState(false);
  const [extensionTestResult, setExtensionTestResult] = useState(null);
  const [extensionBrowserGuide, setExtensionBrowserGuide] = useState('chrome');

  useEffect(() => {
    if (!currentSettings) return;
    const token = currentSettings.extension_api_token || '';
    setExtensionApiToken(token);
    setSavedExtensionApiToken(token);
    setExtensionTestResult(null);
  }, [currentSettings]);

  const status = deriveExtensionStatus({
    extensionApiToken,
    extensionTestResult,
    savedExtensionApiToken,
  });

  const handleGenerateExtensionToken = () => {
    const randomBytes = new Uint8Array(32);
    window.crypto.getRandomValues(randomBytes);
    setExtensionApiToken(
      Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join(''),
    );
    setShowExtensionToken(true);
    setExtensionTestResult(null);
  };

  const handleCopyExtensionToken = async () => {
    if (!extensionApiToken.trim()) {
      showActionMsg("Non c'è ancora un token da copiare.", 'danger');
      return;
    }
    try {
      await navigator.clipboard.writeText(extensionApiToken.trim());
      showActionMsg('Token estensione copiato negli appunti.');
    } catch (error) {
      console.error(error);
      showActionMsg('Impossibile copiare automaticamente il token.', 'danger');
    }
  };

  const handleCopyExtensionUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      showActionMsg('URL webapp copiato negli appunti.');
    } catch (error) {
      console.error(error);
      showActionMsg("Impossibile copiare automaticamente l'URL.", 'danger');
    }
  };

  const handleTestExtensionConnection = async () => {
    setTestingExtensionConnection(true);
    setExtensionTestResult(null);
    try {
      const headers = {};
      if (extensionApiToken.trim()) {
        headers['X-Giac-Extension-Token'] = extensionApiToken.trim();
      }
      const response = await apiFetch('/api/extension/health', { headers });
      const data = await response.json();
      setExtensionTestResult(response.ok
        ? {
            status: 'success',
            message: data.token_required
              ? 'API raggiungibile e token verificato.'
              : 'API raggiungibile, ma al momento non richiede un token.',
          }
        : {
            status: 'error',
            message: data.detail || 'Token non valido o API non raggiungibile.',
          });
    } catch (error) {
      console.error(error);
      setExtensionTestResult({
        status: 'error',
        message: "Errore durante la verifica dell'API estensione.",
      });
    } finally {
      setTestingExtensionConnection(false);
    }
  };

  const handleSaveExtensionSettings = async event => {
    event.preventDefault();
    const cleanToken = extensionApiToken.trim();
    if (!cleanToken) {
      setSettingsError(
        'Il token estensione è obbligatorio. Genera un token sicuro prima di salvare.',
      );
      return;
    }
    if (cleanToken.length < 16) {
      setSettingsError('Il token estensione deve contenere almeno 16 caratteri.');
      return;
    }
    if (cleanToken.length > 256 || !/^[A-Za-z0-9._~-]+$/.test(cleanToken)) {
      setSettingsError(
        'Il token può contenere solo lettere, numeri, punto, trattino e underscore (massimo 256 caratteri).',
      );
      return;
    }

    setSavingExtensionSettings(true);
    setSettingsError(null);
    setExtensionTestResult(null);
    try {
      const response = await apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extension_api_token: cleanToken }),
      });
      const data = await response.json();
      if (response.ok) {
        const savedToken = data.extension_api_token || '';
        setExtensionApiToken(savedToken);
        setSavedExtensionApiToken(savedToken);
        showActionMsg(
          "Token obbligatorio salvato. Copialo nell'integrazione browser scelta.",
        );
      } else {
        setSettingsError(data.detail || 'Errore nel salvataggio del token estensione.');
      }
    } catch (error) {
      console.error(error);
      setSettingsError('Errore di rete durante il salvataggio del token estensione.');
    } finally {
      setSavingExtensionSettings(false);
    }
  };

  return {
    ...status,
    extensionApiToken,
    extensionBrowserGuide,
    extensionDistribution: EXTENSION_DISTRIBUTIONS[extensionBrowserGuide],
    extensionTestResult,
    handleCopyExtensionToken,
    handleCopyExtensionUrl,
    handleGenerateExtensionToken,
    handleSaveExtensionSettings,
    handleTestExtensionConnection,
    savedExtensionApiToken,
    savingExtensionSettings,
    setExtensionApiToken,
    setExtensionBrowserGuide,
    setExtensionTestResult,
    setShowExtensionToken,
    showExtensionToken,
    testingExtensionConnection,
  };
}
