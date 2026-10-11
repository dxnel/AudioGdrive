// Lecteur audio global (un seul <audio> pour toute l'app).
// L'état est partagé via useState, l'élément Audio est créé côté client uniquement.
export const useAudioPlayer = () => {
  const supabase = useSupabaseClient()
  const currentId = useState('ap-id', () => null)
  const playing = useState('ap-playing', () => false)
  const time = useState('ap-time', () => 0)
  const duration = useState('ap-duration', () => 0)
  const error = useState('ap-error', () => '')
  const queue = useState('ap-queue', () => []) // [{ id, src, title }]

  const ensure = () => {
    if (!import.meta.client) return null
    if (window.__audioStream) return window.__audioStream
    const a = new Audio()
    a.preload = 'metadata'
    a.addEventListener('play', () => { playing.value = true; error.value = '' })
    a.addEventListener('pause', () => { playing.value = false })
    a.addEventListener('timeupdate', () => { time.value = a.currentTime })
    a.addEventListener('loadedmetadata', () => { duration.value = a.duration })
    a.addEventListener('durationchange', () => { duration.value = a.duration })
    a.addEventListener('error', () => {
      playing.value = false
      error.value = 'Lecture impossible (fichier introuvable, droits ou format non supporté).'
    })
    a.addEventListener('ended', () => {
      playing.value = false
      const i = queue.value.findIndex(t => t.id === currentId.value)
      const next = i >= 0 ? queue.value[i + 1] : null
      if (next) load(next, true)
      else { time.value = 0 }
    })
    window.__audioStream = a
    return a
  }

  const load = async (track, autoplay = true) => {
    const a = ensure()
    if (!a) return
    currentId.value = track.id
    time.value = 0
    duration.value = 0
    error.value = ''

    // 1. On récupère le token
    const { data } = await supabase.auth.getSession()
    const providerToken = data.session?.provider_token

    if (!providerToken) {
      error.value = 'Session expirée. Veuillez vous reconnecter.'
      return
    }

    // 2. On pointe vers ton API locale
    a.src = `/api/stream?id=${track.id}&token=${providerToken}`

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: track.title || '' })
      navigator.mediaSession.setActionHandler('play', () => a.play())
      navigator.mediaSession.setActionHandler('pause', () => a.pause())
      navigator.mediaSession.setActionHandler('nexttrack', () => next())
      navigator.mediaSession.setActionHandler('previoustrack', () => prev())
    }
    
    if (autoplay) a.play().catch((e) => { if (e.name !== 'AbortError') error.value = 'Lecture bloquée' })
  }

  // track = { id, src, title } ; list = pistes de la liste affichée (lecture enchaînée)
  const toggle = (track, list = []) => {
    const a = ensure()
    if (!a) return
    if (currentId.value === track.id) {
      if (a.paused) a.play().catch(() => {})
      else a.pause()
      return
    }
    queue.value = list.length ? list : [track]
    load(track, true)
  }

  const step = (dir) => {
    const i = queue.value.findIndex(t => t.id === currentId.value)
    const t = queue.value[i + dir]
    if (t) load(t, true)
  }
  const next = () => step(1)
  const prev = () => step(-1)

  const seek = (fraction) => {
    const a = ensure()
    if (!a || !isFinite(a.duration)) return
    a.currentTime = Math.min(Math.max(fraction, 0), 1) * a.duration
  }

  const stop = () => {
    const a = ensure()
    if (!a) return
    a.pause()
    a.removeAttribute('src')
    a.load()
    currentId.value = null
    time.value = 0
    duration.value = 0
  }

  const current = computed(() => queue.value.find(t => t.id === currentId.value) || null)
  const hasNext = computed(() => {
    const i = queue.value.findIndex(t => t.id === currentId.value)
    return i >= 0 && i < queue.value.length - 1
  })
  const hasPrev = computed(() => queue.value.findIndex(t => t.id === currentId.value) > 0)
  const progress = computed(() => (duration.value > 0 && isFinite(duration.value) ? time.value / duration.value : 0))

  return { currentId, current, playing, time, duration, progress, error, hasNext, hasPrev, toggle, seek, stop, next, prev }
}
