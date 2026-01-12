import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedThemePacks() {
    try {
        const themePacks = [
            {
                name: 'Arc Raiders Pack',
                description: 'Pack inspirado no universo futurista de Arc Raiders. Inclui fundo animado sci-fi e cor destaque azul neon.',
                gameTitle: 'Arc Raiders',
                backgroundUrl: 'bg-tech-grid',
                accentColor: '#06b6d4',
                previewUrl: '/packs/arc-raiders.jpg',
                price: 500,
                isActive: true,
                isLimited: false
            },
            {
                name: 'Cyberpunk 2077 Pack',
                description: 'Entre no futuro de Night City com este pack vibrante. Fundo cyberpunk + cor destaque amarelo neon.',
                gameTitle: 'Cyberpunk 2077',
                backgroundUrl: 'bg-neon-city',
                accentColor: '#f59e0b',
                previewUrl: '/packs/cyberpunk.jpg',
                price: 600,
                isActive: true,
                isLimited: false
            },
            {
                name: 'Red Dead Redemption Pack',
                description: 'Viva o velho oeste com este pack temático. Fundo desértico + cor destaque vermelho terra.',
                gameTitle: 'Red Dead Redemption',
                backgroundUrl: 'bg-desert-sunset',
                accentColor: '#dc2626',
                previewUrl: '/packs/red-dead.jpg',
                price: 450,
                isActive: true,
                isLimited: false
            },
            {
                name: 'The Witcher Pack',
                description: 'Pack inspirado no mundo de Geralt de Rivia. Fundo medieval + cor destaque prata mística.',
                gameTitle: 'The Witcher',
                backgroundUrl: 'bg-medieval-castle',
                accentColor: '#6b7280',
                previewUrl: '/packs/witcher.jpg',
                price: 550,
                isActive: true,
                isLimited: false
            },
            {
                name: 'Resident Evil Pack',
                description: 'Sobreviva ao horror com este pack sombrio. Fundo apocalíptico + cor destaque verde bioazard.',
                gameTitle: 'Resident Evil',
                backgroundUrl: 'bg-zombie-outbreak',
                accentColor: '#22c55e',
                previewUrl: '/packs/resident-evil.jpg',
                price: 480,
                isActive: true,
                isLimited: false
            },
            {
                name: 'Valorant Pack',
                description: 'Pack tático inspirado em Valorant. Fundo geométrico futurista + cor destaque vermelho tactical.',
                gameTitle: 'Valorant',
                backgroundUrl: 'bg-tactical-grid',
                accentColor: '#f43f5e',
                previewUrl: '/packs/valorant.jpg',
                price: 520,
                isActive: true,
                isLimited: false
            },
            {
                name: 'Elden Ring Pack',
                description: 'Pack inspirado nas Terras Intermédias. Fundo místico dourado + cor destaque ouro ancestral.',
                gameTitle: 'Elden Ring',
                backgroundUrl: 'bg-golden-tree',
                accentColor: '#f59e0b',
                previewUrl: '/packs/elden-ring.jpg',
                price: 650,
                isActive: true,
                isLimited: false
            },
            {
                name: 'God of War Pack',
                description: 'Pack épico inspirado na mitologia nórdica. Fundo nevado + cor destaque azul gélido.',
                gameTitle: 'God of War',
                backgroundUrl: 'bg-nordic-frost',
                accentColor: '#3b82f6',
                previewUrl: '/packs/god-of-war.jpg',
                price: 580,
                isActive: true,
                isLimited: false
            },
            {
                name: 'Stray Pack',
                description: 'Pack inspirado na jornada do gatinho cyberpunk. Fundo neon urbano + cor destaque laranja quente.',
                gameTitle: 'Stray',
                backgroundUrl: 'bg-neon-alley',
                accentColor: '#f97316',
                previewUrl: '/packs/stray.jpg',
                price: 420,
                isActive: true,
                isLimited: false
            },
            {
                name: 'Hollow Knight Pack',
                description: 'Pack inspirado em Hallownest. Fundo sombrio subterrâneo + cor destaque branco espectral.',
                gameTitle: 'Hollow Knight',
                backgroundUrl: 'bg-dark-cavern',
                accentColor: '#64748b',
                previewUrl: '/packs/hollow-knight.jpg',
                price: 490,
                isActive: true,
                isLimited: false
            }
        ];

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

        console.log('\n🎨 All theme packs restored!');
    } catch (error) {
        console.error('Error seeding theme packs:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedThemePacks();
