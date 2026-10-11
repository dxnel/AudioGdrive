import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

// AES-256-GCM. Format stocké : base64( iv(12) | tag(16) | données )
function getKey(): Buffer {
  const raw = useRuntimeConfig().encryptionKey
  const key = Buffer.from(raw || '', 'base64')
  if (key.length !== 32) {
    throw createError({
      statusCode: 500,
      message: 'NUXT_ENCRYPTION_KEY invalide : génère-la avec `openssl rand -base64 32`'
    })
  }
  return key
}

export function encrypt(text: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv)
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString('base64')
}

export function decrypt(payload: string): string {
  const buf = Buffer.from(payload, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', getKey(), buf.subarray(0, 12))
  decipher.setAuthTag(buf.subarray(12, 28))
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8')
}
