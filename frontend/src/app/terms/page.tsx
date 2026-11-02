import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Términos y Condiciones de Servicio',
  description: 'Términos y Condiciones de Servicio de Gremio Estelar. Normas de la comunidad, planes, economía de creadores y uso de la plataforma.',
};

export default function TermsPage() {
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
          color: '#fbbf24',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '8px',
        }}>
          ✦ Reglas del Santuario & Contrato de Servicio
        </div>
        <h1 style={{
          fontSize: '2.4rem',
          fontWeight: 900,
          color: '#ffffff',
          margin: '0 0 12px',
          letterSpacing: '-0.02em',
        }}>
          Términos y Condiciones de Servicio
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
          Última actualización: {lastUpdated} | Aplicable a toda la plataforma de Gremio Estelar.
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
            1. Aceptación de los Términos
          </h2>
          <p style={{ margin: 0, color: '#cbd5e1' }}>
            Al crear una cuenta, iniciar sesión o hacer uso de las funciones públicas o privadas de <strong>Gremio Estelar</strong> (&quot;la Plataforma&quot;), usted acepta quedar vinculado legalmente por los presentes Términos y Condiciones de Servicio, así como por nuestra <Link href="/privacy" style={{ color: '#38bdf8', textDecoration: 'none' }}>Política de Privacidad</Link>. Si no está de acuerdo con alguno de los puntos establecidos, debe abstenerse de utilizar el servicio.
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
            2. Cuentas y Responsabilidad de Seguridad
          </h2>
          <ul style={{ paddingLeft: '20px', margin: 0, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              El usuario es el único responsable de preservar la confidencialidad de sus credenciales de acceso y de cualquier actividad ocurrida bajo su cuenta.
            </li>
            <li>
              Queda estrictamente prohibida la creación de cuentas mediante métodos automatizados (scripts, bots masivos) o la suplantación deliberada de identidad de cualquier creadora, streamer o miembro del equipo de administración.
            </li>
            <li>
              Cada persona física podrá operar una cuenta personal y, en su caso, un perfil asociado a su identidad como creadora o VTuber.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: 0, marginBottom: '12px' }}>
            3. Normas de Convivencia y Código de Conducta
          </h2>
          <p style={{ margin: '0 0 12px', color: '#cbd5e1' }}>
            Gremio Estelar es un santuario diseñado para el crecimiento respetuoso de la comunidad virtual. Por tanto, no se tolerará en ninguna circunstancia:
          </p>
          <ul style={{ paddingLeft: '20px', margin: 0, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Acoso, hostigamiento, difamación o filtración de información privada (doxxing).</li>
            <li>Discurso de odio, discriminación por género, orientación, etnia o nacionalidad.</li>
            <li>Publicación de contenidos ilícitos o imágenes sexualmente explícitas sin los debidos filtros o autorizaciones de la plataforma.</li>
            <li>Envío masivo de publicidad no deseada (spam) o distribución de software malicioso.</li>
          </ul>
          <p style={{ marginTop: '12px', marginBottom: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
            El equipo de moderación se reserva la facultad de suspender temporal o permanentemente cualquier cuenta que vulnere estas directrices.
          </p>
        </section>

        {/* Section 4 */}
        <section style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: 0, marginBottom: '12px' }}>
            4. Moneda Virtual (Polvo Estelar / Stardust) y Gamificación
          </h2>
          <p style={{ margin: 0, color: '#cbd5e1' }}>
            El <strong>Polvo Estelar (Stardust)</strong> es una unidad de valor digital interna empleada exclusivamente para interactuar dentro de la plataforma (recompensas, apertura de cofres, cosméticos de perfil y funciones lúdicas de la ruleta). El Polvo Estelar no posee valor monetario fiduciario fuera del ecosistema, no genera intereses y no puede ser canjeado por dinero real directamente por usuarios convencionales.
          </p>
        </section>

        {/* Section 5 */}
        <section style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: 0, marginBottom: '12px' }}>
            5. Planes Prémium, Pases Estelares y Pagos
          </h2>
          <ul style={{ paddingLeft: '20px', margin: 0, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              Las suscripciones a los planes (Astro, Nova Pro y Stellar Elite) y las adquisiciones del Pase Estelar proporcionan ventajas cosméticas y utilitarias inmediatas en la cuenta del usuario.
            </li>
            <li>
              Debido a la naturaleza de entrega digital inmediata, las compras efectuadas se consideran firmes y definitivas, a menos que un error técnico comprobable haya impedido la activación de los beneficios correspondientes.
            </li>
          </ul>
        </section>

        {/* Section 6 - Creator Economy */}
        <section style={{
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', marginTop: 0, marginBottom: '12px' }}>
            6. Economía de Creadoras y Sistema de Comisiones (35 / 35 / 30)
          </h2>
          <p style={{ margin: '0 0 10px', color: '#cbd5e1' }}>
            Gremio Estelar opera bajo un modelo de reparto transparente donde el <strong>35% de los ingresos brutos</strong> generados mediante códigos de creador se destina a la creadora afiliada:
          </p>
          <ul style={{ paddingLeft: '20px', margin: 0, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Las creadoras pueden solicitar la liquidación de sus saldos disponibles una vez alcanzado el umbral mínimo fijado ($10 USD).</li>
            <li>Los pagos se procesan de forma manual y auditada mediante transferencias directas a la cuenta de PayPal registrada por la creadora.</li>
            <li>Cualquier intento de manipulación fraudulenta, compras con instrumentos de pago indebidos o autofinanciamiento ilícito conllevará la retención de saldos y la revocación del código de creador.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: 0, marginBottom: '12px' }}>
            7. Propiedad Intelectual y Derechos de Autor (DMCA)
          </h2>
          <p style={{ margin: 0, color: '#cbd5e1' }}>
            Los modelos Live2D, avatares 3D, ilustraciones, música original y marcas asociadas a cada VTuber o creador pertenecen exclusivamente a sus legítimos autores. Gremio Estelar no reclama propiedad sobre las obras creadas por su comunidad, concediéndose únicamente una licencia de visualización técnica no exclusiva para operar el servicio web.
          </p>
          <p style={{ marginTop: '12px', marginBottom: 0, color: '#cbd5e1' }}>
            Cualquier notificación formal de infracción de derechos de autor deberá remitirse a: <a href="mailto:contacto@gremioestelar.com" style={{ color: '#38bdf8', textDecoration: 'none' }}>contacto@gremioestelar.com</a>.
          </p>
        </section>

        {/* Section 8 */}
        <section style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: 0, marginBottom: '12px' }}>
            8. Modificaciones del Servicio
          </h2>
          <p style={{ margin: 0, color: '#cbd5e1' }}>
            Gremio Estelar se reserva el derecho de implementar actualizaciones, modificaciones o mejoras continuas en las funciones de la plataforma. Toda modificación sustancial en estos términos será notificada a través del portal de novedades de la comunidad.
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
