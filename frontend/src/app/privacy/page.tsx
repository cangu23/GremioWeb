import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de Privacidad y Tratamiento de Datos de Gremio Estelar. Información sobre el uso de datos, autenticación y protección de usuarios.',
};

export default function PrivacyPage() {
  const lastUpdated = '2 de noviembre de 2026';

  return (
    <div style={{
      maxWidth: '920px',
      margin: '0 auto',
      padding: '48px 24px 80px',
      color: '#e2e8f0',
      lineHeight: 1.75,
    }}>
      {/* Header */}
      <div style={{ marginBottom: '40px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '24px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#38bdf8',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '8px',
        }}>
          ✦ Marco Legal & Seguridad de Datos
        </div>
        <h1 style={{
          fontSize: '2.4rem',
          fontWeight: 900,
          color: '#ffffff',
          margin: '0 0 12px',
          letterSpacing: '-0.02em',
        }}>
          Política de Privacidad
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
          Última actualización: {lastUpdated} | Aplicable a la plataforma Gremio Estelar (gremioestelar.com).
        </p>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Section 1 */}
        <section style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: 0, marginBottom: '12px' }}>
            1. Identidad del Responsable
          </h2>
          <p style={{ margin: 0, color: '#cbd5e1' }}>
            La plataforma digital <strong>Gremio Estelar</strong> (en adelante, &quot;la Plataforma&quot;, &quot;nosotros&quot; o &quot;el Santuario&quot;), accesible a través del dominio principal <code>gremioestelar.com</code>, es un espacio de red comunitaria, servicios digitales y agencia para creadores virtuales (VTubers), streamers y sus audiencias. Nos comprometemos a salvaguardar la privacidad y los derechos de protección de datos de cada viajero estelar que interactúe en nuestro ecosistema.
          </p>
          <p style={{ marginTop: '12px', marginBottom: 0, color: '#cbd5e1' }}>
            Para cualquier solicitud referente a la privacidad, puedes contactar a nuestro equipo técnico mediante el correo electrónico oficial: <a href="mailto:contacto@gremioestelar.com" style={{ color: '#38bdf8', textDecoration: 'none' }}>contacto@gremioestelar.com</a>.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: 0, marginBottom: '12px' }}>
            2. Información que Recopilamos
          </h2>
          <p style={{ margin: 0, color: '#cbd5e1' }}>
            Recopilamos únicamente la información necesaria para brindar un servicio seguro, interactivo y personalizado:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '10px', marginBottom: 0, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              <strong>Datos de Cuenta Directa:</strong> Nombre de usuario (@handle), nombre visible opcional, dirección de correo electrónico y contraseña almacenada bajo cifrado criptográfico irreversible (bcrypt).
            </li>
            <li>
              <strong>Autenticación con Terceros (Google OAuth y Discord OAuth):</strong> Al utilizar el inicio de sesión federado, recibimos de manera segura tu identificador único de cuenta, correo electrónico verificado, nombre público y URL de avatar para configurar automáticamente tu perfil de usuario.
            </li>
            <li>
              <strong>Datos de Actividad en la Comunidad:</strong> Publicaciones compartidas en el feed, comentarios, insignias ganadas, progreso en el Pase Estelar, niveles de experiencia (XP) y saldo de Polvo Estelar (Stardust).
            </li>
            <li>
              <strong>Datos de Creadoras y Liquidaciones:</strong> Para creadoras que participan en la economía del 35% de comisiones, solicitamos su correo electrónico de PayPal a fin de procesar pagos de transferencias. Nunca solicitamos ni almacenamos números de tarjetas de crédito o credenciales financieras privadas.
            </li>
          </ul>
        </section>

        {/* Section 3 - Google API Disclosure */}
        <section style={{
          background: 'rgba(56, 189, 248, 0.05)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', marginTop: 0, marginBottom: '12px' }}>
            3. Cumplimiento con la Política de Datos de Usuario de Google
          </h2>
          <p style={{ margin: 0, color: '#cbd5e1' }}>
            El uso y la transferencia que Gremio Estelar realiza de la información recibida a través de las APIs de Google se adhieren rigurosamente a la <strong>Google API Services User Data Policy</strong>, incluidos los requisitos de Uso Limitado (Limited Use).
          </p>
          <div style={{ marginTop: '12px', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>✦ <strong>Uso Exclusivo:</strong> Los datos obtenidos de Google se utilizan exclusivamente para permitir el inicio de sesión rápido y la creación de tu sesión en la plataforma.</div>
            <div>✦ <strong>Sin Publicidad ni Venta:</strong> Nunca vendemos, transferimos, alquilamos ni divulgamos información obtenida de Google a anunciantes, intermediarios comerciales ni modelos de lenguaje externos con fines publicitarios.</div>
          </div>
        </section>

        {/* Section 4 */}
        <section style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: 0, marginBottom: '12px' }}>
            4. Cookies y Almacenamiento Local
          </h2>
          <p style={{ margin: 0, color: '#cbd5e1' }}>
            Gremio Estelar utiliza tecnologías de almacenamiento local y cookies técnicas con los siguientes fines:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '10px', marginBottom: 0, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              <strong>Cookies HTTP-Only:</strong> Utilizadas para mantener tu sesión activa de manera segura y proteger contra vulnerabilidades CSRF y robo de sesión.
            </li>
            <li>
              <strong>Almacenamiento Local (LocalStorage):</strong> Empleado para recordar preferencias estéticas de tu navegador, tales como el nivel de volumen del reproductor global (Sintonía Estelar) o la visibilidad de elementos interactivos.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: 0, marginBottom: '12px' }}>
            5. Derechos de Acceso, Rectificación y Supresión de Datos
          </h2>
          <p style={{ margin: 0, color: '#cbd5e1' }}>
            Cuentas con el derecho inalienable de:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '10px', marginBottom: '12px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Consultar qué datos tuyos se encuentran registrados en la plataforma.</li>
            <li>Modificar o actualizar tu información pública desde la sección de Ajustes de Perfil.</li>
            <li>Solicitar la baja y eliminación definitiva de tu cuenta y los datos asociados a la misma.</li>
          </ul>
          <p style={{ margin: 0, color: '#cbd5e1' }}>
            Para ejercer cualquiera de estos derechos, basta con enviar un mensaje a <a href="mailto:contacto@gremioestelar.com" style={{ color: '#38bdf8', textDecoration: 'none' }}>contacto@gremioestelar.com</a> con el asunto &quot;Solicitud de Datos&quot;.
          </p>
        </section>

        {/* Section 6 */}
        <section style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: 0, marginBottom: '12px' }}>
            6. Seguridad y Protección de Infraestructura
          </h2>
          <p style={{ margin: 0, color: '#cbd5e1' }}>
            Toda la comunicación entre tu navegador y los servidores de Gremio Estelar se transmite bajo cifrado SSL/TLS (HTTPS). Implementamos cortafuegos, aislamiento de consultas con Prisma ORM, sanitización estricta de contenidos y limitadores de tasa de peticiones (rate limiters) para prevenir accesos no autorizados y ataques a la infraestructura.
          </p>
        </section>
      </div>

      {/* Footer Navigation Back */}
      <div style={{ marginTop: '48px', textAlign: 'center', paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem' }}>
          ← Volver a la página principal de Gremio Estelar
        </Link>
      </div>
    </div>
  );
}
