/** Bumped at site build time so marketing pages load fresh PNGs from public/screenshots. */
export const SCREENSHOT_ASSET_SHA =
  import.meta.env.VITE_SCREENSHOT_ASSET_SHA ?? 'dev';

export function screenshotSrc(baseName: string): string {
  return `/screenshots/${baseName}.png?v=${SCREENSHOT_ASSET_SHA}`;
}
