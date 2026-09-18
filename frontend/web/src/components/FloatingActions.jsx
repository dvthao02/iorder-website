import { Mail, MessageCircle, Phone, X } from 'lucide-react'
import { useState } from 'react'
import facebookIcon from '../assets/misc/logo-facebook.png'
import zaloIcon from '../assets/misc/zalo-96.png'
import { externalLinks } from '../data/siteContent'
import { useSiteContact } from '../utils/useSiteContact'

export default function FloatingActions() {
  // Hotline/email từ CMS — đồng bộ với Footer và trang Liên hệ.
  const contactInfo = useSiteContact()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <aside className={`floating-actions ${isOpen ? 'is-open' : ''}`} aria-label="Liên hệ nhanh">
      <div id="floating-contact-menu" className="floating-contact-menu">
        <a className="floating-action hotline" href={contactInfo.phoneHref} onClick={() => setIsOpen(false)}>
          <span className="floating-action-icon" aria-hidden="true">
            <Phone size={18} />
          </span>
          <span>
            <strong>Gọi tư vấn</strong>
            <small>{contactInfo.phoneDisplay}</small>
          </span>
        </a>

        <a className="floating-action zalo" href={externalLinks.zalo} target="_blank" rel="noreferrer">
          <span className="floating-action-icon" aria-hidden="true">
            <img src={zaloIcon} alt="" loading="lazy" decoding="async" />
          </span>
          <span>
            <strong>Zalo OA</strong>
            <small>Nhắn tin cùng iOrder</small>
          </span>
        </a>

        <a
          className="floating-action gmail"
          href={`mailto:${contactInfo.salesEmail}?subject=Li%C3%AAn%20h%E1%BB%87%20t%E1%BB%AB%20webiorder`}
        >
          <span className="floating-action-icon" aria-hidden="true">
            <Mail size={18} />
          </span>
          <span>
            <strong>Gửi email</strong>
            <small>{contactInfo.salesEmail}</small>
          </span>
        </a>

        <a className="floating-action facebook" href={externalLinks.facebook} target="_blank" rel="noreferrer">
          <span className="floating-action-icon" aria-hidden="true">
            <img src={facebookIcon} alt="" loading="lazy" decoding="async" />
          </span>
          <span>
            <strong>Facebook</strong>
            <small>Theo dõi iOrder</small>
          </span>
        </a>
      </div>

      <button
        type="button"
        className="floating-toggle"
        aria-controls="floating-contact-menu"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Đóng liên hệ nhanh' : 'Mở liên hệ nhanh'}
        onClick={() => setIsOpen((value) => !value)}
      >
        {isOpen ? <X size={21} /> : <MessageCircle size={21} />}
      </button>
    </aside>
  )
}
