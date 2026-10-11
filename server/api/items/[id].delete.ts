import { serverSupabaseServiceRole } from '#supabase/server'

// Met à la corbeille Drive (récupérable 30 jours) puis retire de l'index. Propriétaire uniquement.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const { item, ownerId } = await resolveItem(event, id, 'owner')
  const db = serverSupabaseServiceRole(event)

  const { data: isRoot } = await db
    .from('libraries').select('id').eq('owner_id', ownerId).eq('root_folder_id', item.drive_id).limit(1)
  if (isRoot?.length) {
    throw createError({ statusCode: 400, message: 'C\'est la racine de la bibliothèque : supprime la bibliothèque à la place.' })
  }

  const res = await driveFetch(event, ownerId, `/files/${id}?supportsAllDrives=true`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ trashed: true })
  })
  if (!res.ok) throw createError({ statusCode: 502, message: `Suppression refusée par Drive (${res.status})` })

  // Retire l'élément et, si c'est un dossier, tout son contenu de l'index
  await db
    .from('library_items')
    .delete()
    .eq('owner_id', ownerId)
    .or(`drive_id.eq.${item.drive_id},path_ids.cs.{${item.drive_id}}`)
  return { ok: true }
})
