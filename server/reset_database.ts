import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
    console.log('🔄 Starting database reset...\n');

    // 1. Find admin user(s) to preserve
    const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' }
    });

    if (admins.length === 0) {
        console.log('❌ No admin users found! Aborting to prevent data loss.');
        return;
    }

    console.log(`✅ Found ${admins.length} admin(s) to preserve:`);
    admins.forEach(a => console.log(`   - ${a.name} (${a.email})`));

    const adminIds = admins.map(a => a.id);

    // 2. Delete all data in correct order (respecting foreign keys)
    console.log('\n🗑️  Deleting data...\n');

    // Reports
    const reports = await prisma.report.deleteMany({});
    console.log(`   Deleted ${reports.count} reports`);

    // Story views
    const storyViews = await prisma.storyView.deleteMany({});
    console.log(`   Deleted ${storyViews.count} story views`);

    // Stories
    const stories = await prisma.story.deleteMany({});
    console.log(`   Deleted ${stories.count} stories`);

    // Messages
    const messages = await prisma.message.deleteMany({});
    console.log(`   Deleted ${messages.count} messages`);

    // Notifications
    const notifications = await prisma.notification.deleteMany({});
    console.log(`   Deleted ${notifications.count} notifications`);

    // Likes
    const likes = await prisma.like.deleteMany({});
    console.log(`   Deleted ${likes.count} likes`);

    // Comments
    const comments = await prisma.comment.deleteMany({});
    console.log(`   Deleted ${comments.count} comments`);

    // Post tags
    const postTags = await prisma.postTag.deleteMany({});
    console.log(`   Deleted ${postTags.count} post tags`);

    // Posts
    const posts = await prisma.post.deleteMany({});
    console.log(`   Deleted ${posts.count} posts`);

    // User badges
    const userBadges = await prisma.userBadge.deleteMany({});
    console.log(`   Deleted ${userBadges.count} user badges`);

    // Friendships
    const friendships = await prisma.friendship.deleteMany({});
    console.log(`   Deleted ${friendships.count} friendships`);

    // Redemptions
    const redemptions = await prisma.redemption.deleteMany({});
    console.log(`   Deleted ${redemptions.count} redemptions`);

    // Point history
    const pointHistory = await prisma.pointHistory.deleteMany({});
    console.log(`   Deleted ${pointHistory.count} point history entries`);

    // Zion history
    const zionHistory = await prisma.zionHistory.deleteMany({});
    console.log(`   Deleted ${zionHistory.count} zion history entries`);

    // Zion purchases
    const zionPurchases = await prisma.zionPurchase.deleteMany({});
    console.log(`   Deleted ${zionPurchases.count} zion purchases`);

    // Catalog photos
    const catalogPhotos = await prisma.catalogPhoto.deleteMany({});
    console.log(`   Deleted ${catalogPhotos.count} catalog photos`);

    // Events
    const events = await prisma.event.deleteMany({});
    console.log(`   Deleted ${events.count} events`);

    // Invite requests
    const inviteRequests = await prisma.inviteRequest.deleteMany({});
    console.log(`   Deleted ${inviteRequests.count} invite requests`);

    // Announcements
    const announcements = await prisma.announcement.deleteMany({});
    console.log(`   Deleted ${announcements.count} announcements`);

    // Delete NON-admin users
    const deletedUsers = await prisma.user.deleteMany({
        where: {
            id: { notIn: adminIds }
        }
    });
    console.log(`   Deleted ${deletedUsers.count} users (kept ${admins.length} admin(s))`);

    // 3. Reset admin stats (optional - keeping basic info)
    for (const admin of admins) {
        await prisma.user.update({
            where: { id: admin.id },
            data: {
                points: 0,
                trophies: 0,
                level: 1,
                xp: 0,
                zions: 1000, // Give admin some starting zions
                isOnline: false,
                lastSeenAt: null
            }
        });
    }
    console.log(`   Reset admin stats`);

    console.log('\n✅ Database reset complete!');
    console.log(`   Preserved admins: ${admins.map(a => a.email).join(', ')}`);
}

resetDatabase()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
