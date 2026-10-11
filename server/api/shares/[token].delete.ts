import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const token = getRouterParam(event, 'token')!
  const db = serverSupabaseServiceRole(event)
  await db.from('shares').update({ revoked: true }).eq('token', token).eq('owner_id', userId)
  return { ok: true }
})
