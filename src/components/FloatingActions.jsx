import { Mail, Phone } from 'lucide-react'
import facebookIcon from '../assets/misc/logo-facebook.png'
import zaloIcon from '../assets/misc/zalo-96.png'

export default function FloatingActions() {
  return (
    <div className="floating-actions" aria-hidden="false">
      <a
        className="floating-action facebook"
        href="https://www.facebook.com/iorder.phanmemquanlybanhang"
        target="_blank"
        rel="noreferrer"
      >
        <span className="floating-action-icon" aria-hidden="true">
          <img src={facebookIcon} alt="Facebook" />
        </span>
        <span>Facebook iOrder</span>
      </a>

      <a
        className="floating-action gmail"
        href="mailto:contact@iorder.vn?subject=Li%C3%AAn%20h%E1%BB%87%20t%E1%BB%AB%20webiorder"
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
        href="https://zalo.me/202942984074069074"
        target="_blank"
        rel="noreferrer"
      >
        <span className="floating-action-icon" aria-hidden="true">
          <img src={zaloIcon} alt="Zalo" />
        </span>
        <span>{"Zalo OA - ho\u1eb7c g\u1eedi email"}</span>
      </a>

      <a className="floating-action hotline" href="tel:02871073999">
        <span className="floating-action-icon" aria-hidden="true">
          <Phone size={18} />
        </span>
        <span>Hotline 028 710 73 999</span>
      </a>
    </div>
  )
}
