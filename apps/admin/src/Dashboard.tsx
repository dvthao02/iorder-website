import { useEffect, useState } from 'react'

import { getHomepage, listMedia, listPosts } from './api'

export function Dashboard({ onOpen }: { onOpen: (module: string) => void }) {
  const [stats, setStats] = useState({ posts: 0, media: 0, homepage: 'Chưa cấu hình' })

  useEffect(() => {
    Promise.all([listPosts(), listMedia(), getHomepage()]).then(([posts, media, homepage]) => {
      setStats({ posts: posts.total, media: media.total, homepage: homepage.item?.status ?? 'draft' })
    }).catch(() => undefined)
  }, [])

  return <section className="dashboard-page">
    <div className="page-heading">
      <div><p className="admin-kicker">Tổng quan nội dung</p><h1>Quản trị website iOrder</h1><p>Chọn công việc cần làm, không cần thao tác trực tiếp với database.</p></div>
      <a className="secondary-button site-preview-link" href="http://127.0.0.1:5173/" rel="noreferrer" target="_blank">Xem website</a>
    </div>
    <div className="stats-grid">
      <button type="button" onClick={() => onOpen('homepage')}><span>Trang chủ</span><strong>{stats.homepage}</strong><small>Sửa banner, section và nội dung nổi bật</small></button>
      <button type="button" onClick={() => onOpen('posts')}><span>Bài viết</span><strong>{stats.posts}</strong><small>Tạo bài, xuất bản và đưa lên trang chủ</small></button>
      <button type="button" onClick={() => onOpen('media')}><span>Thư viện</span><strong>{stats.media}</strong><small>Ảnh và tài liệu đang quản lý</small></button>
    </div>
    <div className="workflow-panel">
      <h2>Quy trình đăng nội dung</h2>
      <ol><li>Tải ảnh bìa lên Thư viện.</li><li>Tạo bài viết và lưu nháp.</li><li>Kiểm tra nội dung rồi bấm Xuất bản.</li><li>Block “Bài viết” trên trang chủ tự lấy các bài đã xuất bản.</li></ol>
    </div>
  </section>
}
