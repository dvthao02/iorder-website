import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { config } from 'dotenv'

const repositoryRoot = resolve(import.meta.dirname, '../../..')
config({ path: resolve(repositoryRoot, '.env') })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required to back up the CMS database')

const backupDir = resolve(process.env.BACKUP_DIR ?? resolve(repositoryRoot, 'backups'))
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupPath = resolve(backupDir, `iordercms-${timestamp}.dump`)

function run(command: string, args: string[]) {
  return new Promise<void>((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: false })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolvePromise()
      else reject(new Error(`${command} exited with code ${code ?? 'unknown'}`))
    })
  })
}

await mkdir(backupDir, { recursive: true })
await run('pg_dump', ['--format=custom', '--no-owner', '--no-acl', '--file', backupPath, databaseUrl])

process.stdout.write(`Database backup created: ${backupPath}\n`)
