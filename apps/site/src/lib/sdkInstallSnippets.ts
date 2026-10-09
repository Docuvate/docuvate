/** Git subdirectory installs (no npm / pub.dev publish required). */
export const SDK_NODE_INSTALL_PNPM =
  'pnpm add "@docuvate/sdk@github:Docuvate/docuvate#path:packages/sdk-node"';

export const SDK_FLUTTER_PUBSPEC = `dependencies:
  docuvate:
    git:
      url: https://github.com/Docuvate/docuvate.git
      path: packages/sdk-flutter`;
