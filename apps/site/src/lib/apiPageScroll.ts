export function isScalarApiHash(hash: string): boolean {
  if (!hash || hash.length < 2) return false;
  const decoded = decodeURIComponent(hash.slice(1));
  return decoded.startsWith('tag/') || decoded.startsWith('operation/');
}

type ParsedScalarHash = {
  tag?: string;
  method?: string;
  path?: string;
};

export function parseScalarApiHash(hash: string): ParsedScalarHash {
  if (!hash || hash.length < 2) return {};
  const decoded = decodeURIComponent(hash.slice(1));
  const operation = /^tag\/([^/]+)\/(GET|PUT|POST|PATCH|DELETE)(\/.*)$/i.exec(decoded);
  if (operation?.[1] && operation[2] && operation[3]) {
    return { tag: operation[1], method: operation[2].toUpperCase(), path: operation[3] };
  }
  const tagOnly = /^tag\/([^/]+)$/i.exec(decoded);
  if (tagOnly) {
    return { tag: tagOnly[1] };
  }
  return {};
}

function siteHeaderBottom(): number {
  const header = document.querySelector('.site-header');
  return header?.getBoundingClientRect().bottom ?? 0;
}

function sectionHeadingTop(section: HTMLElement): number {
  const heading = section.querySelector('h1, h2, h3, h4, .section-header, .section-header-label');
  const el = (heading ?? section) as HTMLElement;
  return el.getBoundingClientRect().top;
}

const TARGET_BELOW_HEADER_PX = 12;

/** Nudge the window scroll so a Scalar section heading sits just below the site header. */
export function alignScalarSectionBelowHeader(section: HTMLElement): void {
  const hb = siteHeaderBottom();
  const top = sectionHeadingTop(section);
  const vh = window.innerHeight;
  if (top < -vh * 0.25 || top > vh * 1.25) {
    return;
  }
  const targetTop = hb + TARGET_BELOW_HEADER_PX;
  const maxTop = hb + 24;
  if (top < hb - 4 || top > maxTop) {
    window.scrollTo({ top: window.scrollY + top - targetTop, left: 0, behavior: 'auto' });
  }
}

/** Keep the marketing site header flush with the viewport top after Scalar deep-links. */
export function pinSiteHeaderToViewportTop(): void {
  const header = document.querySelector('.site-header');
  if (!(header instanceof HTMLElement)) return;
  const top = header.getBoundingClientRect().top;
  if (Math.abs(top) < 0.5) return;
  const next = Math.max(0, window.scrollY + top);
  if (Math.abs(window.scrollY - next) > 0.01) {
    window.scrollTo({ top: next, left: 0, behavior: 'auto' });
  }
}

type ScrollSyncSession = {
  requestedHash: string;
  userIntent: boolean;
  timeoutIds: number[];
  settlePollId: number;
  lastScrollY: number;
  lastScrollChangeAt: number;
  removeIntentListeners: () => void;
};

let activeSession: ScrollSyncSession | null = null;

const SCROLL_SETTLE_MS = 300;

function clearSessionTimeouts(session: ScrollSyncSession): void {
  window.clearInterval(session.settlePollId);
  for (const id of session.timeoutIds) {
    window.clearTimeout(id);
  }
  session.timeoutIds.length = 0;
}

function markUserIntent(): void {
  const session = activeSession;
  if (!session) return;
  session.userIntent = true;
  clearSessionTimeouts(session);
}

function attachUserIntentListeners(): () => void {
  const onKey = (event: KeyboardEvent) => {
    const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
    if (keys.includes(event.key)) markUserIntent();
  };
  const opts: AddEventListenerOptions = { passive: true };
  window.addEventListener('wheel', markUserIntent, opts);
  window.addEventListener('touchmove', markUserIntent, opts);
  window.addEventListener('keydown', onKey);
  window.addEventListener('pointerdown', markUserIntent, opts);
  return () => {
    window.removeEventListener('wheel', markUserIntent);
    window.removeEventListener('touchmove', markUserIntent);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('pointerdown', markUserIntent);
  };
}

function onScrollTrackSettle(): void {
  const session = activeSession;
  if (!session) return;
  const y = window.scrollY;
  if (Math.abs(y - session.lastScrollY) > 0.5) {
    session.lastScrollY = y;
    session.lastScrollChangeAt = performance.now();
  }
}

function restoreRequestedHashIfNeeded(requestedHash: string): void {
  if (location.hash === requestedHash) return;
  const url = `${location.pathname}${location.search}${requestedHash}`;
  history.replaceState(history.state, '', url);
}

function scrollHasSettled(session: ScrollSyncSession): boolean {
  return performance.now() - session.lastScrollChangeAt >= SCROLL_SETTLE_MS;
}

function runScrollSyncPass(requestedHash: string): void {
  const session = activeSession;
  if (!session || session.requestedHash !== requestedHash) return;
  if (session.userIntent) {
    clearSessionTimeouts(session);
    return;
  }

  if (!isScalarApiHash(requestedHash)) {
    pinSiteHeaderToViewportTop();
    return;
  }

  if (!scrollHasSettled(session)) return;

  restoreRequestedHashIfNeeded(requestedHash);

  const id = decodeURIComponent(requestedHash.slice(1));
  const section = document.getElementById(id);
  if (section instanceof HTMLElement) {
    alignScalarSectionBelowHeader(section);
  }
  pinSiteHeaderToViewportTop();
  restoreRequestedHashIfNeeded(requestedHash);
}

export function scheduleApiPageScrollSync(): void {
  const requestedHash = location.hash;
  if (!isScalarApiHash(requestedHash)) {
    pinSiteHeaderToViewportTop();
    return;
  }

  if (activeSession) {
    clearSessionTimeouts(activeSession);
    activeSession.removeIntentListeners();
    window.removeEventListener('scroll', onScrollTrackSettle);
  }

  const now = performance.now();
  const settlePollId = window.setInterval(() => {
    if (activeSession !== session || session.userIntent) return;
    runScrollSyncPass(requestedHash);
  }, 50);

  const session: ScrollSyncSession = {
    requestedHash,
    userIntent: false,
    timeoutIds: [],
    settlePollId,
    lastScrollY: window.scrollY,
    lastScrollChangeAt: now,
    removeIntentListeners: attachUserIntentListeners(),
  };
  activeSession = session;
  window.addEventListener('scroll', onScrollTrackSettle, { passive: true });

  const run = () => runScrollSyncPass(requestedHash);
  run();

  for (const delay of [400, 800, 1200, 1800, 2500, 3500]) {
    session.timeoutIds.push(
      window.setTimeout(() => {
        run();
      }, delay),
    );
  }
  session.timeoutIds.push(
    window.setTimeout(() => {
      clearSessionTimeouts(session);
      window.removeEventListener('scroll', onScrollTrackSettle);
      session.removeIntentListeners();
      if (activeSession === session) activeSession = null;
    }, 4000),
  );
}
