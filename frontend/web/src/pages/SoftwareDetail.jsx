import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import SectionRenderer from '../components/detail/SectionRenderer'
import NotFound from './NotFound'
import { setPageSeo } from '../utils/seo'
import { fetchOffering } from '../utils/contentApi'

import productSuite from '../assets/products/hero-iorder-suite.png'
import posRetail from '../assets/products/hero-pos-retail-cutout.png'

export default function SoftwareDetail() {
  const { slug } = useParams()
  return <SoftwareContent key={slug} slug={slug} />
}

function SoftwareContent({ slug }) {
  const [product, setProduct] = useState(null)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    fetchOffering('software', slug)
      .then((value) => {
        if (active) setProduct(value)
      })
      .catch((reason) => {
        if (active) setError(reason.message)
      })
    return () => {
      active = false
    }
  }, [slug, attempt])
  const seoTitle = product
    ? product.title.includes('iOrder')
      ? product.title
      : `${product.title} - iOrder`
    : 'Phần mềm iOrder'

  useEffect(() => {
    setPageSeo({
      title: product?.seoTitle || seoTitle,
      description:
        product?.seoDescription ||
        product?.summary ||
        'Phần mềm iOrder hỗ trợ bán hàng, quản lý kho, nhân viên và báo cáo doanh thu cho cửa hàng.',
    })
  }, [product, seoTitle])

  if (error === 'HTTP_404') return <NotFound />
  if (!product)
    return (
      <PageLayout>
        <section className="section">
          <div className="container" role="status" aria-live="polite">
            <h1>{error ? 'Chưa tải được thông tin phần mềm' : 'Đang tải thông tin phần mềm…'}</h1>
            {error ? (
              <>
                <p>Vui lòng thử lại sau ít phút hoặc liên hệ để được tư vấn.</p>
                <button
                  className="btn primary"
                  type="button"
                  onClick={() => {
                    setError(null)
                    setAttempt((value) => value + 1)
                  }}
                >
                  Thử lại
                </button>
                <Link className="btn" to="/lien-he">
                  Liên hệ tư vấn
                </Link>
              </>
            ) : null}
          </div>
        </section>
      </PageLayout>
    )

  return (
    <PageLayout>
      <SectionRenderer
        offering={product}
        type="software"
        backPath="/phan-mem"
        backLabel="Quay lại phần mềm"
        fallbackImage={productSuite}
        processImage={posRetail}
      />
    </PageLayout>
  )
}
