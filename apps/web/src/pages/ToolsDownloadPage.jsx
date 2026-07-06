import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle,
  Download,
  FileSpreadsheet,
  FileText,
  MonitorDown,
  Package,
  Printer,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import PageLayout from '../components/PageLayout'
import { setPageSeo } from '../utils/seo'
import { fetchDownloads } from '../utils/contentApi'

const ICON_MAP = {
  download: Download,
  'monitor-down': MonitorDown,
  printer: Printer,
  'file-spreadsheet': FileSpreadsheet,
  'file-text': FileText,
  'shield-check': ShieldCheck,
  package: Package,
  smartphone: Smartphone,
}

const setupNotes = [
  'Tải đúng công cụ theo nhu cầu cài đặt hoặc hỗ trợ.',
  'Mở file hướng dẫn trước khi kết nối máy in hoặc nhập dữ liệu.',
  'Liên hệ iOrder nếu cần bộ cài riêng theo thiết bị hoặc mô hình vận hành.',
]

export default function ToolsDownloadPage() {
  const [downloads, setDownloads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setPageSeo({
      title: 'Tải công cụ iOrder - Hỗ trợ',
      description:
        'Tải tài liệu hỗ trợ cài đặt, cấu hình thiết bị, nhập dữ liệu và triển khai vận hành iOrder cho cửa hàng.',
    })
  }, [])

  useEffect(() => {
    fetchDownloads()
      .then(setDownloads)
      .catch(() => setDownloads([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageLayout>
      <section className="detail-hero tools-download-hero">
        <div className="container tools-hero-grid">
          <div>
            <span className="tools-kicker">Hỗ trợ cài đặt</span>
            <h1 className="detail-title">Tải công cụ iOrder</h1>
            <p className="detail-summary">
              Tổng hợp các file hỗ trợ cài đặt, cấu hình thiết bị, nhập dữ liệu và triển khai vận hành iOrder cho cửa
              hàng.
            </p>
          </div>
          <div className="tools-hero-card">
            <Download size={34} />
            <strong>Kho file hỗ trợ</strong>
            <p>Tài liệu hỗ trợ cài đặt, thiết bị và dữ liệu ban đầu cho đội vận hành.</p>
          </div>
        </div>
      </section>

      <section className="detail-section tools-download-section">
        <div className="container">
          <div className="tools-section-head">
            <div>
              <span className="tools-kicker">Download</span>
              <h2>Các file thường dùng</h2>
            </div>
            <p>Chọn file phù hợp rồi tải xuống để chuẩn bị trước khi đội kỹ thuật iOrder hỗ trợ.</p>
          </div>

          {loading ? <p className="muted">Đang tải danh sách...</p> : null}
          {!loading && downloads.length === 0 ? <p className="muted">Chưa có file hỗ trợ nào được đăng.</p> : null}

          <div className="tools-download-grid">
            {downloads.map((item) => {
              const Icon = ICON_MAP[item.icon] ?? Download
              return (
                <article key={item.id} className="tools-download-card">
                  <div className="tools-download-icon">
                    <Icon size={30} />
                  </div>
                  {item.meta ? <span>{item.meta}</span> : null}
                  <h3>{item.title}</h3>
                  {item.description ? <p>{item.description}</p> : null}
                  {item.fileUrl ? (
                    <a href={item.fileUrl} download className="btn primary tools-download-button">
                      <Download size={18} />
                      <span>Tải xuống</span>
                    </a>
                  ) : null}
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="detail-section tools-note-section">
        <div className="container tools-note-grid">
          <div className="detail-card">
            <h2>Lưu ý trước khi tải</h2>
            <div className="detail-list">
              {setupNotes.map((note) => (
                <div key={note} className="detail-list-item">
                  <CheckCircle size={22} />
                  <p>{note}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="tools-contact-panel">
            <h2>Cần file cài đặt riêng?</h2>
            <p>
              Một số bộ cài hoặc driver thiết bị sẽ phụ thuộc máy in, hệ điều hành và mô hình triển khai. Gửi yêu cầu để
              iOrder cấp đúng file.
            </p>
            <Link to="/lien-he" className="btn large primary">
              <span>Liên hệ hỗ trợ</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
