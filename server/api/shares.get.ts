import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const q = getQuery(event)
  const db = serverSupabaseServiceRole(event)
  let query = db
    .from('shares')
    .select('token,folder_id,role,expires_at,created_at')
    .eq('owner_id', userId)
    .eq('revoked', false)
    .order('created_at', { ascending: false })
  if (q.libraryId) query = query.eq('library_id', String(q.libraryId))
  if (q.folderId) query = query.eq('folder_id', assertId(q.folderId))
  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, message: error.message })
  return { shares: data }
})
