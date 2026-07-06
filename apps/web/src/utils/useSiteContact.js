import { useEffect, useState } from 'react'

import { contactInfo as staticContactInfo } from '../data/siteContent'
import { fetchSiteSettings } from './contentApi'

// Cache module-level: settings gần như không đổi trong 1 phiên xem web,
// tránh mỗi trang (Footer render ở mọi trang) tự fetch lại.
let _cached = null
let _pending = null

function toPhoneHref(hotline) {
  const digits = String(hotline).replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : staticContactInfo.phoneHref
}

function toMapUrl(address) {
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`
}

// Ghép hồ sơ CMS (Cài đặt website → Thông tin website) lên trên fallback tĩnh.
// Từng trường thiếu ở CMS thì giữ giá trị tĩnh — không bao giờ hiện ô trống.
function mergeProfile(profile) {
  if (!profile) return staticContactInfo
  return {
    phoneDisplay: profile.hotline || staticContactInfo.phoneDisplay,
    phoneHref: profile.hotline ? toPhoneHref(profile.hotline) : staticContactInfo.phoneHref,
    salesEmail: profile.salesEmail || staticContactInfo.salesEmail,
    supportEmail: profile.supportEmail || staticContactInfo.supportEmail,
    address: profile.address || staticContactInfo.address,
    addressMapUrl: profile.address ? toMapUrl(profile.address) : staticContactInfo.addressMapUrl,
    workingHours: profile.workingHours || staticContactInfo.workingHours,
    companyName: profile.companyName || null,
    logoUrl: profile.logoUrl || null,
  }
}

async function loadContactInfo() {
  if (_cached) return _cached
  if (!_pending) {
    _pending = fetchSiteSettings()
      .then((payload) => {
        _cached = mergeProfile(payload?.profile)
        return _cached
      })
      .catch(() => staticContactInfo) // API lỗi → dùng data tĩnh, web không vỡ
      .finally(() => {
        _pending = null
      })
  }
  return _pending
}

/**
 * Thông tin liên hệ của website: ưu tiên CMS (admin sửa là web đổi),
 * fallback data tĩnh khi API chưa trả lời hoặc lỗi.
 * Trả về ngay giá trị tĩnh ở render đầu để không giật layout.
 */
export function useSiteContact() {
  const [info, setInfo] = useState(_cached ?? staticContactInfo)

  useEffect(() => {
    let mounted = true
    void loadContactInfo().then((value) => {
      if (mounted) setInfo(value)
    })
    return () => {
      mounted = false
    }
  }, [])

  return info
}
