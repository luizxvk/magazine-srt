import { PrismaClient, ThemePackRarity } from '@prisma/client';

const prisma = new PrismaClient();

async function seedThemePacks() {
    try {
        const themePacks = [
            // COMMON Packs (Easy to get)
            {
                name: 'Neon Alley Cat',
                description: 'Becos urbanos iluminados por neon laranja. Aventura independente.',
                gameTitle: 'Stray Pack',
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
                gameTitle: 'Resident Evil Pack',
                backgroundUrl: 'anim-biohazard',
                accentColor: '#22c55e',
                previewUrl: '/packs/resident-evil.jpg',
                price: 950,
                isActive: true,
                isLimited: false,
                rarity: ThemePackRarity.COMMON
            },
            // RARE Packs
            {
                name: 'Wild West Dust',
                description: 'Poeira do deserto e tons terrosos do velho oeste. Aventura rústica.',
                gameTitle: 'Red Dead Redemption Pack',
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
                gameTitle: 'Valorant Pack',
                backgroundUrl: 'anim-tactical',
                accentColor: '#f43f5e',
                previewUrl: '/packs/valorant.jpg',
                price: 900,
                isActive: true,
                isLimited: false,
                rarity: ThemePackRarity.RARE
            },
            // EPIC Packs
            {
                name: 'Mystic Hunter',
                description: 'Para os caçadores de bestas antigas.',
                gameTitle: 'The Witcher Pack',
                backgroundUrl: 'anim-mystic-hunter',
                accentColor: '#fbbf24',
                previewUrl: '/packs/witcher.jpg',
                price: 8000,
                isActive: true,
                isLimited: true,
                rarity: ThemePackRarity.EPIC
            },
            {
                name: 'Void Depths',
                description: 'Profundezas sombrias com tons de roxo e cinza. Mistério subterrâneo.',
                gameTitle: 'Hollow Knight Pack',
                backgroundUrl: 'anim-void-depths',
                accentColor: '#6b7280',
                previewUrl: '/packs/hollow-knight.jpg',
                price: 950,
                isActive: true,
                isLimited: false,
                rarity: ThemePackRarity.EPIC
            },
            // LEGENDARY Packs (Supply Box Exclusive)
            {
                name: 'Night City Neon',
                description: 'Entre no futuro de Night City. Neon pulsante rosa magenta e ciano.',
                gameTitle: 'Cyberpunk 2077 Pack',
                backgroundUrl: 'anim-night-city',
                accentColor: '#FF00C3',
                previewUrl: '/packs/cyberpunk.jpg',
                price: 2500, // Price acts as value, but not purchasable directly
                isActive: true,
                isLimited: true,
                rarity: ThemePackRarity.LEGENDARY
            },
            {
                name: 'Nordic Frost',
                description: 'Gelo nórdico e tons de azul profundo. Força e serenidade do norte.',
                gameTitle: 'God of War Pack',
                backgroundUrl: 'anim-nordic-frost',
                accentColor: '#88C0D0',
                previewUrl: '/packs/god-of-war.jpg',
                price: 2500,
                isActive: true,
                isLimited: true,
                rarity: ThemePackRarity.LEGENDARY
            },
            {
                name: 'Sunset Vibes',
                description: 'Pack temático de Vice City. Sunset vibes com cores azul, roxo e salmão.',
                gameTitle: 'GTA 6 Pack',
                backgroundUrl: 'anim-sunset-vibes',
                accentColor: '#9B7EAC',
                previewUrl: '/packs/gta-vice.jpg',
                price: 2500,
                isActive: true,
                isLimited: true,
                rarity: ThemePackRarity.LEGENDARY
            }
        ];

        // Delete old packs that we are NOT restoring (if any) or just run update
        // Since we want to RESTORE them, we don't need to delete them again. 
        // But for safety, let's just create/update them.

        // Remove the deleteMany block or make it specific to only unwanted ones. 
        // I will comments it out or just remove it to assume we are ADDING.
        // Actually, let's keep it safe by removing any previous "Generic" ones if they conflict?
        // No, I'll just upsert them.

        // I will remove the deleteMany block.

        /* 
        await prisma.themePack.deleteMany({...}); 
        */
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
