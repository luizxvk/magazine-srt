/**
 * Script para limpar o banco de dados
 * Mantém apenas o usuário admin e os dados do sistema (badges, rewards, etc.)
 * Remove todos os outros usuários e seus dados relacionados
 * 
 * Executar: npx ts-node clean_database.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
    console.log('🧹 Iniciando limpeza do banco de dados...');
    console.log('⚠️  ATENÇÃO: Isso removerá todos os usuários exceto o admin!\n');
    
    // Buscar o admin
    const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
        console.log('❌ Nenhum usuário admin encontrado! Abortando...');
        return;
    }
    
    console.log(`✅ Admin encontrado: ${adminUser.name} (${adminUser.email})`);
    console.log(`   ID: ${adminUser.id}\n`);
    
    // Buscar todos os usuários não-admin
    const usersToDelete = await prisma.user.findMany({
        where: { 
            id: { not: adminUser.id },
            role: { not: 'ADMIN' }
        },
        select: { id: true, name: true, email: true }
    });
    
    console.log(`📋 Usuários a serem removidos: ${usersToDelete.length}`);
    for (const user of usersToDelete) {
        console.log(`   - ${user.name} (${user.email})`);
    }
    console.log('');
    
    const userIdsToDelete = usersToDelete.map(u => u.id);
    
    if (userIdsToDelete.length === 0) {
        console.log('✅ Nenhum usuário para remover. Banco já está limpo!');
        return;
    }
    
    // Deletar dados relacionados em ordem (para evitar erros de FK)
    console.log('🗑️  Removendo dados relacionados...\n');
    
    // 1. Social Activities
    const socialActivities = await prisma.socialActivity.deleteMany({
        where: { userId: { in: userIdsToDelete } }
    });
    console.log(`   SocialActivity: ${socialActivities.count}`);
    
    // 2. Social Connections
    const socialConnections = await prisma.socialConnection.deleteMany({
        where: { userId: { in: userIdsToDelete } }
    });
    console.log(`   SocialConnection: ${socialConnections.count}`);
    
    // 3. User Theme Packs
    const userThemePacks = await prisma.userThemePack.deleteMany({
        where: { userId: { in: userIdsToDelete } }
    });
    console.log(`   UserThemePack: ${userThemePacks.count}`);
    
    // 4. Withdrawal Requests
    const withdrawalRequests = await prisma.withdrawalRequest.deleteMany({
        where: { userId: { in: userIdsToDelete } }
    });
    console.log(`   WithdrawalRequest: ${withdrawalRequests.count}`);
    
    // 5. Feedbacks
    const feedbacks = await prisma.feedback.deleteMany({
        where: { userId: { in: userIdsToDelete } }
    });
    console.log(`   Feedback: ${feedbacks.count}`);
    
    // 6. Market Transactions (buyer and seller)
    const marketTransactions = await prisma.marketTransaction.deleteMany({
        where: { 
            OR: [
                { buyerId: { in: userIdsToDelete } },
                { sellerId: { in: userIdsToDelete } }
            ]
        }
    });
    console.log(`   MarketTransaction: ${marketTransactions.count}`);
    
    // 7. Market Listings
    const marketListings = await prisma.marketListing.deleteMany({
        where: { sellerId: { in: userIdsToDelete } }
    });
    console.log(`   MarketListing: ${marketListings.count}`);
    
    // 8. Zion Purchases
    const zionPurchases = await prisma.zionPurchase.deleteMany({
        where: { userId: { in: userIdsToDelete } }
    });
    console.log(`   ZionPurchase: ${zionPurchases.count}`);
    
    // 9. Zion History
    const zionHistory = await prisma.zionHistory.deleteMany({
        where: { userId: { in: userIdsToDelete } }
    });
    console.log(`   ZionHistory: ${zionHistory.count}`);
    
    // 10. User Badges
    const userBadges = await prisma.userBadge.deleteMany({
        where: { userId: { in: userIdsToDelete } }
    });
    console.log(`   UserBadge: ${userBadges.count}`);
    
    // 11. Story Views
    const storyViews = await prisma.storyView.deleteMany({
        where: { viewerId: { in: userIdsToDelete } }
    });
    console.log(`   StoryView: ${storyViews.count}`);
    
    // 12. Stories
    const stories = await prisma.story.deleteMany({
        where: { userId: { in: userIdsToDelete } }
    });
    console.log(`   Story: ${stories.count}`);
    
    // 13. Reports
    const reports = await prisma.report.deleteMany({
        where: { reporterId: { in: userIdsToDelete } }
    });
    console.log(`   Report: ${reports.count}`);
    
    // 14. Redemptions
    const redemptions = await prisma.redemption.deleteMany({
        where: { userId: { in: userIdsToDelete } }
    });
    console.log(`   Redemption: ${redemptions.count}`);
    
    // 15. Point History
    const pointHistory = await prisma.pointHistory.deleteMany({
        where: { userId: { in: userIdsToDelete } }
    });
    console.log(`   PointHistory: ${pointHistory.count}`);
    
    // 16. Notifications
    const notifications = await prisma.notification.deleteMany({
        where: { userId: { in: userIdsToDelete } }
    });
    console.log(`   Notification: ${notifications.count}`);
    
    // 17. Messages (sent and received)
    const messages = await prisma.message.deleteMany({
        where: { 
            OR: [
                { senderId: { in: userIdsToDelete } },
                { receiverId: { in: userIdsToDelete } }
            ]
        }
    });
    console.log(`   Message: ${messages.count}`);
    
    // 18. Likes (and first delete likes on posts to be deleted)
    const likes = await prisma.like.deleteMany({
        where: { userId: { in: userIdsToDelete } }
    });
    console.log(`   Like: ${likes.count}`);
    
    // 19. Group Messages
    const groupMessages = await prisma.groupMessage.deleteMany({
        where: { senderId: { in: userIdsToDelete } }
    });
    console.log(`   GroupMessage: ${groupMessages.count}`);
    
    // 20. Group Members
    const groupMembers = await prisma.groupMember.deleteMany({
        where: { userId: { in: userIdsToDelete } }
    });
    console.log(`   GroupMember: ${groupMembers.count}`);
    
    // 21. Group Invites
    const groupInvites = await prisma.groupInvite.deleteMany({
        where: { 
            OR: [
                { inviterId: { in: userIdsToDelete } },
                { invitedId: { in: userIdsToDelete } }
            ]
        }
    });
    console.log(`   GroupInvite: ${groupInvites.count}`);
    
    // 22. Groups created by users to delete
    const groups = await prisma.group.deleteMany({
        where: { creatorId: { in: userIdsToDelete } }
    });
    console.log(`   Group: ${groups.count}`);
    
    // 23. Friendships
    const friendships = await prisma.friendship.deleteMany({
        where: { 
            OR: [
                { requesterId: { in: userIdsToDelete } },
                { addresseeId: { in: userIdsToDelete } }
            ]
        }
    });
    console.log(`   Friendship: ${friendships.count}`);
    
    // 24. Comments (first need to delete likes on comments, then comments on posts to delete)
    // Get all posts to be deleted
    const postsToDelete = await prisma.post.findMany({
        where: { userId: { in: userIdsToDelete } },
        select: { id: true }
    });
    const postIdsToDelete = postsToDelete.map(p => p.id);
    
    // Delete likes on posts that will be deleted
    const likesOnPosts = await prisma.like.deleteMany({
        where: { postId: { in: postIdsToDelete } }
    });
    console.log(`   Like (on posts to delete): ${likesOnPosts.count}`);
    
    // Delete comments on posts that will be deleted
    const commentsOnPosts = await prisma.comment.deleteMany({
        where: { postId: { in: postIdsToDelete } }
    });
    console.log(`   Comment (on posts to delete): ${commentsOnPosts.count}`);
    
    // Delete comments by users to delete
    const comments = await prisma.comment.deleteMany({
        where: { userId: { in: userIdsToDelete } }
    });
    console.log(`   Comment (by users): ${comments.count}`);
    
    // 25. Posts
    const posts = await prisma.post.deleteMany({
        where: { userId: { in: userIdsToDelete } }
    });
    console.log(`   Post: ${posts.count}`);
    
    // 26. Catalog Photos
    const catalogPhotos = await prisma.catalogPhoto.deleteMany({
        where: { userId: { in: userIdsToDelete } }
    });
    console.log(`   CatalogPhoto: ${catalogPhotos.count}`);
    
    // 27. Admin Badges (user-specific badges)
    const adminBadges = await prisma.adminBadge.deleteMany({
        where: { userId: { in: userIdsToDelete } }
    });
    console.log(`   AdminBadge: ${adminBadges.count}`);
    
    // 28. Products created by users - skip if no creatorId field exists
    // Products may not have a direct user relation, skip this
    console.log(`   Product: (skipped - no direct user relation)`);
    
    // 29. Finally, delete the users themselves
    console.log('\n🗑️  Removendo usuários...');
    const deletedUsers = await prisma.user.deleteMany({
        where: { id: { in: userIdsToDelete } }
    });
    console.log(`   Users deleted: ${deletedUsers.count}`);
    
    // Verificar usuários restantes
    const remainingUsers = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true }
    });
    
    console.log('\n✅ Limpeza concluída!');
    console.log(`📊 Usuários restantes: ${remainingUsers.length}`);
    for (const user of remainingUsers) {
        console.log(`   - ${user.name} (${user.email}) [${user.role}]`);
    }
}

cleanDatabase()
    .catch((e) => {
        console.error('❌ Erro durante a limpeza:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
