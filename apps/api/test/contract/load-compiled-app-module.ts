import type { AppModule } from '../../src/app.module.js';
import { isRecord } from '../helpers/json.js';

function isNestModuleClass(value: unknown): value is typeof AppModule {
  return typeof value === 'function';
}

/** Loads the compiled Nest module (avoids Vitest ESM cycles from `src/app.module`). */
export async function loadCompiledAppModule(): Promise<typeof AppModule> {
  const mod: unknown = await import('../../dist/app.module.js');
  if (!isRecord(mod)) {
    throw new Error('dist/app.module.js did not export a module object');
  }
  const appModule = mod.AppModule;
  if (!isNestModuleClass(appModule)) {
    throw new Error('dist/app.module.js missing AppModule export');
  }
  return appModule;
}
