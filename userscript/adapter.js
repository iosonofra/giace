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
    const token = String(settings.extensionToken || "").trim();
    if (!token) {
      throw new Error("Configura il token obbligatorio dal menu Giac.");
    }
    return {
      "Content-Type": "application/json",
      "X-Giac-Extension-Token": token
    };
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
      return {
        ok: true,
        settings: {
          ...publicSettings,
          tokenConfigured: Boolean(String(extensionToken || "").trim())
        }
      };
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
      const candidateSettings = { ...settings, ...(message.settings || {}) };
      const baseUrl = normalizeBaseUrl(candidateSettings.webappUrl);
      if (!baseUrl) throw new Error("URL della webapp non valido.");
      const data = await requestJson(`${baseUrl}/api/extension/health`, {
        headers: buildHeaders(candidateSettings)
      });
      return { ok: true, data };
    }

    if (message?.type === "OPEN_OPTIONS") {
      openConfigurationPanel();
      return { ok: true };
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

  function appendPanelElement(parent, tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function closeConfigurationPanel() {
    document.getElementById("giac-userscript-settings")?.remove();
  }

  async function openConfigurationPanel() {
    closeConfigurationPanel();
    const settings = await getSettings();
    const overlay = document.createElement("div");
    overlay.id = "giac-userscript-settings";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "giac-userscript-settings-title");

    const panel = appendPanelElement(overlay, "section", "giac-userscript-settings-panel");
    const header = appendPanelElement(panel, "header", "");
    const title = appendPanelElement(header, "div", "");
    appendPanelElement(title, "span", "giac-userscript-eyebrow", "Userscript Giac");
    const heading = appendPanelElement(title, "strong", "", "Configurazione");
    heading.id = "giac-userscript-settings-title";
    const closeButton = appendPanelElement(header, "button", "giac-userscript-close", "×");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Chiudi configurazione");
    closeButton.addEventListener("click", closeConfigurationPanel);

    const body = appendPanelElement(panel, "div", "giac-userscript-settings-body");
    const destination = appendPanelElement(body, "div", "giac-userscript-destination");
    appendPanelElement(destination, "span", "", "Webapp");
    appendPanelElement(destination, "strong", "", settings.webappUrl || "Non configurata");
    appendPanelElement(destination, "span", "", "PrestaShop");
    appendPanelElement(destination, "strong", "", settings.prestashopOrigin || "Non configurato");

    const tokenLabel = appendPanelElement(body, "label", "", "Token estensione");
    const tokenInput = document.createElement("input");
    tokenInput.type = "password";
    tokenInput.autocomplete = "new-password";
    tokenInput.placeholder = settings.extensionToken
      ? "Token configurato · inserisci solo per sostituirlo"
      : "Incolla il token obbligatorio";
    tokenLabel.appendChild(tokenInput);
    appendPanelElement(
      tokenLabel,
      "small",
      "",
      "Il token resta nella memoria locale del gestore userscript."
    );

    const thresholdLabel = appendPanelElement(body, "label", "", "Scorta minima simulata");
    const thresholdInput = document.createElement("input");
    thresholdInput.type = "number";
    thresholdInput.min = "0";
    thresholdInput.step = "1";
    thresholdInput.value = String(Number(settings.minSkuResidual || 0));
    thresholdLabel.appendChild(thresholdInput);

    const enabledLabel = appendPanelElement(body, "label", "giac-userscript-toggle");
    const enabledText = appendPanelElement(enabledLabel, "span", "");
    appendPanelElement(enabledText, "strong", "", "Userscript attivo");
    appendPanelElement(enabledText, "small", "", "Mostra badge e filtri nelle pagine ordine.");
    const enabledInput = document.createElement("input");
    enabledInput.type = "checkbox";
    enabledInput.role = "switch";
    enabledInput.checked = settings.enabled !== false;
    enabledLabel.appendChild(enabledInput);

    const modeLabel = appendPanelElement(body, "label", "giac-userscript-toggle");
    const modeText = appendPanelElement(modeLabel, "span", "");
    appendPanelElement(modeText, "strong", "", "Valutazione cronologica");
    appendPanelElement(modeText, "small", "", "Consuma virtualmente lo stock seguendo la coda.");
    const modeInput = document.createElement("input");
    modeInput.type = "checkbox";
    modeInput.role = "switch";
    modeInput.checked = settings.chronologicalMode !== false;
    modeLabel.appendChild(modeInput);

    const status = appendPanelElement(body, "div", "giac-userscript-settings-status");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    const footer = appendPanelElement(panel, "footer", "");
    const testButton = appendPanelElement(footer, "button", "secondary", "Verifica");
    testButton.type = "button";
    const saveButton = appendPanelElement(footer, "button", "primary", "Salva");
    saveButton.type = "button";

    function getToken() {
      return tokenInput.value.trim() || String(settings.extensionToken || "").trim();
    }

    function validatePanelToken() {
      const token = getToken();
      if (token.length < 16) throw new Error("Il token deve contenere almeno 16 caratteri.");
      if (token.length > 256 || !/^[A-Za-z0-9._~-]+$/.test(token)) {
        throw new Error("Il token contiene caratteri non validi.");
      }
      return token;
    }

    testButton.addEventListener("click", async () => {
      testButton.disabled = true;
      status.className = "giac-userscript-settings-status";
      status.textContent = "Verifica in corso…";
      try {
        const token = validatePanelToken();
        const response = await handleMessage({
          type: "TEST_CONNECTION",
          settings: { extensionToken: token }
        });
        if (!response?.ok) throw new Error(response?.error || "Connessione non riuscita.");
        status.className = "giac-userscript-settings-status success";
        status.textContent = "Webapp e token verificati.";
      } catch (error) {
        status.className = "giac-userscript-settings-status error";
        status.textContent = error.message;
      } finally {
        testButton.disabled = false;
      }
    });

    saveButton.addEventListener("click", async () => {
      try {
        const token = validatePanelToken();
        const threshold = Number(thresholdInput.value);
        if (!Number.isFinite(threshold) || threshold < 0) {
          throw new Error("La soglia deve essere maggiore o uguale a zero.");
        }
        await writeSetting("extensionToken", token);
        await writeSetting("minSkuResidual", Math.floor(threshold));
        await writeSetting("enabled", enabledInput.checked);
        await writeSetting("chronologicalMode", modeInput.checked);
        responseCache.clear();
        closeConfigurationPanel();
        window.location.reload();
      } catch (error) {
        status.className = "giac-userscript-settings-status error";
        status.textContent = error.message;
      }
    });

    overlay.addEventListener("click", event => {
      if (event.target === overlay) closeConfigurationPanel();
    });
    overlay.addEventListener("keydown", event => {
      if (event.key === "Escape") closeConfigurationPanel();
    });
    document.body.appendChild(overlay);
    closeButton.focus();
  }

  GM_addStyle(`
    #giac-userscript-settings {
      position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center;
      padding: 18px; background: rgba(15, 23, 42, .5);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .giac-userscript-settings-panel {
      width: min(520px, 100%); overflow: hidden; border: 1px solid #dbe2ea;
      border-radius: 12px; background: #fff; color: #172033;
      box-shadow: 0 24px 70px rgba(15, 23, 42, .25);
    }
    .giac-userscript-settings-panel > header {
      display: flex; justify-content: space-between; align-items: center;
      min-height: 64px; padding: 12px 16px; border-bottom: 1px solid #e2e8f0;
    }
    .giac-userscript-settings-panel > header div { display: grid; gap: 3px; }
    .giac-userscript-eyebrow { color: #6366f1; font-size: 10px; font-weight: 850; text-transform: uppercase; }
    .giac-userscript-settings-panel > header strong { font-size: 17px; }
    .giac-userscript-close { width: 34px; height: 34px; border: 0; border-radius: 7px; background: #f1f5f9; cursor: pointer; font-size: 19px; }
    .giac-userscript-settings-body { display: grid; gap: 10px; padding: 16px; }
    .giac-userscript-destination {
      display: grid; grid-template-columns: 78px minmax(0, 1fr); gap: 7px;
      padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;
      font-size: 11px;
    }
    .giac-userscript-destination span { color: #64748b; }
    .giac-userscript-destination strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .giac-userscript-settings-body > label { display: grid; gap: 5px; font-size: 12px; font-weight: 800; }
    .giac-userscript-settings-body input[type="password"],
    .giac-userscript-settings-body input[type="number"] {
      width: 100%; min-height: 40px; padding: 8px 10px; border: 1px solid #cbd5e1;
      border-radius: 8px; background: #fff; color: #172033; font: inherit;
    }
    .giac-userscript-settings-body small { color: #64748b; font-size: 10px; font-weight: 500; }
    .giac-userscript-toggle {
      grid-template-columns: minmax(0, 1fr) auto !important; align-items: center;
      min-height: 58px; padding: 9px 10px; border: 1px solid #e2e8f0; border-radius: 8px;
      background: #f8fafc;
    }
    .giac-userscript-toggle > span { display: grid; gap: 3px; }
    .giac-userscript-toggle input { width: 38px; height: 21px; accent-color: #6366f1; }
    .giac-userscript-settings-status:empty { display: none; }
    .giac-userscript-settings-status { padding: 8px 10px; border-radius: 7px; background: #f1f5f9; font-size: 11px; font-weight: 700; }
    .giac-userscript-settings-status.success { background: #dcfce7; color: #166534; }
    .giac-userscript-settings-status.error { background: #fee2e2; color: #991b1b; }
    .giac-userscript-settings-panel > footer {
      display: flex; justify-content: flex-end; gap: 8px; padding: 11px 16px;
      border-top: 1px solid #e2e8f0; background: #fbfcfe;
    }
    .giac-userscript-settings-panel > footer button {
      min-height: 38px; padding: 8px 13px; border-radius: 8px; cursor: pointer;
      font: inherit; font-size: 11px; font-weight: 800;
    }
    .giac-userscript-settings-panel > footer .secondary { border: 1px solid #cbd5e1; background: #fff; color: #334155; }
    .giac-userscript-settings-panel > footer .primary { border: 1px solid #6366f1; background: #6366f1; color: #fff; }
    @media (prefers-reduced-motion: reduce) {
      #giac-userscript-settings, #giac-userscript-settings * { transition: none !important; }
    }
  `);

  GM_registerMenuCommand("Giac · Apri configurazione", openConfigurationPanel);

  GM_registerMenuCommand("Giac · Attiva/disattiva", async () => {
    const enabled = await readSetting("enabled");
    await writeSetting("enabled", !enabled);
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
