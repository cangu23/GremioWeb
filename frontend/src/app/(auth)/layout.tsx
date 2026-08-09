'use client';

// ── GoogleOAuthProvider compartido ────────────────────────────────────────
// Único provider GSI para /login y /register. Antes, GoogleLoginButton montaba
// su propio GoogleOAuthProvider en cada render (login ↔ register, o el flujo
// error → Reintentar), lo que llamaba google.accounts.id.initialize() varias
// veces: warning "initialize() is called multiple times" y comportamiento
// impredecible de GSI. Al vivir en el layout del grupo (auth), el provider se
// monta UNA vez y persiste entre las dos rutas.
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  if (!GOOGLE_CLIENT_ID) return <>{children}</>;
  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>;
}
