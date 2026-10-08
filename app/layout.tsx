import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Farmicia',
  description:
    'Un petit jardin, de grandes découvertes. Un jeu de ferme paisible en français.',
  icons: { icon: '/favicon.svg' },
};
/** Images effectivement affichées au démarrage (0.32.1 : décor et icônes retirés, jamais utilisés au premier écran). */
const FIRST_SCREEN_IMAGES = [
  // 0.21 : la carte de la saison est préchargée par la carte elle-même (next/image, priority).
  '/assets/pixel/crops-atlas.png',
];
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head>
        {/* 0.9.1 : exactement les images du premier écran (mesurées), la carte d’abord. */}
        {FIRST_SCREEN_IMAGES.map((href) => (
          <link key={href} rel="preload" as="image" href={href} />
        ))}
      </head>
      <body>{children}</body>
    </html>
  );
}
