import assert from 'node:assert/strict';
import test from 'node:test';

import { assertLoopbackBase, auditPlan, syntheticEmail } from './guards.mjs';

test('refuses a non-loopback API base', () => {
  assert.throws(() => assertLoopbackBase('https://documents.example', 'api'), /refusing/);
  assert.throws(() => assertLoopbackBase('http://192.168.1.20:3001', 'api'), /refusing/);
});

test('accepts loopback API and worker bases', () => {
  assert.equal(assertLoopbackBase('http://127.0.0.1:3001', 'api').port, '3001');
  assert.equal(assertLoopbackBase('http://localhost:8001', 'worker').hostname, 'localhost');
  assert.equal(assertLoopbackBase('http://[::1]:3001', 'api').hostname, '[::1]');
});

test('does not probe or upload unless the operator confirms this machine', () => {
  const idle = auditPlan({});
  assert.equal(idle.probeHealth, false);
  assert.equal(idle.runE2E, false);
  assert.equal(idle.usesExistingSession, false);
  assert.equal(idle.listsDocuments, false);

  const healthOnly = auditPlan({ DOCUVATE_PROC_AUDIT_CONFIRM_LOCAL: '1' });
  assert.equal(healthOnly.probeHealth, true);
  assert.equal(healthOnly.runE2E, false);

  const e2e = auditPlan({
    DOCUVATE_PROC_AUDIT_CONFIRM_LOCAL: '1',
    DOCUVATE_PROC_AUDIT_E2E: '1',
  });
  assert.equal(e2e.runE2E, true);
  assert.equal(e2e.requeuesExistingJobs, false);
  assert.equal(e2e.callsConnectors, false);
});

test('builds an isolated synthetic mailbox', () => {
  assert.equal(syntheticEmail('ABCD-1234-ef99'), 'proc-audit-abcd1234ef99@example.test');
});
