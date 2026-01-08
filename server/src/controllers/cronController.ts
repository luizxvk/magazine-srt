import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { runVerificationCronJobs } from '../services/verificationCronService';

export const runVerificationCron = async (req: AuthRequest, res: Response) => {
    try {
        await runVerificationCronJobs();
        res.json({ message: 'Verification cron job completed successfully' });
    } catch (error) {
        console.error('Error running verification cron:', error);
        res.status(500).json({ error: 'Failed to run verification cron job' });
    }
};
