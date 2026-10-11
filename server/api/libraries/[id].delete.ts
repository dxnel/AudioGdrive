import { serverSupabaseServiceRole } from '#supabase/server'

// Supprime la bibliothèque de l'app (index + liens de partage). Le Drive n'est pas touché.
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = getRouterParam(event, 'id')!
  const db = serverSupabaseServiceRole(event)
  await db.from('libraries').delete().eq('id', id).eq('owner_id', userId)
  return { ok: true }
})
