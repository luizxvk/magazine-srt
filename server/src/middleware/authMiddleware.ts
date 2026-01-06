import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
        sessionToken?: string;
    };
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
        
        // Verify session token matches (single device login)
        if (decoded.sessionToken) {
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { sessionToken: true }
            });
            
            if (!user || user.sessionToken !== decoded.sessionToken) {
                return res.status(403).json({ 
                    error: 'Session expired - logged in from another device',
                    code: 'SESSION_EXPIRED'
                });
            }
        }
        
        (req as AuthRequest).user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

export const authenticateTokenOptional = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
        
        // Verify session token matches (single device login)
        if (decoded.sessionToken) {
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { sessionToken: true }
            });
            
            if (!user || user.sessionToken !== decoded.sessionToken) {
                return res.status(403).json({ 
                    error: 'Session expired - logged in from another device',
                    code: 'SESSION_EXPIRED'
                });
            }
        }
        
        (req as AuthRequest).user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
