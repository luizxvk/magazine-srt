import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanNonAdminData() {
    try {
        console.log('🧹 Iniciando limpeza de dados de usuários não-admin...');

        // Buscar ID do admin
        const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!admin) {
            console.error('❌ Admin não encontrado!');
            return;
        }

        console.log(`✅ Admin encontrado: ${admin.name} (${admin.email})`);

        // Primeiro: deletar TODOS os comentários em posts de não-admin
        const postsToDelete = await prisma.post.findMany({
            where: {
                userId: {
                    not: admin.id
                }
            },
            select: { id: true }
        });
        
        const postIds = postsToDelete.map(p => p.id);
        
        // Deletar comentários nesses posts
        const deletedCommentsInPosts = await prisma.comment.deleteMany({
            where: {
                postId: {
                    in: postIds
                }
            }
        });
        console.log(`🗑️  ${deletedCommentsInPosts.count} comentários em posts de não-admin deletados`);
        
        // Deletar comentários de usuários não-admin
        const deletedComments = await prisma.comment.deleteMany({
            where: {
                userId: {
                    not: admin.id
                }
            }
        });
        console.log(`🗑️  ${deletedComments.count} comentários de não-admin deletados`);

        // Deletar likes nesses posts
        const deletedLikesInPosts = await prisma.like.deleteMany({
            where: {
                postId: {
                    in: postIds
                }
            }
        });
        console.log(`🗑️  ${deletedLikesInPosts.count} likes em posts de não-admin deletados`);

        // Deletar likes de usuários não-admin
        const deletedLikes = await prisma.like.deleteMany({
            where: {
                userId: {
                    not: admin.id
                }
            }
        });
        console.log(`🗑️  ${deletedLikes.count} likes de não-admin deletados`);

        // Agora sim deletar posts de todos exceto admin
        const deletedPosts = await prisma.post.deleteMany({
            where: {
                userId: {
                    not: admin.id
                }
            }
        });
        console.log(`🗑️  ${deletedPosts.count} posts deletados`);

        // Deletar stories de todos exceto admin
        const deletedStories = await prisma.story.deleteMany({
            where: {
                userId: {
                    not: admin.id
                }
            }
        });
        console.log(`🗑️  ${deletedStories.count} stories deletadas`);

        // Deletar notificações de todos exceto admin
        const deletedNotifications = await prisma.notification.deleteMany({
            where: {
                userId: {
                    not: admin.id
                }
            }
        });
        console.log(`🗑️  ${deletedNotifications.count} notificações deletadas`);

        // Deletar mensagens de todos exceto admin
        const deletedMessages = await prisma.message.deleteMany({
            where: {
                OR: [
                    { senderId: { not: admin.id } },
                    { receiverId: { not: admin.id } }
                ]
            }
        });
        console.log(`🗑️  ${deletedMessages.count} mensagens deletadas`);

        console.log('');
        console.log('✅ Limpeza concluída com sucesso!');
        console.log(`ℹ️  Dados do admin (${admin.email}) foram preservados.`);

    } catch (error) {
        console.error('❌ Erro durante a limpeza:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanNonAdminData();
