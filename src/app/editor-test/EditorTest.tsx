"use client";

import { useEffect, useRef } from "react";
import { EditorRoot, EditorContent } from "novel";
import StarterKit from "@tiptap/starter-kit";

const box = "border rounded p-3 min-h-20 w-full bg-base-200";

const hints = {
  autocorrect: "on",
  autocapitalize: "sentences",
  spellcheck: "true",
  inputmode: "text",
};

const bareExtensions = [StarterKit];

function Tiptap({ attributes }: { attributes: Record<string, string> }) {
  return (
    <EditorRoot>
      <EditorContent
        extensions={bareExtensions}
        editorProps={{ attributes: { class: box, ...attributes } }}
      />
    </EditorRoot>
  );
}

// TipTap always adds translate="no"; strip it to see if it matters.
function TiptapNoTranslate() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const strip = () => ref.current?.querySelector("[translate]")?.removeAttribute("translate");
    strip();
    const t = setInterval(strip, 500);
    return () => clearInterval(t);
  }, []);
  return (
    <div ref={ref}>
      <Tiptap attributes={hints} />
    </div>
  );
}

const tests: [string, React.ReactNode][] = [
  ["1. Textarea", <textarea key="1" className={box} />],
  ["2. Plain editable box, no editor code", <div key="2" contentEditable suppressContentEditableWarning className={box} />],
  [
    "3. Plain editable box with the post editor's spacing style",
    <div key="3" contentEditable suppressContentEditableWarning className={box} style={{ whiteSpace: "break-spaces" }} />,
  ],
  ["4. Bare editor library", <Tiptap key="4" attributes={{}} />],
  ["5. Bare editor library with keyboard hints", <Tiptap key="5" attributes={hints} />],
  ["6. Same as 5, without translate=\"no\"", <TiptapNoTranslate key="6" />],
];

export function EditorTest() {
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <p className="text-sm">Type &quot;hello.how&quot; in each box and note which ones add the space.</p>
      {tests.map(([label, el]) => (
        <section key={label}>
          <h2 className="font-bold mb-1">{label}</h2>
          {el}
        </section>
      ))}
    </div>
  );
}
