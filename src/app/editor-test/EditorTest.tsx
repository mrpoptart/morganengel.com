"use client";

import { useEffect, useRef, useState } from "react";
import { EditorRoot, EditorContent } from "novel";
import StarterKit from "@tiptap/starter-kit";
import { EditorState } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import { schema } from "@tiptap/pm/schema-basic";

// Records what the keyboard and the page do to an editable element, so the
// sequence can be compared between a plain box and the editor library.

const box = "border rounded p-3 min-h-20 w-full bg-base-200";
const bareExtensions = [StarterKit];

type Log = string[];
let selPatched = false;
const sinks = new Set<(m: string) => void>();

function patchSelection() {
  if (selPatched) return;
  selPatched = true;
  for (const m of ["collapse", "setBaseAndExtent", "addRange", "removeAllRanges", "extend", "setPosition"] as const) {
    const proto = Selection.prototype as unknown as Record<string, (...a: unknown[]) => unknown>;
    const orig = proto[m];
    if (!orig) continue;
    proto[m] = function (this: Selection, ...a: unknown[]) {
      sinks.forEach((s) => s(`JS selection.${m}`));
      return orig.apply(this, a);
    };
  }
}

function describe(n: Node) {
  return n.nodeType === 3 ? `text${JSON.stringify(n.nodeValue)}` : n.nodeName;
}

function useRecorder(root: () => HTMLElement | null) {
  const [log, setLog] = useState<Log>([]);
  useEffect(() => {
    patchSelection();
    let el: HTMLElement | null = null;
    let start = 0;
    const lines: Log = [];
    const push = (m: string) => {
      if (!el || !el.contains(document.activeElement) && document.activeElement !== el) return;
      if (!start) start = performance.now();
      const sel = document.getSelection();
      const at = sel && sel.anchorNode && el.contains(sel.anchorNode) ? ` @${sel.anchorOffset}` : "";
      lines.push(`${Math.round(performance.now() - start)} ${m}${at} | ${JSON.stringify(el.textContent)}`);
      setLog([...lines]);
    };
    const t = setInterval(() => {
      el = root();
      if (!el) return;
      clearInterval(t);
      for (const type of ["keydown", "beforeinput", "input", "compositionstart", "compositionupdate", "compositionend"]) {
        el.addEventListener(type, (e) => {
          const ev = e as InputEvent & KeyboardEvent & CompositionEvent;
          const bits = [type];
          if (ev.inputType) bits.push(ev.inputType);
          if (ev.data != null) bits.push(JSON.stringify(ev.data));
          if (type === "keydown") bits.push(`key=${ev.key} code=${ev.keyCode}`);
          if (ev.isComposing) bits.push("composing");
          if (e.defaultPrevented) bits.push("PREVENTED");
          push(bits.join(" "));
        }, true);
      }
      document.addEventListener("selectionchange", () => push("selectionchange"));
      new MutationObserver((ms) => {
        for (const m of ms) {
          if (m.type === "characterData") push(`mut text ${JSON.stringify(m.oldValue)}->${JSON.stringify(m.target.nodeValue)}`);
          else if (m.type === "childList") push(`mut +[${[...m.addedNodes].map(describe)}] -[${[...m.removedNodes].map(describe)}]`);
          else push(`mut attr ${m.attributeName}`);
        }
      }).observe(el, { subtree: true, childList: true, characterData: true, characterDataOldValue: true, attributes: true });
      sinks.add(push);
    }, 200);
    return () => clearInterval(t);
  }, [root]);
  return [log, () => setLog([])] as const;
}

function Recorded({ title, children, find }: { title: string; children: React.ReactNode; find: (w: HTMLElement) => HTMLElement | null }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [root] = useState(() => () => (wrap.current ? find(wrap.current) : null));
  const [log, clear] = useRecorder(root);
  const text = log.join("\n");
  return (
    <section className="space-y-2">
      <h2 className="font-bold">{title}</h2>
      <div ref={wrap}>{children}</div>
      <div className="flex gap-2">
        <button type="button" className="btn btn-sm" onClick={() => navigator.clipboard.writeText(`${title}\n${text}`)}>Copy log</button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={clear}>Clear</button>
      </div>
      <pre className="text-xs whitespace-pre-wrap max-h-60 overflow-auto bg-base-300 p-2">{text}</pre>
    </section>
  );
}

// ProseMirror on its own, outside React, so nothing re-renders it.
function RawProseMirror() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const view = new EditorView(ref.current, {
      state: EditorState.create({ schema }),
      attributes: { class: box },
    });
    return () => view.destroy();
  }, []);
  return <div ref={ref} />;
}

export function EditorTest() {
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <p className="text-sm">In each box, type &quot;hello.how&quot; once and note whether the space appears. Then tap Copy log under P and E and paste both in the chat.</p>
      <Recorded title="P. Plain editable box" find={(w) => w.querySelector("[contenteditable]")}>
        <div contentEditable suppressContentEditableWarning className={box} style={{ whiteSpace: "break-spaces" }} />
      </Recorded>
      <Recorded title="E. Editor library" find={(w) => w.querySelector(".ProseMirror")}>
        <EditorRoot>
          <EditorContent extensions={bareExtensions} editorProps={{ attributes: { class: box } }} />
        </EditorRoot>
      </Recorded>
      <Recorded title="R. Editor library without React" find={(w) => w.querySelector(".ProseMirror")}>
        <RawProseMirror />
      </Recorded>
    </div>
  );
}
