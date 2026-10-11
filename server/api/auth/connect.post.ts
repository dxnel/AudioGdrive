import { serverSupabaseServiceRole } from '#supabase/server'

// Le navigateur reçoit le refresh token Google UNE fois, juste après le login.
// On le stocke chiffré côté serveur : plus jamais de "Pass expiré" après 1h.
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const { refreshToken } = await readBody<{ refreshToken?: string }>(event)
  if (!refreshToken || typeof refreshToken !== 'string') {
    throw createError({ statusCode: 400, message: 'refreshToken manquant' })
  }

  const db = serverSupabaseServiceRole(event)
  const { error } = await db.from('drive_connections').upsert({
    user_id: userId,
    refresh_token_enc: encrypt(refreshToken),
    updated_at: new Date().toISOString()
  })
  if (error) throw createError({ statusCode: 500, message: error.message })

  // Vérifie que le token fonctionne vraiment (sinon il est supprimé et l'erreur remonte)
  forgetToken(userId)
  await getAccessToken(event, userId, true)
  return { connected: true }
})
