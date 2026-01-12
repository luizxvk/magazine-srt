import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedThemePacks() {
    try {
        const themePacks = [
            {
                name: 'Night City Neon',
                description: 'Mergulhe na estética cyberpunk com neon pulsante. Rosa e ciano vibrantes em harmonia.',
                gameTitle: 'Tema Cyberpunk',
                backgroundUrl: 'anim-night-city',
                accentColor: '#FF00C3',
                previewUrl: '/packs/cyberpunk.jpg',
                price: 1200,
                isActive: true,
                isLimited: false
            },
            {
                name: 'Sunset Vibes',
                description: 'Pôr do sol tropical com tons de azul, roxo e salmão. Perfeito para relaxar.',
                gameTitle: 'Tema Tropical',
                backgroundUrl: 'anim-sunset-vibes',
                accentColor: '#9B7EAC',
                previewUrl: '/packs/gta6.jpg',
                price: 1500,
                isActive: true,
                isLimited: true
            },
            {
                name: 'Wild West Dust',
                description: 'Poeira do deserto e tons terrosos do velho oeste. Aventura rústica.',
                gameTitle: 'Tema Faroeste',
                backgroundUrl: 'anim-wild-west',
                accentColor: '#F37031',
                previewUrl: '/packs/red-dead.jpg',
                price: 1100,
                isActive: true,
                isLimited: false
            },
            {
                name: 'Mystic Hunter',
                description: 'Atmosfera medieval mística com tons de prata e mistério. Para caçadores lendários.',
                gameTitle: 'Tema Medieval',
                backgroundUrl: 'anim-mystic-hunter',
                accentColor: '#81A1C1',
                previewUrl: '/packs/witcher.jpg',
                price: 1000,
                isActive: true,
                isLimited: false
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
                isLimited: false
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
                isLimited: false
            },
            {
                name: 'Nordic Frost',
                description: 'Gelo nórdico e tons de azul profundo. Força e serenidade do norte.',
                gameTitle: 'Tema Nórdico',
                backgroundUrl: 'anim-nordic-frost',
                accentColor: '#88C0D0',
                previewUrl: '/packs/god-of-war.jpg',
                price: 1300,
                isActive: true,
                isLimited: false
            },
            {
                name: 'Neon Alley Cat',
                description: 'Becos urbanos iluminados por neon laranja. Aventura independente.',
                gameTitle: 'Tema Urbano',
                backgroundUrl: 'anim-neon-alley',
                accentColor: '#f97316',
                previewUrl: '/packs/stray.jpg',
                price: 850,
                isActive: true,
                isLimited: false
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
                isLimited: false
            }
        ];

        // First, delete old packs that we're removing
        await prisma.themePack.deleteMany({
            where: {
                name: {
                    in: ['Arc Raiders Pack', 'Elden Ring Pack']
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
                console.log(`✅ Updated: ${pack.name}`);
            } else {
                await prisma.themePack.create({
                    data: pack
                });
                console.log(`✅ Created: ${pack.name}`);
            }
        }

        console.log('\n🎨 Theme packs v0.3.36 ready!');
    } catch (error) {
        console.error('Error seeding theme packs:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedThemePacks();
