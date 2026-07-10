import { Link } from 'react-router-dom'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import FloatingActions from './FloatingActions'
import { useSiteContact } from '../utils/useSiteContact'

export default function Footer({ logoFooter }) {
  // Thông tin liên hệ đọc từ CMS (Cài đặt website) — sửa trong admin là footer đổi theo.
  const contactInfo = useSiteContact()
  const dmcaUrl =
    'https://www.dmca.com/Protection/Status.aspx?ID=55ed00a2-083d-43ee-ac48-18341d415669&refurl=https://iorder.vn/'

  const productLinks = [
    {
      title: 'Ph\u1ea7n m\u1ec1m qu\u1ea3n l\u00fd b\u00e1n h\u00e0ng - iOrder',
      path: '/phan-mem/quan-ly-ban-hang-iorder',
    },
    {
      title: 'Ph\u1ea7n m\u1ec1m qu\u1ea3n l\u00fd tr\u01b0\u1eddng m\u1ea7m non - MimiEdu',
      path: '/phan-mem/quan-ly-truong-mam-non-mimiedu',
    },
    {
      title: 'Ph\u1ea7n m\u1ec1m \u0111\u1ed3ng b\u1ed9 d\u1eef li\u1ec7u iOrder RPA',
      path: '/phan-mem/dong-bo-du-lieu-iorder-rpa',
    },
    {
      title: 'Ph\u1ea7n m\u1ec1m qu\u1ea3n l\u00fd tr\u1ea1m s\u1ea1c xe \u0111i\u1ec7n',
      path: '/phan-mem/quan-ly-tram-sac-xe-dien',
    },
    {
      title: 'Ph\u1ea7n m\u1ec1m qu\u1ea3n l\u00fd v\u1eadn t\u1ea3i',
      path: '/phan-mem/quan-ly-van-tai',
    },
    {
      title: 'H\u00f3a \u0111\u01a1n \u0111i\u1ec7n t\u1eed - Ch\u1eef k\u00fd s\u1ed1',
      path: '/phan-mem/hoa-don-dien-tu-chu-ky-so',
    },
  ]

  const solutionLinks = [
    {
      title: 'H\u1ea1 t\u1ea7ng m\u1ea1ng, Wifi v\u00e0 camera',
      path: '/giai-phap/ha-tang/mang-wifi-camera',
    },
    {
      title: 'C\u00e2n b\u1eb1ng t\u1ea3i Internet, HA v\u00e0 b\u1ea3o m\u1eadt',
      path: '/giai-phap/ha-tang/can-bang-tai-ha-bao-mat',
    },
    {
      title: 'H\u1ec7 th\u1ed1ng data center',
      path: '/giai-phap/ha-tang/data-center',
    },
    {
      title: 'M\u00e1y ch\u1ee7, Proxy, Web/Mail/File server',
      path: '/giai-phap/ha-tang/may-chu-server',
    },
    {
      title: 'Ki\u1ec3m so\u00e1t ra v\u00e0o, ch\u1ea5m c\u00f4ng',
      path: '/giai-phap/ha-tang/kiem-soat-ra-vao-cham-cong',
    },
  ]

  const serviceLinks = [
    {
      title: 'Thi c\u00f4ng m\u1ea1ng, Wifi, Camera',
      path: '/dich-vu/dich-vu-cntt/thi-cong-mang-wifi-camera',
    },
    {
      title: 'B\u1ea3o tr\u00ec v\u00e0 x\u1eed l\u00fd s\u1ef1 c\u1ed1 IT',
      path: '/dich-vu/dich-vu-cntt/bao-tri-it',
    },
    {
      title: 'T\u00ean mi\u1ec1n, hosting, website',
      path: '/dich-vu/dich-vu-cntt/hosting-website',
    },
    {
      title: 'Ch\u1eef k\u00fd s\u1ed1, h\u00f3a \u0111\u01a1n \u0111i\u1ec7n t\u1eed',
      path: '/dich-vu/dich-vu-cntt/chu-ky-so-hoa-don-dien-tu',
    },
  ]

  const supportLinks = [
    { title: 'H\u01b0\u1edbng d\u1eabn s\u1eed d\u1ee5ng', path: '/huong-dan' },
    { title: 'C\u00e2u h\u1ecfi th\u01b0\u1eddng g\u1eb7p', path: '/faq' },
    { title: 'H\u1ed7 tr\u1ee3 t\u1eeb xa', path: '/ho-tro-tu-xa' },
    { title: 'Li\u00ean h\u1ec7 h\u1ed7 tr\u1ee3', path: '/lien-he' },
  ]

  const companyLinks = [
    { title: 'V\u1ec1 iOrder', path: '/gioi-thieu' },
    { title: 'Tin t\u1ee9c', path: '/tin-tuc' },
  ]
  const FOOTER_STYLES = `
/* =========================
   iOrder Compact Premium Footer
========================= */
html,
body,
#root {
  min-height: 100%;
}

body {
  margin: 0;
}

#root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

.footer {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 8% 10%, rgba(11, 142, 220, 0.07), transparent 28%),
    radial-gradient(circle at 88% 15%, rgba(36, 198, 220, 0.07), transparent 30%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 52%, #eef7ff 100%);
  border-top: 1px solid rgba(226, 232, 240, 0.9);
  color: #334155;
}

.footer::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
  background-size: 54px 54px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.25), transparent 70%);
}

.footer-main {
  position: relative;
  z-index: 1;
  padding: 36px 0 16px;
}

.footer-container {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 20px;
  align-items: start;
}

.footer-brand {
  min-width: 0;
}

.footer-logo {
  display: inline-flex;
  align-items: center;
  margin-bottom: 12px;
  text-decoration: none;
}

.footer-logo img {
  display: block;
  width: auto;
  height: 22px;
  max-width: 175px;
  object-fit: contain;
}

.footer-desc {
  max-width: 355px;
  margin: 0 0 14px;
  color: #475467;
  font-size: 14.5px;
  font-weight: 500;
  line-height: 1.6;
}

.footer-contact-list {
  display: grid;
  gap: 8px;
}

.footer-contact-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #475467;
  font-size: 14px;
  font-weight: 560;
  line-height: 1.42;
  text-decoration: none;
  transition:
    color 0.18s ease,
    transform 0.18s ease;
}

.footer-contact-item svg {
  flex: 0 0 auto;
  margin-top: 1px;
  color: #0b8edc;
}

.footer-contact-item:hover {
  color: #0669a8;
  transform: translateX(2px);
}

.footer-column h3 {
  margin: 0 0 12px;
  color: #101828;
  font-size: 14px;
  font-weight: 850;
  line-height: 1.2;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.footer-links {
  display: grid;
  gap: 8px;
}

.footer-links a {
  position: relative;
  width: fit-content;
  max-width: 100%;
  color: #475467;
  font-size: 13.5px;
  font-weight: 560;
  line-height: 1.45;
  text-decoration: none;
  transition:
    color 0.18s ease,
    transform 0.18s ease;
}

.footer-links a::after {
  content: '';
  position: absolute;
  left: 0;
  right: 100%;
  bottom: -4px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, #0b8edc, #24c6dc);
  transition: right 0.18s ease;
}

.footer-links a:hover {
  color: #0669a8;
  transform: translateX(2px);
}

.footer-links a:hover::after {
  right: 0;
}

.footer-company-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 16px;
  padding: 12px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.74);
  box-shadow:
    0 12px 30px rgba(15, 23, 42, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.footer-company-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  border-radius: 11px;
  color: #0b8edc;
  background: rgba(11, 142, 220, 0.1);
}

.footer-company-card strong {
  display: block;
  margin-bottom: 3px;
  color: #101828;
  font-size: 13.8px;
  font-weight: 800;
}

.footer-company-card span {
  display: block;
  color: #667085;
  font-size: 12.8px;
  font-weight: 560;
}

.footer-socials {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.footer-socials a {
  display: grid;
  place-items: center;
  min-width: 34px;
  height: 34px;
  padding: 0 9px;
  border-radius: 999px;
  color: #1877f2;
  background: #ffffff;
  border: 1px solid rgba(203, 213, 225, 0.9);
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
  transition:
    color 0.18s ease,
    background 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.footer-socials a:hover {
  color: #ffffff;
  background: #1877f2;
  box-shadow: 0 12px 24px rgba(24, 119, 242, 0.22);
  transform: translateY(-2px);
}

/* Trust/app row */
.footer-app-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 20px;
  padding: 12px 18px;
  border: 1px solid rgba(226, 232, 240, 0.94);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.86), rgba(240, 248, 255, 0.84));
  box-shadow:
    0 14px 34px rgba(15, 23, 42, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.footer-trust {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #344054;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.4;
}

.footer-trust svg {
  flex: 0 0 auto;
  color: #0b8edc;
}

.footer-apps {
  display: flex;
  align-items: center;
  gap: 11px;
  white-space: nowrap;
}

.footer-apps > span {
  color: #101828;
  font-size: 13.8px;
  font-weight: 750;
}

.footer-app-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-app-buttons a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  text-decoration: none;
  transition:
    transform 0.18s ease,
    filter 0.18s ease;
}

.footer-app-buttons a:hover {
  transform: translateY(-2px);
  filter: drop-shadow(0 10px 18px rgba(15, 23, 42, 0.1));
}

.footer-app-buttons img {
  display: block;
  height: 34px;
  width: auto;
  object-fit: contain;
}

/* Bottom */
.footer-bottom-wrap {
  position: relative;
  z-index: 1;
  border-top: 1px solid rgba(226, 232, 240, 0.95);
  background: rgba(255, 255, 255, 0.72);
}

.footer-bottom {
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
}

.footer-bottom p {
  margin: 0;
  color: #667085;
  font-size: 14px;
  font-weight: 560;
  line-height: 1.4;
}

.footer-bottom p a {
  color: #0669a8;
  font-weight: 760;
  text-decoration: none;
}

.footer-bottom p a:hover {
  text-decoration: underline;
}

.dmca-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 5px 11px;
  border-radius: 999px;
  color: #0669a8 !important;
  background: rgba(11, 142, 220, 0.08);
  border: 1px solid rgba(11, 142, 220, 0.18);
  font-size: 13px !important;
  font-weight: 760 !important;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
}

.dmca-badge:hover {
  background: rgba(11, 142, 220, 0.13);
  border-color: rgba(11, 142, 220, 0.28);
}

/* Responsive */
@media (max-width: 1180px) {
  .footer-container {
    grid-template-columns: 1.2fr 1fr 1fr;
    gap: 28px;
  }

  .footer-brand {
    grid-column: span 3;
  }

  .footer-company {
    grid-column: span 3;
  }
}

/* ── Dark mode ───────────────────────────────────────────────── */
[data-theme='dark'] .footer {
  background:
    radial-gradient(circle at 8% 10%, rgba(11, 142, 220, 0.05), transparent 28%),
    radial-gradient(circle at 88% 15%, rgba(36, 198, 220, 0.04), transparent 30%),
    linear-gradient(180deg, #071120 0%, #060e1c 52%, #050c18 100%) !important;
  border-top-color: rgba(30, 58, 82, 0.8);
  color: #94a3b8;
}

[data-theme='dark'] .footer-desc,
[data-theme='dark'] .footer-contact-item,
[data-theme='dark'] .footer-links a {
  color: #94a3b8;
}

[data-theme='dark'] .footer-column h3 {
  color: #cbd5e1;
}

[data-theme='dark'] .footer-links a:hover,
[data-theme='dark'] .footer-contact-item:hover {
  color: #60a5fa;
}

[data-theme='dark'] .footer-company-card {
  background: rgba(15, 34, 54, 0.8);
  border-color: rgba(30, 58, 82, 0.9);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
}

[data-theme='dark'] .footer-company-card strong {
  color: #e2e8f0;
}

[data-theme='dark'] .footer-company-card span {
  color: #64748b;
}

[data-theme='dark'] .footer-socials a {
  background: rgba(15, 34, 54, 0.9);
  border-color: rgba(30, 58, 82, 0.9);
  color: #60a5fa;
}

[data-theme='dark'] .footer-app-row {
  background: linear-gradient(135deg, rgba(10, 25, 45, 0.9), rgba(8, 20, 38, 0.88));
  border-color: rgba(30, 58, 82, 0.8);
}

[data-theme='dark'] .footer-trust {
  color: #94a3b8;
}

[data-theme='dark'] .footer-apps > span {
  color: #cbd5e1;
}

[data-theme='dark'] .footer-bottom-wrap {
  background: rgba(5, 11, 22, 0.9);
  border-top-color: rgba(30, 58, 82, 0.7);
}

[data-theme='dark'] .footer-bottom p {
  color: #475569;
}

[data-theme='dark'] .footer-bottom p a {
  color: #60a5fa;
}

@media (max-width: 820px) {
  .footer-main {
    padding: 38px 0 20px;
  }

  .footer-container {
    grid-template-columns: 1fr 1fr;
    gap: 26px 22px;
  }

  .footer-brand,
  .footer-company {
    grid-column: span 2;
  }

  .footer-app-row {
    align-items: flex-start;
    flex-direction: column;
    margin-top: 20px;
    padding: 15px;
  }

  .footer-apps {
    align-items: flex-start;
    flex-direction: column;
    white-space: normal;
  }

  .footer-bottom {
    min-height: auto;
    padding: 15px 0;
    flex-wrap: wrap;
  }
}

@media (max-width: 560px) {
  .footer-main {
    padding: 32px 0 18px;
  }

  .footer-container {
    grid-template-columns: 1fr;
  }

  .footer-brand,
  .footer-company {
    grid-column: auto;
  }

  .footer-logo img {
    height: 40px;
    max-width: 165px;
  }

  .footer-desc {
    font-size: 14px;
  }

  .footer-app-row {
    padding: 15px;
    border-radius: 16px;
  }

  .footer-app-buttons {
    flex-wrap: wrap;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 8px;
    padding: 14px 0;
  }

  .footer-bottom p {
    font-size: 13.5px;
  }
}
`

  return (
    <>
      <style>{FOOTER_STYLES}</style>
      <footer className="footer">
        <div className="footer-main">
          <div className="container footer-container">
            <div className="footer-brand">
              <Link to="/" className="footer-logo">
                <img src={logoFooter} alt="iOrder Logo" loading="lazy" decoding="async" />
              </Link>

              <div className="footer-contact-list">
                <a href={contactInfo.addressMapUrl} target="_blank" rel="noreferrer" className="footer-contact-item">
                  <MapPin size={17} />
                  <span>{contactInfo.address}</span>
                </a>

                <a href={contactInfo.phoneHref} className="footer-contact-item">
                  <Phone size={17} />
                  <span>{contactInfo.phoneDisplay}</span>
                </a>

                <a href={`mailto:${contactInfo.supportEmail}`} className="footer-contact-item">
                  <Mail size={17} />
                  <span>{contactInfo.supportEmail}</span>
                </a>

                <div className="footer-contact-item">
                  <Clock size={17} />
                  <span>{contactInfo.workingHours}</span>
                </div>
              </div>
            </div>

            <div className="footer-column">
              <h3>{'S\u1ea3n ph\u1ea9m'}</h3>
              <div className="footer-links">
                {productLinks.map((item) => (
                  <Link key={item.title} to={item.path}>
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>

            <div className="footer-column">
              <h3>{'Gi\u1ea3i ph\u00e1p'}</h3>
              <div className="footer-links">
                {solutionLinks.map((item) => (
                  <Link key={item.title} to={item.path}>
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>

            <div className="footer-column">
              <h3>{'D\u1ecbch v\u1ee5'}</h3>
              <div className="footer-links">
                {serviceLinks.map((item) => (
                  <Link key={item.title} to={item.path}>
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>

            <div className="footer-column footer-company">
              <h3>{'H\u1ed7 tr\u1ee3'}</h3>
              <div className="footer-links">
                {[...supportLinks, ...companyLinks].map((item) => (
                  <Link key={item.title} to={item.path}>
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom-wrap">
          <div className="container footer-bottom">
            <p>
              {'\u00a9 2026 S\u1ea3n ph\u1ea9m ph\u00e1t tri\u1ec3n b\u1edfi '}
              <a href="https://iorder.vn" target="_blank" rel="noreferrer">
                iOrder.vn
              </a>
            </p>

            <a className="dmca-badge" href={dmcaUrl} target="_blank" rel="noreferrer">
              DMCA Protected
            </a>
          </div>
        </div>

        <FloatingActions />
      </footer>
    </>
  )
}
