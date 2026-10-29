"use client";

import { useCallback, useState } from "react";
import StarterKit from "@tiptap/starter-kit";
import { EditorRoot, EditorContent } from "novel";
import { Editor, extensions } from "@/components/Editor";

const stableProps = {
  attributes: {
    autocorrect: "on",
    autocapitalize: "sentences",
    spellcheck: "true",
    inputmode: "text",
  },
};

const bareExtensions = [StarterKit];

function Bare() {
  return (
    <EditorRoot>
      <EditorContent extensions={bareExtensions} editorProps={stableProps} />
    </EditorRoot>
  );
}

function SameExtensions() {
  return (
    <EditorRoot>
      <EditorContent extensions={extensions} editorProps={stableProps} />
    </EditorRoot>
  );
}

function RealEditor() {
  const [, setHtml] = useState("");
  const onUpdate = useCallback((_json: unknown, html: string) => setHtml(html), []);
  return <Editor onUpdate={onUpdate} />;
}

export function EditorTest() {
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <p className="text-sm">Type &quot;hello.how&quot; in each box and note which ones add the space.</p>
      <section>
        <h2 className="font-bold">A. Plain editor</h2>
        <div className="border rounded p-3 min-h-24"><Bare /></div>
      </section>
      <section>
        <h2 className="font-bold">B. Same features as the post editor</h2>
        <div className="border rounded p-3 min-h-24"><SameExtensions /></div>
      </section>
      <section>
        <h2 className="font-bold">C. The real post editor</h2>
        <RealEditor />
      </section>
    </div>
  );
}
