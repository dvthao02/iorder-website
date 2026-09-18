import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import SectionRenderer from '../components/detail/SectionRenderer'
import StaticPage from './StaticPage'
import { solutionPages } from '../data/siteContent'
import { setPageSeo } from '../utils/seo'
import { fetchOffering } from '../utils/contentApi'
import posHero from '../assets/products/pos.jpg'

export default function SolutionDetail() {
  const { slug } = useParams()
  const [cmsSolution, setCmsSolution] = useState(null)

  useEffect(() => {
    fetchOffering('solution', slug)
      .then(setCmsSolution)
      .catch(() => {})
  }, [slug])

  const solution = cmsSolution ?? solutionPages.find((s) => s.slug === slug)

  useEffect(() => {
    setPageSeo({
      title: solution ? `${solution.title} - iOrder` : 'Giải pháp iOrder',
      description:
        solution?.description ?? 'Giải pháp hạ tầng, mạng, bảo mật và thiết bị triển khai cho hệ sinh thái iOrder.',
    })
  }, [solution])

  if (!solution) {
    return <StaticPage />
  }

  return (
    <PageLayout>
      <SectionRenderer offering={solution} type="solution" backPath="/giai-phap" backLabel="Quay lại giải pháp" fallbackImage={posHero} />
    </PageLayout>
  )
}
