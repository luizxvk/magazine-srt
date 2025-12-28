import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const rewardsToDelete = ['Cupom 10% OFF', 'Frete Grátis', 'Wallpaper Exclusivo'];

    const rewards = await prisma.reward.findMany({
        where: { title: { in: rewardsToDelete } }
    });

    const rewardIds = rewards.map(r => r.id);

    // Delete related redemptions first
    const deletedRedemptions = await prisma.redemption.deleteMany({
        where: { rewardId: { in: rewardIds } }
    });
    console.log(`Deleted ${deletedRedemptions.count} redemptions.`);

    const result = await prisma.reward.deleteMany({
        where: {
            id: {
                in: rewardIds
            }
        }
    });

    console.log(`Deleted ${result.count} rewards.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
