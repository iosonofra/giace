export function normalizeTheme(value) {
  return value === 'dark' ? 'dark' : 'light';
}

export function readStoredTheme() {
  try {
    return normalizeTheme(localStorage.getItem('theme'));
  } catch {
    return 'light';
  }
}
