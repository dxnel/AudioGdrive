import { serverSupabaseServiceRole } from '#supabase/server'

// Crée une bibliothèque (ou réutilise l'existante) sur un dossier Drive puis l'indexe.
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const { folderId } = await readBody<{ folderId?: string }>(event)
  const rootId = assertId(folderId)

  // Vérifie que c'est bien un dossier accessible et récupère son vrai nom
  const res = await driveFetch(event, userId, `/files/${rootId}?fields=id,name,mimeType&supportsAllDrives=true`)
  if (!res.ok) throw createError({ statusCode: 404, message: 'Dossier introuvable sur ton Drive' })
  const meta: any = await res.json()
  if (meta.mimeType !== 'application/vnd.google-apps.folder') {
    throw createError({ statusCode: 400, message: 'Ce n\'est pas un dossier' })
  }

  const db = serverSupabaseServiceRole(event)
  let { data: lib } = await db
    .from('libraries').select('*').eq('owner_id', userId).eq('root_folder_id', rootId).maybeSingle()
  if (!lib) {
    const ins = await db
      .from('libraries')
      .insert({ owner_id: userId, root_folder_id: rootId, name: meta.name })
      .select('*').single()
    if (ins.error) throw createError({ statusCode: 500, message: ins.error.message })
    lib = ins.data
  }

  const stats = await scanLibrary(event, userId, lib!.id, rootId, meta.name)
  return { library: { id: lib!.id, name: meta.name, root_folder_id: rootId }, ...stats }
})
