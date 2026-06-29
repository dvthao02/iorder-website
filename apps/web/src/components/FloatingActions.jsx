import { Mail, Phone } from 'lucide-react'
import facebookIcon from '../assets/misc/logo-facebook.png'
import zaloIcon from '../assets/misc/zalo-96.png'
import { contactInfo, externalLinks } from '../data/siteContent'

export default function FloatingActions() {
  return (
    <div className="floating-actions" aria-hidden="false">
      <a
        className="floating-action facebook"
        href={externalLinks.facebook}
        target="_blank"
        rel="noreferrer"
      >
        <span className="floating-action-icon" aria-hidden="true">
          <img src={facebookIcon} alt="Facebook" loading="lazy" decoding="async" />
        </span>
        <span>Facebook iOrder</span>
      </a>

      <a
        className="floating-action gmail"
        href={`mailto:${contactInfo.salesEmail}?subject=Li%C3%AAn%20h%E1%BB%87%20t%E1%BB%AB%20webiorder`}
        target="_blank"
        rel="noreferrer"
      >
        <span className="floating-action-icon" aria-hidden="true">
          <Mail size={18} />
        </span>
        <span>{"G\u1eedi email"}</span>
      </a>

      <a
        className="floating-action zalo"
        href={externalLinks.zalo}
        target="_blank"
        rel="noreferrer"
      >
        <span className="floating-action-icon" aria-hidden="true">
          <img src={zaloIcon} alt="Zalo" loading="lazy" decoding="async" />
        </span>
        <span>{"Zalo OA - ho\u1eb7c g\u1eedi email"}</span>
      </a>

      <a className="floating-action hotline" href={contactInfo.phoneHref}>
        <span className="floating-action-icon" aria-hidden="true">
          <Phone size={18} />
        </span>
        <span>Hotline {contactInfo.phoneDisplay}</span>
      </a>
    </div>
  )
}
