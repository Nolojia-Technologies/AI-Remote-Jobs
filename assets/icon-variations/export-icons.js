/**
 * Export an icon variation (SVG) to the PNG assets the Expo app uses.
 *
 * Usage:
 *   node assets/icon-variations/export-icons.js <variant>           # preview PNGs only
 *   node assets/icon-variations/export-icons.js <variant> --apply   # overwrite app assets
 *
 * <variant> is one of: a | b | c | d   (default: a)
 *
 * Requires: npm install --save-dev @resvg/resvg-js
 */
const fs = require("fs");
const path = require("path");

let Resvg;
try {
  ({ Resvg } = require("@resvg/resvg-js"));
} catch {
  console.error(
    "\nMissing dependency. Run:\n  npm install --save-dev @resvg/resvg-js\n"
  );
  process.exit(1);
}

const VARIANTS = {
  a: "icon-a-neural-home.svg",
  b: "icon-b-briefcase-roof.svg",
  c: "icon-c-monoline.svg",
  d: "icon-d-deepblue.svg",
};

const variant = (process.argv[2] || "a").toLowerCase();
const apply = process.argv.includes("--apply");
const svgFile = VARIANTS[variant];
if (!svgFile) {
  console.error(`Unknown variant "${variant}". Choose: a | b | c | d`);
  process.exit(1);
}

const here = __dirname;
const root = path.resolve(here, "..", "..");
const svg = fs.readFileSync(path.join(here, svgFile), "utf8");

function renderPng(width) {
  const r = new Resvg(svg, { fitTo: { mode: "width", value: width } });
  return r.render().asPng();
}

// width, output path (relative to project root), label
const previewDir = path.join(here, "preview-png");
const targets = apply
  ? [
      [1024, "assets/images/icon.png", "icon"],
      [1024, "assets/images/adaptive-icon.png", "adaptive-icon"],
      [1024, "assets/images/splash.png", "splash"],
      [96, "assets/images/notification-icon.png", "notification-icon"],
      [48, "assets/images/favicon.png", "favicon"],
    ]
  : [
      [1024, "assets/icon-variations/preview-png/icon-1024.png", "icon-1024"],
      [180, "assets/icon-variations/preview-png/icon-180.png", "icon-180"],
      [96, "assets/icon-variations/preview-png/icon-96.png", "icon-96"],
      [48, "assets/icon-variations/preview-png/icon-48.png", "icon-48"],
    ];

if (!apply && !fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });

console.log(`\nVariant ${variant.toUpperCase()} (${svgFile}) — ${apply ? "APPLYING to app assets" : "writing PNG previews"}\n`);
for (const [width, rel, label] of targets) {
  const out = path.join(root, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, renderPng(width));
  console.log(`  ✓ ${label.padEnd(18)} ${width}px  →  ${rel}`);
}
console.log("\nDone.\n");
