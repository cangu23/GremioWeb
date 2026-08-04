export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { AuthProvider } from '@/lib/AuthContext';
import { ToastProvider } from '@/lib/ToastContext';
import ClientLayoutShell from '@/components/layout/ClientLayoutShell';
import PageTransition from '@/components/layout/PageTransition';
import ClientOnly from '@/lib/ClientOnly';
import ParticlesBackground from '@/components/landing/ParticlesBackground';
import './globals.css';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

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
        {GOOGLE_CLIENT_ID ? (
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <ToastProvider>
              <AuthProvider>
                <ClientLayoutShell>
                  <PageTransition>
                    {children}
                  </PageTransition>
                </ClientLayoutShell>
              </AuthProvider>
            </ToastProvider>
          </GoogleOAuthProvider>
        ) : (
          <ToastProvider>
            <AuthProvider>
              <ClientLayoutShell>
                {children}
              </ClientLayoutShell>
            </AuthProvider>
          </ToastProvider>
        )}
      </body>
    </html>
  );
}