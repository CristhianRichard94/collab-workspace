// Global unit-test setup: jsdom does not implement `window.matchMedia`, but
// several parts of the app (ThemeService, Home's reduced-motion check) rely
// on it. Provide a minimal stub so those code paths don't crash in tests.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
