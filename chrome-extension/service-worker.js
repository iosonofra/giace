const DEFAULT_SETTINGS = {
  enabled: true,
  webappUrl: "http://127.0.0.1:8000",
  prestashopOrigin: "",
  extensionToken: "",
  minSkuResidual: 0,
  chronologicalMode: true
};

const responseCache = new Map();
const CACHE_TTL_MS = 30_000;
const MAX_CACHE_ENTRIES = 50;

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

function pruneResponseCache(now = Date.now()) {
  for (const [key, entry] of responseCache) {
    if (now - entry.createdAt >= CACHE_TTL_MS) responseCache.delete(key);
  }
  while (responseCache.size >= MAX_CACHE_ENTRIES) {
    responseCache.delete(responseCache.keys().next().value);
  }
}

async function getSettings() {
  const stored = await chrome.storage.local.get(DEFAULT_SETTINGS);
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
  if (!settings.prestashopOrigin || !sender?.url) return true;
  try {
    return new URL(sender.url).origin === new URL(settings.prestashopOrigin).origin;
  } catch {
    return false;
  }
}

async function handleMessage(message, sender) {
  const settings = await getSettings();

  if (message?.type === "GET_SETTINGS") {
    const { extensionToken, ...publicSettings } = settings;
    return { ok: true, settings: publicSettings };
  }

  if (message?.type === "UPDATE_EVALUATION_MODE") {
    if (!senderMatchesPrestashop(settings, sender)) {
      return { ok: false, error: "Pagina PrestaShop non autorizzata." };
    }
    const chronologicalMode = message.chronologicalMode !== false;
    await chrome.storage.local.set({ chronologicalMode });
    responseCache.clear();
    return { ok: true, chronologicalMode };
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
      settings.chronologicalMode !== false,
      orderIds.slice().sort((a, b) => a - b)
    ]);
    pruneResponseCache();
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
      return { ok: true, data: cached.data, cached: true };
    }

    const data = await fetchJson(`${baseUrl}/api/extension/orders-availability`, {
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

  return { ok: false, error: "Messaggio non supportato." };
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  const stored = await chrome.storage.local.get(null);
  if (Object.keys(stored).length === 0) {
    await chrome.storage.local.set(DEFAULT_SETTINGS);
  }
  if (reason === "install") {
    chrome.runtime.openOptionsPage();
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(error => sendResponse({
      ok: false,
      error: error.name === "AbortError"
        ? "La webapp non ha risposto entro 15 secondi."
        : error.message
    }));
  return true;
});
