import React, { useMemo } from "react";
import { Platform, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { useTheme } from "../../theme";

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });
const PRIMARY = "#2563EB";

/**
 * Renders lesson markdown (GitHub-flavored) with readable, themed typography.
 * Body 17 / line-height 30, scaled mobile headings, styled quotes/code/tables/hr,
 * full light + dark support. Width is capped on large screens (web/tablet).
 */
export function LessonMarkdown({ content }: { content: string }) {
  const { isDark: dark } = useTheme();

  const c = dark
    ? { text: "#D1D5DB", heading: "#FFFFFF", muted: "#9CA3AF", border: "#374151", codeBg: "#111827", quoteBg: "#0B1220" }
    : { text: "#1F2937", heading: "#111827", muted: "#6B7280", border: "#E5E7EB", codeBg: "#F3F4F6", quoteBg: "#F9FAFB" };

  const styles = useMemo(
    () =>
      ({
        body: { color: c.text, fontSize: 17, lineHeight: 30 },
        heading1: { color: c.heading, fontSize: 28, lineHeight: 36, fontWeight: "800", marginTop: 22, marginBottom: 10 },
        heading2: { color: c.heading, fontSize: 23, lineHeight: 31, fontWeight: "700", marginTop: 20, marginBottom: 8 },
        heading3: { color: c.heading, fontSize: 20, lineHeight: 27, fontWeight: "700", marginTop: 16, marginBottom: 6 },
        heading4: { color: c.heading, fontSize: 18, lineHeight: 25, fontWeight: "700", marginTop: 12, marginBottom: 4 },
        paragraph: { color: c.text, fontSize: 17, lineHeight: 30, marginTop: 0, marginBottom: 16 },
        strong: { fontWeight: "700", color: c.heading },
        em: { fontStyle: "italic" },
        bullet_list: { marginBottom: 12, marginTop: 2 },
        ordered_list: { marginBottom: 12, marginTop: 2 },
        list_item: { marginBottom: 6 },
        bullet_list_icon: { color: PRIMARY, marginRight: 6 },
        ordered_list_icon: { color: c.muted, marginRight: 6 },
        blockquote: {
          backgroundColor: c.quoteBg,
          borderLeftWidth: 4,
          borderLeftColor: PRIMARY,
          paddingHorizontal: 14,
          paddingVertical: 6,
          marginVertical: 12,
          borderRadius: 6,
        },
        code_inline: {
          backgroundColor: c.codeBg,
          color: c.heading,
          fontFamily: MONO,
          fontSize: 15,
          paddingHorizontal: 5,
          paddingVertical: 2,
          borderRadius: 4,
        },
        code_block: { backgroundColor: c.codeBg, color: c.text, fontFamily: MONO, fontSize: 14, padding: 12, borderRadius: 8, marginVertical: 12 },
        fence: { backgroundColor: c.codeBg, color: c.text, fontFamily: MONO, fontSize: 14, padding: 12, borderRadius: 8, marginVertical: 12 },
        hr: { backgroundColor: c.border, height: 1, marginVertical: 20 },
        table: { borderWidth: 1, borderColor: c.border, borderRadius: 8, marginVertical: 12, overflow: "hidden" },
        thead: { backgroundColor: c.quoteBg },
        th: { padding: 8, fontWeight: "700", color: c.heading, flex: 1 },
        tr: { borderBottomWidth: 1, borderColor: c.border, flexDirection: "row" },
        td: { padding: 8, color: c.text, flex: 1 },
        link: { color: PRIMARY, textDecorationLine: "underline" },
        image: { borderRadius: 8, marginVertical: 8 },
      }) as const,
    [dark]
  );

  return (
    <View style={{ width: "100%", maxWidth: 760, alignSelf: "center" }}>
      <Markdown style={styles as any}>{content || ""}</Markdown>
    </View>
  );
}
