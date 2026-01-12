import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createLuizUser() {
    try {
        const email = 'luizguilherme@gmail.com';
        const password = 'luiz123'; // ALTERE ESTA SENHA!
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                passwordHash: hashedPassword,
            },
            create: {
                email,
                name: 'Luiz Guilherme',
                displayName: 'Luiz Guilherme',
                passwordHash: hashedPassword,
                role: 'ADMIN',
                bio: 'Founder & Creator',
                points: 5000,
                trophies: 5000,
                zions: 10000,
                zionsPoints: 50000,
                zionsCash: 500,
                level: 50,
                membershipType: 'MAGAZINE',
                isVerified: true
            }
        });

        console.log('✅ User created successfully:');
        console.log({
            email: user.email,
            name: user.name,
            role: user.role,
            zions: user.zions,
            zionsPoints: user.zionsPoints,
            zionsCash: user.zionsCash,
        });
        console.log('\n🔑 Login credentials:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    } catch (error) {
        console.error('Error creating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createLuizUser();
