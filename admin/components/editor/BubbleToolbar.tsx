"use client";

import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline, Strikethrough, Code, Link2, Highlighter, Superscript, Subscript,
  AlignLeft, AlignCenter, AlignRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating context toolbar (Word/Notion-style). Shows inline marks on a text
 * selection, and image controls when an image is selected. All commands apply
 * only to the current selection.
 */
export function BubbleToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: ed, state }: any) => ed.isActive("image") || !state.selection.empty}
      className="flex items-center gap-0.5 rounded-lg border bg-card p-1 shadow-lg"
    >
      {editor.isActive("image") ? (
        <>
          <B on={() => editor.chain().focus().updateAttributes("image", { align: "left" }).run()} title="Align left"><AlignLeft className="h-4 w-4" /></B>
          <B on={() => editor.chain().focus().updateAttributes("image", { align: "center" }).run()} title="Align center"><AlignCenter className="h-4 w-4" /></B>
          <B on={() => editor.chain().focus().updateAttributes("image", { align: "right" }).run()} title="Align right"><AlignRight className="h-4 w-4" /></B>
          <div className="mx-1 h-5 w-px bg-border" />
          <button type="button" className="rounded px-2 py-1 text-xs hover:bg-accent" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().updateAttributes("image", { width: "25%" }).run()}>25%</button>
          <button type="button" className="rounded px-2 py-1 text-xs hover:bg-accent" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().updateAttributes("image", { width: "50%" }).run()}>50%</button>
          <button type="button" className="rounded px-2 py-1 text-xs hover:bg-accent" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().updateAttributes("image", { width: "100%" }).run()}>Full</button>
        </>
      ) : (
        <>
          <B on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold className="h-4 w-4" /></B>
          <B on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic className="h-4 w-4" /></B>
          <B on={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"><Underline className="h-4 w-4" /></B>
          <B on={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough"><Strikethrough className="h-4 w-4" /></B>
          <B on={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code"><Code className="h-4 w-4" /></B>
          <B on={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} title="Superscript"><Superscript className="h-4 w-4" /></B>
          <B on={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} title="Subscript"><Subscript className="h-4 w-4" /></B>
          <div className="mx-1 h-5 w-px bg-border" />
          <label className="flex h-7 w-7 cursor-pointer items-center justify-center rounded hover:bg-accent" title="Text color">
            <span className="text-sm font-bold" style={{ color: (editor.getAttributes("textStyle").color as string) || undefined }}>A</span>
            <input type="color" className="absolute h-0 w-0 opacity-0" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} />
          </label>
          <label className="flex h-7 w-7 cursor-pointer items-center justify-center rounded hover:bg-accent" title="Highlight">
            <Highlighter className="h-4 w-4" />
            <input type="color" className="absolute h-0 w-0 opacity-0" onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()} />
          </label>
          <B
            on={() => {
              const prev = editor.getAttributes("link").href as string | undefined;
              const url = window.prompt("Link URL", prev || "https://");
              if (url === null) return;
              if (url === "") editor.chain().focus().unsetLink().run();
              else editor.chain().focus().setLink({ href: url }).run();
            }}
            active={editor.isActive("link")}
            title="Link (Ctrl+K)"
          >
            <Link2 className="h-4 w-4" />
          </B>
        </>
      )}
    </BubbleMenu>
  );
}

function B({ on, active, title, children }: { on: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={on}
      className={cn("flex h-7 w-7 items-center justify-center rounded hover:bg-accent", active ? "bg-primary/15 text-primary" : "")}
    >
      {children}
    </button>
  );
}
