declare module "react-native-markdown-display" {
  import * as React from "react";
  // The library ships no types; we only use the default <Markdown style>{md}</Markdown> form.
  const Markdown: React.ComponentType<{
    style?: Record<string, any>;
    mergeStyle?: boolean;
    rules?: Record<string, any>;
    onLinkPress?: (url: string) => boolean;
    children?: React.ReactNode;
    [key: string]: any;
  }>;
  export default Markdown;
}
