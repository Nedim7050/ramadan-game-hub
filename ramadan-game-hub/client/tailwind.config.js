/**
 * Configuration Tailwind CSS pour Ramadan Game Hub.
 *
 * Nous activons le mode sombre par défaut en utilisant la classe `dark` sur
 * le `<html>` dans `layout.tsx`.  Les couleurs et styles peuvent être
 * adaptés pour donner une ambiance « Ramadan » (tons sombres et accents
 * dorés).  Vous pouvez personnaliser ce thème dans la section `theme`.
 */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FACC15', // jaune doré pour rappeler les lanternes de Ramadan
        secondary: '#1F2937', // gris foncé pour fond
        accent: '#4F46E5' // violet foncé pour éléments interactifs
      }
    }
  },
  plugins: []
}