import { PrismaClient, ThemePackRarity } from '@prisma/client';

const prisma = new PrismaClient();

async function seedThemePacks() {
    try {
        const themePacks = [
            // COMMON Packs (Easy to get) - 60% drop rate
            {
                name: 'Neon Alley Cat',
                description: 'Becos urbanos iluminados por neon laranja. Aventura independente.',
                gameTitle: 'Tema Urbano',
                backgroundUrl: 'anim-neon-alley',
                accentColor: '#f97316',
                previewUrl: '/packs/stray.jpg',
                price: 850,
                isActive: true,
                isLimited: false,
                rarity: ThemePackRarity.COMMON
            },
            {
                name: 'Biohazard Zone',
                description: 'Verde tóxico e atmosfera sombria de sobrevivência. Para os corajosos.',
                gameTitle: 'Tema Horror',
                backgroundUrl: 'anim-biohazard',
                accentColor: '#22c55e',
                previewUrl: '/packs/resident-evil.jpg',
                price: 950,
                isActive: true,
                isLimited: false,
                rarity: ThemePackRarity.COMMON
            },
            // RARE Packs - 25% drop rate
            {
                name: 'Wild West Dust',
                description: 'Poeira do deserto e tons terrosos do velho oeste. Aventura rústica.',
                gameTitle: 'Tema Faroeste',
                backgroundUrl: 'anim-wild-west',
                accentColor: '#F37031',
                previewUrl: '/packs/red-dead.jpg',
                price: 1100,
                isActive: true,
                isLimited: false,
                rarity: ThemePackRarity.RARE
            },
            {
                name: 'Tactical Strike',
                description: 'Grid tático futurista com vermelho intenso. Precisão e estratégia.',
                gameTitle: 'Tema Tático',
                backgroundUrl: 'anim-tactical',
                accentColor: '#f43f5e',
                previewUrl: '/packs/valorant.jpg',
                price: 900,
                isActive: true,
                isLimited: false,
                rarity: ThemePackRarity.RARE
            },
            // EPIC Packs - 12% drop rate
            {
                name: 'Mystic Hunter',
                description: 'Para os caçadores de bestas antigas.',
                gameTitle: 'Tema Medieval', // Kept existing gameTitle
                backgroundUrl: '/packs/mystic-hunter-bg.jpg', // Updated background
                accentColor: '#fbbf24', // Updated accentColor
                previewUrl: '/packs/witcher.jpg', // Kept existing previewUrl
                price: 8000, // Updated price
                isActive: true, // Kept existing isActive
                isLimited: true, // Updated isLimited
                rarity: ThemePackRarity.LEGENDARY, // Updated rarity
                fontFamily: 'Crimson Text', // Added new field
                maxStock: 50 // Added new field
            },
            {
                name: 'Void Depths',
                description: 'Profundezas sombrias com tons de roxo e cinza. Mistério subterrâneo.',
                gameTitle: 'Tema Underground',
                backgroundUrl: 'anim-void-depths',
                accentColor: '#6b7280',
                previewUrl: '/packs/hollow-knight.jpg',
                price: 950,
                isActive: true,
                isLimited: false,
                rarity: ThemePackRarity.EPIC
            },
            // LEGENDARY Packs - 3% drop rate
            {
                name: 'Nordic Frost',
                description: 'Gelo nórdico e tons de azul profundo. Força e serenidade do norte.',
                gameTitle: 'Tema Nórdico',
                backgroundUrl: 'anim-nordic-frost',
                accentColor: '#88C0D0',
                previewUrl: '/packs/god-of-war.jpg',
                price: 1300,
                isActive: true,
                isLimited: false,
                rarity: ThemePackRarity.LEGENDARY
            }
        ];

        // First, delete old packs that we're removing
        await prisma.themePack.deleteMany({
            where: {
                name: {
                    in: [
                        'Arc Raiders Pack',
                        'Elden Ring Pack',
                        'Arc Raiders Starter',
                        'Neon Night City',
                        'Sunset Vibes',
                        'Elden Lord',
                        'Night City Neon'
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
