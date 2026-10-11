import { serverSupabaseServiceRole } from '#supabase/server'

// Vue invité : uniquement le dossier partagé et tout ce qu'il contient.
export default defineEventHandler(async (event) => {
  const share = await getShare(event, getRouterParam(event, 'token')!)
  const db = serverSupabaseServiceRole(event)

  const { data, error } = await db
    .from('library_items')
    .select('drive_id,parent_id,name,mime_type,is_folder,created_time,size,path_ids')
    .eq('library_id', share.library_id)
    .or(`drive_id.eq.${share.folder_id},path_ids.cs.{${share.folder_id}}`)
  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!data?.length) throw createError({ statusCode: 404, message: 'Dossier partagé introuvable' })

  return {
    share: { role: share.role, folderId: share.folder_id, expiresAt: share.expires_at },
    items: data
  }
})
