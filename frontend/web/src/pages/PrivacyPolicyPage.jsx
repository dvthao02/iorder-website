import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, ChevronRight, MapPin, Mail, Phone, ShieldCheck } from 'lucide-react'
import PageLayout from '../components/PageLayout'
import { setPageSeo } from '../utils/seo'
import { useSiteContact } from '../utils/useSiteContact'

// REMOVE-BY: migrate this source-verified fallback into CMS content-pages after the policy import is automated.
const policySections = [
  {
    id: 'collection',
    title: '1. Mục đích và phạm vi thu thập',
    paragraphs: [
      (company) =>
        `${company} yêu cầu khách hàng cung cấp các thông tin cơ bản bao gồm: email, điện thoại, tên đăng nhập, mật khẩu đăng nhập, địa chỉ (khi đăng ký sử dụng dịch vụ của ${company}) và một số thông tin bắt buộc khác khi khách hàng muốn tương tác với một số nội dung trên website và ứng dụng ${company}.`,
      (company) => `${company} thu thập thông tin khách hàng cho các mục đích sau:`,
    ],
    bullets: [
      'Đăng ký tài khoản và xác thực người dùng',
      'Cung cấp dịch vụ và hỗ trợ kỹ thuật',
      'Tăng cường trải nghiệm người dùng và cải thiện ứng dụng',
      'Đảm bảo quyền lợi của Khách hàng',
    ],
    after: [
      (company) =>
        `Việc bạn truy cập, đăng ký, sử dụng ${company} có nghĩa rằng bạn đồng ý và chấp nhận các quy định trong chính sách bảo mật của chúng tôi. Khách hàng tự chịu trách nhiệm bảo mật và lưu giữ mọi hoạt động sử dụng dịch vụ dưới tên đăng ký, mật khẩu, hộp thư điện tử và/hoặc số điện thoại của mình. ${company} không chịu trách nhiệm liên đới về các thất thoát dữ liệu, bí mật thông tin do khách hàng vô tình hoặc cố ý gây ra.`,
      (company) =>
        `Ngoài ra, Khách hàng có trách nhiệm thông báo kịp thời cho ${company} về những hành vi sử dụng trái phép, lạm dụng, vi phạm bảo mật, hoặc việc bên thứ ba lưu giữ tên đăng ký và mật khẩu để có biện pháp giải quyết phù hợp.`,
    ],
  },
  {
    id: 'integrations',
    title: (company) => `2. Dịch vụ, ứng dụng liên kết với ${company}`,
    paragraphs: [
      (company) =>
        `Để đảm bảo quyền lợi và trải nghiệm tốt nhất cho Khách hàng, ${company} áp dụng một số điều khoản riêng khi Khách hàng sử dụng các dịch vụ, ứng dụng do ${company} cung cấp hoặc có liên kết với ${company}.`,
    ],
    integrations: [
      {
        title: (company) =>
          `A. Đối với khách hàng sử dụng Ứng dụng ${company} từ Apple App Store hoặc Google Play, bạn hiểu và chấp nhận rằng ${company} có quyền:`,
        items: (company) => ['Lấy vị trí hiện tại của bạn;', `Ghi dữ liệu của Ứng dụng ${company} lên thẻ nhớ;`, 'Truy cập Internet từ thiết bị của bạn.'],
        note: (company) =>
          `Lưu ý: Tất cả các truy cập này chỉ được chúng tôi thực hiện khi có sự đồng ý của bạn. Việc từ chối quyền có thể ảnh hưởng đến một số tính năng của ${company}.`,
      },
      {
        title: (company) => `B. Đối với tài khoản Facebook của Khách hàng khi liên kết ${company}, ${company} sẽ yêu cầu quyền truy cập các thông tin sau:`,
        items: (company) => [
          `Quyền truy cập vào địa chỉ email của Trang (Fanpage) Facebook sử dụng để tích hợp với ${company};`,
          `Quyền truy cập vào tập hợp các mục công khai trên Trang Facebook đã tích hợp với ${company};`,
          `Cho phép truy cập vào tập hợp các mục công khai trên Tài khoản cá nhân của người dùng có tương tác với Trang Facebook tích hợp với ${company};`,
          `Cho phép gửi và nhận tin nhắn, bình luận trên Trang Facebook tích hợp với ${company} thông qua ${company}.`,
        ],
      },
      {
        title: (company) => `C. Đối với tài khoản Zalo của Khách hàng khi liên kết với ${company}, ${company} sẽ yêu cầu quyền truy cập các thông tin sau:`,
        items: (company) => [
          `Quyền truy cập vào ảnh đại diện, tên, ảnh bìa của tài khoản Zalo Official Account sử dụng để tích hợp với ${company};`,
          `Quyền truy cập vào thông tin tên, số điện thoại của tài khoản Zalo Official Account sử dụng tích hợp với ${company};`,
          `Cho phép gửi và nhận tin nhắn từ tài khoản Zalo Official Account tích hợp với ${company} thông qua ${company}.`,
        ],
      },
    ],
  },
  {
    id: 'use',
    title: '3. Phạm vi sử dụng thông tin',
    paragraphs: [(company) => `${company} sử dụng thông tin Khách hàng cung cấp để:`],
    bullets: [
      'Cung cấp các dịch vụ đến Khách hàng.',
      (company) => `Gửi các thông báo về các hoạt động trao đổi thông tin giữa Khách hàng và đơn vị Hỗ trợ kỹ thuật của ${company}.`,
      'Ngăn ngừa các hoạt động phá hủy tài khoản của người dùng hoặc các hoạt động giả mạo Khách hàng.',
      'Gửi các thông báo, khuyến mãi (chỉ khi có sự đồng ý của khách hàng).',
      'Liên lạc và giải quyết với khách hàng trong những trường hợp đặc biệt.',
      (company) => `${company} có trách nhiệm hợp tác cung cấp thông tin cá nhân Khách hàng khi có yêu cầu từ cơ quan nhà nước có thẩm quyền.`,
      'Chia sẻ dữ liệu với đối tác tích hợp hoặc bên thứ ba (chỉ khi có sự đồng ý của khách hàng).',
    ],
  },
  {
    id: 'retention',
    title: '4. Thời gian lưu trữ thông tin',
    paragraphs: [
      (company) =>
        `Trong mọi trường hợp, thông tin cá nhân Khách hàng sẽ được bảo mật hoàn toàn trên máy chủ của ${company}. Khách hàng có quyền cập nhật, sửa đổi và xóa thông tin của các Dữ liệu cá nhân này. Tuy nhiên, trong một số trường hợp, ${company} vẫn có thể khôi phục những thông tin đó từ cơ sở dữ liệu để giải quyết các tranh chấp, thi hành điều khoản, hoặc vì các yêu cầu kỹ thuật, pháp lý liên quan đến sự an toàn và hoạt động của ${company}.`,
      (company) => `Thông tin của Khách hàng được lưu trữ trên hệ thống bảo mật của ${company} và:`,
    ],
    bullets: ['Được lưu trong suốt thời gian sử dụng Dịch vụ.', 'Sau khi ngưng sử dụng dịch vụ, dữ liệu được lưu trữ tối đa 10 năm, trừ khi có yêu cầu khác từ Pháp luật hoặc vì lý do tranh chấp.'],
  },
  {
    id: 'access',
    title: '6. Phương tiện và công cụ để Khách hàng tiếp cận và chỉnh sửa dữ liệu của mình',
    paragraphs: [
      (company) =>
        `Khách hàng có quyền tự kiểm tra, cập nhật, điều chỉnh thông tin cá nhân của mình bằng cách đăng nhập vào tài khoản và chỉnh sửa thông tin cá nhân hoặc yêu cầu ${company} thực hiện việc này.`,
      (company) =>
        `Khách hàng có quyền gửi khiếu nại đến Ban quản trị của ${company} nếu phát hiện thông tin cá nhân bị cung cấp cho bên thứ ba. Khi tiếp nhận phản hồi, ${company} sẽ xác nhận lại thông tin, giải thích lý do và hướng dẫn Khách hàng khôi phục, bảo mật lại thông tin.`,
    ],
  },
  {
    id: 'commitment',
    title: '7. Cam kết bảo mật thông tin cá nhân Khách hàng',
    paragraphs: [
      (company) =>
        `Thông tin của Khách hàng trên ${company} được ${company} cam kết bảo mật tuyệt đối theo chính sách bảo vệ thông tin cá nhân. Việc thu thập và sử dụng thông tin của mỗi Khách hàng chỉ được thực hiện khi có sự đồng ý của Khách hàng đó, trừ những trường hợp pháp luật có quy định khác.`,
      (company) => `${company} cam kết:`,
    ],
    bullets: [
      'Không sử dụng, chuyển giao, cung cấp hay tiết lộ cho bên thứ ba thông tin cá nhân của Khách hàng khi không có sự cho phép hoặc đồng ý từ Khách hàng, trừ những trường hợp theo quy định khác.',
      (company) => `Bảo mật tuyệt đối mọi thông tin giao dịch trực tuyến của Khách hàng, bao gồm thông tin hóa đơn và chứng từ kế toán số hóa tại khu vực dữ liệu trung tâm an toàn của ${company}.`,
      'Chủ động phòng tránh truy cập trái phép, tấn công dữ liệu và mất mát thông tin.',
    ],
  },
  {
    id: 'updates',
    title: '8. Cập nhật chính sách',
    paragraphs: [
      () =>
        'Chính sách này có thể được cập nhật theo thời gian. Chúng tôi sẽ thông báo rõ ràng thông qua ứng dụng hoặc website nếu có bất kỳ thay đổi nào. Việc tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng nghĩa với việc bạn đã chấp thuận chính sách mới.',
    ],
  },
]

function value(item, company) {
  return typeof item === 'function' ? item(company) : item
}

export default function PrivacyPolicyPage() {
  const contact = useSiteContact()
  const company = contact.companyName || 'iOrder'

  useEffect(() => {
    setPageSeo({
      title: `Chính sách bảo mật - ${company}`,
      description: `Chính sách bảo mật thông tin cá nhân của khách hàng khi sử dụng ứng dụng và dịch vụ ${company}.`,
    })
  }, [company])

  return (
    <PageLayout mainProps={{ 'data-content-source': 'iorder-app-privacy-policy' }}>
      <section className="policy-hero">
        <div className="container">
          <Link to="/" className="policy-breadcrumb">
            Trang chủ <ChevronRight size={16} /> Chính sách bảo mật
          </Link>
          <div className="policy-hero-content">
            <span className="policy-eyebrow"><ShieldCheck size={18} /> Bảo vệ dữ liệu khách hàng</span>
            <h1>Chính sách bảo mật</h1>
            <p>{company} cam kết tôn trọng và bảo vệ thông tin cá nhân của khách hàng sử dụng ứng dụng và dịch vụ của chúng tôi.</p>
          </div>
        </div>
      </section>

      <section className="policy-section">
        <div className="container policy-layout">
          <aside className="policy-toc" aria-label="Mục lục chính sách">
            <p>Nội dung chính sách</p>
            {policySections.map((section) => <a key={section.id} href={`#${section.id}`}>{value(section.title, company)}</a>)}
          </aside>

          <article className="policy-content">
            <p className="policy-intro">Việc truy cập và sử dụng {company} đồng nghĩa với việc bạn đồng ý với các điều khoản trong Chính sách bảo mật này.</p>

            {policySections.slice(0, 4).map((section) => <PolicySection key={section.id} section={section} company={company} />)}

            <section className="policy-block" id="contact">
              <h2>5. Địa chỉ của đơn vị thu thập, quản lý thông tin hỗ trợ Khách hàng</h2>
              <div className="policy-contact-card">
                <strong>Công ty TNHH Công nghệ {company}</strong>
                <a href={contact.addressMapUrl} target="_blank" rel="noreferrer"><MapPin size={18} /> {contact.address}</a>
                <a href={contact.phoneHref}><Phone size={18} /> Hotline: {contact.phoneDisplay}</a>
                <a href={`mailto:${contact.supportEmail}`}><Mail size={18} /> Email: {contact.supportEmail}</a>
              </div>
              <p>Chúng tôi có trách nhiệm tiếp nhận, xác minh và phản hồi mọi yêu cầu liên quan đến bảo mật thông tin.</p>
            </section>

            {policySections.slice(4).map((section) => <PolicySection key={section.id} section={section} company={company} />)}
          </article>
        </div>
      </section>
    </PageLayout>
  )
}

function PolicySection({ section, company }) {
  return (
    <section className="policy-block" id={section.id}>
      <h2>{value(section.title, company)}</h2>
      {section.paragraphs?.map((paragraph, index) => <p key={index}>{value(paragraph, company)}</p>)}
      {section.bullets ? <PolicyList items={section.bullets} company={company} /> : null}
      {section.integrations?.map((integration) => (
        <div className="policy-integration" key={value(integration.title, company)}>
          <h3>{value(integration.title, company)}</h3>
          <ol>{integration.items(company).map((item) => <li key={item}>{item}</li>)}</ol>
          {integration.note ? <p className="policy-note">{integration.note(company)}</p> : null}
        </div>
      ))}
      {section.after?.map((paragraph, index) => <p key={index}>{value(paragraph, company)}</p>)}
    </section>
  )
}

function PolicyList({ items, company }) {
  return <ul className="policy-list">{items.map((item) => <li key={value(item, company)}><CheckCircle size={18} /> <span>{value(item, company)}</span></li>)}</ul>
}
