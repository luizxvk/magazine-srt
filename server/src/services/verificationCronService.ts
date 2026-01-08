import prisma from '../utils/prisma';
import { sendVerificationReminder } from './emailVerificationService';

// Suspend accounts with expired verification
export const suspendExpiredAccounts = async (): Promise<number> => {
    try {
        const now = new Date();
        
        // Find users with expired verification
        const expiredUsers = await prisma.user.findMany({
            where: {
                isVerified: false,
                verificationExpiry: {
                    lt: now,
                },
                deletedAt: null,
            },
        });

        if (expiredUsers.length === 0) {
            console.log('No expired accounts to suspend');
            return 0;
        }

        // Suspend these accounts (soft delete)
        await prisma.user.updateMany({
            where: {
                id: {
                    in: expiredUsers.map(u => u.id),
                },
            },
            data: {
                deletedAt: now,
            },
        });

        console.log(`Suspended ${expiredUsers.length} expired accounts`);
        return expiredUsers.length;
    } catch (error) {
        console.error('Error suspending expired accounts:', error);
        return 0;
    }
};

// Send reminders to users about to expire (24 hours before)
export const sendExpirationReminders = async (): Promise<number> => {
    try {
        const now = new Date();
        const twentyFourHoursFromNow = new Date();
        twentyFourHoursFromNow.setHours(twentyFourHoursFromNow.getHours() + 24);

        // Find users expiring in 24 hours who haven't been reminded recently
        const usersToRemind = await prisma.user.findMany({
            where: {
                isVerified: false,
                verificationExpiry: {
                    gte: now,
                    lte: twentyFourHoursFromNow,
                },
                deletedAt: null,
                // Only send if last email was more than 12 hours ago
                verificationSentAt: {
                    lt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
                },
            },
        });

        if (usersToRemind.length === 0) {
            console.log('No users need reminders');
            return 0;
        }

        let sent = 0;
        for (const user of usersToRemind) {
            try {
                const hoursRemaining = Math.ceil(
                    (user.verificationExpiry!.getTime() - now.getTime()) / (1000 * 60 * 60)
                );

                await sendVerificationReminder({
                    to: user.email,
                    name: user.name,
                    hoursRemaining,
                });

                // Update last sent time
                await prisma.user.update({
                    where: { id: user.id },
                    data: { verificationSentAt: now },
                });

                sent++;
            } catch (error) {
                console.error(`Failed to send reminder to ${user.email}:`, error);
            }
        }

        console.log(`Sent ${sent} expiration reminders`);
        return sent;
    } catch (error) {
        console.error('Error sending expiration reminders:', error);
        return 0;
    }
};

// Run both tasks
export const runVerificationCronJobs = async (): Promise<void> => {
    console.log('Running verification cron jobs...');
    
    const suspended = await suspendExpiredAccounts();
    const reminded = await sendExpirationReminders();
    
    console.log(`Cron job complete: ${suspended} suspended, ${reminded} reminded`);
};
