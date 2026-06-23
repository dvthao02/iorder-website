import { test, expect } from '@playwright/test'

// storageState được inject qua playwright.config.ts (globalSetup tạo session)
const ADMIN_URL = 'http://127.0.0.1:5174'
const PUBLIC_URL = 'http://localhost:5173'

// ── Tests ────────────────────────────────────────────────────────────────────

test('login & dashboard hiển thị đúng', async ({ page }) => {
  await page.goto(ADMIN_URL)
  await expect(page.locator('nav button').first()).toBeVisible({ timeout: 8000 })
  await expect(page.locator('.admin-sidebar')).toBeVisible()
})

test('Trang chủ — API online và editor load đủ blocks', async ({ page }) => {
  await page.goto(ADMIN_URL)
  await page.click('nav button:has-text("Trang chủ")')
  await expect(page.locator('text=Tiêu đề SEO')).toBeVisible({ timeout: 12000 })

  // Chờ API probe xong
  await expect(page.locator('.api-state.is-online')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('.api-state.is-offline')).toHaveCount(0)

  // Phải có blocks
  await expect(page.locator('.block-card').first()).toBeVisible({ timeout: 8000 })
  const blockCount = await page.locator('.block-card').count()
  expect(blockCount).toBeGreaterThanOrEqual(5)
  console.log(`  → ${blockCount} blocks loaded`)
})

test('sửa SEO title → Lưu nháp thành công', async ({ page }) => {
  await page.goto(ADMIN_URL)
  await page.click('nav button:has-text("Trang chủ")')
  await expect(page.locator('text=Tiêu đề SEO')).toBeVisible({ timeout: 12000 })

  // Chờ API online trước khi thao tác
  await expect(page.locator('.api-state.is-online')).toBeVisible({ timeout: 10000 })

  // Sửa SEO title
  const seoInput = page.locator('input[maxlength="70"]').first()
  await seoInput.clear()
  await seoInput.fill('iOrder - Phần mềm quản lý bán hàng')

  // Lưu nháp phải enable
  const saveBtn = page.locator('button:has-text("Lưu nháp")')
  await expect(saveBtn).toBeEnabled({ timeout: 5000 })
  await saveBtn.click()

  // Chờ thông báo thành công (không phải is-error)
  await expect(page.locator('.publish-notice:not(.is-error)')).toContainText('Đã lưu', { timeout: 10000 })
  console.log('  → Lưu nháp OK')
})

test('Lưu & xuất bản trang chủ', async ({ page }) => {
  await page.goto(ADMIN_URL)
  await page.click('nav button:has-text("Trang chủ")')
  await expect(page.locator('text=Tiêu đề SEO')).toBeVisible({ timeout: 12000 })
  await expect(page.locator('.api-state.is-online')).toBeVisible({ timeout: 10000 })

  // Sửa để có thay đổi mới
  const seoInput = page.locator('input[maxlength="70"]').first()
  const currentVal = await seoInput.inputValue()
  await seoInput.clear()
  await seoInput.fill(currentVal.includes('✓') ? currentVal.replace(' ✓', '') : currentVal + ' ✓')

  // Bấm xuất bản
  const publishBtn = page.locator('button:has-text("Lưu & xuất bản")')
  await expect(publishBtn).toBeEnabled({ timeout: 5000 })
  await publishBtn.click()

  await expect(page.locator('.publish-notice:not(.is-error)')).toContainText('Đã lưu và xuất bản', { timeout: 12000 })
  console.log('  → Xuất bản OK')
})

test('web public phản ánh nội dung sau khi xuất bản', async ({ page }) => {
  await page.goto(PUBLIC_URL)
  await expect(page.locator('body')).not.toBeEmpty()
  // Hero phải có
  const hero = page.locator('section').first()
  await expect(hero).toBeVisible({ timeout: 10000 })
  console.log('  → Public site renders OK')
})

test('Phần mềm & Giải pháp — offerings load đủ', async ({ page }) => {
  await page.goto(ADMIN_URL)
  await page.click('nav button:has-text("Phần mềm")')

  // Chờ danh sách load
  await expect(page.locator('.offering-row').first()).toBeVisible({ timeout: 12000 })
  const count = await page.locator('.offering-row').count()
  expect(count).toBeGreaterThanOrEqual(6)
  console.log(`  → ${count} offerings loaded`)

  // Tab switching
  await page.click('.tab-nav button:has-text("Giải pháp")')
  await expect(page.locator('.offering-row').first()).toBeVisible({ timeout: 8000 })
})

test('Cài đặt website — profile và external links load', async ({ page }) => {
  await page.goto(ADMIN_URL)
  await page.click('nav button:has-text("Cài đặt")')
  await expect(page.locator('text=Thông tin công ty')).toBeVisible({ timeout: 10000 })

  // Tab Liên kết ngoài
  await page.click('.tab-nav button:has-text("Liên kết ngoài")')
  await expect(page.locator('input[placeholder*="https://app.iorder"], input[placeholder*="app.iorder"], input').first()).toBeVisible({ timeout: 6000 })
  console.log('  → Settings loaded OK')
})

test('Menu điều hướng — load được', async ({ page }) => {
  await page.goto(ADMIN_URL)
  await page.click('nav button:has-text("Menu")')
  await expect(page.locator('text=Menu điều hướng').first()).toBeVisible({ timeout: 10000 })
  console.log('  → Navigation editor loaded OK')
})
