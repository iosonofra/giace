const api = globalThis.browser || globalThis.chrome;
const enabledInput = document.getElementById("enabled");
const modeInput = document.getElementById("chronological-mode");
const modeLabel = document.getElementById("mode-label");
const connectionLabel = document.getElementById("connection-label");
const connectionDot = document.getElementById("connection-dot");
const domainValue = document.getElementById("domain-value");
const tokenValue = document.getElementById("token-value");
const thresholdValue = document.getElementById("threshold-value");
const statusBox = document.getElementById("popup-status");
const testButton = document.getElementById("test-connection");

function showStatus(message, tone = "") {
  statusBox.textContent = message;
  statusBox.className = tone;
}

function setConnection(label, tone = "pending") {
  connectionLabel.textContent = label;
  connectionDot.className = `status-dot ${tone}`;
}

async function load() {
  const response = await api.runtime.sendMessage({ type: "GET_SETTINGS" });
  if (!response?.ok) throw new Error(response?.error || "Configurazione non disponibile.");
  const settings = response.settings || {};
  enabledInput.checked = settings.enabled !== false;
  modeInput.checked = settings.chronologicalMode !== false;
  modeLabel.textContent = modeInput.checked ? "Valuta la coda ordini" : "Confronta la disponibilità";
  domainValue.textContent = settings.prestashopOrigin
    ? new URL(settings.prestashopOrigin).host
    : "Non configurato";
  tokenValue.textContent = settings.tokenConfigured ? "Configurato" : "Non configurato";
  thresholdValue.textContent = `${Number(settings.minSkuResidual || 0)} unità`;
  const configured = Boolean(
    settings.webappUrl
    && settings.prestashopOrigin
    && settings.tokenConfigured
  );
  setConnection(
    configured && settings.hostsAuthorized
      ? "Configurazione pronta"
      : configured
        ? "Autorizza i domini nelle impostazioni"
        : "Configurazione incompleta",
    configured && settings.hostsAuthorized ? "success" : "pending"
  );
}

enabledInput.addEventListener("change", async () => {
  await api.storage.local.set({ enabled: enabledInput.checked });
  await api.runtime.sendMessage({ type: "APPLY_CONFIGURATION" });
  showStatus(enabledInput.checked ? "Integrazione attivata." : "Integrazione disattivata.", "success");
});

modeInput.addEventListener("change", async () => {
  await api.storage.local.set({ chronologicalMode: modeInput.checked });
  await api.runtime.sendMessage({ type: "CLEAR_CACHE" });
  modeLabel.textContent = modeInput.checked ? "Valuta la coda ordini" : "Confronta la disponibilità";
  showStatus("Modalità aggiornata. Ricarica Ordini++.", "success");
});

testButton.addEventListener("click", async () => {
  testButton.disabled = true;
  showStatus("Verifica in corso…");
  const response = await api.runtime.sendMessage({ type: "TEST_CONNECTION" });
  if (response?.ok) {
    setConnection("Webapp connessa", "success");
    showStatus("Connessione e token validi.", "success");
  } else {
    setConnection("Connessione non riuscita", "error");
    showStatus(response?.error || "Connessione non riuscita.", "error");
  }
  testButton.disabled = false;
});

document.getElementById("open-options").addEventListener("click", () => {
  api.runtime.openOptionsPage();
});

load().catch(error => {
  setConnection("Configurazione non disponibile", "error");
  showStatus(error.message, "error");
});
