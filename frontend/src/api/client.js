const nativeFetch = globalThis.fetch.bind(globalThis);

/**
 * Punto unico di accesso HTTP della web app.
 *
 * Mantiene per ora la stessa semantica di window.fetch: i chiamanti continuano
 * a gestire status, JSON e download come prima. Centralizzarlo consente di
 * introdurre in seguito timeout, autenticazione e telemetria senza modificare
 * ogni singola funzionalità.
 */
export function apiFetch(input, init) {
  return nativeFetch(input, init);
}

export async function readApiJson(response) {
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data?.detail || `Richiesta non riuscita (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}
