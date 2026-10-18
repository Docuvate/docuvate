/**
 * PNG basenames under public/screenshots that the built site references (LandingPage).
 * Keep in sync with screenshotSrc() usage in LandingPage.tsx.
 */
const LOCALES = ['de', 'en'];
const THEMES = ['light', 'dark'];
/** feature "labels" uses folders-* assets */
const BASES = ['library', 'chat', 'fields', 'folders'];

export function referencedScreenshotBasenames() {
  const names = [];
  for (const base of BASES) {
    for (const locale of LOCALES) {
      for (const theme of THEMES) {
        names.push(`${base}-${locale}-${theme}.png`);
      }
    }
  }
  return names;
}

export function referencedScreenshotSet() {
  return new Set(referencedScreenshotBasenames());
}
