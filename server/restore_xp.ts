/**
 * Script para restaurar/recalcular XP dos usuários baseado em suas atividades
 * SEM dar wipe no banco de dados
 * 
 * XP é concedido por:
 * - Post criado: 250 XP
 * - Comentário feito: 100 XP
 * - Comentário recebido: 20 XP
 * - Story criado: 50 XP
 */

import prisma from './src/utils/prisma';

// XP Table: Level X requires XP_TABLE[X-1] total XP
const XP_TABLE = Array.from({ length: 30 }, (_, i) => {
    const level = i + 1;
    if (level === 1) return 0;
    return Math.floor(1000 * Math.pow(level - 1, 1.2));
});

const getLevelFromXP = (xp: number): number => {
    for (let i = XP_TABLE.length - 1; i >= 0; i--) {
        if (xp >= XP_TABLE[i]) {
            return i + 1;
        }
    }
    return 1;
};

async function restoreXP() {
    console.log('🔄 Iniciando restauração de XP...\n');

    // Get all users
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            displayName: true,
            xp: true,
            level: true,
        }
    });

    console.log(`📊 Total de usuários: ${users.length}\n`);

    let updatedCount = 0;

    for (const user of users) {
        // Count posts created by user
        const postsCount = await prisma.post.count({
            where: { userId: user.id }
        });

        // Count comments made by user
        const commentsCount = await prisma.comment.count({
            where: { userId: user.id }
        });

        // Count comments received on user's posts
        const commentsReceived = await prisma.comment.count({
            where: {
                post: {
                    userId: user.id
                },
                userId: { not: user.id } // Exclude self-comments
            }
        });

        // Count stories created by user
        const storiesCount = await prisma.story.count({
            where: { userId: user.id }
        });

        // Calculate total XP
        const xpFromPosts = postsCount * 250;
        const xpFromComments = commentsCount * 100;
        const xpFromCommentsReceived = commentsReceived * 20;
        const xpFromStories = storiesCount * 50;

        const calculatedXP = xpFromPosts + xpFromComments + xpFromCommentsReceived + xpFromStories;
        const calculatedLevel = getLevelFromXP(calculatedXP);

        // Only update if calculated XP is higher than current (don't lose progress)
        const finalXP = Math.max(calculatedXP, user.xp);
        const finalLevel = getLevelFromXP(finalXP);

        if (finalXP !== user.xp || finalLevel !== user.level) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    xp: finalXP,
                    level: finalLevel
                }
            });

            console.log(`✅ ${user.displayName || user.name} (${user.id})`);
            console.log(`   Posts: ${postsCount} (${xpFromPosts} XP)`);
            console.log(`   Comments: ${commentsCount} (${xpFromComments} XP)`);
            console.log(`   Comments received: ${commentsReceived} (${xpFromCommentsReceived} XP)`);
            console.log(`   Stories: ${storiesCount} (${xpFromStories} XP)`);
            console.log(`   Old: ${user.xp} XP (Level ${user.level}) → New: ${finalXP} XP (Level ${finalLevel})`);
            console.log('');

            updatedCount++;
        }
    }

    console.log(`\n🎉 Restauração concluída! ${updatedCount} usuários atualizados.`);
}

restoreXP()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
