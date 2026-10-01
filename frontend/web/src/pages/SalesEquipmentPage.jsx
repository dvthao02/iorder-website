import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Barcode, Box, Monitor, Printer, WalletCards } from 'lucide-react'

import PageLayout from '../components/PageLayout'
import { fetchSalesEquipment } from '../utils/contentApi'
import { setPageSeo } from '../utils/seo'
import '../styles/pages/sales-equipment.css'

const EQUIPMENT_GROUPS = [
  { id: 'pos', label: 'Máy bán hàng', icon: Monitor },
  { id: 'printer', label: 'Máy in hóa đơn, mã vạch', icon: Printer },
  { id: 'scanner', label: 'Máy quét mã vạch', icon: Barcode },
  { id: 'cash_drawer', label: 'Két tiền', icon: WalletCards },
  { id: 'accessory', label: 'Thiết bị bán hàng khác', icon: Box },
]

const CATEGORY_LABELS = Object.fromEntries(EQUIPMENT_GROUPS.map(({ id, label }) => [id, label]))
const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price)
const chunkRows = (items, size) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size))

function EquipmentDetail({ equipment }) {
  return (
    <article className="sales-equipment-detail" aria-labelledby="equipment-detail-title">
      <div className="sales-equipment-detail-image">
        {equipment.coverUrl ? <img src={equipment.coverUrl} alt={equipment.name} /> : <Monitor size={72} aria-hidden="true" />}
      </div>
      <div className="sales-equipment-detail-content">
        <span>{CATEGORY_LABELS[equipment.category] ?? 'Thiết bị'}</span>
        <h2 id="equipment-detail-title">{equipment.name}</h2>
        {equipment.modelCode ? <p className="sales-equipment-model">Mã sản phẩm: {equipment.modelCode}</p> : null}
        <strong className="sales-equipment-price">{formatPrice(equipment.priceVnd)}đ</strong>
        <p className="sales-equipment-warranty">Bảo hành {equipment.warrantyMonths} tháng</p>
        {equipment.summary ? <p className="sales-equipment-summary">{equipment.summary}</p> : null}
        <Link className="btn primary sales-equipment-contact" to="/lien-he">
          Liên hệ tư vấn
        </Link>
      </div>
      {equipment.specificationGroups.length ? (
        <div className="sales-equipment-specs">
          {equipment.specificationGroups.map((group) => (
            <section key={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </article>
  )
}

export default function SalesEquipmentPage() {
  const [equipment, setEquipment] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [cardsPerRow, setCardsPerRow] = useState(5)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setPageSeo({
      title: 'Thiết bị bán hàng iOrder',
      description: 'Máy POS, máy in, máy quét mã vạch và phụ kiện bán hàng tương thích với iOrder.',
    })
    fetchSalesEquipment()
      .then(setEquipment)
      .catch(() => setEquipment([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const syncCardsPerRow = () => setCardsPerRow(window.innerWidth <= 980 ? 2 : 5)
    syncCardsPerRow()
    window.addEventListener('resize', syncCardsPerRow)
    return () => window.removeEventListener('resize', syncCardsPerRow)
  }, [])

  const selected = equipment.find((item) => item.id === selectedId) ?? null
  const groupedEquipment = useMemo(
    () =>
      EQUIPMENT_GROUPS.map((group) => ({
        ...group,
        rows: chunkRows(equipment.filter((item) => item.category === group.id), cardsPerRow),
      })).filter((group) => group.rows.length > 0),
    [cardsPerRow, equipment],
  )

  return (
    <PageLayout>
      <main className="sales-equipment-page">
        <section className="sales-equipment-hero">
          <div className="container sales-equipment-hero-content">
            <span>Hệ sinh thái iOrder</span>
            <h1>Thiết bị bán hàng</h1>
            <p>Chọn bộ thiết bị phù hợp để bán hàng nhanh, vận hành ổn định và triển khai đồng bộ cùng iOrder.</p>
          </div>
        </section>

        <section className="sales-equipment-catalog" aria-labelledby="sales-equipment-title">
          <div className="container">
            <div className="sales-equipment-heading">
              <div>
                <span className="listing-kicker">Danh mục thiết bị</span>
                <h2 id="sales-equipment-title">Thiết bị sẵn sàng cho điểm bán</h2>
              </div>
              <p>Giá tham khảo và cấu hình do CMS quản lý; đội ngũ iOrder sẽ tư vấn theo mô hình vận hành của bạn.</p>
            </div>

            {loading ? <p className="sales-equipment-message">Đang tải thiết bị...</p> : null}
            {!loading && groupedEquipment.length === 0 ? (
              <p className="sales-equipment-message">Danh mục thiết bị đang được cập nhật. Vui lòng quay lại sau.</p>
            ) : null}

            {groupedEquipment.length ? (
              <div className="sales-equipment-groups">
                {groupedEquipment.map(({ id, label, icon: Icon, rows }) => (
                  <section className="sales-equipment-group" key={id} aria-labelledby={`sales-equipment-group-${id}`}>
                    <h2 id={`sales-equipment-group-${id}`}>
                      <Icon size={23} aria-hidden="true" />
                      {label}
                    </h2>
                    {rows.map((row) => (
                      <div className="sales-equipment-card-row" key={row[0].id}>
                        <div className="sales-equipment-cards" role="list">
                          {row.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              role="listitem"
                              className={`sales-equipment-card ${selectedId === item.id ? 'is-selected' : ''}`}
                              onClick={() => setSelectedId((current) => (current === item.id ? null : item.id))}
                            >
                              <div className="sales-equipment-card-image">
                                {item.coverUrl ? (
                                  <img src={item.coverUrl} alt={item.name} />
                                ) : (
                                  <Monitor size={44} aria-hidden="true" />
                                )}
                              </div>
                              <span>{CATEGORY_LABELS[item.category] ?? 'Thiết bị'}</span>
                              <strong>{item.name}</strong>
                              <b>{formatPrice(item.priceVnd)}đ</b>
                              <small>Bảo hành {item.warrantyMonths} tháng</small>
                            </button>
                          ))}
                        </div>
                        {selected && row.some((item) => item.id === selected.id) ? <EquipmentDetail equipment={selected} /> : null}
                      </div>
                    ))}
                  </section>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </PageLayout>
  )
}
