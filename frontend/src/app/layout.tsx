import type { Metadata } from 'next';

import { AuthProvider } from '@/lib/AuthContext';
import { ToastProvider } from '@/lib/ToastContext';
import Navbar from '@/components/layout/Navbar';
import ParticlesBackground from '@/components/landing/ParticlesBackground';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gremio Estelar — El Hogar de los VTubers',
  description:
    'Gremio Estelar es la plataforma definitiva para conectar creadores de contenido virtual. Gestiona tu perfil, interactúa con la comunidad y lleva tu carrera al siguiente nivel.',
  keywords: ['VTuber', 'comunidad', 'streaming', 'gremio', 'creadores de contenido'],
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <ParticlesBackground />
        <ToastProvider>
          <AuthProvider>
            <Navbar />
            <main className="page">
              {children}
            </main>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}