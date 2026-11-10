"use client";

import { useEffect, useRef, useState } from "react";
import { EditorState, Selection } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import { schema } from "@tiptap/pm/schema-basic";

// Records what the keyboard and the page do to an editable element, so the
// sequence can be compared between a plain box and the editor library.

const box = "border rounded p-3 min-h-20 w-full bg-base-200";

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

// The styles TipTap injects for every editor, so the copies match it exactly.
const editorCss = `.ProseMirror { position: relative; word-wrap: break-word; white-space: pre-wrap; white-space: break-spaces; -webkit-font-variant-ligatures: none; font-variant-ligatures: none; font-feature-settings: "liga" 0; }`;

// ProseMirror on its own, outside React, so nothing re-renders it.
function RawProseMirror({
  attributes = {},
  quietClass = false,
  startText = "",
}: {
  attributes?: Record<string, string>;
  quietClass?: boolean;
  startText?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const doc = startText
      ? schema.node("doc", null, [schema.node("paragraph", null, [schema.text(startText)])])
      : undefined;
    const state = EditorState.create({ schema, doc });
    const view = new EditorView(ref.current, {
      state: doc ? state.apply(state.tr.setSelection(Selection.atEnd(state.doc))) : state,
      attributes: { class: box, ...attributes },
    });
    if (quietClass) {
      // ProseMirror calls classList.remove() on every update, which rewrites
      // the class attribute even when nothing changes. Skip those no-ops.
      const cl = view.dom.classList;
      const add = cl.add.bind(cl);
      const remove = cl.remove.bind(cl);
      cl.add = (...t: string[]) => {
        const missing = t.filter((c) => !cl.contains(c));
        if (missing.length) add(...missing);
      };
      cl.remove = (...t: string[]) => {
        const present = t.filter((c) => cl.contains(c));
        if (present.length) remove(...present);
      };
    }
    return () => view.destroy();
  }, [attributes, quietClass, startText]);
  return <div ref={ref} />;
}

export function EditorTest() {
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <style>{editorCss}</style>
      <p className="text-sm">Some boxes start with &quot;Hi&quot; already in them. In those, tap right after &quot;Hi&quot; and type &quot;.how&quot;. In the empty ones, type &quot;hello.how&quot;. Note which ones add the space.</p>
      <Recorded title="P. Plain editable box (empty)" find={(w) => w.querySelector("[contenteditable]")}>
        <div contentEditable suppressContentEditableWarning className={box} style={{ whiteSpace: "break-spaces" }} />
      </Recorded>
      <Recorded title="A. Plain box starting with Hi" find={(w) => w.querySelector("[contenteditable]")}>
        <div contentEditable suppressContentEditableWarning className={box} style={{ whiteSpace: "break-spaces" }} dangerouslySetInnerHTML={{ __html: "Hi" }} />
      </Recorded>
      <Recorded title="B. Plain box starting with Hi inside a paragraph" find={(w) => w.querySelector("[contenteditable]")}>
        <div contentEditable suppressContentEditableWarning className={box} style={{ whiteSpace: "break-spaces" }} dangerouslySetInnerHTML={{ __html: "<p>Hi</p>" }} />
      </Recorded>
      <Recorded title="C. Plain box holding only a line break (empty)" find={(w) => w.querySelector("[contenteditable]")}>
        <div contentEditable suppressContentEditableWarning className={box} style={{ whiteSpace: "break-spaces" }} dangerouslySetInnerHTML={{ __html: "<br>" }} />
      </Recorded>
      <Recorded title="F. Copy of Facebook's post box (empty)" find={(w) => w.querySelector("[contenteditable]")}>
        <div contentEditable suppressContentEditableWarning role="textbox" spellCheck tabIndex={0} data-lexical-editor="true" className={box} style={{ userSelect: "text", whiteSpace: "pre-wrap", wordBreak: "break-word" }} dangerouslySetInnerHTML={{ __html: '<p dir="auto"><br></p>' }} />
      </Recorded>
      <Recorded title="E. Editor library starting with Hi" find={(w) => w.querySelector(".ProseMirror[translate]")}>
        <RawProseMirror startText="Hi" />
      </Recorded>
    </div>
  );
}
