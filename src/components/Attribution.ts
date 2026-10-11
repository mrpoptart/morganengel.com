import { Node, mergeAttributes } from "@tiptap/core";

/**
 * Attribution — the "— Name" line under a quote.
 *
 * Renders to `<footer class="attribution">…</footer>` rather than a `<p>`, so
 * typography's quote marks (which hang off the blockquote's first/last `<p>`)
 * stay on the quote text. The leading dash is added in globals.css, so only
 * the name is typed. Toggle it with the built-in `toggleNode` command.
 */
export const Attribution = Node.create({
  name: "attribution",
  group: "block",
  content: "inline*",
  defining: true,

  parseHTML() {
    return [{ tag: "footer.attribution", priority: 1000 }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["footer", mergeAttributes(HTMLAttributes, { class: "attribution" }), 0];
  },
});
