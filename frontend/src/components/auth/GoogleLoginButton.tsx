'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import { useRouter } from 'next/navigation';

export default function GoogleLoginButton() {
  const { googleLogin } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  return (
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        try {
          await googleLogin(credentialResponse.credential || '');
          showToast('¡Inicio de sesión con Google exitoso! 🎉', 'success');
          router.push('/dashboard');
        } catch (err: unknown) {
          showToast(err instanceof Error ? err.message : 'Error al iniciar sesión con Google', 'error');
        }
      }}
      onError={() => {
        showToast('Error al iniciar sesión con Google', 'error');
      }}
      theme="filled_black"
      size="large"
      text="signin_with"
      shape="rectangular"
      width="100%"
      containerProps={{
        style: {
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        },
      }}
    />
  );
}
