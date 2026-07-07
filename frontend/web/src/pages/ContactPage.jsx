import { useState, useEffect } from 'react'
import { CheckCircle, Clock, Mail, MapPin, Phone } from 'lucide-react'
import PageLayout from '../components/PageLayout'
import { setPageSeo } from '../utils/seo'
import { submitContactLead } from '../utils/contentApi'
import { useSiteContact } from '../utils/useSiteContact'

const consultationChecklist = [
  'Danh sách sản phẩm, menu hoặc dịch vụ đang bán',
  'Số lượng chi nhánh, quầy thu ngân, bàn/phòng nếu có',
  'Thiết bị hiện có: máy in, máy quét mã vạch, tablet, máy POS',
  'Quy trình bán hàng hiện tại và điểm đang muốn tối ưu',
]

export default function ContactPage() {
  // Thông tin liên hệ từ CMS (Cài đặt website), fallback data tĩnh khi API lỗi.
  const contactInfo = useSiteContact()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    businessModel: '',
    branches: '',
    need: '',
    message: '',
    website: '',
  })
  const [submitState, setSubmitState] = useState('idle')
  const [submitMessage, setSubmitMessage] = useState('')

  useEffect(() => {
    setPageSeo({
      title: 'Liên hệ tư vấn iOrder',
      description:
        'Gửi thông tin để iOrder tư vấn phần mềm bán hàng, order tại bàn, quản lý kho, thiết bị POS và quy trình triển khai phù hợp với cửa hàng.',
    })
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const mailtoHref = () => {
    const subject = 'Yêu cầu tư vấn iOrder từ website'
    const body = [
      'Thông tin khách cần tư vấn:',
      `Họ tên: ${formData.name}`,
      `Số điện thoại: ${formData.phone}`,
      `Email: ${formData.email || 'Chưa cung cấp'}`,
      `Mô hình kinh doanh: ${formData.businessModel}`,
      `Số chi nhánh/quầy: ${formData.branches || 'Chưa cung cấp'}`,
      `Nhu cầu chính: ${formData.need || 'Chưa chọn'}`,
      '',
      'Mô tả thêm:',
      formData.message || 'Chưa cung cấp',
    ].join('\n')
    return `mailto:${contactInfo.salesEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitState('submitting')
    setSubmitMessage('')
    try {
      await submitContactLead({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        businessModel: formData.businessModel || undefined,
        branches: formData.branches || undefined,
        need: formData.need || undefined,
        message: formData.message || undefined,
        website: formData.website || undefined,
      })
      setSubmitState('success')
      setSubmitMessage('Đã gửi thông tin tư vấn thành công. iOrder sẽ liên hệ lại sớm nhất.')
      setFormData({
        name: '',
        phone: '',
        email: '',
        businessModel: '',
        branches: '',
        need: '',
        message: '',
        website: '',
      })
    } catch {
      setSubmitState('error')
      setSubmitMessage(
        `Không thể gửi thông tin lúc này. Vui lòng thử lại hoặc gửi trực tiếp tới ${contactInfo.salesEmail}.`,
      )
    }
  }

  return (
    <PageLayout>
      <section className="contact-hero">
        <div className="container contact-hero-grid">
          <div>
            <span className="listing-kicker">Tư vấn triển khai</span>
            <h1 className="contact-hero-title">Liên hệ iOrder để cấu hình đúng mô hình cửa hàng</h1>
            <p className="contact-hero-lead">
              Gửi thông tin cơ bản về mô hình kinh doanh, số chi nhánh và nhu cầu vận hành. iOrder sẽ tư vấn gói triển
              khai, thiết bị và quy trình phù hợp.
            </p>
          </div>
          <div className="contact-hero-card">
            <strong>Phản hồi nhanh trong giờ làm việc</strong>
            <span>Hotline, email, Zalo và hỗ trợ từ xa khi cần kiểm tra thiết bị.</span>
          </div>
        </div>
      </section>

      <section className="contact-section">
        <div className="container">
          <div className="contact-grid">
            <div>
              <h2 className="contact-section-title">Thông tin tư vấn</h2>
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="contact-form-grid">
                  <div className="contact-field">
                    <label>
                      Họ tên <span>*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="contact-input"
                      placeholder="Nhập họ tên"
                    />
                  </div>

                  <div className="contact-field">
                    <label>
                      Số điện thoại <span>*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="contact-input"
                      placeholder="090..."
                    />
                  </div>

                  <div className="contact-field">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="contact-input"
                      placeholder="example@email.com"
                    />
                  </div>

                  <div className="contact-field">
                    <label>
                      Mô hình kinh doanh <span>*</span>
                    </label>
                    <select
                      name="businessModel"
                      value={formData.businessModel}
                      onChange={handleChange}
                      required
                      className="contact-input"
                    >
                      <option value="">Chọn mô hình</option>
                      <option>Nhà hàng</option>
                      <option>Quán cafe / trà sữa</option>
                      <option>Cửa hàng bán lẻ</option>
                      <option>Mini mart / tạp hóa</option>
                      <option>Chuỗi nhiều chi nhánh</option>
                      <option>Mô hình khác</option>
                    </select>
                  </div>

                  <div className="contact-field">
                    <label>Số chi nhánh/quầy</label>
                    <input
                      type="text"
                      name="branches"
                      value={formData.branches}
                      onChange={handleChange}
                      className="contact-input"
                      placeholder="Ví dụ: 1 chi nhánh, 2 quầy thu ngân"
                    />
                  </div>

                  <div className="contact-field">
                    <label>Nhu cầu chính</label>
                    <select name="need" value={formData.need} onChange={handleChange} className="contact-input">
                      <option value="">Chọn nhu cầu</option>
                      <option>POS bán hàng tại quầy</option>
                      <option>Order tại bàn, in bếp/bar</option>
                      <option>Quản lý kho</option>
                      <option>Báo cáo doanh thu</option>
                      <option>Đồng bộ nhiều chi nhánh</option>
                      <option>Cần tư vấn tổng thể</option>
                    </select>
                  </div>
                </div>

                <div className="contact-field">
                  <label>Mô tả thêm</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    className="contact-textarea"
                    placeholder="Ví dụ: cần setup menu, máy in bếp, báo cáo doanh thu theo ca..."
                  />
                </div>

                {/* Honeypot chống spam: ẩn thực sự khỏi người dùng, chỉ bot mới điền vào field này. */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    width: 1,
                    height: 1,
                    overflow: 'hidden',
                    clip: 'rect(0 0 0 0)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <label htmlFor="website">Website</label>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    autoComplete="off"
                    tabIndex={-1}
                  />
                </div>

                <div className="contact-submit-row">
                  <button type="submit" className="contact-submit" disabled={submitState === 'submitting'}>
                    {submitState === 'submitting' ? 'Đang gửi...' : 'Gửi thông tin tư vấn'}
                  </button>
                  <a className="contact-mailto-fallback" href={mailtoHref()}>
                    hoặc gửi email trực tiếp
                  </a>
                </div>

                {submitMessage ? (
                  <p
                    className={`contact-form-status ${submitState === 'success' ? 'is-success' : ''} ${submitState === 'error' ? 'is-error' : ''}`}
                    role="status"
                  >
                    {submitMessage}
                  </p>
                ) : null}
              </form>
            </div>

            <div>
              <h2 className="contact-section-title">Kênh liên hệ</h2>
              <div className="contact-info-list">
                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3>Hotline</h3>
                    <p>
                      <a href={contactInfo.phoneHref}>{contactInfo.phoneDisplay}</a>
                    </p>
                    <p className="contact-info-note">{contactInfo.workingHours}</p>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3>Email</h3>
                    <p>
                      <a href={`mailto:${contactInfo.salesEmail}`}>{contactInfo.salesEmail}</a>
                    </p>
                    <p className="contact-info-note">Tiếp nhận yêu cầu tư vấn và triển khai</p>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3>Địa chỉ</h3>
                    <p>{contactInfo.address}</p>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3>Giờ làm việc</h3>
                    <p>{contactInfo.workingHours}</p>
                  </div>
                </div>
              </div>

              <div className="contact-checklist">
                <h3>Cần chuẩn bị trước khi tư vấn</h3>
                {consultationChecklist.map((item) => (
                  <div key={item} className="contact-checklist-item">
                    <CheckCircle size={18} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
