import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = serverSupabaseServiceRole(event)
  const { data } = await db.from('drive_connections').select('user_id').eq('user_id', userId).maybeSingle()
  return { connected: !!data }
})
