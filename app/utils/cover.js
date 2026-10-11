// Pochettes générées : une couleur stable par dossier / fichier (pas d'images à charger)
const hash = (s = '') => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}
export const coverHue = (seed) => hash(String(seed)) % 360

export const coverStyle = (seed) => {
  const h = coverHue(seed)
  return { background: `linear-gradient(135deg, hsl(${h} 70% 56%), hsl(${(h + 50) % 360} 75% 36%))` }
}

// Dégradé d'ambiance derrière l'en-tête d'un dossier
export const tintStyle = (seed) => {
  const h = coverHue(seed)
  return {
    background: `linear-gradient(180deg, hsl(${h} 55% 30% / .65) 0%, hsl(${h} 40% 14% / .3) 300px, transparent 560px)`
  }
}
