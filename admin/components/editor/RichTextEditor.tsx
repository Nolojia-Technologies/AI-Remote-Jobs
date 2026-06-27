"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { FontFamily } from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { FontSize } from "./font-size";
import { ResizableImage } from "./ResizableImage";
import { EditorToolbar } from "./EditorToolbar";
import { BubbleToolbar } from "./BubbleToolbar";

const lowlight = createLowlight(common);

// Ctrl/Cmd+K — add or edit a link on the selection.
const LinkShortcut = Extension.create({
  name: "linkShortcut",
  addKeyboardShortcuts() {
    return {
      "Mod-k": () => {
        const prev = this.editor.getAttributes("link").href as string | undefined;
        const url = window.prompt("Link URL", prev || "https://");
        if (url === null) return true;
        if (url === "") this.editor.chain().focus().unsetLink().run();
        else this.editor.chain().focus().setLink({ href: url }).run();
        return true;
      },
    };
  },
});

export interface EditorChange {
  html: string;
  json: any;
  text: string;
}

export function RichTextEditor({
  initialHtml,
  onChange,
  fullscreen,
  onToggleFullscreen,
}: {
  initialHtml: string;
  onChange: (c: EditorChange) => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const editor = useEditor({
    immediatelyRender: false, // SSR-safe (Next.js)
    extensions: [
      // StarterKit v3 already bundles Underline + Link — configure, don't re-add.
      StarterKit.configure({
        codeBlock: false,
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } },
      }),
      ResizableImage.configure({ HTMLAttributes: { class: "lesson-img" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontSize,
      FontFamily,
      Superscript,
      Subscript,
      Placeholder.configure({ placeholder: "Write the lesson… or paste from Word, Google Docs, ChatGPT or Claude." }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({ lowlight }),
      LinkShortcut,
    ],
    content: initialHtml || "",
    editorProps: { attributes: { class: "lesson-editor focus:outline-none" } },
    onUpdate: ({ editor }) => onChange({ html: editor.getHTML(), json: editor.getJSON(), text: editor.getText() }),
  });

  useEffect(() => () => editor?.destroy(), [editor]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
      <EditorToolbar editor={editor} fullscreen={fullscreen} onToggleFullscreen={onToggleFullscreen} />
      <BubbleToolbar editor={editor} />
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
