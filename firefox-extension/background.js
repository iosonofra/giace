const DEFAULT_SETTINGS = {
  enabled: true,
  webappUrl: "",
  prestashopOrigin: "",
  extensionToken: "",
  minSkuResidual: 0,
  grantedOrigins: []
};

const CONTENT_SCRIPT_ID = "giac-prestashop-orders";
const responseCache = new Map();
const CACHE_TTL_MS = 30_000;

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function originPattern(value) {
  const url = new URL(value);
  return `${url.protocol}//${url.hostname}/*`;
}

async function getSettings() {
  const stored = await browser.storage.local.get(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...stored };
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || `Errore HTTP ${response.status}`);
    }
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildHeaders(settings) {
  const headers = { "Content-Type": "application/json" };
  if (settings.extensionToken) {
    headers["X-Giac-Extension-Token"] = settings.extensionToken;
  }
  return headers;
}

function senderMatchesPrestashop(settings, sender) {
  if (!settings.prestashopOrigin || !sender?.url) return false;
  try {
    return new URL(sender.url).origin === new URL(settings.prestashopOrigin).origin;
  } catch {
    return false;
  }
}

async function unregisterContentScript() {
  const registered = await browser.scripting.getRegisteredContentScripts({
    ids: [CONTENT_SCRIPT_ID]
  });
  if (registered.length > 0) {
    await browser.scripting.unregisterContentScripts({ ids: [CONTENT_SCRIPT_ID] });
  }
}

async function applyContentScriptRegistration(settings = null) {
  const currentSettings = settings || await getSettings();
  await unregisterContentScript();
  if (!currentSettings.enabled || !currentSettings.prestashopOrigin) return;

  const matchPattern = originPattern(currentSettings.prestashopOrigin);
  const granted = await browser.permissions.contains({ origins: [matchPattern] });
  if (!granted) return;

  await browser.scripting.registerContentScripts([{
    id: CONTENT_SCRIPT_ID,
    matches: [matchPattern],
    js: ["content-script.js"],
    css: ["content-style.css"],
    runAt: "document_idle",
    allFrames: false,
    persistAcrossSessions: true
  }]);
}

async function handleMessage(message, sender) {
  const settings = await getSettings();

  if (message?.type === "GET_SETTINGS") {
    return { ok: true, settings };
  }

  if (message?.type === "APPLY_CONFIGURATION") {
    responseCache.clear();
    await applyContentScriptRegistration(settings);
    return { ok: true };
  }

  if (message?.type === "TEST_CONNECTION") {
    const candidateSettings = { ...settings, ...(message.settings || {}) };
    const baseUrl = normalizeBaseUrl(candidateSettings.webappUrl);
    if (!baseUrl) throw new Error("Inserisci l'URL della webapp.");
    const data = await fetchJson(`${baseUrl}/api/extension/health`, {
      headers: buildHeaders(candidateSettings)
    });
    return { ok: true, data };
  }

  if (message?.type === "FETCH_AVAILABILITY") {
    if (!settings.enabled) return { ok: false, disabled: true };
    if (!senderMatchesPrestashop(settings, sender)) {
      return { ok: false, ignored: true, error: "Dominio PrestaShop non autorizzato." };
    }

    const orderIds = Array.from(new Set(
      (message.orderIds || [])
        .map(value => Number(value))
        .filter(value => Number.isInteger(value) && value > 0)
    )).slice(0, 1000);

    if (orderIds.length === 0) {
      return { ok: true, data: { orders: {}, summary: { requested_count: 0 } } };
    }

    const baseUrl = normalizeBaseUrl(settings.webappUrl);
    if (!baseUrl) throw new Error("Configura l'URL della webapp nelle opzioni dell'estensione.");

    const cacheKey = JSON.stringify([
      baseUrl,
      Number(settings.minSkuResidual || 0),
      orderIds.slice().sort((a, b) => a - b)
    ]);
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
      return { ok: true, data: cached.data, cached: true };
    }

    const data = await fetchJson(`${baseUrl}/api/extension/orders-availability`, {
      method: "POST",
      headers: buildHeaders(settings),
      body: JSON.stringify({
        visible_order_ids: orderIds,
        min_sku_residual: Number(settings.minSkuResidual || 0)
      })
    });
    responseCache.set(cacheKey, { createdAt: Date.now(), data });
    return { ok: true, data, cached: false };
  }

  if (message?.type === "CLEAR_CACHE") {
    responseCache.clear();
    return { ok: true };
  }

  return { ok: false, error: "Messaggio non supportato." };
}

browser.runtime.onInstalled.addListener(async details => {
  const stored = await browser.storage.local.get(null);
  if (Object.keys(stored).length === 0) {
    await browser.storage.local.set(DEFAULT_SETTINGS);
  }
  await applyContentScriptRegistration();
  if (details.reason === "install") {
    await browser.runtime.openOptionsPage();
  }
});

browser.runtime.onStartup.addListener(() => {
  applyContentScriptRegistration().catch(console.error);
});

browser.action.onClicked.addListener(() => {
  browser.runtime.openOptionsPage();
});

browser.permissions.onRemoved.addListener(() => {
  applyContentScriptRegistration().catch(console.error);
});

browser.runtime.onMessage.addListener((message, sender) => (
  handleMessage(message, sender).catch(error => ({
    ok: false,
    error: error.name === "AbortError"
      ? "La webapp non ha risposto entro 15 secondi."
      : error.message
  }))
));
