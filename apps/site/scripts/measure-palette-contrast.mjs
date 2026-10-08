/**
 * WCAG contrast for shipped c1 marketing theme (matches palettes.css).
 */
import { wcagContrast, parse } from 'culori';

function ratio(fg, bg) {
  return Math.round(wcagContrast(parse(fg), parse(bg)) * 100) / 100;
}

function assertMin(label, value, min) {
  if (value < min) {
    console.error(`FAIL ${label}: ${value}:1 (need ≥${min}:1)`);
    return false;
  }
  console.log(`  OK ${label}: ${value}:1`);
  return true;
}

const closingBand = {
  bg: 'oklch(20% 0.014 75deg)',
  title: 'oklch(96% 0.01 85deg)',
  lead: 'oklch(82% 0.012 85deg)',
  note: 'oklch(78% 0.012 85deg)',
  btnBorder: 'oklch(96% 0.01 85deg / 28%)',
};

const c1 = {
  light: {
    heroBg: 'oklch(97% 0.012 85deg)',
    heroMuted: 'oklch(43% 0.014 85deg)',
    cardBg: 'oklch(99.5% 0.01 85deg)',
    cardMuted: 'oklch(45% 0.014 85deg)',
    ctaBg: closingBand.bg,
    ctaLead: closingBand.lead,
    badgeFg: 'oklch(46% 0.11 65deg)',
    badgeBg: 'oklch(99.5% 0.01 85deg)',
    vivid: 'oklch(56% 0.19 38deg)',
    on: 'oklch(99% 0.01 85deg)',
    link: 'oklch(52% 0.19 38deg)',
  },
  dark: {
    heroBg: 'oklch(22% 0.014 75deg)',
    heroMuted: 'oklch(78% 0.012 85deg)',
    cardBg: 'oklch(26% 0.016 75deg)',
    cardMuted: 'oklch(80% 0.012 85deg)',
    ctaBg: closingBand.bg,
    ctaLead: closingBand.lead,
    badgeFg: 'oklch(74% 0.11 65deg)',
    badgeBg: 'oklch(26% 0.016 75deg)',
    vivid: 'oklch(56% 0.19 38deg)',
    on: 'oklch(99% 0.01 85deg)',
    link: 'oklch(68% 0.16 38deg)',
  },
};

let ok = true;

for (const mode of ['light', 'dark']) {
  const t = c1[mode];
  console.log(`\nc1 ${mode}:`);
  console.log(`  button text on accent: ${ratio(t.on, t.vivid)}:1`);
  console.log(`  accent link on hero bg: ${ratio(t.link, t.heroBg)}:1`);
  console.log(`  CTA band body on band bg: ${ratio(t.ctaLead, t.ctaBg)}:1`);
  console.log(`  integration badge on card: ${ratio(t.badgeFg, t.badgeBg)}:1`);
  console.log(`  card body muted on card bg: ${ratio(t.cardMuted, t.cardBg)}:1`);
  console.log(`  hero muted on hero bg: ${ratio(t.heroMuted, t.heroBg)}:1`);

  console.log(`\n  Self-host closing band (${mode}, same tokens in both themes):`);
  ok =
    assertMin('title on band', ratio(closingBand.title, closingBand.bg), 4.5) && ok;
  ok =
    assertMin('lead on band', ratio(closingBand.lead, closingBand.bg), 4.5) && ok;
  ok = assertMin('note on band', ratio(closingBand.note, closingBand.bg), 4.5) && ok;
  ok =
    assertMin(
      'secondary btn border on band',
      ratio(closingBand.btnBorder, closingBand.bg),
      3
    ) && ok;
}

if (!ok) {
  process.exit(1);
}
