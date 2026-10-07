import prisma from '../database/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

async function main() {
  console.log('[DB] Iniciando seed mínimo...');

  // 1. ADMIN mínimo
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@gremioestelar.com';
  const username = process.env.SEED_ADMIN_USERNAME || 'admin_master';

  let passwordPlain = process.env.SEED_ADMIN_PASSWORD || '';
  if (!passwordPlain) {
    passwordPlain = crypto.randomBytes(12).toString('base64url');
    console.warn('[DB] SEED_ADMIN_PASSWORD no definido — se generó una contraseña aleatoria.');
  } else if (passwordPlain === 'Admin123!' || passwordPlain.length < 12) {
    throw new Error('[DB] SEED_ADMIN_PASSWORD debe tener al menos 12 caracteres y no usar la contraseña por defecto.');
  }
  const hashedPassword = await bcrypt.hash(passwordPlain, 10);

  let user = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'ADMIN',
        status: 'ACTIVE',
        password: hashedPassword,
      },
    });
    console.log(`[DB] Usuario existente '${user.username}' actualizado a ADMIN con éxito.`);
  } else {
    user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        provider: 'EMAIL',
        displayName: 'Administrador Estelar',
      },
    });
    console.log(`[DB] Usuario ADMIN '${user.username}' creado con éxito.`);
  }

  // 2. SHOP ITEMS mínimos
  const shopDefaults = [
    { name: 'Estrella Dorada', description: 'Una insignia dorada que brilla en tu perfil', type: 'BADGE', price: 500, data: JSON.stringify({ icon: '⭐', color: '#ffd700', label: 'Estrella' }), sortOrder: 1 },
    { name: 'Corazón de Fuego', description: 'Una insignia llameante para los más apasionados', type: 'BADGE', price: 1200, data: JSON.stringify({ icon: '🔥', color: '#ff4500', label: 'Ardiente' }), sortOrder: 2 },
    { name: 'Nuevo en la Escena', description: 'Título de bienvenida gratuito para los recién llegados a Gremio Estelar', type: 'TITLE', price: 0, data: JSON.stringify({ text: '✨ Nuevo en la Escena', color: '#00d4ff', gradient: 'linear-gradient(90deg, #00d4ff, #a78bfa)' }), sortOrder: 10 },
    { name: 'Marco Dorado', description: 'Un elegante marco dorado con destellos', type: 'FRAME', price: 1500, data: JSON.stringify({ borderColor: '#ffd700', borderStyle: 'solid', glow: 'rgba(255,215,0,0.5)', label: 'Dorado' }), sortOrder: 20 },
    { name: 'Amanecer', description: 'Un degradado naranja-dorado para tu perfil', type: 'COLOR', price: 600, data: JSON.stringify({ color: '#ff6b35' }), sortOrder: 30 },
  ];

  let shopCount = 0;
  for (const item of shopDefaults) {
    const existing = await prisma.shopItem.findFirst({ where: { name: item.name } });
    if (!existing) {
      await prisma.shopItem.create({ data: { ...item, active: true } });
      shopCount++;
    } else {
      await prisma.shopItem.update({
        where: { id: existing.id },
        data: { price: item.price, description: item.description, sortOrder: item.sortOrder },
      });
    }
  }
  console.log(`[DB] Shop items mínimos: ${shopCount} creados/actualizados.`);

  // 3. LOGROS mínimos
  const achievementsDefaults = [
    { name: 'Primeros Pasos', description: 'Realiza tu primera acción en la plataforma', xpReward: 10, category: 'GENERAL' },
    { name: 'Primer Post', description: 'Publica tu primer mensaje en la comunidad', xpReward: 15, category: 'GENERAL' },
    { name: 'Racha Diaria', description: 'Reclama tu primera recompensa diaria', xpReward: 20, category: 'GENERAL' },
    { name: '100 XP', description: 'Acumula 100 puntos de experiencia', xpReward: 20, category: 'XP' },
    { name: 'Nivel 5', description: 'Alcanza el nivel 5', xpReward: 50, category: 'NIVEL' },
  ];

  let achievementsCount = 0;
  for (const ach of achievementsDefaults) {
    const existing = await prisma.achievement.findUnique({ where: { name: ach.name } });
    if (!existing) {
      await prisma.achievement.create({ data: ach });
      achievementsCount++;
    }
  }
  console.log(`[DB] Logros mínimos: ${achievementsCount} creados.`);

  // 4. MISIONES mínimas
  const missionsDefaults = [
    {
      title: '✨ Conexión Estelar Diaria',
      description: 'Entra a Gremio Estelar hoy y reclama tu energía estelar',
      type: 'DAILY',
      goal: 1,
      action: 'DAILY_LOGIN',
      xpReward: 50,
      stardustReward: 30,
      active: true,
    },
    {
      title: '💖 Esparcir Cariño',
      description: 'Reacciona a 3 publicaciones o imágenes en el feed',
      type: 'DAILY',
      goal: 3,
      action: 'POST_LIKE',
      xpReward: 50,
      stardustReward: 30,
      active: true,
    },
    {
      title: '💬 Charla en la Comunidad',
      description: 'Deja 1 comentario amigable en cualquier publicación',
      type: 'DAILY',
      goal: 1,
      action: 'COMMENT_CREATE',
      xpReward: 60,
      stardustReward: 40,
      active: true,
    },
  ];

  let missionsCount = 0;
  for (const m of missionsDefaults) {
    const existing = await prisma.mission.findFirst({ where: { action: m.action, type: m.type } });
    if (!existing) {
      await prisma.mission.create({ data: m });
      missionsCount++;
    } else {
      await prisma.mission.update({
        where: { id: existing.id },
        data: { title: m.title, description: m.description, goal: m.goal, xpReward: m.xpReward, stardustReward: m.stardustReward, active: m.active },
      });
    }
  }
  console.log(`[DB] Misiones mínimas: ${missionsCount} creadas/actualizadas.`);

  // 5. TEMPORADA activa + niveles mínimos del pase (si no existe)
  let season = await prisma.season.findFirst({ where: { active: true } });
  if (!season) {
    season = await prisma.season.create({
      data: {
        name: 'Temporada 1: Lluvia de Estrellas ⭐',
        theme: 'stars',
        number: 1,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 2 * 30 * 24 * 60 * 60 * 1000),
        active: true,
      },
    });
    console.log(`[DB] Temporada activa creada: ${season.id}`);

    for (let level = 1; level <= 10; level++) {
      const existing = await prisma.passLevel.findFirst({
        where: { seasonId: season.id, level },
      });
      // PassLevel usa @@unique([seasonId, level]) y un @id normal (cuid).
      // findFirst es suficiente para comprobar existencia por (seasonId, level).
      
      if (!existing) {
        await prisma.passLevel.create({
          data: {
            seasonId: season.id,
            level,
            freeReward: JSON.stringify({ type: 'stardust', amount: level * 40, label: `${level * 40} Stardust ⭐` }),
            premiumReward: JSON.stringify({ type: 'stardust', amount: level * 120, label: `${level * 120} Stardust ⭐` }),
          },
        });
      }
    }
    console.log(`[DB] Niveles mínimos del pase creados hasta el 10.`);
  } else {
    console.log(`[DB] Ya existe temporada activa: ${season.id}`);
    await prisma.passLevel.findFirst({ where: { seasonId: season.id, level: 1 } }).then((lv) => {
      if (!lv) {
        console.warn('[DB] La temporada activa no tiene niveles mínimos. Ejecuta seed de niveles manualmente o corre este script de nuevo tras crear temporada.');
      }
    });
  }

  console.log('[DB] Seed mínimo completado.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
