import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdmin() {
    const email = 'admin@magazine.com';
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (user) {
            console.log(`User ${email} found! Updating password...`);
            const hashedPassword = await bcrypt.hash('123456', 10);
            await prisma.user.update({
                where: { email },
                data: { passwordHash: hashedPassword }
            });
            console.log(`User ${email} password updated to '123456'`);
        } else {
            console.log(`User ${email} NOT found. Creating...`);
            const hashedPassword = await bcrypt.hash('123456', 10);
            const newUser = await prisma.user.create({
                data: {
                    email,
                    passwordHash: hashedPassword,
                    name: 'Admin Magazine',
                    role: 'ADMIN',
                    membershipType: 'MAGAZINE',
                    level: 99,
                    xp: 99999,
                },
            });
            console.log(`User ${email} created with password '123456'`);
        }
    } catch (error) {
        console.error('Error checking admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdmin();
