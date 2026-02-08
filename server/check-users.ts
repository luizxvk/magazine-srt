import prisma from './src/utils/prisma';

async function main() {
  const admin = await prisma.user.update({
    where: { email: 'admin@magazine.com' },
    data: { 
      deletedAt: null,
      isVerified: true
    }
  });
  console.log('Admin restaurado:', admin.email);
  await prisma.$disconnect();
}

main();
