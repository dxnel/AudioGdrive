import type { H3Event } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export async function requireUserId(event: H3Event): Promise<string> {
  const user: any = await serverSupabaseUser(event).catch(() => null)
  const id = user?.id ?? user?.sub
  if (!id) throw createError({ statusCode: 401, message: 'Non connecté' })
  return id as string
}

export async function getShare(event: H3Event, token: string) {
  const db = serverSupabaseServiceRole(event)
  const { data } = await db.from('shares').select('*').eq('token', token).eq('revoked', false).maybeSingle()
  if (!data || (data.expires_at && new Date(data.expires_at) < new Date())) {
    throw createError({ statusCode: 404, message: 'Lien de partage invalide ou expiré' })
  }
  return data
}

export type Need = 'view' | 'edit' | 'owner'

// Point d'entrée unique des droits sur un fichier/dossier de l'index.
//  - avec ?share=TOKEN : droits de l'invité (viewer = voir/écouter, editor = + renommer)
//  - sinon : session Supabase du propriétaire
// Un invité ne voit un élément que s'il est DANS le dossier partagé (ou est ce dossier).
export async function resolveItem(event: H3Event, driveId: string, need: Need) {
  assertId(driveId)
  const db = serverSupabaseServiceRole(event)
  const shareToken = getQuery(event).share as string | undefined

  if (shareToken) {
    if (need === 'owner') throw createError({ statusCode: 403, message: 'Réservé au propriétaire' })
    const share = await getShare(event, shareToken)
    if (need === 'edit' && share.role !== 'editor') {
      throw createError({ statusCode: 403, message: 'Ce lien est en lecture seule' })
    }
    const { data } = await db
      .from('library_items')
      .select('*')
      .eq('library_id', share.library_id)
      .eq('drive_id', driveId)
      .limit(1)
    const item = data?.[0]
    if (!item || !(item.drive_id === share.folder_id || item.path_ids.includes(share.folder_id))) {
      throw createError({ statusCode: 404, message: 'Introuvable' })
    }
    return { item, ownerId: share.owner_id as string, isOwner: false }
  }

  const userId = await requireUserId(event)
  const { data } = await db
    .from('library_items')
    .select('*')
    .eq('owner_id', userId)
    .eq('drive_id', driveId)
    .limit(1)
  const item = data?.[0]
  if (!item) throw createError({ statusCode: 404, message: 'Introuvable' })
  return { item, ownerId: userId, isOwner: true }
}
