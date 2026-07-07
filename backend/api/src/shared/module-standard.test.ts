import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

// Các module hiện có service.ts với mutation method (create/update/delete/...) nhưng CHƯA gọi insertAuditLog.
// nợ chuẩn — xóa dần khỏi danh sách khi nâng cấp
const KNOWN_VIOLATIONS = ['navigation']

// Các module hiện chưa có file <name>.service.test.ts.
// nợ chuẩn — xóa dần khỏi danh sách khi nâng cấp
const KNOWN_MISSING_TESTS = ['categories', 'downloads', 'media', 'navigation', 'partners', 'settings', 'testimonials']

// settings module hiện chưa có file <name>.errors.ts (không throw ApplicationError subclass riêng).
// nợ chuẩn — xóa dần khỏi danh sách khi nâng cấp
const KNOWN_MISSING_STRUCTURE: Record<string, string[]> = {
  settings: ['settings.errors.ts'],
}

const MODULES_DIR = join(import.meta.dirname, '../modules')

function listModuleNames(): string[] {
  return readdirSync(MODULES_DIR).filter((entry) => statSync(join(MODULES_DIR, entry)).isDirectory())
}

const MUTATION_METHOD_REGEX = /async\s+(create|update|delete|publish|unpublish|archive|restore)\w*\s*\(/

describe('module structure standard (CLAUDE.md: backend/api/src/modules/<name>/)', () => {
  const moduleNames = listModuleNames()

  it('finds at least one module to check', () => {
    expect(moduleNames.length).toBeGreaterThan(0)
  })

  for (const name of moduleNames) {
    const dir = join(MODULES_DIR, name)
    const requiredFiles = [
      `${name}.repository.ts`,
      `${name}.service.ts`,
      `${name}.errors.ts`,
      `${name}-routes.ts`,
      'index.ts',
    ]
    const exempt = new Set(KNOWN_MISSING_STRUCTURE[name] ?? [])

    it(`${name}: has required files (.repository/.service/.errors/-routes/index)`, () => {
      for (const file of requiredFiles) {
        if (exempt.has(file)) continue
        expect(existsSync(join(dir, file)), `Missing ${name}/${file}`).toBe(true)
      }
    })

    it(`${name}: mutation methods in service call insertAuditLog (or are in KNOWN_VIOLATIONS)`, () => {
      const servicePath = join(dir, `${name}.service.ts`)
      if (!existsSync(servicePath)) return // đã báo ở test structure phía trên

      const content = readFileSync(servicePath, 'utf-8')
      const hasMutation = MUTATION_METHOD_REGEX.test(content)
      const hasAuditLog = content.includes('insertAuditLog')

      if (hasMutation && !hasAuditLog) {
        expect(KNOWN_VIOLATIONS, `${name}.service.ts has mutation method(s) without insertAuditLog`).toContain(name)
      }
    })

    it(`${name}: has <name>.service.test.ts (or is in KNOWN_MISSING_TESTS)`, () => {
      const testPath = join(dir, `${name}.service.test.ts`)
      if (!existsSync(testPath)) {
        expect(KNOWN_MISSING_TESTS, `${name}.service.test.ts is missing`).toContain(name)
      }
    })
  }
})
