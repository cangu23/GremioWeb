import prisma from '../../database/prisma';

let isTableInitialized = false;

/**
 * Asegura que la tabla cuentas_vinculadas exista en la base de datos
 */
export async function initDiscordLinkTable(): Promise<void> {
  if (isTableInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS cuentas_vinculadas (
        discord_id VARCHAR(100) PRIMARY KEY,
        gremio_username VARCHAR(100) NOT NULL,
        gremio_user_id VARCHAR(100) NOT NULL,
        gremio_plan VARCHAR(50) DEFAULT 'FREE',
        vinculado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultimo_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    isTableInitialized = true;
  } catch (err) {
    console.warn('✦ [DiscordLink] Advertencia al verificar tabla cuentas_vinculadas:', err);
  }
}

export interface DiscordLinkStatus {
  connected: boolean;
  discordId?: string;
  discordUsername?: string;
  plan?: string;
  linkedAt?: string;
}

/**
 * Obtiene el estado de vinculación de Discord para un usuario
 */
export async function getDiscordLinkByUserId(userId: string): Promise<DiscordLinkStatus> {
  await initDiscordLinkTable();
  try {
    const rows: any[] = await prisma.$queryRaw`
      SELECT discord_id, gremio_username, gremio_plan, vinculado_en
      FROM cuentas_vinculadas
      WHERE gremio_user_id = ${userId}
      LIMIT 1
    `;

    if (rows && rows.length > 0) {
      const row = rows[0];
      return {
        connected: true,
        discordId: String(row.discord_id),
        discordUsername: String(row.gremio_username),
        plan: String(row.gremio_plan || 'FREE'),
        linkedAt: row.vinculado_en ? new Date(row.vinculado_en).toISOString() : undefined,
      };
    }

    return { connected: false };
  } catch (err) {
    console.error('Error al consultar estado de Discord:', err);
    return { connected: false };
  }
}

/**
 * Vincula una cuenta de Discord a un usuario existente y otorga bono de bienvenida
 */
export async function linkDiscordAccount(
  userId: string,
  discordId: string,
  discordUsername: string,
): Promise<{ alreadyLinked: boolean; effectivePlan: string }> {
  await initDiscordLinkTable();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, plan: true, role: true },
  });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  // Verificar si ya existía una vinculación previa para otorgar el bono solo 1 vez
  const existing: any[] = await prisma.$queryRaw`
    SELECT discord_id FROM cuentas_vinculadas WHERE gremio_user_id = ${userId} LIMIT 1
  `;
  const isFirstTime = !existing || existing.length === 0;

  // Limpiar posibles registros huérfanos con ese mismo discordId o userId
  await prisma.$executeRaw`
    DELETE FROM cuentas_vinculadas WHERE gremio_user_id = ${userId} OR discord_id = ${discordId}
  `;

  const effectivePlan = user.plan || 'FREE';

  await prisma.$executeRaw`
    INSERT INTO cuentas_vinculadas (discord_id, gremio_username, gremio_user_id, gremio_plan, vinculado_en, ultimo_sync)
    VALUES (${discordId}, ${discordUsername}, ${userId}, ${effectivePlan}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;

  // Otorgar bono de bienvenida de 150 Stardust si es su primera vez
  if (isFirstTime) {
    await prisma.user.update({
      where: { id: userId },
      data: { stardust: { increment: 150 } },
    });
  }

  return {
    alreadyLinked: !isFirstTime,
    effectivePlan,
  };
}

/**
 * Desvincula la cuenta de Discord
 */
export async function unlinkDiscordAccount(userId: string): Promise<boolean> {
  await initDiscordLinkTable();
  try {
    await prisma.$executeRaw`
      DELETE FROM cuentas_vinculadas WHERE gremio_user_id = ${userId}
    `;
    return true;
  } catch (err) {
    console.error('Error al desvincular Discord:', err);
    return false;
  }
}
