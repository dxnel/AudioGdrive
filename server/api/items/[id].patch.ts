import { serverSupabaseServiceRole } from '#supabase/server'

// Renommer (propriétaire, ou invité avec un lien "editor")
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const { name } = await readBody<{ name?: string }>(event)
  const newName = (name || '').trim()
  if (!newName || newName.length > 255) throw createError({ statusCode: 400, message: 'Nom invalide' })

  const { item, ownerId } = await resolveItem(event, id, 'edit')

  const res = await driveFetch(event, ownerId, `/files/${id}?supportsAllDrives=true`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: newName })
  })
  if (!res.ok) throw createError({ statusCode: 502, message: `Renommage refusé par Drive (${res.status})` })

  const db = serverSupabaseServiceRole(event)
  await db.from('library_items').update({ name: newName }).eq('owner_id', ownerId).eq('drive_id', item.drive_id)
  return { ok: true, name: newName }
})
