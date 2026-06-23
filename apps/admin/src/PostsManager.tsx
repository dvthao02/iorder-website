import type { MediaAsset, PostInput, PostResponse } from '@iorder/contracts'
import { useEffect, useState } from 'react'

import { archivePost, createPost, listMedia, listPosts, publishPost, updatePost } from './api'
import { RichTextEditor } from './RichTextEditor'

interface PostsManagerProps {
  onBack: () => void
}

const emptyPost: PostInput = {
  type: 'news',
  title: '',
  slug: '',
  excerpt: null,
  body: '',
  category: null,
  checklist: [],
  coverMediaId: null,
  seoTitle: null,
  seoDescription: null,
  canonicalUrl: null,
  promotionStartAt: null,
  promotionEndAt: null,
  ctaLabel: null,
  ctaUrl: null,
  badgeText: null,
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function toInput(post: PostResponse): PostInput {
  return {
    type: post.type,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    category: post.category,
    checklist: post.checklist,
    coverMediaId: post.coverMediaId,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    canonicalUrl: post.canonicalUrl,
    promotionStartAt: post.promotionStartAt ? new Date(post.promotionStartAt) : null,
    promotionEndAt: post.promotionEndAt ? new Date(post.promotionEndAt) : null,
    ctaLabel: post.ctaLabel,
    ctaUrl: post.ctaUrl,
    badgeText: post.badgeText,
  }
}

export function PostsManager({ onBack }: PostsManagerProps) {
  const [posts, setPosts] = useState<PostResponse[]>([])
  const [images, setImages] = useState<MediaAsset[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<PostInput>(emptyPost)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadData = async () => {
    const [postResult, mediaResult] = await Promise.all([listPosts(), listMedia('image')])
    setPosts(postResult.items)
    setImages(mediaResult.items)
  }

  useEffect(() => {
    void loadData().catch(() => setMessage('Không thể tải danh sách bài viết.'))
  }, [])

  const patchForm = <Key extends keyof PostInput>(key: Key, value: PostInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const selectPost = (post: PostResponse) => {
    setSelectedId(post.id)
    setForm(toInput(post))
    setMessage('')
  }

  const newPost = () => {
    setSelectedId(null)
    setForm(emptyPost)
    setMessage('')
  }

  const savePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setMessage('')

    try {
      const result = selectedId ? await updatePost(selectedId, form) : await createPost(form)
      setSelectedId(result.item.id)
      setForm(toInput(result.item))
      await loadData()
      setMessage('Đã lưu bản nháp.')
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      setMessage(code === 'SLUG_EXISTS' ? 'Đường dẫn bài viết đã tồn tại.' : 'Không thể lưu bài viết.')
    } finally {
      setIsSaving(false)
    }
  }

  const changeStatus = async (action: 'publish' | 'archive') => {
    if (action === 'archive' && !selectedId) return
    setIsSaving(true)
    setMessage('')
    try {
      let result
      if (action === 'publish') {
        const saved = selectedId ? await updatePost(selectedId, form) : await createPost(form)
        setSelectedId(saved.item.id)
        result = await publishPost(saved.item.id)
      } else {
        result = await archivePost(selectedId!)
      }
      setForm(toInput(result.item))
      await loadData()
      setMessage(action === 'publish' ? 'Đã lưu và xuất bản bài viết.' : 'Bài viết đã được ẩn.')
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      setMessage(code === 'SLUG_EXISTS' ? 'Đường dẫn bài viết đã tồn tại.' : 'Không thể cập nhật trạng thái bài viết.')
    } finally {
      setIsSaving(false)
    }
  }

  const current = posts.find((post) => post.id === selectedId)

  return (
    <section className="admin-card content-manager">
      <button className="text-button" type="button" onClick={onBack}>← Tổng quan</button>
      <p className="admin-kicker">Nội dung website</p>
      <div className="manager-heading">
        <div>
          <h1>Bài viết</h1>
          <p>Tạo tin tức hoặc bài khuyến mãi, lưu nháp rồi xuất bản.</p>
        </div>
        <button className="secondary-button" type="button" onClick={newPost}>Bài viết mới</button>
      </div>

      <div className="content-manager-grid">
        <aside className="post-list" aria-label="Danh sách bài viết">
          {posts.length === 0 ? <p>Chưa có bài viết.</p> : null}
          {posts.map((post) => (
            <button className={post.id === selectedId ? 'is-active' : ''} key={post.id} type="button" onClick={() => selectPost(post)}>
              <strong>{post.title}</strong>
              <span>{post.type === 'promotion' ? 'Khuyến mãi' : 'Tin tức'} · {post.status}</span>
            </button>
          ))}
        </aside>

        <form className="post-form" onSubmit={savePost}>
          <div className="form-row">
            <label>
              Loại bài
              <select value={form.type} onChange={(event) => patchForm('type', event.target.value as PostInput['type'])}>
                <option value="news">Tin tức</option>
                <option value="promotion">Khuyến mãi</option>
              </select>
            </label>
            <label>
              Ảnh bìa
              <select value={form.coverMediaId ?? ''} onChange={(event) => patchForm('coverMediaId', event.target.value || null)}>
                <option value="">Không chọn</option>
                {images.map((image) => <option key={image.id} value={image.id}>{image.originalName}</option>)}
              </select>
            </label>
          </div>
          <label>
            Tiêu đề
            <input required maxLength={220} value={form.title} onChange={(event) => {
              const title = event.target.value
              setForm((currentForm) => ({
                ...currentForm,
                title,
                ...(!selectedId ? { slug: slugify(title) } : {}),
              }))
            }} />
          </label>
          <label>
            Đường dẫn
            <input required maxLength={180} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => patchForm('slug', slugify(event.target.value))} />
          </label>
          <label>
            Tóm tắt
            <textarea maxLength={600} rows={3} value={form.excerpt ?? ''} onChange={(event) => patchForm('excerpt', event.target.value || null)} />
          </label>
          <label>
            Chủ đề
            <input maxLength={120} placeholder="Ví dụ: Nhà hàng - Cafe" value={form.category ?? ''} onChange={(event) => patchForm('category', event.target.value || null)} />
          </label>
          <div className="rte-field">
            <span className="rte-label">Nội dung</span>
            <RichTextEditor value={form.body} placeholder="Soạn nội dung bài viết..." onChange={(html) => patchForm('body', html)} />
          </div>
          <label>
            Checklist / điểm nổi bật (mỗi dòng một mục)
            <textarea rows={5} value={form.checklist.join('\n')} onChange={(event) => patchForm('checklist', event.target.value.split('\n').map((item) => item.trim()).filter(Boolean))} />
          </label>
          <div className="form-row">
            <label>
              SEO title
              <input maxLength={70} value={form.seoTitle ?? ''} onChange={(event) => patchForm('seoTitle', event.target.value || null)} />
            </label>
            <label>
              SEO description
              <input maxLength={180} value={form.seoDescription ?? ''} onChange={(event) => patchForm('seoDescription', event.target.value || null)} />
            </label>
          </div>
          {message ? <p role="status">{message}</p> : null}
          <div className="post-actions">
            <button disabled={isSaving} type="submit">{isSaving ? 'Đang lưu...' : 'Lưu nháp'}</button>
            <button className="publish-button" disabled={isSaving || !form.title || !form.slug || !form.body} type="button" onClick={() => void changeStatus('publish')}>{isSaving ? 'Đang xử lý...' : 'Lưu & xuất bản'}</button>
            {selectedId && current?.status === 'published' ? <button className="secondary-button" disabled={isSaving} type="button" onClick={() => void changeStatus('archive')}>Ẩn bài</button> : null}
          </div>
        </form>
      </div>
    </section>
  )
}
