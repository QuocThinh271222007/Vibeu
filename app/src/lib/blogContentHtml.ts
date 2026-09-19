import DOMPurify from 'dompurify'

/** Flattens a rich (or legacy plain) block's content down to plain text — used for the
 * word-count/keyword hints in AdminBlogEditor.tsx and for the content[] search mirror. Safe on
 * legacy plain-string blocks too: text with no tags round-trips through innerHTML unchanged. */
export function htmlToText(html: string): string {
  if (typeof document === 'undefined') return html
  const container = document.createElement('div')
  container.innerHTML = html
  return (container.textContent ?? '').trim()
}

/** Allow-listed for what RichBlockEditor.tsx's TipTap config can actually produce (bold/italic/
 * underline/strike, inline color/font-size spans, paragraph alignment, tables with per-cell
 * background color) — run on both the admin editor's output before saving and again defensively
 * before dangerouslySetInnerHTML on the public BlogPost.tsx page. `style` is intentionally
 * allowed on every tag below (color/font-size/text-align/background-color all render as inline
 * styles) — DOMPurify still strips dangerous CSS (expressions, javascript: urls) from it, and
 * this content is admin-authored only, never public user input. */
export function sanitizeBlogHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'span', 'strong', 'em', 'u', 's', 'a',
      'h2', 'h3', 'ul', 'ol', 'li', 'blockquote',
      'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'colspan', 'rowspan', 'style'],
  })
}
