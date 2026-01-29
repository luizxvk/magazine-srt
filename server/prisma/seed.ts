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

    // Seed Badges - Complete achievements list
    const badges = [
        // === FIRST STEPS (Primeiros Passos) ===
        { name: 'Primeiros Passos', description: 'Completou o primeiro login na plataforma', iconUrl: 'icon:Star', trophies: 10 },
        { name: 'Identidade Revelada', description: 'Atualizou seu perfil pela primeira vez', iconUrl: 'icon:User', trophies: 15 },
        { name: 'Perfil Completo', description: 'Preencheu todos os campos do perfil', iconUrl: 'icon:CheckCircle', trophies: 25 },
        
        // === CONTENT CREATION (Criação de Conteúdo) ===
        { name: 'Primeira Voz', description: 'Fez sua primeira postagem', iconUrl: 'icon:Edit', trophies: 15 },
        { name: 'Criador de Conteúdo', description: 'Fez 5 postagens', iconUrl: 'icon:FileText', trophies: 50 },
        { name: 'Blogueiro', description: 'Fez 20 postagens', iconUrl: 'icon:BookOpen', trophies: 100 },
        { name: 'Editor Chefe', description: 'Fez 50 postagens', iconUrl: 'icon:Award', trophies: 200 },
        { name: 'Cineasta', description: 'Postou 10 vídeos', iconUrl: 'icon:Video', trophies: 75 },
        { name: 'Storyteller', description: 'Postou 20 stories', iconUrl: 'icon:Camera', trophies: 75 },

        // === SOCIAL & ENGAGEMENT (Engajamento Social) ===
        { name: 'Comentador', description: 'Fez seu primeiro comentário', iconUrl: 'icon:MessageCircle', trophies: 15 },
        { name: 'Tagarela', description: 'Fez 100 comentários', iconUrl: 'icon:MessageSquare', trophies: 150 },
        { name: 'Socialite', description: 'Fez 10 comentários', iconUrl: 'icon:Users', trophies: 30 },
        { name: 'Debatedor', description: 'Fez 50 comentários', iconUrl: 'icon:MessagesSquare', trophies: 100 },
        { name: 'Super Like', description: 'Deu 500 likes', iconUrl: 'icon:ThumbsUp', trophies: 100 },
        { name: 'Engajado', description: 'Deu 50 likes', iconUrl: 'icon:Heart', trophies: 50 },
        { name: 'Super Fã', description: 'Deu 100 likes', iconUrl: 'icon:HeartHandshake', trophies: 75 },
        
        // === FRIENDSHIPS (Amizades) ===
        { name: 'Primeira Conexão', description: 'Adicionou o primeiro amigo', iconUrl: 'icon:UserPlus', trophies: 10 },
        { name: 'Roda de Amigos', description: 'Alcançou 10 amigos', iconUrl: 'icon:UsersRound', trophies: 30 },
        { name: 'Popular', description: 'Alcançou 50 amigos', iconUrl: 'icon:Star', trophies: 100 },
        { name: 'Celebridade', description: 'Alcançou 100 amigos', iconUrl: 'icon:Sparkles', trophies: 200 },
        { name: 'Anfitrião', description: 'Criou um grupo de chat', iconUrl: 'icon:Home', trophies: 25 },
        { name: 'Conectado', description: 'Está online por 7 dias seguidos', iconUrl: 'icon:Wifi', trophies: 50 },
        
        // === POPULARITY (Popularidade) ===
        { name: 'Influenciador', description: 'Recebeu 50 likes em suas postagens', iconUrl: 'icon:TrendingUp', trophies: 100 },
        { name: 'Ícone', description: 'Recebeu 100 likes em suas postagens', iconUrl: 'icon:Crown', trophies: 150 },
        { name: 'Top Voice', description: 'Recebeu 500 likes em suas postagens', iconUrl: 'icon:Mic', trophies: 300 },
        { name: 'Viral', description: 'Recebeu 50 comentários em suas postagens', iconUrl: 'icon:Zap', trophies: 150 },
        
        // === ECONOMY (Economia) ===
        { name: 'Colecionador de Zions', description: 'Acumulou 100 Zions', iconUrl: 'icon:Coins', trophies: 25 },
        { name: 'Poupador', description: 'Acumulou 1.000 Zions', iconUrl: 'icon:PiggyBank', trophies: 50 },
        { name: 'Burguês', description: 'Acumulou 10.000 Zions', iconUrl: 'icon:Landmark', trophies: 150 },
        { name: 'Milionário', description: 'Acumulou 1.000.000 Zions', iconUrl: 'icon:DollarSign', trophies: 1000 },
        { name: 'Consumista', description: 'Comprou 5 itens na loja', iconUrl: 'icon:ShoppingBag', trophies: 50 },
        { name: 'Rei do Cashback', description: 'Resgatou 10 recompensas', iconUrl: 'icon:Gift', trophies: 100 },
        { name: 'Sócio', description: 'Comprou um pacote VIP', iconUrl: 'icon:BadgeCheck', trophies: 200 },

        // === COLLECTION (Coleção) ===
        { name: 'Colecionador', description: 'Conquistou 5 badges', iconUrl: 'icon:Medal', trophies: 50 },
        { name: 'Museu Vivo', description: 'Conquistou 15 badges', iconUrl: 'icon:Trophy', trophies: 150 },
        { name: 'Lenda', description: 'Conquistou 30 badges', iconUrl: 'icon:Gem', trophies: 500 },
        
        // === LOYALTY (Fidelidade) ===
        { name: 'Veterano', description: 'Está na plataforma há 30 dias', iconUrl: 'icon:Clock', trophies: 75 },
        { name: 'Dedicado', description: 'Fez login por 14 dias seguidos', iconUrl: 'icon:CalendarCheck', trophies: 100 },
        { name: 'Viciado', description: 'Fez login por 30 dias seguidos', iconUrl: 'icon:Flame', trophies: 200 },
        
        // === SPECIAL (Especiais) ===
        { name: 'Beta Tester', description: 'Participou da fase beta da plataforma', iconUrl: 'icon:Zap', trophies: 999 },
        { name: 'Explorador', description: 'Visitou todas as páginas do app', iconUrl: 'icon:Compass', trophies: 30 },
        { name: 'Xerife', description: 'Reportou conteúdo impróprio', iconUrl: 'icon:Shield', trophies: 25 },
        { name: 'VIP', description: 'É membro MGT', iconUrl: 'icon:Crown', trophies: 100 },
    ];

    // DELETE old badges that are NOT in the essential list
    const badgeNames = badges.map(b => b.name);
    const deletedBadges = await prisma.badge.deleteMany({
        where: {
            name: {
                notIn: badgeNames
            }
        }
    });
    console.log(`Deleted ${deletedBadges.count} old badges`);

    for (const badge of badges) {
        console.log(`Processing badge: ${badge.name}`);
        
        // Primeiro, deletar duplicatas com o mesmo nome (mantém apenas 1)
        const existingBadges = await prisma.badge.findMany({ where: { name: badge.name } });
        
        if (existingBadges.length > 1) {
            console.log(`  Found ${existingBadges.length} badges with name "${badge.name}", cleaning duplicates...`);
            // Manter o primeiro, deletar os outros
            const [keep, ...duplicates] = existingBadges;
            for (const dup of duplicates) {
                // Redirecionar UserBadges
                await prisma.userBadge.updateMany({
                    where: { badgeId: dup.id },
                    data: { badgeId: keep.id }
                });
                await prisma.badge.delete({ where: { id: dup.id } });
            }
        }
        
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
