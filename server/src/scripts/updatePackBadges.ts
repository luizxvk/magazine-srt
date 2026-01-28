import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapeamento de badges por gameTitle (case insensitive match)
const PACK_BADGES: Record<string, string> = {
    // Red Dead Redemption - Revólver
    'red dead': 'https://cdn-icons-png.flaticon.com/512/3601/3601698.png',
    // Hollow Knight - Espada/Agulha
    'hollow knight': 'https://cdn-icons-png.flaticon.com/512/7555/7555748.png',
    // The Witcher - Medalão de lobo
    'witcher': 'https://cdn-icons-png.flaticon.com/512/3771/3771508.png',
    // Valorant - Mira/Crosshair
    'valorant': 'https://cdn-icons-png.flaticon.com/512/6369/6369894.png',
    // Resident Evil - Vírus/Bio
    'resident evil': 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png',
    // Stray - Gato
    'stray': 'https://cdn-icons-png.flaticon.com/512/1076/1076877.png',
    // Cyberpunk - Chip/Cyber
    'cyberpunk': 'https://cdn-icons-png.flaticon.com/512/2809/2809871.png',
    // Night City - Cidade neon
    'night city': 'https://cdn-icons-png.flaticon.com/512/7641/7641847.png',
    // GTA - Carro
    'gta': 'https://cdn-icons-png.flaticon.com/512/3097/3097139.png',
    // Forza - Velocímetro
    'forza': 'https://cdn-icons-png.flaticon.com/512/2361/2361952.png',
    // Need for Speed - Chama
    'need for speed': 'https://cdn-icons-png.flaticon.com/512/785/785116.png',
    // The Crew - Volante
    'crew': 'https://cdn-icons-png.flaticon.com/512/3774/3774278.png',
    // Elden Ring - Anel
    'elden ring': 'https://cdn-icons-png.flaticon.com/512/6941/6941697.png',
    // Dark Souls - Fogueira
    'dark souls': 'https://cdn-icons-png.flaticon.com/512/3174/3174963.png',
    // God of War - Machado
    'god of war': 'https://cdn-icons-png.flaticon.com/512/3166/3166896.png',
    // Horizon - Arco
    'horizon': 'https://cdn-icons-png.flaticon.com/512/6632/6632869.png',
    // Spider-Man - Teia
    'spider': 'https://cdn-icons-png.flaticon.com/512/3014/3014013.png',
    // Minecraft - Picareta
    'minecraft': 'https://cdn-icons-png.flaticon.com/512/743/743123.png',
    // Call of Duty - Mira militar
    'call of duty': 'https://cdn-icons-png.flaticon.com/512/2061/2061956.png',
    // Assassin's Creed - Capuz/Lâmina
    'assassin': 'https://cdn-icons-png.flaticon.com/512/2694/2694779.png',
    // FIFA - Bola de futebol
    'fifa': 'https://cdn-icons-png.flaticon.com/512/53/53283.png',
    // Rocket League - Foguete
    'rocket league': 'https://cdn-icons-png.flaticon.com/512/2906/2906274.png',
    // Default fallback - Gamepad
    'default': 'https://cdn-icons-png.flaticon.com/512/3612/3612569.png',
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
