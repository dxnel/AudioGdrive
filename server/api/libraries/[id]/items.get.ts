import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')!
  const db = serverSupabaseServiceRole(event)
  const { data, error } = await db
    .from('library_items')
    .select('drive_id,parent_id,name,mime_type,is_folder,created_time,size,path_ids')
    .eq('library_id', id)
    .eq('owner_id', userId)
  if (error) throw createError({ statusCode: 500, message: error.message })
  return { items: data }
})
