import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import SectionRenderer from '../components/detail/SectionRenderer'
import StaticPage from './StaticPage'
import { setPageSeo } from '../utils/seo'
import { softwareProducts } from '../data/siteContent'
import { fetchOffering } from '../utils/contentApi'

import productSuite from '../assets/products/hero-iorder-suite.png'

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
      <SectionRenderer offering={product} type="software" backPath="/phan-mem" backLabel="Quay lại phần mềm" fallbackImage={productSuite} />
    </PageLayout>
  )
}
