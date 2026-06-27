import React, { useMemo, useState } from "react";
import { Linking } from "react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "../../theme";

/**
 * Renders rich lesson HTML (from the Tiptap editor) in an auto-height WebView.
 * The WebView is sized to its content and does not scroll itself — the parent
 * ScrollView scrolls — so the reading-time / scroll-% gate keeps working.
 */
export function LessonHtml({ html, onHeight }: { html: string; onHeight?: (h: number) => void }) {
  const { isDark: dark } = useTheme();
  const [height, setHeight] = useState(240);

  const c = dark
    ? { text: "#D1D5DB", heading: "#FFFFFF", muted: "#9CA3AF", border: "#374151", code: "#111827", quote: "#0B1220", mark: "#854D0E" }
    : { text: "#1F2937", heading: "#111827", muted: "#6B7280", border: "#E5E7EB", code: "#F3F4F6", quote: "#F9FAFB", mark: "#FEF08A" };

  const doc = useMemo(
    () => `<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<style>
  :root { color-scheme: ${dark ? "dark" : "light"}; }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { margin:0; padding:0; background:transparent; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size:17px; line-height:1.75; color:${c.text};
    word-wrap:break-word; overflow-wrap:break-word;
  }
  h1,h2,h3,h4,h5,h6 { color:${c.heading}; font-weight:800; line-height:1.25; margin:1.2em 0 .5em; }
  h1{font-size:28px} h2{font-size:23px;font-weight:700} h3{font-size:20px;font-weight:700} h4{font-size:18px;font-weight:700}
  p { margin:0 0 1em; }
  a { color:#2563EB; text-decoration:underline; }
  strong { color:${c.heading}; }
  ul,ol { margin:0 0 1em; padding-left:1.4em; }
  li { margin:.3em 0; }
  blockquote { border-left:4px solid #2563EB; background:${c.quote}; margin:1em 0; padding:.5em 1em; border-radius:6px; color:${c.text}; }
  mark { background:${c.mark}; color:${dark ? "#FDE68A" : "#111827"}; padding:0 2px; border-radius:3px; }
  img { max-width:100%; height:auto; border-radius:8px; margin:.5em 0; }
  img[data-align="left"] { display:block; margin-right:auto; }
  img[data-align="center"] { display:block; margin-left:auto; margin-right:auto; }
  img[data-align="right"] { display:block; margin-left:auto; }
  sup, sub { font-size:.75em; }
  figure { margin:1em 0; } figcaption { color:${c.muted}; font-size:13px; text-align:center; margin-top:4px; }
  hr { border:none; border-top:1px solid ${c.border}; margin:1.5em 0; }
  pre { background:${c.code}; padding:12px; border-radius:8px; overflow-x:auto; margin:1em 0; }
  code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size:14px; }
  pre code { color:${c.text}; }
  :not(pre) > code { background:${c.code}; color:${c.heading}; padding:1px 5px; border-radius:4px; }
  table { width:100%; border-collapse:collapse; margin:1em 0; font-size:15px; }
  th,td { border:1px solid ${c.border}; padding:8px; text-align:left; }
  th { background:${c.quote}; color:${c.heading}; font-weight:700; }
</style></head>
<body>${html}
<script>
  (function () {
    var post = function () {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(String(document.documentElement.scrollHeight));
      }
    };
    post();
    window.addEventListener('load', post);
    setTimeout(post, 250); setTimeout(post, 800); setTimeout(post, 1800);
    try { new ResizeObserver(post).observe(document.body); } catch (e) {}
    document.querySelectorAll('img').forEach(function (img) { img.addEventListener('load', post); });
  })();
  true;
</script>
</body></html>`,
    [html, dark, c.text, c.heading, c.border, c.code, c.quote, c.mark, c.muted]
  );

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html: doc }}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      style={{ width: "100%", height, backgroundColor: "transparent" }}
      opaque={false}
      onMessage={(e) => {
        const h = Number(e.nativeEvent.data);
        if (h > 0) {
          if (Math.abs(h - height) > 1) setHeight(h);
          onHeight?.(h);
        }
      }}
      onShouldStartLoadWithRequest={(req) => {
        // Allow the initial inline document; open real links externally.
        if (req.url.startsWith("http")) {
          Linking.openURL(req.url).catch(() => {});
          return false;
        }
        return true;
      }}
    />
  );
}
