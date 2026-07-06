import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Check,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

function ToolbarButton({
  active,
  disabled,
  icon: Icon,
  label,
  title,
  onClick,
}: {
  active?: boolean
  disabled?: boolean
  icon?: LucideIcon
  label?: string
  title: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      className={`rte-tool${active ? ' is-active' : ''}`}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {Icon ? <Icon size={17} strokeWidth={2.2} /> : label}
    </button>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkValue, setLinkValue] = useState('')

  const openLinkPopover = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    setLinkValue(previous ?? 'https://')
    setLinkOpen(true)
  }

  const applyLink = () => {
    const url = linkValue.trim()
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
    setLinkOpen(false)
  }

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    setLinkValue('')
    setLinkOpen(false)
  }

  return (
    <div className="rte-toolbar">
      <ToolbarButton
        title="In đậm"
        icon={Bold}
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        title="In nghiêng"
        icon={Italic}
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        title="Gạch chân"
        icon={UnderlineIcon}
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        title="Gạch ngang"
        icon={Strikethrough}
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <span className="rte-sep" />
      <ToolbarButton
        title="Tiêu đề lớn"
        icon={Heading2}
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        title="Tiêu đề nhỏ"
        icon={Heading3}
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <span className="rte-sep" />
      <ToolbarButton
        title="Danh sách dấu chấm"
        icon={List}
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        title="Danh sách số"
        icon={ListOrdered}
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        title="Trích dẫn"
        icon={Quote}
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <span className="rte-sep" />
      <span className="rte-link-wrap">
        <ToolbarButton title="Chèn liên kết" icon={Link2} active={editor.isActive('link')} onClick={openLinkPopover} />
        {linkOpen ? (
          <span className="rte-link-popover">
            <input
              autoFocus
              value={linkValue}
              placeholder="https:// hoặc /duong-dan"
              onChange={(event) => setLinkValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  applyLink()
                }
                if (event.key === 'Escape') setLinkOpen(false)
              }}
            />
            <button
              type="button"
              title="Áp dụng liên kết"
              onMouseDown={(event) => event.preventDefault()}
              onClick={applyLink}
            >
              <Check size={15} />
            </button>
            <button
              type="button"
              title="Xóa liên kết"
              onMouseDown={(event) => event.preventDefault()}
              onClick={removeLink}
            >
              <X size={15} />
            </button>
          </span>
        ) : null}
      </span>
      <ToolbarButton
        title="Đường kẻ ngang"
        icon={Minus}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />
      <span className="rte-sep" />
      <ToolbarButton
        title="Hoàn tác"
        icon={Undo2}
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        title="Làm lại"
        icon={Redo2}
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      />
    </div>
  )
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Placeholder.configure({ placeholder: placeholder ?? 'Soạn nội dung...' }),
    ],
    content: value || '',
    onUpdate: ({ editor: instance }) => {
      const html = instance.getHTML()
      onChange(html === '<p></p>' ? '' : html)
    },
  })

  // Keep editor in sync when switching between posts (external value change)
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const next = value || '<p></p>'
    if (current !== next && next !== (current === '<p></p>' ? '' : current)) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div className="rte">
      <Toolbar editor={editor} />
      <EditorContent className="rte-content" editor={editor} />
    </div>
  )
}
