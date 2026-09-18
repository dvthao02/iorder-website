import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import SectionRenderer from '../components/detail/SectionRenderer'
import StaticPage from './StaticPage'
import { servicePages } from '../data/siteContent'
import { setPageSeo } from '../utils/seo'
import { fetchOffering } from '../utils/contentApi'
import posHero from '../assets/products/pos.jpg'

export default function ServiceDetail() {
  const { slug } = useParams()
  const [cmsService, setCmsService] = useState(null)

  useEffect(() => {
    fetchOffering('service', slug)
      .then(setCmsService)
      .catch(() => {})
  }, [slug])

  const service = cmsService ?? servicePages.find((s) => s.slug === slug)

  useEffect(() => {
    setPageSeo({
      title: service ? `${service.title} - iOrder` : 'Dịch vụ iOrder',
      description:
        service?.description ??
        'Dịch vụ CNTT iOrder hỗ trợ triển khai, bảo trì và chuyển đổi số cho cửa hàng, doanh nghiệp.',
    })
  }, [service])

  if (!service) {
    return <StaticPage />
  }

  return (
    <PageLayout>
      <SectionRenderer offering={service} type="service" backPath="/dich-vu" backLabel="Quay lại dịch vụ" fallbackImage={posHero} />
    </PageLayout>
  )
}
