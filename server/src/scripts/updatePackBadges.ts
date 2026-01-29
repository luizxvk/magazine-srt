import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapeamento de badges por gameTitle (case insensitive match)
const PACK_BADGES: Record<string, string> = {
    // Valorant
    'valorant': 'https://img.icons8.com/?size=100&id=bp2NCefx58vp&format=png&color=000000',
    // Red Dead Redemption
    'red dead': 'https://img.icons8.com/?size=100&id=LzBRW74k9E9c&format=png&color=000000',
    // Hollow Knight
    'hollow knight': 'https://img.icons8.com/?size=100&id=m4ruZvTt68SY&format=png&color=000000',
    // The Witcher
    'witcher': 'https://img.icons8.com/?size=100&id=MGNtlXsq2xHJ&format=png&color=000000',
    // Resident Evil
    'resident evil': 'https://img.icons8.com/?size=100&id=3gLLhBYwHTFg&format=png&color=000000',
    // Stray
    'stray': 'https://img.icons8.com/?size=100&id=He74K2AoYI0r&format=png&color=000000',
    // GTA / Rockstar
    'gta': 'https://img.icons8.com/?size=100&id=LmbJipJS2cfG&format=png&color=000000',
    'rockstar': 'https://img.icons8.com/?size=100&id=LmbJipJS2cfG&format=png&color=000000',
    // God of War
    'god of war': 'https://img.icons8.com/?size=100&id=C9Z3dngNBjYJ&format=png&color=000000',
    'nordic': 'https://img.icons8.com/?size=100&id=C9Z3dngNBjYJ&format=png&color=000000',
    // Cyberpunk
    'cyberpunk': 'https://img.icons8.com/?size=100&id=OKYaYQfXrLta&format=png&color=000000',
    'night city': 'https://img.icons8.com/?size=100&id=OKYaYQfXrLta&format=png&color=000000',
    // Default fallback - Gamepad
    'default': 'https://img.icons8.com/?size=100&id=12455&format=png&color=000000',
};

async function updatePackBadges() {
    try {
        const packs = await prisma.themePack.findMany();
        
        console.log(`Found ${packs.length} theme packs to update`);

        for (const pack of packs) {
            // Find matching badge by gameTitle
            const gameTitleLower = pack.gameTitle.toLowerCase();
            let badgeUrl = PACK_BADGES['default'];

            for (const [key, url] of Object.entries(PACK_BADGES)) {
                if (key !== 'default' && gameTitleLower.includes(key)) {
                    badgeUrl = url;
                    break;
                }
            }

            // Update pack with badge
            await prisma.themePack.update({
                where: { id: pack.id },
                data: { badgeUrl }
            });

            console.log(`✅ Updated ${pack.name}: ${badgeUrl}`);
        }

        console.log('\\n🎉 All packs updated with badges!');
    } catch (error) {
        console.error('Error updating pack badges:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updatePackBadges();
