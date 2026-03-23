"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  EditorRoot,
  EditorContent,
  useEditor,
  type JSONContent,
} from "novel";
import { generateJSON } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";

interface EditorProps {
  initialContent?: JSONContent;
  initialHTML?: string;
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
  onClick,
}: {
  label: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex items-center justify-center w-9 h-9 text-sm rounded-md transition-colors shrink-0 ${
        isActive
          ? "bg-primary text-primary-content"
          : "text-base-content/70 hover:bg-base-content/10 hover:text-base-content active:bg-base-content/20"
      }`}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-base-content/15 shrink-0" />;
}

function Toolbar({ portalTarget }: { portalTarget: HTMLElement | null }) {
  const { editor } = useEditor();
  if (!editor || !portalTarget) return null;

  const toolbar = (
    <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none px-2 py-1.5">
      <ToolbarButton
        label={<strong>B</strong>}
        isActive={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label={<em>I</em>}
        isActive={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label={<span className="underline">U</span>}
        isActive={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        label={<s>S</s>}
        isActive={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolbarButton
        label="<>"
        isActive={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <ToolbarButton
        label="H"
        isActive={editor.isActive("highlight")}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      />

      <Divider />

      <ToolbarButton
        label="H2"
        isActive={editor.isActive("heading", { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      />
      <ToolbarButton
        label="H3"
        isActive={editor.isActive("heading", { level: 3 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      />

      <Divider />

      <ToolbarButton
        label="&bull;"
        isActive={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="1."
        isActive={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label="&ldquo;"
        isActive={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />

      <Divider />

      <ToolbarButton
        label="&#128279;"
        isActive={editor.isActive("link")}
        onClick={() => {
          if (editor.isActive("link")) {
            editor.chain().focus().unsetLink().run();
            return;
          }
          const url = window.prompt("Enter URL:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
      />
    </div>
  );

  return createPortal(toolbar, portalTarget);
}

export function Editor({ initialContent, initialHTML, onUpdate }: EditorProps) {
  const [content] = useState<JSONContent | undefined>(() => {
    if (initialContent) return initialContent;
    if (initialHTML) return generateJSON(initialHTML, extensions) as JSONContent;
    return undefined;
  });
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarTarget, setToolbarTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setToolbarTarget(toolbarRef.current);
  }, []);

  return (
    <div className="min-h-[600px] border border-base-content/10 rounded-xl bg-base-200/30">
      {/* Toolbar portal target — sticky at top */}
      <div
        ref={toolbarRef}
        className="sticky top-0 z-10 border-b border-base-content/10 bg-base-200/95 backdrop-blur-sm"
      />

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
          <Toolbar portalTarget={toolbarTarget} />
        </EditorContent>
      </EditorRoot>
    </div>
  );
}
