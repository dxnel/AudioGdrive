// Proxy audio Drive -> navigateur.
// Le token Google ne quitte JAMAIS le serveur. Le <audio> appelle simplement
//   /api/stream?id=<driveId>            (propriétaire, cookie de session)
//   /api/stream?id=<driveId>&share=<t>  (invité, lien de partage)
// Les requêtes Range sont relayées : indispensable pour le seek et pour Safari.
export default defineEventHandler(async (event) => {
  const id = String(getQuery(event).id || '')
  const { item, ownerId } = await resolveItem(event, id, 'view')
  if (item.is_folder) throw createError({ statusCode: 400, message: 'Ce n\'est pas un fichier' })

  const headers: Record<string, string> = {}
  const range = getHeader(event, 'range')
  if (range) headers.Range = range

  // Coupe le flux Drive si l'auditeur ferme l'onglet / change de morceau
  const abort = new AbortController()
  event.node.req.on('close', () => abort.abort())

  const upstream = await driveFetch(event, ownerId, `/files/${id}?alt=media&supportsAllDrives=true`, {
    headers,
    signal: abort.signal
  })

  if (![200, 206, 416].includes(upstream.status)) {
    throw createError({
      statusCode: upstream.status === 404 ? 404 : 502,
      message: `Lecture Drive impossible (${upstream.status})`
    })
  }

  setResponseStatus(event, upstream.status)

  let type = upstream.headers.get('content-type') || ''
  if (!type || type.startsWith('application/octet-stream')) type = item.mime_type || 'audio/mpeg'
  setHeader(event, 'content-type', type)
  for (const h of ['content-length', 'content-range']) {
    const v = upstream.headers.get(h)
    if (v) setHeader(event, h, v)
  }
  setHeader(event, 'accept-ranges', 'bytes')
  setHeader(event, 'cache-control', 'private, max-age=3600')

  return upstream.body
})
