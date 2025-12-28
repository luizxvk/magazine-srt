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

    // Seed Badges
    const badges = [
        // Existing (Updated to use Lucide icons)
        { name: 'Primeira Voz', description: 'Fez a primeira postagem', iconUrl: 'icon:PenTool', trophies: 100 },
        { name: 'Criador de Conteúdo', description: 'Fez 5 postagens', iconUrl: 'icon:FileText', trophies: 200 },
        { name: 'Socialite', description: 'Fez 10 comentários', iconUrl: 'icon:MessageCircle', trophies: 50 },
        { name: 'Engajado', description: 'Deu 50 likes', iconUrl: 'icon:Heart', trophies: 50 },
        { name: 'Influenciador', description: 'Recebeu 50 likes', iconUrl: 'icon:ThumbsUp', trophies: 500 },

        // New Social Achievements (12)
        { name: 'Primeira Conexão', description: 'Adicionou o primeiro amigo', iconUrl: 'icon:UserPlus', trophies: 10 },
        { name: 'Roda de Amigos', description: 'Alcançou 10 amigos', iconUrl: 'icon:Users', trophies: 50 },
        { name: 'Popular', description: 'Alcançou 50 amigos', iconUrl: 'icon:Star', trophies: 100 },
        { name: 'Celebridade', description: 'Alcançou 100 amigos', iconUrl: 'icon:Crown', trophies: 500 },
        { name: 'Blogueiro', description: 'Fez 20 postagens', iconUrl: 'icon:FileText', trophies: 50 },
        { name: 'Editor Chefe', description: 'Fez 50 postagens', iconUrl: 'icon:Megaphone', trophies: 200 },
        { name: 'Debatedor', description: 'Fez 50 comentários', iconUrl: 'icon:MessageCircle', trophies: 50 },
        { name: 'Super Fã', description: 'Deu 100 likes', iconUrl: 'icon:Heart', trophies: 50 },
        { name: 'Ícone', description: 'Recebeu 100 likes', iconUrl: 'icon:ThumbsUp', trophies: 150 },
        { name: 'Storyteller', description: 'Postou 10 stories', iconUrl: 'icon:Camera', trophies: 50 },
        { name: 'Viral', description: 'Recebeu 50 comentários em posts', iconUrl: 'icon:MessageSquare', trophies: 100 },
        { name: 'Anfitrião', description: 'Convidou 5 amigos para a plataforma', iconUrl: 'icon:UserPlus', trophies: 100 },
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
    const rewards = [
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
