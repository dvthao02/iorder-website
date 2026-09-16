import * as Minio from 'minio'

const required = ['MINIO_ROOT_USER', 'MINIO_ROOT_PASSWORD', 'MINIO_BUCKET'] as const
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} is required to initialize MinIO.`)
}

const endpoint = process.env.MINIO_ENDPOINT ?? 'minio'
const port = Number(process.env.MINIO_PORT ?? '9000')
const useSSL = process.env.MINIO_USE_SSL === 'true'
const bucket = process.env.MINIO_BUCKET!
const client = new Minio.Client({
  endPoint: endpoint,
  port,
  useSSL,
  accessKey: process.env.MINIO_ROOT_USER!,
  secretKey: process.env.MINIO_ROOT_PASSWORD!,
})

const exists = await client.bucketExists(bucket)
if (!exists) await client.makeBucket(bucket)

await client.setBucketPolicy(
  bucket,
  JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  }),
)

process.stdout.write(`MinIO bucket is ready: ${bucket}\n`)
