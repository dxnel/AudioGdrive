import { serverSupabaseServiceRole } from '#supabase/server'

// Crée un lien de partage sur un sous-dossier de l'une de TES bibliothèques.
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await readBody<{ libraryId?: string; folderId?: string; role?: string; expiresInDays?: number | null }>(event)
  const folderId = assertId(body.folderId)
  const role = body.role === 'editor' ? 'editor' : 'viewer'

  const db = serverSupabaseServiceRole(event)
  const { data: item } = await db
    .from('library_items')
    .select('library_id,is_folder')
    .eq('owner_id', userId)
    .eq('library_id', String(body.libraryId || ''))
    .eq('drive_id', folderId)
    .maybeSingle()
  if (!item || !item.is_folder) throw createError({ statusCode: 404, message: 'Dossier introuvable dans cette bibliothèque' })

  const days = Number(body.expiresInDays)
  const expires_at = days > 0 ? new Date(Date.now() + days * 86_400_000).toISOString() : null

  const { data, error } = await db
    .from('shares')
    .insert({ library_id: item.library_id, owner_id: userId, folder_id: folderId, role, expires_at })
    .select('token,folder_id,role,expires_at,created_at')
    .single()
  if (error) throw createError({ statusCode: 500, message: error.message })
  return { share: data }
})
