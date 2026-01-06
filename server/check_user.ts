
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'nicolevalentina.official@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
        console.log(`User found: ${user.name} (${user.email})`);
        // Reset password to '123456'
        const passwordHash = await bcrypt.hash('123456', 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash }
        });
        console.log('Password reset to 123456');
    } else {
        console.log('User not found. Creating...');
        const passwordHash = await bcrypt.hash('123456', 10);
        await prisma.user.create({
            data: {
                email,
                name: 'Nicole Valentina',
                passwordHash,
                role: 'ADMIN',
                membershipType: 'MGT',
                trophies: 100,
                level: 5
            }
        });
        console.log('User created with password 123456');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
