// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Architecture contract for the TypeScript apps.
 *
 * API (apps/api/src/modules/<module>/<layer>):
 *   presentation (controllers) -> application (services/use cases)
 *   -> domain / infrastructure (repositories). Never upwards.
 * Web (apps/web/src/components/<feature>): a feature may only use another
 *   feature through that feature's public API (its index.ts) or through
 *   shared building blocks (components/ui, layout, errors, lib).
 */
const API = '^src/(modules/[^/]+|shared)/';
const WEB_FEATURE = '^src/components/([^/]+)/';
const WEB_SHARED_FEATURES = ['ui', 'layout', 'errors'];

module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'Circular imports make module init order fragile. TypeORM entities are exempt: bidirectional relations (@ManyToOne/@OneToMany with lazy () => Entity refs) are cyclic by design and resolved by TypeORM at runtime.',
      from: { path: '^src/', pathNot: '^src/shared/infrastructure/database/entities/' },
      to: { circular: true, viaOnly: { pathNot: '^src/shared/infrastructure/database/entities/' } },
    },
    {
      name: 'api-domain-is-innermost',
      severity: 'error',
      comment: 'Domain must not depend on application, infrastructure or presentation.',
      from: { path: `${API}domain/` },
      to: { path: `${API}(application|infrastructure|presentation)/` },
    },
    {
      name: 'api-application-not-controllers',
      severity: 'error',
      comment:
        'Services/use cases must not depend on controllers. (Tightening step: also forbid presentation DTOs/mappers once the 7 use cases that return DTOs map in the controller.)',
      from: { path: `${API}application/` },
      to: { path: `${API}presentation/.+[.]controller[.]ts$` },
    },
    {
      name: 'api-infrastructure-not-presentation',
      severity: 'error',
      comment: 'Repositories/adapters must not depend on controllers, DTOs or mappers.',
      from: { path: `${API}infrastructure/` },
      to: { path: `${API}presentation/` },
    },
    {
      name: 'web-feature-isolation',
      severity: 'error',
      comment:
        "Web features must not import each other's internals; go through the feature's index.ts.",
      from: { path: WEB_FEATURE },
      to: {
        path: WEB_FEATURE,
        pathNot: [
          '^src/components/$1/',
          '^src/components/[^/]+/index[.]ts$',
          ...WEB_SHARED_FEATURES.map((f) => `^src/components/${f}/`),
        ],
      },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(dist|generated|node_modules)/' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
    },
  },
};
