export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';

import { AuthProvider } from '@/lib/AuthContext';
import { ToastProvider } from '@/lib/ToastContext';
import ClientLayoutShell from '@/components/layout/ClientLayoutShell';
import GlobalMusicPlayer from '@/components/layout/GlobalMusicPlayer';
import PageTransition from '@/components/layout/PageTransition';
import ClientOnly from '@/lib/ClientOnly';
import ParticlesBackground from '@/components/landing/ParticlesBackground';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gremio Estelar — El Hogar de los VTubers',
  description:
    'Gremio Estelar es la plataforma definitiva para conectar creadores de contenido virtual. Gestiona tu perfil, interactúa con la comunidad y lleva tu carrera al siguiente nivel.',
  keywords: ['VTuber', 'comunidad', 'streaming', 'gremio', 'creadores de contenido'],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.png', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientOnly fallback={null}>
          <ParticlesBackground />
        </ClientOnly>
        {/* One music player for the whole site — survives navigation, never
            restarts when changing pages (stelar.mp3 in frontend/public/audio) */}
        <GlobalMusicPlayer />
        {/* ⚡ OPTIMIZACIÓN: GoogleOAuthProvider (que inyecta el script GSI de
            Google ~300KB) se movió a GoogleLoginButton, que es su único
            consumidor (login/registro). Antes se cargaba en TODAS las páginas. */}
        <ToastProvider>
          <AuthProvider>
            {/* PageTransition must wrap ClientLayoutShell (NOT be wrapped by
                it): ClientLayoutShell swaps its JSX shape between auth pages
                (bare fragment) and normal pages (Navbar+main+Footer), which
                would remount PageTransition and reset its ref — breaking the
                veil on navigation. As a stable outer wrapper it survives. */}
            <PageTransition>
              <ClientLayoutShell>
                {children}
              </ClientLayoutShell>
            </PageTransition>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}