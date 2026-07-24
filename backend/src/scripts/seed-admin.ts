import prisma from '../database/prisma';
import bcrypt from 'bcrypt';

async function main() {
  const email = 'admin@gremioestelar.com';
  const username = 'admin_master';
  const passwordPlain = 'Admin123!';
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
