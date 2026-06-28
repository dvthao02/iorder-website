import type { ExternalLinks, SiteProfileInput, SiteProfileResponse } from '@iorder/contracts'
import { useEffect, useState } from 'react'
import { type AppearanceSettings, getAppearance, getExternalLinks, getSiteProfile, updateAppearance, updateExternalLinks, updateSiteProfile } from './api'
import { PageHeader, ToggleSwitch } from './ui'

const PROFILE_FIELDS: { key: keyof SiteProfileInput; label: string; type?: string }[] = [
  { key: 'companyName', label: 'Tên công ty *' },
  { key: 'legalName', label: 'Tên pháp lý (tuỳ chọn)' },
  { key: 'hotline', label: 'Hotline' },
  { key: 'salesEmail', label: 'Email kinh doanh' },
  { key: 'supportEmail', label: 'Email hỗ trợ' },
  { key: 'address', label: 'Địa chỉ' },
  { key: 'workingHours', label: 'Giờ làm việc' },
]

const LINK_FIELDS: { key: keyof ExternalLinks; label: string }[] = [
  { key: 'appLogin', label: 'Đăng nhập ứng dụng (app.iorder.vn/login)' },
  { key: 'trial', label: 'Đăng ký dùng thử' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'zalo', label: 'Zalo OA' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'appStore', label: 'App Store' },
  { key: 'googlePlay', label: 'Google Play' },
  { key: 'addressMap', label: 'Link Google Maps' },
]

const emptyProfile = (): SiteProfileInput => ({
  companyName: 'iOrder',
  legalName: null,
  hotline: null,
  supportEmail: null,
  salesEmail: null,
  address: null,
  workingHours: null,
  logoMediaId: null,
})

const emptyLinks = (): ExternalLinks => ({
  appLogin: null,
  trial: null,
  facebook: null,
  zalo: null,
  youtube: null,
  appStore: null,
  googlePlay: null,
  addressMap: null,
})

const emptyAppearance = (): AppearanceSettings => ({
  primaryColor: '#0b8edc',
  accentColor: '#6366f1',
  darkMode: false,
})

export function SiteProfileEditor() {
  const [profile, setProfile] = useState<SiteProfileInput>(emptyProfile())
  const [links, setLinks] = useState<ExternalLinks>(emptyLinks())
  const [appearance, setAppearance] = useState<AppearanceSettings>(emptyAppearance())
  const [activeTab, setActiveTab] = useState<'profile' | 'links' | 'appearance'>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getSiteProfile(), getExternalLinks(), getAppearance()])
      .then(([profileRes, linksRes, appearanceRes]) => {
        if (profileRes.item) {
          const p = profileRes.item as SiteProfileResponse
          setProfile({
            companyName: p.companyName,
            legalName: p.legalName,
            hotline: p.hotline,
            supportEmail: p.supportEmail,
            salesEmail: p.salesEmail,
            address: p.address,
            workingHours: p.workingHours,
            logoMediaId: p.logoMediaId,
          })
        }
        if (linksRes.item) setLinks(linksRes.item)
        if (appearanceRes.item) setAppearance(appearanceRes.item)
      })
      .catch(() => setError('Không tải được cài đặt.'))
      .finally(() => setLoading(false))
  }, [])

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await updateSiteProfile(profile)
      setMessage('Đã lưu thông tin công ty.')
    } catch {
      setError('Lưu thất bại. Kiểm tra lại dữ liệu.')
    } finally {
      setSaving(false)
    }
  }

  const saveLinks = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await updateExternalLinks(links)
      setMessage('Đã lưu liên kết ngoài.')
    } catch {
      setError('Lưu thất bại.')
    } finally {
      setSaving(false)
    }
  }

  const saveAppearance = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await updateAppearance(appearance)
      if (appearance.darkMode) document.documentElement.setAttribute('data-theme', 'dark')
      else document.documentElement.removeAttribute('data-theme')
      setMessage('Đã lưu giao diện. Trang web sẽ áp dụng sau khi reload.')
    } catch {
      setError('Lưu thất bại.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-module"><p className="admin-info">Đang tải...</p></div>

  return (
    <div className="admin-module">
      <PageHeader
        title="Cài đặt website"
        description="Thông tin công ty, logo và các liên kết ngoài của website."
      />

      <div className="tab-nav">
        <button type="button" className={activeTab === 'profile' ? 'is-active' : ''} onClick={() => setActiveTab('profile')}>Thông tin công ty</button>
        <button type="button" className={activeTab === 'links' ? 'is-active' : ''} onClick={() => setActiveTab('links')}>Liên kết ngoài</button>
        <button type="button" className={activeTab === 'appearance' ? 'is-active' : ''} onClick={() => setActiveTab('appearance')}>🎨 Giao diện</button>
      </div>

      {message && <p className="form-success">{message}</p>}
      {error && <p className="form-error">{error}</p>}

      {activeTab === 'profile' && (
        <form className="admin-form" onSubmit={(e) => void saveProfile(e)}>
          {PROFILE_FIELDS.map(({ key, label, type }) => (
            <div key={key} className="form-row">
              <label>{label}</label>
              <input
                type={type ?? 'text'}
                value={(profile[key] as string | null) ?? ''}
                onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value || null }))}
                required={key === 'companyName'}
              />
            </div>
          ))}
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thông tin'}</button>
          </div>
        </form>
      )}

      {activeTab === 'links' && (
        <form className="admin-form" onSubmit={(e) => void saveLinks(e)}>
          <p className="admin-info">Các URL này dùng để tạo nút CTA, link mạng xã hội và nút tải ứng dụng trên website.</p>
          {LINK_FIELDS.map(({ key, label }) => (
            <div key={key} className="form-row">
              <label>{label}</label>
              <input
                type="url"
                value={(links[key] as string | null) ?? ''}
                onChange={(e) => setLinks((l) => ({ ...l, [key]: e.target.value || null }))}
                placeholder="https://..."
              />
            </div>
          ))}
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu liên kết'}</button>
          </div>
        </form>
      )}

      {activeTab === 'appearance' && (
        <form className="admin-form" onSubmit={(e) => void saveAppearance(e)}>
          <p className="admin-info">Tuỳ chỉnh màu sắc chủ đạo và chế độ hiển thị của website.</p>

          <div className="form-row" style={{ alignItems: 'center' }}>
            <label>Màu chính (Primary)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="color"
                value={appearance.primaryColor}
                onChange={(e) => setAppearance((a) => ({ ...a, primaryColor: e.target.value }))}
                style={{ width: 48, height: 36, padding: 2, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }}
              />
              <input
                type="text"
                value={appearance.primaryColor}
                onChange={(e) => setAppearance((a) => ({ ...a, primaryColor: e.target.value }))}
                style={{ width: 110, fontFamily: 'monospace' }}
                placeholder="#0b8edc"
              />
              <span style={{ fontSize: 13, color: '#888' }}>Màu nút, link, highlight</span>
            </div>
          </div>

          <div className="form-row" style={{ alignItems: 'center' }}>
            <label>Màu phụ (Accent)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="color"
                value={appearance.accentColor}
                onChange={(e) => setAppearance((a) => ({ ...a, accentColor: e.target.value }))}
                style={{ width: 48, height: 36, padding: 2, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }}
              />
              <input
                type="text"
                value={appearance.accentColor}
                onChange={(e) => setAppearance((a) => ({ ...a, accentColor: e.target.value }))}
                style={{ width: 110, fontFamily: 'monospace' }}
                placeholder="#6366f1"
              />
              <span style={{ fontSize: 13, color: '#888' }}>Gradient, badge phụ</span>
            </div>
          </div>

          <div className="form-row" style={{ alignItems: 'center' }}>
            <label>Chế độ tối/sáng</label>
            <ToggleSwitch
              checked={appearance.darkMode}
              onChange={(next) => setAppearance((a) => ({ ...a, darkMode: next }))}
              label="Bật chế độ tối (Dark mode)"
              hint="Áp dụng giao diện nền tối trên toàn website"
            />
          </div>

          <div className="form-row">
            <label>Xem trước màu</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ background: appearance.primaryColor, color: '#fff', padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>Nút chính</div>
              <div style={{ border: `2px solid ${appearance.primaryColor}`, color: appearance.primaryColor, padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>Nút outline</div>
              <div style={{ background: `linear-gradient(135deg, ${appearance.primaryColor}, ${appearance.accentColor})`, color: '#fff', padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>Gradient</div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu giao diện'}</button>
            <button type="button" onClick={() => setAppearance(emptyAppearance())} style={{ marginLeft: 8 }}>Reset mặc định</button>
          </div>
        </form>
      )}
    </div>
  )
}
