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

  return (
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
  )
}
