import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

// Cache mémoire des access tokens Google (1 par propriétaire, ~1h de validité)
const tokenCache = new Map<string, { token: string; exp: number }>()

export function forgetToken(ownerId: string) {
  tokenCache.delete(ownerId)
}

// Les ids Drive sont injectés dans des requêtes `q=` : on les valide strictement.
export function assertId(id: unknown): string {
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{4,100}$/.test(id)) {
    throw createError({ statusCode: 400, message: 'ID Drive invalide' })
  }
  return id
}

function notConnected() {
  return createError({
    statusCode: 409,
    statusMessage: 'drive_not_connected',
    message: 'Google Drive non connecté : reconnecte-toi avec Google.'
  })
}

export async function getAccessToken(event: H3Event, ownerId: string, force = false): Promise<string> {
  const hit = tokenCache.get(ownerId)
  if (!force && hit && hit.exp > Date.now() + 60_000) return hit.token

  const db = serverSupabaseServiceRole(event)
  const { data } = await db
    .from('drive_connections')
    .select('refresh_token_enc')
    .eq('user_id', ownerId)
    .maybeSingle()
  if (!data) throw notConnected()

  const cfg = useRuntimeConfig()
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: cfg.googleClientId,
      client_secret: cfg.googleClientSecret,
      refresh_token: decrypt(data.refresh_token_enc),
      grant_type: 'refresh_token'
    })
  })
  const json: any = await res.json().catch(() => ({}))

  if (!res.ok) {
    tokenCache.delete(ownerId)
    if (json.error === 'invalid_grant') {
      // Token révoqué / expiré : on l'oublie, l'utilisateur doit se reconnecter
      await db.from('drive_connections').delete().eq('user_id', ownerId)
      throw notConnected()
    }
    throw createError({ statusCode: 502, message: `Google OAuth : ${json.error || res.status}` })
  }

  tokenCache.set(ownerId, { token: json.access_token, exp: Date.now() + (json.expires_in ?? 3600) * 1000 })
  return json.access_token
}

// fetch vers l'API Drive v3 avec le token du propriétaire (retry 1x si 401)
export async function driveFetch(
  event: H3Event,
  ownerId: string,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith('http') ? path : `https://www.googleapis.com/drive/v3${path}`
  const run = async (force: boolean) =>
    fetch(url, {
      ...init,
      headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${await getAccessToken(event, ownerId, force)}` }
    })
  let res = await run(false)
  if (res.status === 401) res = await run(true)
  return res
}
