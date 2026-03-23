"use client";

import { useState } from "react";
import {
  EditorRoot,
  EditorContent,
  EditorBubble,
  EditorBubbleItem,
  useEditor,
  type JSONContent,
} from "novel";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";

interface EditorProps {
  initialContent?: JSONContent;
  onUpdate?: (json: JSONContent, html: string) => void;
}

const extensions = [
  StarterKit,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: { class: "link link-primary" },
  }),
  Underline,
  Highlight,
  Placeholder.configure({ placeholder: "Start writing..." }),
];

function ToolbarButton({
  label,
  isActive,
  onSelect,
}: {
  label: React.ReactNode;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <EditorBubbleItem onSelect={onSelect}>
      <button
        type="button"
        className={`px-2 py-1 text-sm rounded transition-colors ${
          isActive
            ? "bg-primary text-primary-content"
            : "hover:bg-base-content/10"
        }`}
      >
        {label}
      </button>
    </EditorBubbleItem>
  );
}

function BubbleToolbar() {
  const { editor } = useEditor();
  if (!editor) return null;

  const items = [
    {
      label: <strong>B</strong>,
      active: editor.isActive("bold"),
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: <em>I</em>,
      active: editor.isActive("italic"),
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: <span className="underline">U</span>,
      active: editor.isActive("underline"),
      action: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      label: <s>S</s>,
      active: editor.isActive("strike"),
      action: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      label: "</>",
      active: editor.isActive("code"),
      action: () => editor.chain().focus().toggleCode().run(),
    },
    {
      label: "H",
      active: editor.isActive("highlight"),
      action: () => editor.chain().focus().toggleHighlight().run(),
    },
  ];

  const headings = [
    {
      label: "H2",
      active: editor.isActive("heading", { level: 2 }),
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "H3",
      active: editor.isActive("heading", { level: 3 }),
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
  ];

  const blocks = [
    {
      label: "•",
      active: editor.isActive("bulletList"),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "1.",
      active: editor.isActive("orderedList"),
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "🔗",
      active: editor.isActive("link"),
      action: () => {
        const url = window.prompt("Enter URL:");
        if (url) editor.chain().focus().setLink({ href: url }).run();
      },
    },
  ];

  return (
    <EditorBubble className="flex items-center gap-0.5 rounded-lg border border-base-content/20 bg-base-300 shadow-xl p-1">
      {items.map((item, i) => (
        <ToolbarButton
          key={i}
          label={item.label}
          isActive={item.active}
          onSelect={item.action}
        />
      ))}
      <div className="w-px h-5 bg-base-content/20 mx-0.5" />
      {headings.map((item, i) => (
        <ToolbarButton
          key={`h${i}`}
          label={item.label}
          isActive={item.active}
          onSelect={item.action}
        />
      ))}
      <div className="w-px h-5 bg-base-content/20 mx-0.5" />
      {blocks.map((item, i) => (
        <ToolbarButton
          key={`b${i}`}
          label={item.label}
          isActive={item.active}
          onSelect={item.action}
        />
      ))}
    </EditorBubble>
  );
}

export function Editor({ initialContent, onUpdate }: EditorProps) {
  const [content] = useState<JSONContent | undefined>(initialContent);

  return (
    <div className="min-h-[600px] border border-base-content/10 rounded-xl overflow-hidden bg-base-200/30">
      <EditorRoot>
        <EditorContent
          initialContent={content}
          extensions={extensions}
          className="prose prose-invert prose-lg max-w-none prose-blog p-6 min-h-[600px] focus:outline-none"
          onUpdate={({ editor }) => {
            const json = editor.getJSON();
            onUpdate?.(json, editor.getHTML());
          }}
        >
          <BubbleToolbar />
        </EditorContent>
      </EditorRoot>
    </div>
  );
}
