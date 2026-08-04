import prisma from '../database/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@gremioestelar.com';
  const username = process.env.SEED_ADMIN_USERNAME || 'admin_master';

  // Never use a well-known default password. If SEED_ADMIN_PASSWORD is not
  // provided, generate a random one and print it once (dev/bootstrap only).
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

  console.log('--- CREDENCIALES ---');
  console.log(`Email: ${email}`);
  console.log(`Username: ${username}`);
  console.log(`Password: ${passwordPlain}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
