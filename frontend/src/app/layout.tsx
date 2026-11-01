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
    'agencia VTuber',
    'grupo VTuber',
    'agencia de VTubers en español',
    'talentos virtuales',
    'comunidad VTuber',
    'streaming',
    'gremio estelar',
    'creadores de contenido virtual',
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Gremio Estelar',
  alternateName: ['Gremio Estelar VTuber Group', 'GremioEstelar'],
  url: 'https://gremioestelar.com',
  logo: 'https://gremioestelar.com/logo.png',
  description:
    'Agencia, red y comunidad de talentos virtuales y creadores de contenido VTuber en español.',
  founder: [
    { '@type': 'Person', name: 'Guren Tatsumaki' },
    { '@type': 'Person', name: 'Meiro' },
    { '@type': 'Person', name: 'Alesha' },
  ],
  knowsAbout: [
    'VTuber',
    'Virtual Talents',
    'Agencia VTuber',
    'Streaming',
    'Live2D',
    '3D VRM',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
