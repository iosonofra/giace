(() => {
  "use strict";

  const USERSCRIPT_DEFAULTS = {
    enabled: true,
    webappUrl: __GIAC_WEBAPP_URL__,
    prestashopOrigin: __GIAC_PRESTASHOP_ORIGIN__,
    extensionToken: "",
    minSkuResidual: 0,
    chronologicalMode: true
  };
  const STORAGE_PREFIX = "giac.feedback.";
  const CACHE_TTL_MS = 30_000;
  const MAX_CACHE_ENTRIES = 50;
  const responseCache = new Map();
  const storageListeners = [];

  function normalizeBaseUrl(value) {
    const normalized = String(value || "").trim().replace(/\/+$/, "");
    if (!normalized) return "";
    try {
      const url = new URL(normalized);
      if (url.username || url.password) return "";
      if (!["http:", "https:"].includes(url.protocol)) return "";
      return normalized;
    } catch {
      return "";
    }
  }

  async function readSetting(key) {
    return GM_getValue(`${STORAGE_PREFIX}${key}`, USERSCRIPT_DEFAULTS[key]);
  }

  async function writeSetting(key, value) {
    const oldValue = await readSetting(key);
    await GM_setValue(`${STORAGE_PREFIX}${key}`, value);
    const changes = { [key]: { oldValue, newValue: value } };
    storageListeners.forEach(listener => listener(changes, "local"));
  }

  async function getSettings() {
    const settings = {};
    for (const key of Object.keys(USERSCRIPT_DEFAULTS)) {
      settings[key] = await readSetting(key);
    }
    return settings;
  }

  function senderMatchesPrestashop(settings) {
    if (!settings.prestashopOrigin) return true;
    try {
      return window.location.origin === new URL(settings.prestashopOrigin).origin;
    } catch {
      return false;
    }
  }

  function buildHeaders(settings) {
    const headers = { "Content-Type": "application/json" };
    if (settings.extensionToken) {
      headers["X-Giac-Extension-Token"] = settings.extensionToken;
    }
    return headers;
  }

  function requestJson(url, options = {}) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: options.method || "GET",
        url,
        headers: options.headers || {},
        data: options.body,
        timeout: 15_000,
        onload(response) {
          let data = {};
          try {
            data = response.responseText ? JSON.parse(response.responseText) : {};
          } catch {
            reject(new Error("La webapp ha restituito una risposta non valida."));
            return;
          }
          if (response.status < 200 || response.status >= 300) {
            reject(new Error(data.detail || `Errore HTTP ${response.status}`));
            return;
          }
          resolve(data);
        },
        onerror() {
          reject(new Error("Impossibile raggiungere la webapp."));
        },
        ontimeout() {
          reject(new Error("La webapp non ha risposto entro 15 secondi."));
        }
      });
    });
  }

  function pruneResponseCache(now = Date.now()) {
    for (const [key, entry] of responseCache) {
      if (now - entry.createdAt >= CACHE_TTL_MS) responseCache.delete(key);
    }
    while (responseCache.size >= MAX_CACHE_ENTRIES) {
      responseCache.delete(responseCache.keys().next().value);
    }
  }

  async function handleMessage(message) {
    const settings = await getSettings();

    if (message?.type === "GET_SETTINGS") {
      const { extensionToken, ...publicSettings } = settings;
      return { ok: true, settings: publicSettings };
    }

    if (message?.type === "UPDATE_EVALUATION_MODE") {
      if (!senderMatchesPrestashop(settings)) {
        return { ok: false, error: "Pagina PrestaShop non autorizzata." };
      }
      const chronologicalMode = message.chronologicalMode !== false;
      await writeSetting("chronologicalMode", chronologicalMode);
      responseCache.clear();
      return { ok: true, chronologicalMode };
    }

    if (message?.type === "FETCH_AVAILABILITY") {
      if (!settings.enabled) return { ok: false, disabled: true };
      if (!senderMatchesPrestashop(settings)) {
        return { ok: false, ignored: true, error: "Dominio PrestaShop non autorizzato." };
      }

      const orderIds = Array.from(new Set(
        (message.orderIds || [])
          .map(value => Number(value))
          .filter(value => Number.isInteger(value) && value > 0)
      )).slice(0, 1000);

      if (!orderIds.length) {
        return { ok: true, data: { orders: {}, summary: { requested_count: 0 } } };
      }

      const baseUrl = normalizeBaseUrl(settings.webappUrl);
      if (!baseUrl) throw new Error("URL della webapp non valido.");
      const cacheKey = JSON.stringify([
        baseUrl,
        Number(settings.minSkuResidual || 0),
        settings.chronologicalMode !== false,
        orderIds.slice().sort((a, b) => a - b)
      ]);
      pruneResponseCache();
      const cached = responseCache.get(cacheKey);
      if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
        return { ok: true, data: cached.data, cached: true };
      }

      const data = await requestJson(`${baseUrl}/api/extension/orders-availability`, {
        method: "POST",
        headers: buildHeaders(settings),
        body: JSON.stringify({
          visible_order_ids: orderIds,
          min_sku_residual: Number(settings.minSkuResidual || 0),
          chronological_mode: settings.chronologicalMode !== false
        })
      });
      pruneResponseCache();
      responseCache.set(cacheKey, { createdAt: Date.now(), data });
      return { ok: true, data, cached: false };
    }

    if (message?.type === "CLEAR_CACHE") {
      responseCache.clear();
      return { ok: true };
    }

    if (message?.type === "TEST_CONNECTION") {
      const baseUrl = normalizeBaseUrl(settings.webappUrl);
      if (!baseUrl) throw new Error("URL della webapp non valido.");
      const data = await requestJson(`${baseUrl}/api/extension/health`, {
        headers: buildHeaders(settings)
      });
      return { ok: true, data };
    }

    return { ok: false, error: "Messaggio non supportato." };
  }

  const chrome = {
    runtime: {
      lastError: null,
      sendMessage(message, callback) {
        handleMessage(message)
          .then(response => callback?.(response))
          .catch(error => callback?.({ ok: false, error: error.message }));
      }
    },
    storage: {
      onChanged: {
        addListener(listener) {
          if (typeof listener === "function") storageListeners.push(listener);
        }
      }
    }
  };

  GM_registerMenuCommand("Giac · Configura token", async () => {
    const currentToken = String(await readSetting("extensionToken") || "");
    const token = window.prompt("Incolla il token API configurato nella webapp Giac:", currentToken);
    if (token === null) return;
    await writeSetting("extensionToken", token.trim());
    responseCache.clear();
    window.alert("Token userscript aggiornato.");
  });

  GM_registerMenuCommand("Giac · Attiva/disattiva", async () => {
    const enabled = await readSetting("enabled");
    await writeSetting("enabled", !enabled);
    responseCache.clear();
    window.location.reload();
  });

  GM_registerMenuCommand("Giac · Soglia disponibilità", async () => {
    const currentValue = Number(await readSetting("minSkuResidual") || 0);
    const value = window.prompt("Residuo minimo uniforme per SKU:", String(currentValue));
    if (value === null) return;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      window.alert("Inserisci un numero maggiore o uguale a zero.");
      return;
    }
    await writeSetting("minSkuResidual", parsed);
    responseCache.clear();
    window.location.reload();
  });

  GM_registerMenuCommand("Giac · Verifica collegamento", async () => {
    try {
      const response = await handleMessage({ type: "TEST_CONNECTION" });
      window.alert(response?.ok ? "Collegamento alla webapp riuscito." : response?.error);
    } catch (error) {
      window.alert(`Collegamento non riuscito: ${error.message}`);
    }
  });

