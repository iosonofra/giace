const api = globalThis.browser || globalThis.chrome;
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
const clearTokenButton = document.getElementById("clear-token");
const statusBox = document.getElementById("status");
const configurationStatus = document.getElementById("configuration-status");
const tokenState = document.getElementById("token-state");
const dirtyState = document.getElementById("dirty-state");
const modeSummary = document.getElementById("mode-summary");
const thresholdSummary = document.getElementById("threshold-summary");
const railWebapp = document.getElementById("rail-webapp");
const railDomain = document.getElementById("rail-domain");
const railToken = document.getElementById("rail-token");

let storedToken = "";
let savedSnapshot = "";

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
  if (url.username || url.password) {
    throw new Error(`${label}: non inserire credenziali nell’indirizzo.`);
  }
  return normalizeUrl(url.toString());
}

function originPattern(value) {
  const url = new URL(value);
  return `${url.protocol}//${url.hostname}/*`;
}

function validateToken(value) {
  if (!value) throw new Error("Il token è obbligatorio.");
  if (value.length < 16) {
    throw new Error("Il token deve contenere almeno 16 caratteri.");
  }
  if (value.length > 256 || !/^[A-Za-z0-9._~-]+$/.test(value)) {
    throw new Error("Il token contiene caratteri non validi.");
  }
  return value;
}

function showStatus(message, tone = "neutral") {
  statusBox.textContent = message;
  statusBox.className = tone;
}

function currentToken() {
  return tokenInput.value.trim() || storedToken;
}

function readForm() {
  const webappUrl = validateSecureUrl(webappUrlInput.value, "URL webapp");
  const prestashopUrl = validateSecureUrl(
    prestashopOriginInput.value,
    "Dominio PrestaShop"
  );
  return {
    enabled: enabledInput.checked,
    webappUrl,
    prestashopOrigin: new URL(prestashopUrl).origin,
    extensionToken: validateToken(currentToken()),
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
  const unused = (previousOrigins || []).filter(
    origin => !currentOrigins.includes(origin)
  );
  if (unused.length > 0) {
    await api.permissions.remove({ origins: unused });
  }
}

function formSnapshot() {
  return JSON.stringify({
    enabled: enabledInput.checked,
    webappUrl: normalizeUrl(webappUrlInput.value),
    prestashopOrigin: normalizeUrl(prestashopOriginInput.value),
    tokenReplacement: tokenInput.value.trim(),
    minSkuResidual: minResidualInput.value,
    chronologicalMode: chronologicalModeInput.checked,
    tokenConfigured: Boolean(storedToken)
  });
}

function setRailItem(element, complete, value) {
  const stepNumbers = {
    "rail-webapp": "1",
    "rail-domain": "2",
    "rail-token": "3"
  };
  element.classList.toggle("complete", complete);
  element.classList.toggle("pending", !complete);
  element.firstElementChild.textContent = complete
    ? "✓"
    : stepNumbers[element.id];
  element.querySelector("strong").textContent = value;
}

function refreshPresentation() {
  const tokenConfigured = Boolean(currentToken());
  const hasWebapp = Boolean(normalizeUrl(webappUrlInput.value));
  const hasDomain = Boolean(normalizeUrl(prestashopOriginInput.value));
  const complete = hasWebapp && hasDomain && tokenConfigured;
  const dirty = Boolean(savedSnapshot) && formSnapshot() !== savedSnapshot;

  configurationStatus.textContent = complete
    ? dirty ? "Modifiche da salvare" : "Configurata"
    : "Configurazione incompleta";
  configurationStatus.className = `status-pill ${
    complete && !dirty ? "success" : "warning"
  }`;
  tokenState.textContent = storedToken
    ? tokenInput.value.trim() ? "Token da sostituire" : "Token configurato"
    : tokenInput.value.trim() ? "Nuovo token" : "Non configurato";
  tokenState.className = `field-state ${tokenConfigured ? "success" : ""}`.trim();
  clearTokenButton.disabled = !storedToken;
  dirtyState.textContent = dirty ? "Modifiche non salvate" : "Configurazione caricata";
  dirtyState.classList.toggle("dirty", dirty);
  modeSummary.textContent = chronologicalModeInput.checked
    ? "Cronologica"
    : "Disponibilità";
  thresholdSummary.textContent = `${
    Math.max(0, Math.floor(Number(minResidualInput.value || 0)))
  } unità`;

  setRailItem(railWebapp, hasWebapp, hasWebapp ? "Indicata" : "Da configurare");
  setRailItem(railDomain, hasDomain, hasDomain ? "Indicato" : "Da autorizzare");
  setRailItem(
    railToken,
    tokenConfigured,
    tokenConfigured ? "Protetto" : "Non configurato"
  );
}

async function loadSettings() {
  const settings = await api.storage.local.get(DEFAULT_SETTINGS);
  storedToken = String(settings.extensionToken || "");
  enabledInput.checked = settings.enabled !== false;
  webappUrlInput.value = settings.webappUrl || "";
  prestashopOriginInput.value = settings.prestashopOrigin || "";
  tokenInput.value = "";
  tokenInput.placeholder = storedToken
    ? "Token già configurato · inserisci solo per sostituirlo"
    : "Incolla il token obbligatorio";
  minResidualInput.value = Number(settings.minSkuResidual || 0);
  chronologicalModeInput.checked = settings.chronologicalMode !== false;
  savedSnapshot = formSnapshot();
  refreshPresentation();
}

form.addEventListener("input", refreshPresentation);
form.addEventListener("change", refreshPresentation);

form.addEventListener("submit", async event => {
  event.preventDefault();
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  showStatus("Richiesta delle autorizzazioni ai domini configurati…");
  try {
    const settings = readForm();
    const origins = requiredOrigins(settings);
    const granted = await api.permissions.request({ origins });
    if (!granted) {
      throw new Error("Il browser non ha autorizzato i domini configurati.");
    }
    const previous = await api.storage.local.get(DEFAULT_SETTINGS);
    await api.storage.local.set({ ...settings, grantedOrigins: origins });
    storedToken = settings.extensionToken;
    tokenInput.value = "";
    tokenInput.placeholder = "Token già configurato · inserisci solo per sostituirlo";
    await api.runtime.sendMessage({ type: "APPLY_CONFIGURATION" });
    await removeUnusedOrigins(previous.grantedOrigins, origins);
    savedSnapshot = formSnapshot();
    refreshPresentation();
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
    const granted = await api.permissions.request({ origins });
    if (!granted) {
      throw new Error("Il browser non ha autorizzato i domini configurati.");
    }
    const response = await api.runtime.sendMessage({
      type: "TEST_CONNECTION",
      settings
    });
    if (!response?.ok) {
      throw new Error(response?.error || "Connessione non riuscita.");
    }
    showStatus("Connessione riuscita. Webapp e token verificati.", "success");
  } catch (error) {
    showStatus(error.message, "error");
  } finally {
    testButton.disabled = false;
  }
});

clearTokenButton.addEventListener("click", async () => {
  if (!storedToken) return;
  if (!window.confirm("Rimuovere il token salvato da questo browser?")) return;
  await api.storage.local.set({ extensionToken: "" });
  storedToken = "";
  tokenInput.value = "";
  savedSnapshot = "";
  refreshPresentation();
  showStatus("Token rimosso. L’integrazione richiede un nuovo token.", "success");
});

loadSettings().catch(error => showStatus(error.message, "error"));
