import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const db = serverSupabaseServiceRole(event)
  const { data, error } = await db
    .from('libraries')
    .select('id,name,root_folder_id,last_scan')
    .eq('owner_id', userId)
    .order('created_at')
  if (error) throw createError({ statusCode: 500, message: error.message })
  return { libraries: data }
})
