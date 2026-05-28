import { Node, mergeAttributes } from "@tiptap/core";

/**
 * Caption — a lightweight text format for image captions and asides.
 *
 * Renders to `<p class="caption">…</p>` so it stays a plain inline-content
 * block (no blockquote-style box), and is styled in globals.css under
 * `.prose-blog`. Toggle it with the built-in `toggleNode` command.
 */
export const Caption = Node.create({
  name: "caption",
  group: "block",
  content: "inline*",
  defining: true,

  parseHTML() {
    // Higher priority than the default paragraph rule so `<p class="caption">`
    // round-trips back into a caption node instead of a plain paragraph.
    return [{ tag: "p.caption", priority: 1000 }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["p", mergeAttributes(HTMLAttributes, { class: "caption" }), 0];
  },
});
