import express from 'express';
import cors from 'cors';
import compression from 'compression';
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
import reportRoutes from './src/routes/reportRoutes';
import groupRoutes from './src/routes/groupRoutes';
import adminBadgeRoutes from './src/routes/adminBadges';
import dashboardRoutes from './src/routes/dashboard';
import cronRoutes from './src/routes/cronRoutes';
import uploadRoutes from './src/routes/uploadRoutes';
import marketRoutes from './src/routes/marketRoutes';
import feedbackRoutes from './src/routes/feedbackRoutes';
import productRoutes from './src/routes/productRoutes';
import withdrawalRoutes from './src/routes/withdrawalRoutes';
import themePackRoutes from './src/routes/themePackRoutes';
import supplyBoxRoutes from './src/routes/supplyBoxRoutes';
import rovexRoutes from './src/routes/rovexRoutes';
import featureRoutes from './src/routes/featureRoutes';
import ogRoutes from './src/routes/ogRoutes';
import consumptionRoutes from './src/routes/consumptionRoutes';
import { logger } from './src/utils/logger';
import { sanitizeInput, securityHeaders } from './src/middleware/securityMiddleware';
import { rateLimit } from './src/middleware/rateLimitMiddleware';
import { suspensionMiddleware } from './src/middleware/suspensionMiddleware';
import { runVerificationCronJobs } from './src/services/verificationCronService';
import { reportMetricsToRovex, isRovexConfigured } from './src/services/rovexService';
import { cleanupExpiredGroupMessages } from './src/services/groupMessageCleanupService';

dotenv.config();

// Initialize Logger
logger.init();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable gzip compression for all responses
app.use(compression());

// Permissive CORS Configuration - MUST be before security headers
const allowedOrigins = [
    'https://magazine-frontend.vercel.app',
    'https://magazine-srt.vercel.app',
    'https://magazine-mgt.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    // Capacitor origins (Android/iOS apps)
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'https://localhost'
];

const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow Capacitor/Ionic apps
        if (origin.startsWith('capacitor://') || origin.startsWith('ionic://')) {
            return callback(null, true);
        }
        
        // Allow file:// protocol (WebView local files)
        if (origin.startsWith('file://')) {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control'],
    preflightContinue: false,
    optionsSuccessStatus: 200
};

// Handle OPTIONS explicitly
app.options(/.*/, cors(corsOptions));
app.use(cors(corsOptions));

// Security Headers (after CORS)
app.use(securityHeaders);

// Global Rate Limiting (100 requests per minute per IP)
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Input Sanitization
app.use(sanitizeInput);

app.use('/uploads', express.static('uploads'));

// Routes
// API Router
const apiRouter = express.Router();

// Rovex routes FIRST (always allowed, even when suspended)
apiRouter.use('/rovex', rovexRoutes);

// Suspension check middleware (applied to all routes below)
// This will block access if community is suspended
apiRouter.use(suspensionMiddleware);

// Regular routes (subject to suspension check)
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/feed', feedRoutes);
apiRouter.use('/posts', postRoutes);
apiRouter.use('/supply-box', supplyBoxRoutes);
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
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/groups', groupRoutes);
apiRouter.use('/admin/badges', adminBadgeRoutes);
apiRouter.use('/admin/dashboard', dashboardRoutes);
apiRouter.use('/cron', cronRoutes);
apiRouter.use('/uploads', uploadRoutes);
apiRouter.use('/market', marketRoutes);
apiRouter.use('/feedback', feedbackRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/withdrawals', withdrawalRoutes);
apiRouter.use('/theme-packs', themePackRoutes);
apiRouter.use('/features', featureRoutes);
apiRouter.use('/og', ogRoutes);
apiRouter.use('/admin', consumptionRoutes);

// Mount API Router
app.use('/api', apiRouter);

// Log all requests (after routes for debugging)
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

        // Run verification cron job every hour
        setInterval(() => {
            runVerificationCronJobs().catch(err =>
                console.error('Cron job error:', err)
            );
        }, 60 * 60 * 1000); // 1 hour

        // Run immediately on startup
        runVerificationCronJobs().catch(err =>
            console.error('Initial cron job error:', err)
        );

        // === GROUP MESSAGE CLEANUP ===
        // Clean expired group messages every 6 hours
        setInterval(() => {
            cleanupExpiredGroupMessages().catch(err =>
                console.error('[GroupCleanup] Cron job error:', err)
            );
        }, 6 * 60 * 60 * 1000); // 6 hours

        // Run cleanup on startup (after 30 seconds)
        setTimeout(() => {
            cleanupExpiredGroupMessages().catch(err =>
                console.error('[GroupCleanup] Initial cleanup error:', err)
            );
        }, 30 * 1000);

        // === ROVEX INTEGRATION ===
        // Report metrics to Rovex Platform every 5 minutes
        if (isRovexConfigured()) {
            console.log('[Rovex] ✅ Integration configured - starting metrics cron');
            
            // Report every 5 minutes
            setInterval(() => {
                reportMetricsToRovex().catch(err =>
                    console.error('[Rovex] Metrics cron error:', err)
                );
            }, 5 * 60 * 1000); // 5 minutes

            // Report on startup (after 10 seconds to let server stabilize)
            setTimeout(() => {
                reportMetricsToRovex().catch(err =>
                    console.error('[Rovex] Initial metrics report error:', err)
                );
            }, 10 * 1000);
        } else {
            console.log('[Rovex] ⚠️ Integration not configured - skipping metrics cron');
        }
    });

    // Keep the server alive
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
}

export default app;
