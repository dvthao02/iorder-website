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
    title: "Phần mềm quản lý bán hàng - iOrder",
    path: "/phan-mem/quan-ly-ban-hang-iorder",
  },
  {
    title: "Phần mềm quản lý trường mầm non - MimiEdu",
    path: "/phan-mem/quan-ly-truong-mam-non-mimiedu",
  },
  {
    title: "Phần mềm đồng bộ dữ liệu iOrder RPA",
    path: "/phan-mem/dong-bo-du-lieu-iorder-rpa",
  },
  {
    title: "Phần mềm quản lý trạm sạc xe điện",
    path: "/phan-mem/quan-ly-tram-sac-xe-dien",
  },
  {
    title: "Phần mềm quản lý vận tải",
    path: "/phan-mem/quan-ly-van-tai",
  },
  {
    title: "Hóa đơn điện tử - Chữ ký số",
    path: "/phan-mem/hoa-don-dien-tu-chu-ky-so",
  },
];

  const solutionLinks = [
    { title: "Hạ tầng mạng, Wifi và camera", path: "/giai-phap/ha-tang/mang-wifi-camera" },
    { title: "Cân bằng tải Internet, HA và bảo mật", path: "/giai-phap/ha-tang/can-bang-tai-ha-bao-mat" },
    { title: "Hệ thống data center", path: "/giai-phap/ha-tang/data-center" },
    { title: "Máy chủ, Proxy, Web/Mail/File server", path: "/giai-phap/ha-tang/may-chu-server" },
    { title: "Kiểm soát ra vào, chấm công", path: "/giai-phap/ha-tang/kiem-soat-ra-vao-cham-cong" },
  ];

  const serviceLinks = [
    { title: "Thi công mạng, Wifi, Camera", path: "/dich-vu/dich-vu-cntt/thi-cong-mang-wifi-camera" },
    { title: "Bảo trì và xử lý sự cố IT", path: "/dich-vu/dich-vu-cntt/bao-tri-it" },
    { title: "Tên miền, hosting, website", path: "/dich-vu/dich-vu-cntt/hosting-website" },
    { title: "Chữ ký số, hóa đơn điện tử", path: "/dich-vu/dich-vu-cntt/chu-ky-so-hoa-don-dien-tu" },
  ];

  const supportLinks = [
    { title: "Hướng dẫn sử dụng", path: "/huong-dan" },
    { title: "Câu hỏi thường gặp", path: "/faq" },
    { title: "Hỗ trợ từ xa", path: "/ho-tro-tu-xa" },
    { title: "Liên hệ hỗ trợ", path: "/lien-he" },
  ];

  const companyLinks = [
    { title: "Về iOrder", path: "/gioi-thieu" },
    { title: "Tin tức", path: "/tin-tuc" },
    { title: "Liên hệ", path: "/lien-he" },
    { title: "Điều khoản dịch vụ", path: "/terms" },
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
                href="https://maps.google.com/?q=756A Đ. Âu Cơ Phường 14 Tân Bình TP.HCM"
                target="_blank"
                rel="noreferrer"
                className="footer-contact-item"
              >
                <MapPin size={17} />
                <span>756A Đ. Âu Cơ, P.14, Q. Tân Bình, TP.HCM</span>
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
                <span>Thứ 2 - Thứ 7: 08:00 - 18:00</span>
              </div>
            </div>
          </div>

          <div className="footer-column">
            <h3>Sản phẩm</h3>
            <div className="footer-links">
              {productLinks.map((item) => (
                <Link key={item.title} to={item.path}>
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="footer-column">
            <h3>Giải pháp</h3>
            <div className="footer-links">
              {solutionLinks.map((item) => (
                <Link key={item.title} to={item.path}>
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="footer-column">
            <h3>Dịch vụ</h3>
            <div className="footer-links">
              {serviceLinks.map((item) => (
                <Link key={item.title} to={item.path}>
                  {item.title}
                </Link>
              ))}
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

          <div className="footer-column footer-company">
            <h3>Hỗ trợ</h3>

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
      © 2026 Sản phẩm phát triển bởi{" "}
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
