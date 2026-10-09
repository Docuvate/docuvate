/** Warm stone + Zinnober (#D9480F) accents for site code blocks. */

export const docuvateLight = {
  name: 'docuvate-light',
  type: 'light',
  bg: '#f4f1ec',
  fg: '#2a2622',
  settings: [
    { settings: { foreground: '#2a2622' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#7a7268', fontStyle: 'italic' } },
    { scope: ['string', 'constant.other.symbol'], settings: { foreground: '#5c5348' } },
    { scope: ['constant.numeric', 'constant.language'], settings: { foreground: '#b84a12' } },
    { scope: ['keyword', 'storage.type', 'storage.modifier'], settings: { foreground: '#D9480F' } },
    { scope: ['entity.name.function', 'support.function'], settings: { foreground: '#9a3d0c' } },
    { scope: ['entity.name.type', 'support.type', 'support.class'], settings: { foreground: '#6b4423' } },
    { scope: ['variable', 'entity.name.variable'], settings: { foreground: '#2a2622' } },
    { scope: ['keyword.operator'], settings: { foreground: '#5c5348' } },
    { scope: ['punctuation'], settings: { foreground: '#5c5348' } },
  ],
};

export const docuvateDark = {
  name: 'docuvate-dark',
  type: 'dark',
  bg: '#1c1916',
  fg: '#ece6de',
  settings: [
    { settings: { foreground: '#ece6de' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#8a8278', fontStyle: 'italic' } },
    { scope: ['string', 'constant.other.symbol'], settings: { foreground: '#c9bfb3' } },
    { scope: ['constant.numeric', 'constant.language'], settings: { foreground: '#f0a078' } },
    { scope: ['keyword', 'storage.type', 'storage.modifier'], settings: { foreground: '#e96f49' } },
    { scope: ['entity.name.function', 'support.function'], settings: { foreground: '#ff8c5a' } },
    { scope: ['entity.name.type', 'support.type', 'support.class'], settings: { foreground: '#d4a574' } },
    { scope: ['variable', 'entity.name.variable'], settings: { foreground: '#ece6de' } },
    { scope: ['keyword.operator'], settings: { foreground: '#a89f94' } },
    { scope: ['punctuation'], settings: { foreground: '#a89f94' } },
  ],
};
