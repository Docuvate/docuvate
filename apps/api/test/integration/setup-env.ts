import { readFileSync } from 'node:fs';

const ENV_FILE = '/tmp/docuvate-integration-env.json';

const raw = readFileSync(ENV_FILE, 'utf8');
const parsed = JSON.parse(raw) as { databaseUrl: string };
process.env.DATABASE_URL = parsed.databaseUrl;
