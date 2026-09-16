import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TiptapImage from '@tiptap/extension-image'
import TiptapLink from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table'
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Table2,
  Trash2,
  Undo2,
} from 'lucide-react'
import { sanitizeBlogHtml } from '@/lib/blogContentHtml'

/**
 * WYSIWYG replacement for the old discrete-block editor — continuous "type like in Word" editing
 * plus Excel-like tables (Table2 button). `content` is only used to seed the editor on mount;
 * AdminBlogEditor.tsx gates rendering this until its async load finishes, so there's no need to
 * sync external `content` changes back into an already-mounted editor.
 */
export function RichTextEditor({
  content,
  onChange,
  onUploadImage,
  placeholder,
}: {
  content: string
  onChange: (html: string) => void
  onUploadImage: (file: File) => Promise<string | null>
  placeholder?: string
}) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapImage,
      TiptapLink.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder ?? 'Viết nội dung bài viết…' }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor }) => onChange(sanitizeBlogHtml(editor.getHTML())),
    editorProps: {
      attributes: {
        class:
          'rich-content min-h-[420px] rounded-b-xl px-3.5 py-3 text-sm outline-none ' +
          '[&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:first:mt-0 ' +
          '[&_h3]:mt-4 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold ' +
          '[&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 ' +
          '[&_blockquote]:mt-2 [&_blockquote]:border-l-4 [&_blockquote]:border-vibe-pink/30 [&_blockquote]:pl-3 [&_blockquote]:italic ' +
          '[&_img]:mt-2 [&_img]:max-w-full [&_img]:rounded-lg ' +
          '[&_table]:mt-2 [&_table]:w-full [&_table]:table-fixed [&_table]:border-collapse ' +
          '[&_th]:border [&_th]:border-vibe-ink/15 [&_th]:bg-vibe-cream [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold ' +
          '[&_td]:border [&_td]:border-vibe-ink/15 [&_td]:px-2 [&_td]:py-1.5 [&_td]:text-xs ' +
          '[&_a]:text-vibe-pink-dark [&_a]:underline',
      },
    },
  })

  // Only for the (rare) case the parent swaps which post is being edited without remounting —
  // AdminBlogEditor currently keys its loading gate so this mostly guards against future misuse.
  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  if (!editor) return null

  async function handleImageFile(file: File) {
    setUploading(true)
    const url = await onUploadImage(file)
    setUploading(false)
    if (url) editor!.chain().focus().setImage({ src: url }).run()
  }

  function setLink() {
    const previousUrl = editor!.getAttributes('link').href as string | undefined
    const url = window.prompt('Đường dẫn liên kết:', previousUrl ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor!.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor!.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const inTable = editor.isActive('table')

  return (
    <div className="rounded-xl border-2 border-vibe-ink/10 focus-within:border-vibe-pink/50">
      <div className="flex flex-wrap items-center gap-1 border-b-2 border-vibe-ink/10 p-1.5">
        <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} label="Đậm">
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} label="Nghiêng">
          <Italic size={14} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()} label="Đoạn văn">
          <Pilcrow size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          label="Heading 2"
        >
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          label="Heading 3"
        >
          <Heading3 size={14} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} label="Danh sách">
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="Danh sách số"
        >
          <ListOrdered size={14} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} label="Trích dẫn">
          <Quote size={14} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton active={editor.isActive('link')} onClick={setLink} label="Liên kết">
          <Link2 size={14} />
        </ToolbarButton>
        <ToolbarButton active={false} onClick={() => fileInputRef.current?.click()} label={uploading ? 'Đang tải...' : 'Chèn ảnh'} disabled={uploading}>
          <ImagePlus size={14} />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImageFile(file)
            e.target.value = ''
          }}
        />
        <ToolbarButton
          active={inTable}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          label="Chèn bảng"
        >
          <Table2 size={14} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton active={false} onClick={() => editor.chain().focus().undo().run()} label="Hoàn tác">
          <Undo2 size={14} />
        </ToolbarButton>
        <ToolbarButton active={false} onClick={() => editor.chain().focus().redo().run()} label="Làm lại">
          <Redo2 size={14} />
        </ToolbarButton>
      </div>

      {inTable && (
        <div className="flex flex-wrap items-center gap-1 border-b-2 border-vibe-ink/10 bg-vibe-cream/50 p-1.5">
          <TableTextButton onClick={() => editor.chain().focus().addRowAfter().run()}>+ Hàng</TableTextButton>
          <TableTextButton onClick={() => editor.chain().focus().deleteRow().run()}>− Hàng</TableTextButton>
          <TableTextButton onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Cột</TableTextButton>
          <TableTextButton onClick={() => editor.chain().focus().deleteColumn().run()}>− Cột</TableTextButton>
          <TableTextButton onClick={() => editor.chain().focus().deleteTable().run()} danger>
            <Trash2 size={12} className="inline -mt-0.5" /> Xoá bảng
          </TableTextButton>
        </div>
      )}

      <EditorContent editor={editor as Editor} />
    </div>
  )
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-vibe-ink/10" />
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  label,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-7 w-7 place-items-center rounded-md transition-colors disabled:opacity-40 ${
        active ? 'bg-vibe-pink/15 text-vibe-pink-dark' : 'text-vibe-ink-soft hover:bg-vibe-cream'
      }`}
    >
      {children}
    </button>
  )
}

function TableTextButton({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-vibe-ink-soft hover:bg-white'
      }`}
    >
      {children}
    </button>
  )
}
