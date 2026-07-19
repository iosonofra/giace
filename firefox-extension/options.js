const DEFAULT_SETTINGS = {
  enabled: true,
  webappUrl: "",
  prestashopOrigin: "",
  extensionToken: "",
  minSkuResidual: 0,
  chronologicalMode: true,
  grantedOrigins: []
};

const form = document.getElementById("settings-form");
const enabledInput = document.getElementById("enabled");
const webappUrlInput = document.getElementById("webapp-url");
const prestashopOriginInput = document.getElementById("prestashop-origin");
const tokenInput = document.getElementById("extension-token");
const minResidualInput = document.getElementById("min-residual");
const chronologicalModeInput = document.getElementById("chronological-mode");
const testButton = document.getElementById("test-button");
const statusBox = document.getElementById("status");

function normalizeUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function validateSecureUrl(value, label) {
  let url;
  try {
    url = new URL(normalizeUrl(value));
  } catch {
    throw new Error(`${label}: inserisci un URL valido.`);
  }
  const isLoopback = ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLoopback)) {
    throw new Error(`${label}: usa HTTPS. HTTP è ammesso solo per localhost o 127.0.0.1.`);
  }
  return normalizeUrl(url.toString());
}

function originPattern(value) {
  const url = new URL(value);
  return `${url.protocol}//${url.hostname}/*`;
}

function showStatus(message, tone = "neutral") {
  statusBox.textContent = message;
  statusBox.className = tone;
}

function readForm() {
  const webappUrl = validateSecureUrl(webappUrlInput.value, "URL webapp");
  const prestashopUrl = validateSecureUrl(prestashopOriginInput.value, "Dominio PrestaShop");
  const extensionToken = tokenInput.value.trim();
  if (!extensionToken) throw new Error("Il token è obbligatorio.");
  if (extensionToken.length < 16) throw new Error("Il token deve contenere almeno 16 caratteri.");
  if (extensionToken.length > 256 || !/^[A-Za-z0-9._~-]+$/.test(extensionToken)) {
    throw new Error("Il token contiene caratteri non validi.");
  }
  return {
    enabled: enabledInput.checked,
    webappUrl,
    prestashopOrigin: new URL(prestashopUrl).origin,
    extensionToken,
    minSkuResidual: Math.max(0, Math.floor(Number(minResidualInput.value || 0))),
    chronologicalMode: chronologicalModeInput.checked
  };
}

function requiredOrigins(settings) {
  return Array.from(new Set([
    originPattern(settings.webappUrl),
    originPattern(settings.prestashopOrigin)
  ]));
}

async function removeUnusedOrigins(previousOrigins, currentOrigins) {
  const unused = (previousOrigins || []).filter(origin => !currentOrigins.includes(origin));
  if (unused.length > 0) {
    await browser.permissions.remove({ origins: unused });
  }
}

async function loadSettings() {
  const settings = await browser.storage.local.get(DEFAULT_SETTINGS);
  enabledInput.checked = settings.enabled !== false;
  webappUrlInput.value = settings.webappUrl || "";
  prestashopOriginInput.value = settings.prestashopOrigin || "";
  tokenInput.value = settings.extensionToken || "";
  minResidualInput.value = Number(settings.minSkuResidual || 0);
  chronologicalModeInput.checked = settings.chronologicalMode !== false;
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  showStatus("Richiesta delle autorizzazioni ai domini configurati…");
  try {
    const settings = readForm();
    const origins = requiredOrigins(settings);
    const granted = await browser.permissions.request({ origins });
    if (!granted) {
      throw new Error("Firefox non ha autorizzato i domini configurati.");
    }
    const previous = await browser.storage.local.get(DEFAULT_SETTINGS);
    await browser.storage.local.set({ ...settings, grantedOrigins: origins });
    await browser.runtime.sendMessage({ type: "APPLY_CONFIGURATION" });
    await removeUnusedOrigins(previous.grantedOrigins, origins);
    showStatus("Configurazione salvata. Ricarica la pagina Ordini++.", "success");
  } catch (error) {
    showStatus(error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
});

testButton.addEventListener("click", async () => {
  testButton.disabled = true;
  showStatus("Verifica della connessione in corso…");
  try {
    const settings = readForm();
    const origins = requiredOrigins(settings);
    const granted = await browser.permissions.request({ origins });
    if (!granted) {
      throw new Error("Firefox non ha autorizzato i domini configurati.");
    }
    const response = await browser.runtime.sendMessage({
      type: "TEST_CONNECTION",
      settings
    });
    if (!response?.ok) {
      throw new Error(response?.error || "Connessione non riuscita.");
    }
    showStatus(
      response.data?.token_required
        ? "Connessione riuscita. Token verificato."
        : "Connessione riuscita. Il backend non richiede un token.",
      "success"
    );
  } catch (error) {
    showStatus(error.message, "error");
  } finally {
    testButton.disabled = false;
  }
});

loadSettings().catch(error => showStatus(error.message, "error"));
