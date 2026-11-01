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
  metadataBase: new URL('https://gremioestelar.com'),
  title: {
    default: 'Gremio Estelar — La Red & Comunidad de VTubers y Streamers',
    template: '%s | Gremio Estelar',
  },
  description:
    'Gremio Estelar es la plataforma definitiva para conectar creadores de contenido virtual en español. Gestiona tu perfil, interactúa con la comunidad, descubre directos y lleva tu carrera al siguiente nivel.',
  keywords: [
    'VTuber',
    'Streamer',
    'comunidad',
    'streaming',
    'gremio',
    'creadores de contenido',
    'Twitch',
    'YouTube',
    'Kick',
    'Live2D',
    '3D VRM',
  ],
  authors: [{ name: 'Gremio Estelar' }],
  creator: 'Gremio Estelar',
  publisher: 'Gremio Estelar',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Gremio Estelar — La Red & Comunidad de VTubers y Streamers',
    description:
      'Descubre, conecta y apoya a creadores virtuales, VTubers y streamers en español. Perfiles verificados, directos en vivo, pases y comunidad.',
    url: 'https://gremioestelar.com',
    siteName: 'Gremio Estelar',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'Gremio Estelar',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gremio Estelar — La Red & Comunidad de VTubers y Streamers',
    description:
      'Descubre, conecta y apoya a creadores virtuales, VTubers y streamers en español. Perfiles verificados, directos en vivo y comunidad.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png' },
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
