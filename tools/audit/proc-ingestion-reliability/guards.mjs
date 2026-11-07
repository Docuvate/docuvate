/**
 * Safety guards for the processing/ingestion/reliability local audit.
 * The script never accepts an existing session and only talks to loopback.
 */

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function assertLoopbackBase(raw, label) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`${label} is not a URL`);
  }
  const host = url.hostname.startsWith('[') ? url.hostname.slice(1, -1) : url.hostname;
  if (!LOOPBACK_HOSTS.has(host)) {
    throw new Error(`${label} must be loopback; refusing ${host}`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${label} must use http or https`);
  }
  return url;
}

export function auditPlan(env) {
  const confirmLocal = env.DOCUVATE_PROC_AUDIT_CONFIRM_LOCAL === '1';
  const e2eRequested = env.DOCUVATE_PROC_AUDIT_E2E === '1';
  return {
    confirmLocal,
    probeHealth: confirmLocal,
    runE2E: confirmLocal && e2eRequested,
    usesExistingSession: false,
    listsDocuments: false,
    requeuesExistingJobs: false,
    callsConnectors: false,
  };
}

export function syntheticEmail(randomId) {
  const id = randomId.replace(/[^a-z0-9]/gi, '').slice(0, 12).toLowerCase();
  if (id.length < 8) {
    throw new Error('synthetic id is too short');
  }
  return `proc-audit-${id}@example.test`;
}
