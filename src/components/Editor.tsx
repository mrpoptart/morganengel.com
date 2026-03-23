"use client";

import { useState } from "react";
import {
  EditorRoot,
  EditorContent,
  type JSONContent,
} from "novel";
import StarterKit from "@tiptap/starter-kit";

interface EditorProps {
  initialContent?: JSONContent;
  onUpdate?: (json: JSONContent, html: string) => void;
}

const extensions = [StarterKit];

export function Editor({ initialContent, onUpdate }: EditorProps) {
  const [content] = useState<JSONContent | undefined>(initialContent);

  return (
    <div className="min-h-[400px] border border-base-content/10 rounded-xl overflow-hidden bg-base-200/30">
      <EditorRoot>
        <EditorContent
          initialContent={content}
          extensions={extensions}
          className="prose prose-invert prose-lg max-w-none prose-blog p-6 min-h-[400px] focus:outline-none"
          onUpdate={({ editor }) => {
            const json = editor.getJSON();
            onUpdate?.(json, editor.getHTML());
          }}
        />
      </EditorRoot>
    </div>
  );
}
