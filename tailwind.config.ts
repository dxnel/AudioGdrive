import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  theme: {
    extend: {
      colors: {
        ink: '#0E0F12',
        surface: '#16181D',
        raised: '#1E2128',
        mute: '#8A8F9A',
        accent: { DEFAULT: '#8B8CFF', strong: '#7677F2' }
      },
      borderColor: {
        line: 'rgba(255,255,255,0.08)'
      },
      fontFamily: {
        sans: ['"Schibsted Grotesk"', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif']
      }
    }
  }
}
