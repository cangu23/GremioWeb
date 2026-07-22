export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { AuthProvider } from '@/lib/AuthContext';
import { ToastProvider } from '@/lib/ToastContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageTransition from '@/components/layout/PageTransition';
import './globals.css';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export const metadata: Metadata = {
  title: 'Gremio Estelar — El Hogar de los VTubers',
  description:
    'Gremio Estelar es la plataforma definitiva para conectar creadores de contenido virtual. Gestiona tu perfil, interactúa con la comunidad y lleva tu carrera al siguiente nivel.',
  keywords: ['VTuber', 'comunidad', 'streaming', 'gremio', 'creadores de contenido'],
  icons: {
    icon: [
      // SVG adaptable: cambia automáticamente entre negro (claro) y blanco (oscuro)
      { url: '/favicon.svg', type: 'image/svg+xml' },
      // PNG de respaldo para navegadores que no soporten SVG como favicon
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
        {GOOGLE_CLIENT_ID ? (
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <ToastProvider>
              <AuthProvider>
                <Navbar />
                <main className="page">
                  <PageTransition>
                    {children}
                  </PageTransition>
                </main>
                <Footer />
              </AuthProvider>
            </ToastProvider>
          </GoogleOAuthProvider>
        ) : (
          <ToastProvider>
            <AuthProvider>
              <Navbar />
              <main className="page">
                {children}
              </main>
              <Footer />
            </AuthProvider>
          </ToastProvider>
        )}
      </body>
    </html>
  );
}