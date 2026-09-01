import { useEffect, useState } from 'react';

function readStoredSection(storageKey, validSections, fallback) {
  try {
    if (typeof window === 'undefined') return fallback;
    const stored = window.sessionStorage.getItem(storageKey);
    return validSections.includes(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

export function useProgressiveSettings(storageKey, validSections, fallback) {
  const [activeSection, setActiveSection] = useState(() => (
    readStoredSection(storageKey, validSections, fallback)
  ));

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      if (activeSection) window.sessionStorage.setItem(storageKey, activeSection);
      else window.sessionStorage.removeItem(storageKey);
    } catch {
      // L'interfaccia resta utilizzabile anche quando lo storage non è disponibile.
    }
  }, [activeSection, storageKey]);

  const toggleSection = id => setActiveSection(current => (current === id ? '' : id));
  return { activeSection, setActiveSection, toggleSection };
}
