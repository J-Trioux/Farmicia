import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Les Jardins de Rosalie', description: 'Un petit jardin, de grandes découvertes. Un jeu de ferme paisible en français.' };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {return <html lang="fr"><body>{children}</body></html>}
