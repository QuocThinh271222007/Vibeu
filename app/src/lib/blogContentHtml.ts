import DOMPurify from 'dompurify'
import type { ContentBlock } from '@/data/blog'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** One-time upgrade path: turns a legacy block-array post into an HTML string so the new
 * WYSIWYG editor (RichTextEditor.tsx) has something to pre-fill instead of opening blank. */
export function blocksToHtml(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'heading2':
          return `<h2>${escapeHtml(block.text)}</h2>`
        case 'heading3':
          return `<h3>${escapeHtml(block.text)}</h3>`
        case 'paragraph':
          return `<p>${escapeHtml(block.text)}</p>`
        case 'image':
          return `<figure><img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}">${
            block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ''
          }</figure>`
        default:
          return ''
      }
    })
    .join('')
}

/** Plain-text mirror stored alongside content_html — see blog_posts.content in schema.sql. Only
 * meaningful in the browser (uses the DOM to strip tags), which is fine since it's only ever
 * called from AdminBlogEditor.tsx before saving. */
export function htmlToPlainText(html: string): string[] {
  if (typeof document === 'undefined') return []
  const container = document.createElement('div')
  container.innerHTML = html
  const out: string[] = []
  container.querySelectorAll('p, h2, h3, li, blockquote, td, th').forEach((el) => {
    const text = el.textContent?.trim()
    if (text) out.push(text)
  })
  return out
}

/** Allow-listed for the tags/attributes RichTextEditor.tsx's TipTap config can actually produce
 * (headings, paragraphs, lists, blockquote, tables, images, links) — run on both the admin
 * editor's output before saving and again defensively before dangerouslySetInnerHTML on the
 * public BlogPost.tsx page. */
export function sanitizeBlogHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a',
      'h2', 'h3', 'ul', 'ol', 'li', 'blockquote',
      'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'colspan', 'rowspan'],
  })
}
