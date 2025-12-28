import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function debugUsers() {
    try {
        console.log('--- Listing All Users ---');
        const users = await prisma.user.findMany();
        for (const user of users) {
            console.log(`ID: ${user.id} | Email: ${user.email} | Name: ${user.name} | Role: ${user.role}`);
        }
        console.log('-------------------------');

        // Fix Admin
        const adminEmail = 'admin@magazine.com';
        const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
        if (admin) {
            const hash = await bcrypt.hash('123456', 10);
            await prisma.user.update({
                where: { email: adminEmail },
                data: { passwordHash: hash }
            });
            console.log(`[FIX] Password for ${adminEmail} reset to '123456'`);
        } else {
            console.log(`[WARN] Admin user ${adminEmail} not found.`);
        }

        // Fix Nicole
        // Search for nicole
        const nicole = users.find(u => u.email.includes('nicole') || u.name.toLowerCase().includes('nicole'));
        if (nicole) {
            const hash = await bcrypt.hash('123456', 10);
            await prisma.user.update({
                where: { id: nicole.id },
                data: { passwordHash: hash }
            });
            console.log(`[FIX] Password for ${nicole.email} (Name: ${nicole.name}) reset to '123456'`);
        } else {
            console.log(`[WARN] No user found matching 'nicole'. Creating one...`);
            const email = 'nicolevalentina.official@gmail.com';
            const hash = await bcrypt.hash('123456', 10);
            await prisma.user.create({
                data: {
                    email,
                    passwordHash: hash,
                    name: 'Nicole Valentina',
                    role: 'MEMBER',
                    membershipType: 'MAGAZINE',
                    level: 5,
                    xp: 5000
                }
            });
            console.log(`[CREATE] Created user ${email} with password '123456'`);
        }

    } catch (error) {
        console.error('Error debugging users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugUsers();
