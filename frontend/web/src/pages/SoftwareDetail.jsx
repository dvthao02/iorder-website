import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle, CircleDollarSign, Clock, Gauge, ShieldCheck } from 'lucide-react'
import PageLayout from '../components/PageLayout'
import StaticPage from './StaticPage'
import { setPageSeo } from '../utils/seo'
import { softwareProducts } from '../data/siteContent'
import { fetchOffering } from '../utils/contentApi'

import posHero from '../assets/products/pos.jpg'

const detailIcons = [Gauge, Clock, CircleDollarSign]
const rolloutSteps = ['Khảo sát mô hình', 'Nhập dữ liệu ban đầu', 'Cài thiết bị', 'Đào tạo ca bán đầu tiên']

export default function SoftwareDetail() {
  const { slug } = useParams()
  const [cmsProduct, setCmsProduct] = useState(null)
  const staticProduct = softwareProducts.find((item) => item.slug === slug)
  const product = cmsProduct ?? staticProduct
  const seoTitle = product
    ? product.title.includes('iOrder')
      ? product.title
      : `${product.title} - iOrder`
    : 'Phần mềm iOrder'

  useEffect(() => {
    fetchOffering('software', slug)
      .then(setCmsProduct)
      .catch(() => {})
  }, [slug])

  useEffect(() => {
    setPageSeo({
      title: seoTitle,
      description:
        product?.summary ??
        'Phần mềm iOrder hỗ trợ bán hàng, quản lý kho, nhân viên và báo cáo doanh thu cho cửa hàng.',
    })
  }, [product, seoTitle])

  if (!product) return <StaticPage />

  return (
    <PageLayout>
      <section className="detail-hero software-detail-hero">
        <div className="container article-hero-grid">
          <div>
            <Link to="/phan-mem" className="detail-back-link">
              <ArrowLeft size={20} />
              Quay lại phần mềm
            </Link>
            <span className="listing-kicker">
              <ShieldCheck size={16} />
              iOrder Software
            </span>
            <h1 className="detail-title">{product.title}</h1>
            <p className="detail-summary">{product.summary}</p>
          </div>
          <div className="software-metric-grid">
            {product.metrics.map((metric, index) => {
              const Icon = detailIcons[index] ?? CheckCircle
              return (
                <div key={metric} className="software-metric-card">
                  <Icon size={26} />
                  <strong>{metric}</strong>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="detail-section">
        <div className="container">
          <div className="detail-grid">
            <div className="detail-card">
              <h2>Tính năng chính</h2>
              <div className="detail-list">
                {product.features.map((feature) => (
                  <div key={feature} className="detail-list-item">
                    <CheckCircle size={22} />
                    <p>{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-card">
              <h2>Lợi ích vận hành</h2>
              <div className="detail-benefits">
                {product.benefits.map((benefit) => (
                  <div key={benefit} className="detail-benefit-card">
                    <p>{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="detail-section software-rollout-section">
        <div className="container software-rollout-grid">
          <div className="software-rollout-image">
            <img src={posHero} alt={`Minh họa triển khai ${product.title} iOrder`} loading="lazy" decoding="async" />
          </div>
          <div className="software-rollout-copy">
            <h2>Quy trình triển khai {product.title.toLowerCase()}</h2>
            <p>
              Đội ngũ iOrder sẽ hỗ trợ từ khâu khảo sát, chuẩn hóa dữ liệu đến cài đặt thiết bị và hướng dẫn nhân viên
              vận hành thực tế.
            </p>
            <div className="software-rollout-steps">
              {rolloutSteps.map((step, index) => (
                <div key={step}>
                  <span>{index + 1}</span>
                  <strong>{step}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <div className="container">
          <div className="section-title">
            <h2>Câu hỏi thường gặp</h2>
          </div>
          <div className="faq-grid">
            {product.faq.map(([question, answer]) => (
              <div key={question} className="faq-card">
                <h3>{question}</h3>
                <p>{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="detail-cta">
        <div className="container">
          <h2>Cần tư vấn cấu hình {product.title.toLowerCase()}?</h2>
          <p>
            iOrder sẽ hỗ trợ chọn thiết bị, nhập dữ liệu ban đầu và thiết kế quy trình phù hợp với mô hình cửa hàng của
            bạn.
          </p>
          <Link to="/lien-he" className="btn large primary">
            <span>Liên hệ tư vấn</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </PageLayout>
  )
}
