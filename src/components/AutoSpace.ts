import { Extension, InputRule } from "@tiptap/core";
import { fixPunctuationSpacing } from "@/lib/autoSpace";

/**
 * AutoSpace — when a word is finished with a space, turn "hello.how" into
 * "hello. How" (see `fixPunctuationSpacing` for what's left alone).
 *
 * Runs on the trailing space so the whole word is known, which also covers
 * phone keyboards that only report text when a word is committed. Input
 * rules skip code blocks and inline code, and Backspace right after undoes
 * the fix.
 */
export const AutoSpace = Extension.create({
  name: "autoSpace",

  addInputRules() {
    return [
      new InputRule({
        find: (text) => {
          const m = /(\S+)(\s)$/.exec(text);
          if (!m) return null;
          const fixed = fixPunctuationSpacing(m[1]);
          if (fixed === null) return null;
          return { index: m.index, text: m[0], data: { replacement: fixed + m[2] } };
        },
        handler: ({ state, range, match }) => {
          // The range covers the word, plus the space when a keyboard has
          // already committed it; either way, write the word and the space.
          state.tr.insertText(match.data?.replacement as string, range.from, range.to);
        },
      }),
    ];
  },
});
