import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { sendWelcomeToMagazineEmail, sendNewMagazineMemberEmail } from '../services/emailService';

export const createRequest = async (req: Request, res: Response) => {
    try {
        const { name, email, instagram } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const existingRequest = await prisma.inviteRequest.findUnique({
            where: { email }
        });

        if (existingRequest) {
            return res.status(400).json({ error: 'Request already exists for this email' });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        // If user exists but is NOT MGT (i.e., already MAGAZINE), block
        // MGT users CAN request to join Magazine - admin will decide
        if (existingUser && existingUser.membershipType !== 'MGT') {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Store whether this is an MGT user requesting Magazine membership
        const request = await prisma.inviteRequest.create({
            data: { 
                name, 
                email, 
                instagram,
                // If user exists and is MGT, store the userId for later conversion
            }
        });

        // Notify all admins with special message for MGT conversion
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' }
        });

        if (admins.length > 0) {
            const notificationContent = existingUser?.membershipType === 'MGT'
                ? `🔄 Usuário MGT solicitando entrada na Magazine: ${name} (${email})`
                : `Nova solicitação de convite: ${name} (${email})`;

            await prisma.notification.createMany({
                data: admins.map(admin => ({
                    userId: admin.id,
                    type: 'SYSTEM',
                    content: notificationContent,
                    read: false
                }))
            });
        }

        res.status(201).json(request);
    } catch (error) {
        console.error('Error creating invite request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getRequests = async (req: Request, res: Response) => {
    try {
        const requests = await prisma.inviteRequest.findMany({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' }
        });
        res.json(requests);
    } catch (error) {
        console.error('Error fetching invite requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

import bcrypt from 'bcryptjs';

// ... (existing imports)

export const approveRequest = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const request = await prisma.inviteRequest.findUnique({ where: { id } });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({ error: 'Request is not pending' });
        }

        // Check if this is an existing MGT user requesting to join Magazine
        const existingUser = await prisma.user.findUnique({
            where: { email: request.email }
        });

        let user;
        let generatedPassword = null;

        if (existingUser && existingUser.membershipType === 'MGT') {
            // Convert MGT user to MAGAZINE membership
            user = await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    membershipType: 'MAGAZINE'
                }
            });

            // Notify the user about their membership upgrade
            await prisma.notification.create({
                data: {
                    userId: user.id,
                    type: 'SYSTEM',
                    content: '🎉 Parabéns! Sua solicitação foi aprovada! Você agora é um membro Magazine!',
                    read: false
                }
            });

            // Send welcome email to Magazine
            await sendWelcomeToMagazineEmail(user.email, user.name);
        } else {
            // Create new user (original behavior)
            generatedPassword = Math.random().toString(36).slice(-8);
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(generatedPassword, salt);

            user = await prisma.user.create({
                data: {
                    name: request.name,
                    email: request.email,
                    passwordHash: passwordHash,
                    displayName: request.instagram || request.name,
                    role: 'MEMBER'
                }
            });

            // Send welcome email with credentials to new Magazine member
            await sendNewMagazineMemberEmail(user.email, user.name, generatedPassword);
        }

        // Update request status
        await prisma.inviteRequest.update({
            where: { id },
            data: { status: 'APPROVED' }
        });

        const responseData: any = {
            message: existingUser?.membershipType === 'MGT' 
                ? 'MGT user converted to Magazine membership'
                : 'Request approved and user created',
            user,
            wasConversion: existingUser?.membershipType === 'MGT'
        };

        // Only include password for new users
        if (generatedPassword) {
            responseData.generatedPassword = generatedPassword;
        }

        res.json(responseData);
    } catch (error) {
        console.error('Error approving request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const rejectRequest = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.inviteRequest.update({
            where: { id },
            data: { status: 'REJECTED' }
        });
        res.json({ message: 'Request rejected' });
    } catch (error) {
        console.error('Error rejecting request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
