import hljs from "highlight.js";

export function highlightHtml(html: string): string {
  if (typeof window === "undefined") return html;
  if (!html.includes("<pre")) return html;

  const doc = new DOMParser().parseFromString(html, "text/html");

  doc.querySelectorAll("pre > code").forEach((code) => {
    const langMatch = code.className.match(/language-(\S+)/);
    const lang = langMatch?.[1];
    const text = code.textContent ?? "";

    if (!lang || lang === "plaintext" || !hljs.getLanguage(lang)) {
      code.textContent = text;
      return;
    }

    const { value } = hljs.highlight(text, { language: lang, ignoreIllegals: true });
    code.innerHTML = value;
    code.classList.add("hljs");
  });

  return doc.body.innerHTML;
}
