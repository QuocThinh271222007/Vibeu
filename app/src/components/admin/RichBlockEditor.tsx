import { useEffect } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyleKit } from '@tiptap/extension-text-style'
import TextAlign from '@tiptap/extension-text-align'
import { Table, TableRow, TableHeader as BaseTableHeader, TableCell as BaseTableCell } from '@tiptap/extension-table'
import Underline from '@tiptap/extension-underline'
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, PaintBucket, Strikethrough, Underline as UnderlineIcon } from 'lucide-react'
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

const FONT_SIZES = [
  { label: 'Mặc định', value: '' },
  { label: 'Nhỏ', value: '13px' },
  { label: 'Vừa', value: '16px' },
  { label: 'Lớn', value: '20px' },
  { label: 'Rất lớn', value: '26px' },
]

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
      Underline,
      TextStyleKit.configure({ fontFamily: false, lineHeight: false, backgroundColor: false }),
      TextAlign.configure({ types: ['paragraph'] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor }) => onChange(sanitizeBlogHtml(editor.getHTML())),
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

  // A freshly-added table block starts with no rows at all — seed it with a real 3x3 table once,
  // instead of making the admin insert one manually right after creating the block.
  useEffect(() => {
    if (variant === 'table' && editor && editor.isEmpty) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  if (!editor) return null

  const inTable = editor.isActive('table')

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

        <select
          value={(editor.getAttributes('textStyle').fontSize as string | undefined) ?? ''}
          onChange={(e) => {
            const v = e.target.value
            if (v) editor.chain().focus().setFontSize(v).run()
            else editor.chain().focus().unsetFontSize().run()
          }}
          className="h-6 rounded-md border border-vibe-ink/10 bg-white px-1 text-[11px] font-medium text-vibe-ink-soft outline-none"
          title="Cỡ chữ"
        >
          {FONT_SIZES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

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
