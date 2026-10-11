import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')!
  const db = serverSupabaseServiceRole(event)
  const { data: lib } = await db.from('libraries').select('*').eq('id', id).eq('owner_id', userId).maybeSingle()
  if (!lib) throw createError({ statusCode: 404, message: 'Bibliothèque introuvable' })
  return await scanLibrary(event, userId, lib.id, lib.root_folder_id, lib.name)
})
