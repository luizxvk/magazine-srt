import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/authRoutes';
import userRoutes from './src/routes/userRoutes';
import feedRoutes from './src/routes/feedRoutes';
import postRoutes from './src/routes/postRoutes';
import socialRoutes from './src/routes/socialRoutes';
import notificationRoutes from './src/routes/notificationRoutes';
import gamificationRoutes from './src/routes/gamificationRoutes';
import messageRoutes from './src/routes/messageRoutes';
import inviteRoutes from './src/routes/inviteRoutes';
import announcementRoutes from './src/routes/announcementRoutes';
import contentRoutes from './src/routes/contentRoutes';
import logsRoutes from './src/routes/logsRoutes';
import catalogRoutes from './src/routes/catalogRoutes';
import paymentRoutes from './src/routes/paymentRoutes';
import eventRoutes from './src/routes/eventRoutes';
import { logger } from './src/utils/logger';

dotenv.config();

// Initialize Logger
logger.init();

const app = express();
const PORT = process.env.PORT || 3000;

// Permissive CORS Configuration
app.use(cors({
    origin: '*', // Allow ALL origins
    credentials: false, // Disable credentials (cookies) since we use Bearer tokens
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Handle preflight for all routes
app.options(/.*/, cors({
    origin: '*',
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static('uploads'));

// Routes
// API Router
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/feed', feedRoutes);
apiRouter.use('/posts', postRoutes);
apiRouter.use('/social', socialRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/gamification', gamificationRoutes);
apiRouter.use('/messages', messageRoutes);
apiRouter.use('/invites', inviteRoutes);
apiRouter.use('/announcements', announcementRoutes);
apiRouter.use('/content', contentRoutes);
apiRouter.use('/logs', logsRoutes);
apiRouter.use('/catalog', catalogRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/events', eventRoutes);

// Mount API Router
app.use('/api', apiRouter);
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.path}`);
    next();
});





// Health check route
app.get('/', (req, res) => {
    res.json({ message: 'MAGAZINE API is running', status: 'active' });
});

// Start server (only for local development, not for serverless)
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

if (!isServerless) {
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    // Keep the server alive
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
}

export default app;
