const { withAppBuildGradle } = require("@expo/config-plugins");

const MARKER = "// meta-audience-network-adapter";

/**
 * Adds the Meta Audience Network mediation adapter for AdMob to the Android
 * build. This is the ONLY build-side change needed for Meta bidding — the
 * Meta App ID / placements are configured in the AdMob mediation console, and
 * the Google Mobile Ads SDK runs the auction at runtime.
 *
 * Flag-gated in app.config.ts (EXPO_PUBLIC_ENABLE_META_MEDIATION=true), so it
 * never affects the default build until you opt in.
 */
const withMetaMediation = (config, { adapterVersion = "6.20.0.0" } = {}) => {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") return cfg;
    if (cfg.modResults.contents.includes(MARKER)) return cfg;

    const dep = `    implementation 'com.google.ads.mediation:facebook:${adapterVersion}' ${MARKER}`;
    cfg.modResults.contents = cfg.modResults.contents.replace(
      /dependencies\s*\{/,
      (match) => `${match}\n${dep}`
    );
    return cfg;
  });
};

module.exports = withMetaMediation;
