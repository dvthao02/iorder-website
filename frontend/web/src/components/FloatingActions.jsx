import {
  ArrowUp,
  Mail,
  MessageCircle,
  Phone,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import facebookIcon from '../assets/misc/logo-facebook.png'
import zaloIcon from '../assets/misc/zalo-96.png'

import { externalLinks } from '../data/siteContent'
import { useSiteContact } from '../utils/useSiteContact'

export default function FloatingActions() {
  const contactInfo = useSiteContact()

  const [isOpen, setIsOpen] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)

  /**
   * Hiện nút "Lên đầu trang" sau khi scroll > 480px.
   */
  useEffect(() => {
    const syncScrollState = () => {
      setShowBackToTop(window.scrollY > 480)
    }

    syncScrollState()

    window.addEventListener('scroll', syncScrollState, {
      passive: true,
    })

    return () => {
      window.removeEventListener('scroll', syncScrollState)
    }
  }, [])

  /**
   * Scroll mượt lên đầu trang.
   */
  const handleBackToTop = () => {
    setIsOpen(false)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  /**
   * Đóng menu sau khi click một action.
   */
  const handleActionClick = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* =====================================================
          FLOATING CONTACT — RIGHT
          ===================================================== */}

      <aside
        className={`floating-actions ${isOpen ? 'is-open' : ''}`}
        aria-label="Liên hệ nhanh"
      >
        {/* ===================================================
            CONTACT MENU
            =================================================== */}

        <div
          id="floating-contact-menu"
          className="floating-contact-menu"
          aria-hidden={!isOpen}
        >
          {/* Hotline */}

          <a
            className="floating-action hotline"
            href={contactInfo.phoneHref}
            aria-label={`Gọi tư vấn ${contactInfo.phoneDisplay}`}
            tabIndex={isOpen ? 0 : -1}
            onClick={handleActionClick}
          >
            <span className="floating-tooltip">
              <strong>Gọi tư vấn</strong>

              <small>
                {contactInfo.phoneDisplay}
              </small>
            </span>

            <span
              className="floating-action-icon"
              aria-hidden="true"
            >
              <Phone size={20} />
            </span>
          </a>

          {/* Zalo */}

          <a
            className="floating-action zalo"
            href={externalLinks.zalo}
            target="_blank"
            rel="noreferrer"
            aria-label="Zalo OA — Nhắn tin cùng iOrder"
            tabIndex={isOpen ? 0 : -1}
            onClick={handleActionClick}
          >
            <span className="floating-tooltip">
              <strong>Zalo OA</strong>

              <small>
                Nhắn tin cùng iOrder
              </small>
            </span>

            <span
              className="floating-action-icon"
              aria-hidden="true"
            >
              <img
                src={zaloIcon}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </span>
          </a>

          {/* Email */}

          <a
            className="floating-action gmail"
            href={`mailto:${contactInfo.salesEmail}?subject=Li%C3%AAn%20h%E1%BB%87%20t%E1%BB%AB%20webiorder`}
            aria-label={`Gửi email ${contactInfo.salesEmail}`}
            tabIndex={isOpen ? 0 : -1}
            onClick={handleActionClick}
          >
            <span className="floating-tooltip">
              <strong>Gửi email</strong>

              <small>
                {contactInfo.salesEmail}
              </small>
            </span>

            <span
              className="floating-action-icon"
              aria-hidden="true"
            >
              <Mail size={20} />
            </span>
          </a>

          {/* Facebook */}

          <a
            className="floating-action facebook"
            href={externalLinks.facebook}
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook — Theo dõi iOrder"
            tabIndex={isOpen ? 0 : -1}
            onClick={handleActionClick}
          >
            <span className="floating-tooltip">
              <strong>Facebook</strong>

              <small>
                Theo dõi iOrder
              </small>
            </span>

            <span
              className="floating-action-icon"
              aria-hidden="true"
            >
              <img
                src={facebookIcon}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </span>
          </a>
        </div>

        {/* ===================================================
            MAIN CHAT BUTTON
            =================================================== */}

        <button
          type="button"
          className="floating-toggle"
          aria-controls="floating-contact-menu"
          aria-expanded={isOpen}
          aria-label={
            isOpen
              ? 'Đóng liên hệ nhanh'
              : 'Mở liên hệ nhanh'
          }
          onClick={() => {
            setIsOpen((value) => !value)
          }}
        >
          <span
            className="floating-toggle-icon"
            aria-hidden="true"
          >
            {isOpen ? (
              <X size={21} />
            ) : (
              <MessageCircle size={21} />
            )}
          </span>

          <span
            className="floating-toggle-tooltip"
            aria-hidden="true"
          >
            {isOpen
              ? 'Đóng'
              : 'Liên hệ iOrder'}
          </span>
        </button>
      </aside>

      {/* =====================================================
          BACK TO TOP — LEFT
          ===================================================== */}

      <button
        type="button"
        className={`floating-back-to-top ${
          showBackToTop ? 'is-visible' : ''
        }`}
        aria-label="Lên đầu trang"
        title="Lên đầu trang"
        tabIndex={showBackToTop ? 0 : -1}
        onClick={handleBackToTop}
      >
        <ArrowUp size={20} />
      </button>
    </>
  )
}