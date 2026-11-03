import env from '../config/env';
import logger from '../utils/logger';

interface SendPasswordResetParams {
  to: string;
  username: string;
  resetUrl: string;
}

export const sendPasswordResetEmail = async ({
  to,
  username,
  resetUrl,
}: SendPasswordResetParams): Promise<{ success: boolean; id?: string; error?: string }> => {
  const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;

  if (!apiKey) {
    logger.warn(`[EMAIL:DEV] RESEND_API_KEY not set. Reset URL for ${to}: ${resetUrl}`);
    return { success: true, id: 'dev-mode' };
  }

  const fromEmail = env.EMAIL_FROM || process.env.EMAIL_FROM || 'Gremio Estelar <onboarding@resend.dev>';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recupera tu Acceso Cósmico</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080914; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f0f0f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #080914; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background: #111428; border: 1px solid rgba(138, 43, 226, 0.35); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 32px 30px 24px; text-align: center; background: linear-gradient(135deg, rgba(138, 43, 226, 0.25), rgba(0, 229, 255, 0.15)); border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <div style="font-size: 1.6rem; font-weight: 800; letter-spacing: -0.02em; color: #ffffff; text-shadow: 0 2px 10px rgba(138,43,226,0.6);">
                ✦ Gremio Estelar ✦
              </div>
              <div style="font-size: 0.85rem; color: #a78bfa; margin-top: 6px; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600;">
                Recuperación de Contraseña
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 28px;">
              <h2 style="font-size: 1.25rem; font-weight: 700; margin: 0 0 14px; color: #ffffff;">
                Hola, <span style="color: #00e5ff;">${username}</span> ✧
              </h2>
              <p style="font-size: 0.95rem; line-height: 1.65; color: #cbd5e1; margin: 0 0 24px;">
                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Gremio Estelar</strong>. Presiona el siguiente botón para elegir una nueva clave cósmica:
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8a2be2, #4f46e5); color: #ffffff; font-size: 0.95rem; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 20px rgba(138, 43, 226, 0.4); letter-spacing: 0.02em;">
                      Restablecer mi Contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 0.82rem; line-height: 1.5; color: #94a3b8; margin: 0 0 16px;">
                Este enlace expirará en <strong>60 minutos</strong> por tu seguridad. Si no solicitaste este cambio, puedes ignorar este mensaje; tu cuenta sigue completamente protegida.
              </p>

              <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 18px; margin-top: 24px;">
                <p style="font-size: 0.75rem; color: #64748b; line-height: 1.5; margin: 0; word-break: break-all;">
                  Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                  <a href="${resetUrl}" style="color: #a78bfa; text-decoration: underline;">${resetUrl}</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 30px; text-align: center; background-color: #0b0d19; border-top: 1px solid rgba(255, 255, 255, 0.05); font-size: 0.75rem; color: #64748b;">
              ✦ Gremio Estelar — La comunidad de creadores y VTubers
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: '✦ Gremio Estelar — Recupera tu contraseña',
        html,
        text: `Hola ${username},\n\nRecibimos una solicitud para restablecer tu contraseña en Gremio Estelar.\n\nAccede al siguiente enlace para restablecerla (válido por 60 minutos):\n${resetUrl}\n\nSi no fuiste tú, ignora este correo.`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error(`[EMAIL] Failed to send email via Resend: ${JSON.stringify(data)}`);
      return { success: false, error: data?.message || 'Error al enviar correo' };
    }

    logger.info(`[EMAIL] Password reset email sent to ${to} (id: ${data.id})`);
    return { success: true, id: data.id };
  } catch (error: any) {
    logger.error(`[EMAIL] Network error sending email: ${error?.message || error}`);
    return { success: false, error: error?.message || 'Error de red con el servicio de correo' };
  }
};
