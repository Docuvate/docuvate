import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const siteScripts = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(siteScripts, '..');
const src = join(siteRoot, '..', '..', 'openapi', 'docuvate.v1.json');
const destDir = join(siteRoot, 'src', 'generated');

const metaDe = (await import(pathToFileURL(join(siteScripts, 'site-public-metadata.mjs')).href))
  .sitePublicOpenApiMetadata;
const metaEn = (
  await import(pathToFileURL(join(siteScripts, 'site-public-metadata.en.mjs')).href)
).sitePublicOpenApiMetadataEn;

const baseSpec = JSON.parse(readFileSync(src, 'utf8'));

function enhanceSpec(spec, meta) {
  const next = structuredClone(spec);
  next.info = { ...next.info, ...meta.info };

  const renameTag = (name) => meta.tagRenames[name] ?? name;

  for (const pathItem of Object.values(next.paths ?? {})) {
    for (const method of Object.values(pathItem)) {
      if (!method || typeof method !== 'object' || !('operationId' in method)) continue;
      if (Array.isArray(method.tags)) {
        method.tags = method.tags.map(renameTag);
      }
      const summaryOverride = meta.pathSummaries[method.operationId];
      const descriptionOverride = meta.pathDescriptions?.[method.operationId];
      if (summaryOverride) method.summary = summaryOverride;
      if (descriptionOverride) method.description = descriptionOverride;
    }
  }

  const usedTagNames = new Set();
  for (const pathItem of Object.values(next.paths ?? {})) {
    for (const method of Object.values(pathItem)) {
      if (!method || typeof method !== 'object' || !('operationId' in method)) continue;
      for (const tag of method.tags ?? []) {
        usedTagNames.add(tag);
      }
    }
  }

  const tagEntries = Object.entries(meta.tagDescriptions)
    .filter(([name]) => usedTagNames.has(name))
    .map(([name, description]) => ({ name, description }));

  next.tags = tagEntries;

  next.servers = [
    {
      url: meta.exampleServerUrl,
      description: meta.serverDescription,
    },
  ];

  return next;
}

mkdirSync(destDir, { recursive: true });
writeFileSync(join(destDir, 'openapi.v1.json'), JSON.stringify(enhanceSpec(baseSpec, metaDe), null, 2));
writeFileSync(join(destDir, 'openapi.v1.en.json'), JSON.stringify(enhanceSpec(baseSpec, metaEn), null, 2));
console.log('Enhanced OpenAPI specs at', destDir);
