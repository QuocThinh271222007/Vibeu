import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyleKit } from '@tiptap/extension-text-style'
import TextAlign from '@tiptap/extension-text-align'
import { Table, TableRow, TableHeader as BaseTableHeader, TableCell as BaseTableCell } from '@tiptap/extension-table'
import { AlignCenter, AlignLeft, AlignRight, Bold, Highlighter, Italic, PaintBucket, Strikethrough, Underline as UnderlineIcon } from 'lucide-react'
import { sanitizeBlogHtml } from '@/lib/blogContentHtml'

// TipTap's stock table cell/header nodes have no color of their own — "tô màu bảng" needs a
// per-cell background, set via the built-in setCellAttribute command once the attribute exists.
const TableCell = BaseTableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.backgroundColor || null,
        renderHTML: (attrs: { backgroundColor?: string | null }) =>
          attrs.backgroundColor ? { style: `background-color: ${attrs.backgroundColor}` } : {},
      },
    }
  },
})
const TableHeader = BaseTableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.backgroundColor || null,
        renderHTML: (attrs: { backgroundColor?: string | null }) =>
          attrs.backgroundColor ? { style: `background-color: ${attrs.backgroundColor}` } : {},
      },
    }
  },
})

const DEFAULT_FONT_SIZE = 15

/**
 * Small TipTap instance scoped to ONE content_blocks entry — a `paragraph` block's inline text
 * (bold/italic/underline/strike, font size, text color, left/center/right alignment) or a
 * `table` block's whole table (same inline formatting inside cells, plus per-cell background
 * color). Deliberately excludes headings/lists/images/links: those already exist as their own
 * block types in AdminBlogEditor.tsx, so allowing them here too would just duplicate structure.
 */
export function RichBlockEditor({
  content,
  onChange,
  variant,
}: {
  content: string
  onChange: (html: string) => void
  variant: 'paragraph' | 'table'
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      TextStyleKit.configure({ fontFamily: false, lineHeight: false }),
      TextAlign.configure({ types: ['paragraph'] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor }) => onChange(sanitizeBlogHtml(editor.getHTML())),
    // A freshly-added table block starts with no rows at all — seed it with a real 3x3 table
    // once, instead of making the admin insert one manually right after creating the block.
    // onCreate (not a useEffect keyed on the returned `editor`) is the correct place for this:
    // it fires exactly once per real Editor instance, strictly after every extension — including
    // the table commands — has finished initializing. Verified directly against this editor
    // config that the alternative breaks in exactly the way it looks like it shouldn't: right
    // after useEditor() first returns a non-null editor, its extensionManager can still be
    // mid-setup, so editor.chain().insertTable(...).run() silently returns false — and since a
    // table with every cell blank still reads as isEmpty (no text content anywhere), there's no
    // safe way to tell "seed failed, try again" from "already seeded" without this hook.
    onCreate: ({ editor }) => {
      if (variant === 'table' && editor.isEmpty) {
        // Deferred a tick: inserting synchronously here runs the resulting onUpdate (which calls
        // the parent's onChange/setState) before this component has finished its own first
        // mount, which React flags as a state update on an unmounted component.
        setTimeout(() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), 0)
      }
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[2.5rem] rounded-b-lg px-3 py-2 text-sm outline-none ' +
          '[&_table]:w-full [&_table]:table-fixed [&_table]:border-collapse ' +
          '[&_th]:border [&_th]:border-vibe-ink/15 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold ' +
          '[&_td]:border [&_td]:border-vibe-ink/15 [&_td]:px-2 [&_td]:py-1.5 [&_td]:text-xs',
      },
    },
  })

  if (!editor) return null

  const inTable = editor.isActive('table')
  const currentFontSize = editor.getAttributes('textStyle').fontSize as string | undefined
  const fontSizePx = currentFontSize ? parseInt(currentFontSize, 10) : undefined

  return (
    <div className="rounded-lg border-2 border-vibe-ink/10 focus-within:border-vibe-pink/50">
      <div className="flex flex-wrap items-center gap-0.5 border-b-2 border-vibe-ink/10 bg-vibe-cream/40 p-1">
        <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} label="Đậm">
          <Bold size={13} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} label="Nghiêng">
          <Italic size={13} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} label="Gạch chân">
          <UnderlineIcon size={13} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} label="Gạch ngang">
          <Strikethrough size={13} />
        </ToolbarButton>

        <Divider />

        <div className="flex h-6 items-center gap-0.5 rounded-md border border-vibe-ink/10 bg-white px-1" title="Cỡ chữ (px)">
          <input
            type="number"
            min={8}
            max={72}
            placeholder={String(DEFAULT_FONT_SIZE)}
            value={fontSizePx ?? ''}
            onChange={(e) => {
              const raw = e.target.value
              if (raw === '') {
                editor.chain().focus().unsetFontSize().run()
                return
              }
              const n = Math.max(8, Math.min(72, Number(raw)))
              editor.chain().focus().setFontSize(`${n}px`).run()
            }}
            className="w-9 text-[11px] font-medium text-vibe-ink-soft outline-none"
          />
          <span className="text-[10px] text-vibe-ink-soft/60">px</span>
        </div>

        <label title="Màu chữ" className="ml-0.5 grid h-6 w-6 cursor-pointer place-items-center rounded-md hover:bg-white">
          <span className="text-[11px] font-bold" style={{ color: (editor.getAttributes('textStyle').color as string) || undefined }}>
            A
          </span>
          <input
            type="color"
            value={(editor.getAttributes('textStyle').color as string | undefined) ?? '#2c2740'}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="sr-only"
          />
        </label>

        <label title="Màu nền chữ (highlight)" className="grid h-6 w-6 cursor-pointer place-items-center rounded-md hover:bg-white">
          <Highlighter size={13} style={{ color: (editor.getAttributes('textStyle').backgroundColor as string) || undefined }} />
          <input
            type="color"
            value={(editor.getAttributes('textStyle').backgroundColor as string | undefined) ?? '#fff7da'}
            onChange={(e) => editor.chain().focus().setBackgroundColor(e.target.value).run()}
            className="sr-only"
          />
        </label>

        <Divider />

        <ToolbarButton active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} label="Căn trái">
          <AlignLeft size={13} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} label="Căn giữa">
          <AlignCenter size={13} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} label="Căn phải">
          <AlignRight size={13} />
        </ToolbarButton>

        {inTable && (
          <>
            <Divider />
            <label title="Tô màu ô bảng" className="grid h-6 w-6 cursor-pointer place-items-center rounded-md text-vibe-ink-soft hover:bg-white">
              <PaintBucket size={13} />
              <input
                type="color"
                onChange={(e) => editor.chain().focus().setCellAttribute('backgroundColor', e.target.value).run()}
                className="sr-only"
              />
            </label>
            <TableTextButton onClick={() => editor.chain().focus().addRowAfter().run()}>+ Hàng</TableTextButton>
            <TableTextButton onClick={() => editor.chain().focus().deleteRow().run()}>− Hàng</TableTextButton>
            <TableTextButton onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Cột</TableTextButton>
            <TableTextButton onClick={() => editor.chain().focus().deleteColumn().run()}>− Cột</TableTextButton>
          </>
        )}
      </div>

      <EditorContent editor={editor as Editor} />
    </div>
  )
}

function Divider() {
  return <span className="mx-0.5 h-4 w-px bg-vibe-ink/10" />
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`grid h-6 w-6 place-items-center rounded-md transition-colors ${
        active ? 'bg-vibe-pink/15 text-vibe-pink-dark' : 'text-vibe-ink-soft hover:bg-white'
      }`}
    >
      {children}
    </button>
  )
}

function TableTextButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-vibe-ink-soft hover:bg-white">
      {children}
    </button>
  )
}
