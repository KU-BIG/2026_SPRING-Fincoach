import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({ breaks: true, gfm: true });

/** LLM 응답(마크다운)을 안전한 HTML로 변환. XSS 방지를 위해 DOMPurify로 정제. */
export function renderMarkdown(raw: string): string {
  const html = marked.parse(raw, { async: false }) as string;
  return DOMPurify.sanitize(html);
}
