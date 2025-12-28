
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@magazine.com'; // Assuming this is the email, or admin@magazine
    // The user said "admin@magazine", let's try that first, or check both.
    // Actually, standard practice is often admin@magazine.com or similar. 
    // I will upsert 'admin@magazine.com' as the main admin.

    // Wait, the user specifically said "admin@magazine". I should support that or standard email format.
    // Let's create 'admin@magazine.com' and 'admin@magazine' to be sure, or just 'admin@magazine.com' and tell the user.
    // But if they are typing 'admin@magazine', maybe the validation allows it?
    // The login schema expects z.string().email(). 'admin@magazine' is NOT a valid email by Zod default.
    // So the user MIGHT be typing 'admin@magazine' but the system expects an email.
    // However, if the user SAYS "admin@magazine", they might mean that's what they are trying.
    // Let's stick to a valid email 'admin@magazine.com' and tell the user to use that.

    const targetEmail = 'admin@magazine.com';
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
        where: { email: targetEmail },
        update: {
            passwordHash,
            role: 'ADMIN',
            membershipType: 'MAGAZINE'
        },
        create: {
            email: targetEmail,
            name: 'Admin',
            passwordHash,
            role: 'ADMIN',
            membershipType: 'MAGAZINE',
            zions: 9999,
            trophies: 999
        }
    });

    console.log(`Admin user upserted: ${admin.email} / ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
