import { readFileSync } from 'node:fs';

import { isRecord, parseJsonUnknown } from '../helpers/json.js';

const ENV_FILE = '/tmp/docuvate-integration-env.json';

const raw = readFileSync(ENV_FILE, 'utf8');
const parsed = parseJsonUnknown(raw);
if (!isRecord(parsed) || typeof parsed.databaseUrl !== 'string') {
  throw new Error('invalid integration env file');
}
process.env.DATABASE_URL = parsed.databaseUrl;
