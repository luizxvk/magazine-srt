import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUser() {
    try {
        const emails = ['luizguilherme@gmail.com', 'luizguilherme011@gmail.com'];
        
        for (const email of emails) {
            const deleted = await prisma.user.deleteMany({
                where: { email }
            });
            
            if (deleted.count > 0) {
                console.log(`✅ Deleted user: ${email}`);
            } else {
                console.log(`⚠️  User not found: ${email}`);
            }
        }
    } catch (error) {
        console.error('Error deleting user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteUser();
