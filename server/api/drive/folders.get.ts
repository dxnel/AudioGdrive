// Navigateur de dossiers pour choisir la racine d'une bibliothèque.
// GET /api/drive/folders?parent=root  -> sous-dossiers directs du parent
export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const parent = assertId((getQuery(event).parent as string) || 'root')

  const params = new URLSearchParams({
    q: `'${parent}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id,name)',
    orderBy: 'name',
    pageSize: '1000',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true'
  })
  const res = await driveFetch(event, userId, `/files?${params}`)
  if (!res.ok) throw createError({ statusCode: 502, message: `Drive a répondu ${res.status}` })
  const json: any = await res.json()
  return { folders: json.files || [] }
})
