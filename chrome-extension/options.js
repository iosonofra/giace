const DEFAULT_SETTINGS = {
  enabled: true,
  webappUrl: "http://127.0.0.1:8000",
  prestashopOrigin: "",
  extensionToken: "",
  minSkuResidual: 0,
  chronologicalMode: true
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

function showStatus(message, tone = "neutral") {
  statusBox.textContent = message;
  statusBox.className = tone;
}

function readForm() {
  return {
    enabled: enabledInput.checked,
    webappUrl: normalizeUrl(webappUrlInput.value),
    prestashopOrigin: normalizeUrl(prestashopOriginInput.value),
    extensionToken: tokenInput.value.trim(),
    minSkuResidual: Math.max(0, Number(minResidualInput.value || 0)),
    chronologicalMode: chronologicalModeInput.checked
  };
}

function validateToken(value) {
  if (!value) throw new Error("Il token è obbligatorio.");
  if (value.length < 16) throw new Error("Il token deve contenere almeno 16 caratteri.");
  if (value.length > 256 || !/^[A-Za-z0-9._~-]+$/.test(value)) {
    throw new Error("Il token contiene caratteri non validi.");
  }
}

async function loadSettings() {
  const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);
  enabledInput.checked = settings.enabled !== false;
  webappUrlInput.value = settings.webappUrl || "";
  prestashopOriginInput.value = settings.prestashopOrigin || "";
  tokenInput.value = settings.extensionToken || "";
  minResidualInput.value = Number(settings.minSkuResidual || 0);
  chronologicalModeInput.checked = settings.chronologicalMode !== false;
}

function sendMessage(message) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response || { ok: false, error: "Nessuna risposta." });
    });
  });
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const settings = readForm();
  if (!settings.webappUrl) {
    showStatus("Inserisci l'URL della webapp.", "error");
    return;
  }
  try {
    validateToken(settings.extensionToken);
  } catch (error) {
    showStatus(error.message, "error");
    return;
  }
  await chrome.storage.local.set(settings);
  await sendMessage({ type: "CLEAR_CACHE" });
  showStatus("Configurazione salvata. Ricarica la pagina ordini PrestaShop.", "success");
});

testButton.addEventListener("click", async () => {
  const settings = readForm();
  try {
    validateToken(settings.extensionToken);
  } catch (error) {
    showStatus(error.message, "error");
    return;
  }
  testButton.disabled = true;
  showStatus("Verifica della connessione in corso…", "neutral");
  const response = await sendMessage({ type: "TEST_CONNECTION", settings });
  testButton.disabled = false;
  if (response?.ok) {
    showStatus(
      response.data?.token_required
        ? "Connessione riuscita. Token verificato."
        : "Connessione riuscita. Il backend non richiede ancora un token.",
      "success"
    );
  } else {
    showStatus(response?.error || "Connessione non riuscita.", "error");
  }
});

loadSettings();
