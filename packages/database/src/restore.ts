import { access } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { config } from 'dotenv'

const repositoryRoot = resolve(import.meta.dirname, '../../..')
config({ path: resolve(repositoryRoot, '.env') })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required to restore the CMS database')

const backupInput = process.env.BACKUP_FILE ?? process.argv[2]
if (!backupInput) throw new Error('BACKUP_FILE or first positional argument is required')

if (process.env.ALLOW_DATABASE_RESTORE !== 'yes') {
  throw new Error('Refusing to restore database. Set ALLOW_DATABASE_RESTORE=yes to continue.')
}

const backupPath = resolve(process.cwd(), backupInput)
await access(backupPath)

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

await run('pg_restore', [
  '--clean',
  '--if-exists',
  '--no-owner',
  '--no-acl',
  '--dbname',
  databaseUrl,
  backupPath,
])

process.stdout.write(`Database restored from: ${backupPath}\n`)
