import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle,
  Download,
  FileSpreadsheet,
  MonitorDown,
  Printer,
  ShieldCheck,
} from 'lucide-react'
import PageLayout from '../components/PageLayout'
import { setPageSeo } from '../utils/seo'

const downloads = [
  {
    icon: MonitorDown,
    title: 'iOrder Remote Support',
    description: 'Công cụ hỗ trợ kỹ thuật từ xa khi cần cài đặt, kiểm tra máy in hoặc xử lý sự cố.',
    meta: 'Windows / Hỗ trợ từ xa',
    file: '/downloads/iorder-remote-support.txt',
  },
  {
    icon: Printer,
    title: 'iOrder Printer Setup',
    description: 'Tài liệu cấu hình máy in hóa đơn, máy in bếp/bar và kiểm tra lệnh in thử.',
    meta: 'Máy in / Thiết bị bán hàng',
    file: '/downloads/iorder-printer-setup-guide.txt',
  },
  {
    icon: FileSpreadsheet,
    title: 'Mẫu nhập dữ liệu ban đầu',
    description: 'File mẫu để chuẩn bị danh mục sản phẩm, nhóm hàng, giá bán và tồn kho ban đầu.',
    meta: 'Import dữ liệu',
    file: '/downloads/iorder-import-template.txt',
  },
  {
    icon: ShieldCheck,
    title: 'Checklist triển khai iOrder',
    description: 'Danh sách việc cần chuẩn bị trước khi đưa iOrder vào vận hành tại cửa hàng.',
    meta: 'Triển khai / Vận hành',
    file: '/downloads/iorder-pos-setup-checklist.txt',
  },
]

const setupNotes = [
  'Tải đúng công cụ theo nhu cầu cài đặt hoặc hỗ trợ.',
  'Mở file hướng dẫn trước khi kết nối máy in hoặc nhập dữ liệu.',
  'Liên hệ iOrder nếu cần bộ cài riêng theo thiết bị hoặc mô hình vận hành.',
]

export default function ToolsDownloadPage() {
  useEffect(() => {
    setPageSeo({
      title: 'Tải công cụ iOrder - Hỗ trợ',
      description: 'Tải tài liệu hỗ trợ cài đặt, cấu hình thiết bị, nhập dữ liệu và triển khai vận hành iOrder cho cửa hàng.',
    })
  }, [])

  return (
    <PageLayout>
        <section className="detail-hero tools-download-hero">
          <div className="container tools-hero-grid">
            <div>
              <span className="tools-kicker">Hỗ trợ cài đặt</span>
              <h1 className="detail-title">Tải công cụ iOrder</h1>
              <p className="detail-summary">
                Tổng hợp các file hỗ trợ cài đặt, cấu hình thiết bị, nhập dữ liệu và triển khai vận hành iOrder cho cửa hàng.
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

            <div className="tools-download-grid">
              {downloads.map((item) => {
                const Icon = item.icon
                return (
                  <article key={item.title} className="tools-download-card">
                    <div className="tools-download-icon">
                      <Icon size={30} />
                    </div>
                    <span>{item.meta}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <a href={item.file} download className="btn primary tools-download-button">
                      <Download size={18} />
                      <span>Tải xuống</span>
                    </a>
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
                Một số bộ cài hoặc driver thiết bị sẽ phụ thuộc máy in, hệ điều hành và mô hình triển khai. Gửi yêu cầu để iOrder cấp đúng file.
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
