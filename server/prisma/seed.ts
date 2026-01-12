import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@magazine.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash: hashedPassword,
        } as any,
        create: {
            email,
            name: 'Admin User',
            passwordHash: hashedPassword,
            role: Role.ADMIN,
            displayName: 'Admin',
            bio: 'System Administrator',
            points: 1000,
            trophies: 1000,
            level: 10,
        } as any,
    });

    console.log({ user });

    // Seed Badges - Essential achievements only
    const badges = [
        // First Steps
        { name: 'Primeiros Passos', description: 'Completou o primeiro login na plataforma', iconUrl: 'icon:Star', trophies: 10 },
        { name: 'Identidade Revelada', description: 'Atualizou seu perfil pela primeira vez', iconUrl: 'icon:User', trophies: 15 },
        
        // Content Creation
        { name: 'Criador de Conteúdo', description: 'Fez 5 postagens', iconUrl: 'icon:FileText', trophies: 200 },

        // Social & Engagement
        { name: 'Comentador', description: 'Fez seu primeiro comentário', iconUrl: 'icon:MessageCircle', trophies: 15 },
        { name: 'Primeira Conexão', description: 'Adicionou o primeiro amigo', iconUrl: 'icon:UserPlus', trophies: 10 },
        { name: 'Popular', description: 'Alcançou 50 amigos', iconUrl: 'icon:Star', trophies: 100 },

        // Economy & Collection
        { name: 'Colecionador de Zions', description: 'Acumulou 100 Zions', iconUrl: 'icon:Coins', trophies: 25 },
        { name: 'Milionário', description: 'Acumulou 1.000.000 Zions', iconUrl: 'icon:DollarSign', trophies: 1000 },

        // Loyalty
        { name: 'Veterano', description: 'Está na plataforma há 30 dias', iconUrl: 'icon:Award', trophies: 75 },
        
        // Special
        { name: 'Beta Tester', description: 'Participou da fase beta da plataforma', iconUrl: 'icon:Zap', trophies: 999 },
    ];

    for (const badge of badges) {
        console.log(`Processing badge: ${badge.name}`);
        const existingBadge = await prisma.badge.findFirst({ where: { name: badge.name } });

        if (existingBadge) {
            await prisma.badge.update({
                where: { id: existingBadge.id },
                data: {
                    description: badge.description,
                    iconUrl: badge.iconUrl,
                    trophies: badge.trophies
                }
            });
        } else {
            await prisma.badge.create({
                data: {
                    name: badge.name,
                    description: badge.description,
                    iconUrl: badge.iconUrl,
                    trophies: badge.trophies
                }
            });
        }
    }
    console.log('Badges seeded');

    // Seed Rewards
    const rewards: { title: string; type: string; costZions: number; stock: number; code?: string; url?: string }[] = [
        // { title: 'Cupom 10% OFF', type: 'COUPON', costZions: 50, stock: 100, code: 'MAGAZINE10' },
        // { title: 'Frete Grátis', type: 'COUPON', costZions: 30, stock: 50, code: 'FRETEFREE' },
        // { title: 'Wallpaper Exclusivo', type: 'DIGITAL', costZions: 10, stock: 999, url: 'https://example.com/wallpaper.jpg' }
    ];

    for (const reward of rewards) {
        const existing = await prisma.reward.findFirst({ where: { title: reward.title } });
        if (!existing) {
            await prisma.reward.create({
                data: {
                    title: reward.title,
                    type: reward.type as any,
                    costZions: reward.costZions,
                    stock: reward.stock,
                    metadata: reward.code ? { code: reward.code } : { url: reward.url }
                }
            });
        }
    }
    console.log('Rewards seeded');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
