import zaloIcon from '../assets/misc/zalo-96.png'
import { Phone, Mail } from 'lucide-react'

export default function FloatingActions() {
  return (
    <div className="floating-actions" aria-hidden="false">
      <a className={`floating-action gmail`} href="mailto:contact@iorder.vn?subject=Liên%20hệ%20từ%20webiorder" target="_blank" rel="noreferrer">
        <span className={`floating-action-icon`} aria-hidden="true">
          <Mail size={18} />
        </span>
        <span>Gửi email</span>
      </a>

      <a className={`floating-action zalo`} href="https://zalo.me/202942984074069074" target="_blank" rel="noreferrer">
        <span className={`floating-action-icon`} aria-hidden="true">
          <img src={zaloIcon} alt="Zalo" />
        </span>
        <span>Zalo OA — hoặc gửi email</span>
      </a>

      <a className={`floating-action hotline`} href="tel:02871073999">
        <span className={`floating-action-icon`} aria-hidden="true">
          <Phone size={18} />
        </span>
        <span>Hotline 028 710 73 999</span>
      </a>
    </div>
  )
}
