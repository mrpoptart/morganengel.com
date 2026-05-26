"use client";

import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
  type NodeViewProps,
} from "@tiptap/react";
import { common, createLowlight } from "lowlight";

export const lowlight = createLowlight(common);

const LANGUAGES: { value: string; label: string }[] = [
  { value: "plaintext", label: "plain text" },
  { value: "bash", label: "bash" },
  { value: "c", label: "c" },
  { value: "cpp", label: "c++" },
  { value: "csharp", label: "c#" },
  { value: "css", label: "css" },
  { value: "go", label: "go" },
  { value: "html", label: "html" },
  { value: "java", label: "java" },
  { value: "javascript", label: "javascript" },
  { value: "json", label: "json" },
  { value: "kotlin", label: "kotlin" },
  { value: "markdown", label: "markdown" },
  { value: "php", label: "php" },
  { value: "python", label: "python" },
  { value: "ruby", label: "ruby" },
  { value: "rust", label: "rust" },
  { value: "scss", label: "scss" },
  { value: "shell", label: "shell" },
  { value: "sql", label: "sql" },
  { value: "swift", label: "swift" },
  { value: "typescript", label: "typescript" },
  { value: "xml", label: "xml" },
  { value: "yaml", label: "yaml" },
];

function CodeBlockComponent({ node, updateAttributes }: NodeViewProps) {
  const current = (node.attrs.language as string | null) || "plaintext";

  return (
    <NodeViewWrapper className="code-block-with-lang">
      <div className="code-block-header" contentEditable={false}>
        <select
          className="code-block-lang-select"
          value={current}
          onChange={(e) => updateAttributes({ language: e.target.value })}
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
      <pre>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
}

export const CodeBlockWithLanguage = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },
}).configure({ lowlight, defaultLanguage: "plaintext" });
