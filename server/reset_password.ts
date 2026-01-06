// Script para resetar senha de usuário
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetUserPassword() {
    const email = 'luizguilherme011@gmail.com';
    const newPassword = 'Carro123';
    
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user) {
            console.log('Usuário não encontrado!');
            return;
        }
        
        console.log('Usuário encontrado:', user.name, user.email);
        
        const passwordHash = await bcrypt.hash(newPassword, 10);
        
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null
            }
        });
        
        console.log('✅ Senha resetada com sucesso para:', newPassword);
        
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetUserPassword();
