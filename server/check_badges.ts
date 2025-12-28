import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const badges = await prisma.badge.findMany();
    console.log('Total badges:', badges.length);
    badges.forEach(b => console.log(`- ${b.name} (${b.iconUrl})`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
