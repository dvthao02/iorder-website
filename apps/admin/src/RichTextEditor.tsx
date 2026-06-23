import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

function ToolbarButton({ active, disabled, label, title, onClick }: { active?: boolean; disabled?: boolean; label: string; title: string; onClick: () => void }) {
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
      {label}
    </button>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Nhập đường dẫn (để trống để xóa liên kết):', previous ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="rte-toolbar">
      <ToolbarButton title="In đậm" label="B" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolbarButton title="In nghiêng" label="I" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <ToolbarButton title="Gạch chân" label="U" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} />
      <ToolbarButton title="Gạch ngang" label="S" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />
      <span className="rte-sep" />
      <ToolbarButton title="Tiêu đề lớn" label="H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
      <ToolbarButton title="Tiêu đề nhỏ" label="H3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
      <span className="rte-sep" />
      <ToolbarButton title="Danh sách dấu chấm" label="• Danh sách" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolbarButton title="Danh sách số" label="1. Số" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <ToolbarButton title="Trích dẫn" label="❝ Trích" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      <span className="rte-sep" />
      <ToolbarButton title="Chèn liên kết" label="🔗 Link" active={editor.isActive('link')} onClick={setLink} />
      <ToolbarButton title="Đường kẻ ngang" label="―" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
      <span className="rte-sep" />
      <ToolbarButton title="Hoàn tác" label="↶" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} />
      <ToolbarButton title="Làm lại" label="↷" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} />
    </div>
  )
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
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
