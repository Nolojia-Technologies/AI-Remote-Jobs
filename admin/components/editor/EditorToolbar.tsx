"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3, Heading4, Pilcrow,
  List, ListOrdered, Quote, AlignLeft, AlignCenter, AlignRight, AlignJustify, Link2, Unlink,
  Image as ImageIcon, Table as TableIcon, Minus, Code2, Undo2, Redo2, Maximize2, Minimize2,
  Highlighter, Rows3, Columns3, Trash2, Loader2, Combine, Split,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadLessonImage } from "@/lib/upload-image";

const FONT_SIZES = [
  { label: "Small", value: "14px" },
  { label: "Normal", value: "" },
  { label: "Large", value: "20px" },
  { label: "Extra Large", value: "26px" },
];

const FONT_FAMILIES = [
  { label: "Font", value: "" },
  { label: "Sans", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono", value: "ui-monospace, Menlo, monospace" },
];

export function EditorToolbar({
  editor,
  fullscreen,
  onToggleFullscreen,
}: {
  editor: Editor | null;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!editor) return null;
  const e = editor.chain().focus();

  async function onPickImage(file?: File | null) {
    if (!file || !editor) return;
    setUploading(true);
    try {
      const url = await uploadLessonImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      alert("Image upload failed: " + (err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev || "https://");
    if (url === null) return;
    if (url === "") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: url }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-card p-2 sticky top-0 z-10">
      <Group>
        <Btn on={() => e.toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold className="h-4 w-4" /></Btn>
        <Btn on={() => e.toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic className="h-4 w-4" /></Btn>
        <Btn on={() => e.toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"><Underline className="h-4 w-4" /></Btn>
        <Btn on={() => e.toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough"><Strikethrough className="h-4 w-4" /></Btn>
      </Group>

      <Group>
        <Btn on={() => e.toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1"><Heading1 className="h-4 w-4" /></Btn>
        <Btn on={() => e.toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2"><Heading2 className="h-4 w-4" /></Btn>
        <Btn on={() => e.toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3"><Heading3 className="h-4 w-4" /></Btn>
        <Btn on={() => e.toggleHeading({ level: 4 }).run()} active={editor.isActive("heading", { level: 4 })} title="Heading 4"><Heading4 className="h-4 w-4" /></Btn>
        <Btn on={() => e.setParagraph().run()} active={editor.isActive("paragraph")} title="Paragraph"><Pilcrow className="h-4 w-4" /></Btn>
      </Group>

      <Group>
        <Btn on={() => e.toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list"><List className="h-4 w-4" /></Btn>
        <Btn on={() => e.toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list"><ListOrdered className="h-4 w-4" /></Btn>
        <Btn on={() => e.toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote"><Quote className="h-4 w-4" /></Btn>
        <Btn on={() => e.toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block"><Code2 className="h-4 w-4" /></Btn>
      </Group>

      <Group>
        <Btn on={() => e.setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left"><AlignLeft className="h-4 w-4" /></Btn>
        <Btn on={() => e.setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align center"><AlignCenter className="h-4 w-4" /></Btn>
        <Btn on={() => e.setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right"><AlignRight className="h-4 w-4" /></Btn>
        <Btn on={() => e.setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justify"><AlignJustify className="h-4 w-4" /></Btn>
      </Group>

      <Group>
        {/* Text color */}
        <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded hover:bg-accent" title="Text color">
          <span className="text-sm font-bold" style={{ color: (editor.getAttributes("textStyle").color as string) || undefined }}>A</span>
          <input type="color" className="absolute h-0 w-0 opacity-0" onChange={(ev) => editor.chain().focus().setColor(ev.target.value).run()} />
        </label>
        {/* Highlight */}
        <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded hover:bg-accent" title="Highlight color">
          <Highlighter className="h-4 w-4" />
          <input type="color" className="absolute h-0 w-0 opacity-0" onChange={(ev) => editor.chain().focus().toggleHighlight({ color: ev.target.value }).run()} />
        </label>
        {/* Font size */}
        <select
          className="h-8 rounded border bg-background px-1 text-xs"
          title="Font size"
          value={(editor.getAttributes("textStyle").fontSize as string) || ""}
          onChange={(ev) => {
            const v = ev.target.value;
            if (v) (editor.chain().focus() as any).setFontSize(v).run();
            else (editor.chain().focus() as any).unsetFontSize().run();
          }}
        >
          {FONT_SIZES.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
        </select>
        {/* Font family */}
        <select
          className="h-8 rounded border bg-background px-1 text-xs"
          title="Font family"
          value={(editor.getAttributes("textStyle").fontFamily as string) || ""}
          onChange={(ev) => {
            const v = ev.target.value;
            if (v) editor.chain().focus().setFontFamily(v).run();
            else editor.chain().focus().unsetFontFamily().run();
          }}
        >
          {FONT_FAMILIES.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
        </select>
      </Group>

      <Group>
        <Btn on={setLink} active={editor.isActive("link")} title="Link"><Link2 className="h-4 w-4" /></Btn>
        <Btn on={() => e.unsetLink().run()} title="Remove link"><Unlink className="h-4 w-4" /></Btn>
        <Btn on={() => fileRef.current?.click()} title="Insert image">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}</Btn>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(ev) => onPickImage(ev.target.files?.[0])} />
        <Btn on={() => e.setHorizontalRule().run()} title="Divider"><Minus className="h-4 w-4" /></Btn>
      </Group>

      <Group>
        <Btn on={() => e.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert table"><TableIcon className="h-4 w-4" /></Btn>
        <Btn on={() => e.addRowAfter().run()} title="Add row"><Rows3 className="h-4 w-4" /></Btn>
        <Btn on={() => e.addColumnAfter().run()} title="Add column"><Columns3 className="h-4 w-4" /></Btn>
        <Btn on={() => e.deleteRow().run()} title="Delete row"><Rows3 className="h-4 w-4 text-destructive" /></Btn>
        <Btn on={() => e.deleteColumn().run()} title="Delete column"><Columns3 className="h-4 w-4 text-destructive" /></Btn>
        <Btn on={() => e.mergeCells().run()} title="Merge cells"><Combine className="h-4 w-4" /></Btn>
        <Btn on={() => e.splitCell().run()} title="Split cell"><Split className="h-4 w-4" /></Btn>
        <Btn on={() => e.deleteTable().run()} title="Delete table"><Trash2 className="h-4 w-4 text-destructive" /></Btn>
      </Group>

      <Group>
        <Btn on={() => e.undo().run()} title="Undo"><Undo2 className="h-4 w-4" /></Btn>
        <Btn on={() => e.redo().run()} title="Redo"><Redo2 className="h-4 w-4" /></Btn>
      </Group>

      <div className="ml-auto">
        <Btn on={onToggleFullscreen} active={fullscreen} title={fullscreen ? "Exit full screen" : "Full screen"}>
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Btn>
      </div>
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5 border-r pr-1 mr-1 last:border-r-0">{children}</div>;
}

function Btn({ on, active, title, children }: { on: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(ev) => ev.preventDefault()}
      onClick={on}
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-accent",
        active ? "bg-primary/15 text-primary" : "text-foreground"
      )}
    >
      {children}
    </button>
  );
}
