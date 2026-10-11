import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

const FOLDER = 'application/vnd.google-apps.folder'

async function listChildren(event: H3Event, ownerId: string, folderId: string) {
  const out: any[] = []
  let pageToken: string | undefined
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false and (mimeType = '${FOLDER}' or mimeType contains 'audio/')`,
      fields: 'nextPageToken,files(id,name,mimeType,createdTime,size)',
      pageSize: '1000',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true'
    })
    if (pageToken) params.set('pageToken', pageToken)
    const res = await driveFetch(event, ownerId, `/files?${params}`)
    if (!res.ok) throw createError({ statusCode: 502, message: `Drive a répondu ${res.status}` })
    const json: any = await res.json()
    out.push(...(json.files || []))
    pageToken = json.nextPageToken
  } while (pageToken)
  return out
}

// Parcourt le dossier racine, garde uniquement les sous-dossiers qui contiennent
// de l'audio (directement ou plus bas) + les fichiers audio, et réécrit l'index.
export async function scanLibrary(event: H3Event, ownerId: string, libraryId: string, rootId: string, rootName: string) {
  const folders = new Map<string, { name: string; parent: string | null; path: string[]; created?: string }>()
  folders.set(rootId, { name: rootName, parent: null, path: [] })
  const files: any[] = []
  const queue = [rootId]

  while (queue.length) {
    const batch = queue.splice(0, 5) // 5 dossiers en parallèle
    const results = await Promise.all(
      batch.map(async (id) => ({ id, children: await listChildren(event, ownerId, id) }))
    )
    for (const { id, children } of results) {
      const parent = folders.get(id)!
      const path = [...parent.path, id]
      for (const c of children) {
        if (c.mimeType === FOLDER) {
          if (!folders.has(c.id)) {
            folders.set(c.id, { name: c.name, parent: id, path, created: c.createdTime })
            queue.push(c.id)
          }
        } else {
          files.push({ ...c, parent: id, path })
        }
      }
    }
  }

  const withAudio = new Set<string>([rootId])
  for (const f of files) for (const p of f.path) withAudio.add(p)

  const rows: any[] = []
  for (const [id, f] of folders) {
    if (!withAudio.has(id)) continue
    rows.push({
      library_id: libraryId, owner_id: ownerId, drive_id: id, parent_id: f.parent,
      name: f.name, mime_type: FOLDER, is_folder: true, created_time: f.created ?? null,
      size: null, path_ids: f.path
    })
  }
  for (const f of files) {
    rows.push({
      library_id: libraryId, owner_id: ownerId, drive_id: f.id, parent_id: f.parent,
      name: f.name, mime_type: f.mimeType, is_folder: false, created_time: f.createdTime ?? null,
      size: f.size ? Number(f.size) : null, path_ids: f.path
    })
  }

  const db = serverSupabaseServiceRole(event)
  await db.from('library_items').delete().eq('library_id', libraryId)
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from('library_items').insert(rows.slice(i, i + 500))
    if (error) throw createError({ statusCode: 500, message: error.message })
  }
  await db.from('libraries').update({ last_scan: new Date().toISOString(), name: rootName }).eq('id', libraryId)

  return { folders: rows.filter((r) => r.is_folder).length, files: files.length }
}
