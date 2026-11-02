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
    'Gremio Estelar es la agencia, red y santuario de talentos virtuales (VTubers) y streamers en español fundada por Guren Tatsumaki. Conecta talentos, directos sincronizados, lore e historia, eventos y comunidad.',
  keywords: [
    'VTuber',
    'Streamer',
    'Gremio Estelar',
    'Guren Tatsumaki',
    'AleshaWeasley',
    'Meiro Chan',
    'Chemy',
    'agencia VTuber',
    'grupo VTuber',
    'agencia de VTubers en español',
    'talentos virtuales',
    'comunidad VTuber',
    'streaming',
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
  alternateName: ['Gremio Estelar VTubers', 'GremioEstelar', 'Gremio Estelar Agency'],
  url: 'https://gremioestelar.com',
  logo: 'https://gremioestelar.com/logo.png',
  sameAs: [
    'https://x.com/GremioEstelarES',
    'https://discord.gg/SAR2EazYMa',
    'https://www.twitch.tv/gurenvt_',
  ],
  description:
    'Gremio Estelar es la agencia, red y santuario de talentos virtuales (VTubers) y streamers en español. Fundado y dirigido por Guren Tatsumaki (CEO) junto al equipo de talentos originarios AleshaWeasley y Meiro Chan, con la dirección artística de Chemy. Provee una plataforma interactiva propia para el crecimiento, colaboración, pases de comunidad, lore y transmisión de creadores digitales.',
  founder: [
    {
      '@type': 'Person',
      name: 'Guren Tatsumaki',
      jobTitle: 'Fundador & CEO',
      url: 'https://gremioestelar.com/profile/canguvt',
      sameAs: 'https://www.twitch.tv/gurenvt_',
    },
    {
      '@type': 'Person',
      name: 'AleshaWeasley',
      jobTitle: 'Co-fundadora',
      url: 'https://gremioestelar.com/profile/aleshaW',
    },
    {
      '@type': 'Person',
      name: 'Meiro Chan',
      jobTitle: 'Co-fundadora',
      url: 'https://gremioestelar.com/profile/Meiro',
    },
  ],
  employee: [
    {
      '@type': 'Person',
      name: 'Chemy',
      jobTitle: 'Directora de Arte & Ilustradora Oficial',
    },
  ],
  sponsor: [
    {
      '@type': 'Person',
      name: 'Rixzrosez',
      jobTitle: 'Ex Co-fundador (Aporte Histórico)',
    },
  ],
  knowsAbout: [
    'VTuber',
    'Virtual Talents',
    'Agencia VTuber en español',
    'Streaming',
    'Live2D',
    '3D VRM',
    'Comunidad de Creadores',
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
