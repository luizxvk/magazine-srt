import { PrismaClient, ThemePackRarity } from '@prisma/client';

const prisma = new PrismaClient();

async function seedThemePacks() {
    try {
        const themePacks: any[] = [];

        // First, delete old packs that we're removing
        await prisma.themePack.deleteMany({
            where: {
                name: {
                    in: [
                        'Arc Raiders Pack', 'Elden Ring Pack', 'Arc Raiders Starter', 'Neon Night City', 'Sunset Vibes', 'Elden Lord', 'Night City Neon',
                        'Hollow Knight Pack', 'Stray Pack', 'God of War Pack', 'Valorant Pack', 'Resident Evil Pack', 'The Witcher Pack', 'Red Dead Redemption Pack', 'GTA 6 (Vice City) Pack', 'Cyberpunk 2077 Pack', 'Vice City Vibes', 'GTA VI',
                        'Neon Alley Cat', 'Biohazard Zone', 'Wild West Dust', 'Tactical Strike', 'Mystic Hunter', 'Void Depths', 'Nordic Frost'
                    ]
                }
            }
        });
        console.log('🗑️ Removed old packs');

        for (const pack of themePacks) {
            const existing = await prisma.themePack.findFirst({
                where: { name: pack.name }
            });

            if (existing) {
                await prisma.themePack.update({
                    where: { id: existing.id },
                    data: pack
                });
                console.log(`✅ Updated: ${pack.name} [${pack.rarity}]`);
            } else {
                await prisma.themePack.create({
                    data: pack
                });
                console.log(`✅ Created: ${pack.name} [${pack.rarity}]`);
            }
        }

        console.log('\n🎨 Theme packs v0.3.38 with rarities ready!');
    } catch (error) {
        console.error('Error seeding theme packs:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedThemePacks();
