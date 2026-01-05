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
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/feed', feedRoutes);
app.use('/posts', postRoutes);
app.use('/social', socialRoutes);
app.use('/notifications', notificationRoutes);
app.use('/gamification', gamificationRoutes);
app.use('/messages', messageRoutes);
app.use('/invites', inviteRoutes);
app.use('/announcements', announcementRoutes);
app.use('/announcements', announcementRoutes);
app.use('/content', contentRoutes); // Fixed: Removed /api to match client requests
app.use('/logs', logsRoutes);
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.path}`);
    next();
});



// Standard Route Mount
app.use('/catalog', catalogRoutes);
app.use('/payments', paymentRoutes);
app.use('/events', eventRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'MAGAZINE API is running', status: 'active' });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
