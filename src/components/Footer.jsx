import { Link } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Building2,
} from "lucide-react";
import FloatingActions from "./FloatingActions";

export default function Footer({ logoFooter, androidDownload, appleDownload }) {
  const dmcaUrl =
    "https://www.dmca.com/Protection/Status.aspx?ID=55ed00a2-083d-43ee-ac48-18341d415669&refurl=https://iorder.vn/";

  const productLinks = [
  {
    title: "Pháº§n má»m quáº£n lÃ½ bÃ¡n hÃ ng - iOrder",
    path: "/phan-mem/quan-ly-ban-hang-iorder",
  },
  {
    title: "Pháº§n má»m quáº£n lÃ½ trÆ°á»ng máº§m non - MimiEdu",
    path: "/phan-mem/quan-ly-truong-mam-non-mimiedu",
  },
  {
    title: "Pháº§n má»m Ä‘á»“ng bá»™ dá»¯ liá»‡u iOrder RPA",
    path: "/phan-mem/dong-bo-du-lieu-iorder-rpa",
  },
  {
    title: "Pháº§n má»m quáº£n lÃ½ tráº¡m sáº¡c xe Ä‘iá»‡n",
    path: "/phan-mem/quan-ly-tram-sac-xe-dien",
  },
  {
    title: "Pháº§n má»m quáº£n lÃ½ váº­n táº£i",
    path: "/phan-mem/quan-ly-van-tai",
  },
  {
    title: "HÃ³a Ä‘Æ¡n Ä‘iá»‡n tá»­ - Chá»¯ kÃ½ sá»‘",
    path: "/phan-mem/hoa-don-dien-tu-chu-ky-so",
  },
];

  const solutionLinks = [
    { title: "Háº¡ táº§ng máº¡ng, Wifi vÃ  camera", path: "/giai-phap/ha-tang/mang-wifi-camera" },
    { title: "CÃ¢n báº±ng táº£i Internet, HA vÃ  báº£o máº­t", path: "/giai-phap/ha-tang/can-bang-tai-ha-bao-mat" },
    { title: "Há»‡ thá»‘ng data center", path: "/giai-phap/ha-tang/data-center" },
    { title: "MÃ¡y chá»§, Proxy, Web/Mail/File server", path: "/giai-phap/ha-tang/may-chu-server" },
    { title: "Kiá»ƒm soÃ¡t ra vÃ o, cháº¥m cÃ´ng", path: "/giai-phap/ha-tang/kiem-soat-ra-vao-cham-cong" },
  ];

  const serviceLinks = [
    { title: "Thi cÃ´ng máº¡ng, Wifi, Camera", path: "/dich-vu/dich-vu-cntt/thi-cong-mang-wifi-camera" },
    { title: "Báº£o trÃ¬ vÃ  xá»­ lÃ½ sá»± cá»‘ IT", path: "/dich-vu/dich-vu-cntt/bao-tri-it" },
    { title: "TÃªn miá»n, hosting, website", path: "/dich-vu/dich-vu-cntt/hosting-website" },
    { title: "Chá»¯ kÃ½ sá»‘, hÃ³a Ä‘Æ¡n Ä‘iá»‡n tá»­", path: "/dich-vu/dich-vu-cntt/chu-ky-so-hoa-don-dien-tu" },
  ];

  const supportLinks = [
    { title: "HÆ°á»›ng dáº«n sá»­ dá»¥ng", path: "/huong-dan" },
    { title: "CÃ¢u há»i thÆ°á»ng gáº·p", path: "/faq" },
    { title: "Há»— trá»£ tá»« xa", path: "/ho-tro-tu-xa" },
    { title: "LiÃªn há»‡ há»— trá»£", path: "/lien-he" },
  ];

  const companyLinks = [
    { title: "Vá» iOrder", path: "/gioi-thieu" },
    { title: "Tin tá»©c", path: "/tin-tuc" },
    { title: "LiÃªn há»‡", path: "/lien-he" },
    { title: "Äiá»u khoáº£n dá»‹ch vá»¥", path: "/terms" },
  ];

  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="container footer-container">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img src={logoFooter} alt="iOrder Logo" />
            </Link>
            <div className="footer-contact-list">
              <a
                href="https://maps.google.com/?q=756A Ä. Ã‚u CÆ¡ PhÆ°á»ng 14 TÃ¢n BÃ¬nh TP.HCM"
                target="_blank"
                rel="noreferrer"
                className="footer-contact-item"
              >
                <MapPin size={17} />
                <span>756A Ä. Ã‚u CÆ¡, P.14, Q. TÃ¢n BÃ¬nh, TP.HCM</span>
              </a>

              <a href="tel:02871073999" className="footer-contact-item">
                <Phone size={17} />
                <span>028 710 73 999</span>
              </a>

              <a href="mailto:support@iorder.vn" className="footer-contact-item">
                <Mail size={17} />
                <span>support@iorder.vn</span>
              </a>

              <div className="footer-contact-item">
                <Clock size={17} />
                <span>Thá»© 2 - Thá»© 7: 08:00 - 18:00</span>
              </div>
            </div>

            <div className="footer-socials" aria-label="Kênh mạng xã hội iOrder">
              <a
                href="https://www.facebook.com/iorder.phanmemquanlybanhang"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook iOrder"
              >
                f
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h3>Sáº£n pháº©m</h3>
            <div className="footer-links">
              {productLinks.map((item) => (
                <Link key={item.title} to={item.path}>
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="footer-column">
            <h3>Giáº£i phÃ¡p</h3>
            <div className="footer-links">
              {solutionLinks.map((item) => (
                <Link key={item.title} to={item.path}>
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="footer-column">
            <h3>Dá»‹ch vá»¥</h3>
            <div className="footer-links">
              {serviceLinks.map((item) => (
                <Link key={item.title} to={item.path}>
                  {item.title}
                </Link>
              ))}
            </div>

          </div>

          <div className="footer-column footer-company">
            <h3>Há»— trá»£</h3>

            <div className="footer-links">
              {[...supportLinks, ...companyLinks.slice(0, 2)].map((item) => (
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
      Â© 2026 Sáº£n pháº©m phÃ¡t triá»ƒn bá»Ÿi{" "}
      <a href="https://iorder.vn" target="_blank" rel="noreferrer">
        iOrder.vn
      </a>
    </p>

    <a
      className="dmca-badge"
      href={dmcaUrl}
      target="_blank"
      rel="noreferrer"
    >
      DMCA Protected
    </a>
  </div>
</div>

      <FloatingActions />
    </footer>
  );
}
