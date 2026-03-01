import '../styles/globals.css';
import Navbar from '../components/Navbar';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Ramadan Game Hub',
  description: 'Plateforme de jeux multijoueurs en ligne pour étudiants',
};

/**
 * Layout racine appliqué à toutes les pages.  Il définit la langue, le mode
 * sombre et intègre la barre de navigation.  Le fichier CSS global
 * (`styles/globals.css`) contient l’import Tailwind.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-secondary min-h-screen text-white">
        <Navbar />
        <main className="container mx-auto p-4 flex flex-col min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </body>
    </html>
  );
}