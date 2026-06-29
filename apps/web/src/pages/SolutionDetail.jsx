import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import StaticPage from './StaticPage'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { solutionPages } from '../data/siteContent'
import { setPageSeo } from '../utils/seo'
import { fetchOffering } from '../utils/contentApi'

export default function SolutionDetail() {
  const { slug } = useParams()
  const [cmsSolution, setCmsSolution] = useState(null)

  useEffect(() => {
    fetchOffering('solution', slug).then(setCmsSolution).catch(() => {})
  }, [slug])

  const solution = cmsSolution ?? solutionPages.find(s => s.slug === slug)

  useEffect(() => {
    setPageSeo({
      title: solution ? `${solution.title} - iOrder` : 'Giải pháp iOrder',
      description: solution?.description ?? 'Giải pháp hạ tầng, mạng, bảo mật và thiết bị triển khai cho hệ sinh thái iOrder.',
    })
  }, [solution])

  if (!solution) {
    return <StaticPage />
  }

  return (
    <PageLayout>
        <section className="detail-hero">
          <div className="container">
            <Link to="/giai-phap" className="detail-back-link">
              <ArrowLeft size={20} />
              Quay lại Giải pháp
            </Link>
            <h1 className="detail-title">{solution.title}</h1>
            <p className="detail-summary">
              {solution.description}
            </p>
          </div>
        </section>

        <section className="detail-section">
          <div className="container">
            <h2 style={{ marginBottom: '30px' }}>Tính năng chính</h2>
            <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              {solution.features.map((feature, idx) => (
                <div key={idx} className="detail-list-item">
                  <CheckCircle size={24} color="#1588e3" />
                  <p>{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="detail-cta">
          <div className="container">
            <h2>Sẵn sàng triển khai?</h2>
            <p>
              Liên hệ với chúng tôi để tư vấn giải pháp phù hợp nhất cho kinh doanh của bạn.
            </p>
            <Link to="/lien-he" className="btn large primary">
              Liên hệ tư vấn
            </Link>
          </div>
        </section>
    </PageLayout>
  )
}
