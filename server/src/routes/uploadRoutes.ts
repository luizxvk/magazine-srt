import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/authMiddleware';
import { 
    uploadPostImage, 
    uploadStoryImage, 
    uploadAvatar,
    uploadCatalogPhoto,
    uploadGroupImage 
} from '../controllers/uploadController';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'));
        }
        cb(null, true);
    },
});

// All upload routes require authentication
router.post('/post', authenticateToken, upload.single('image'), uploadPostImage);
router.post('/story', authenticateToken, upload.single('image'), uploadStoryImage);
router.post('/avatar', authenticateToken, upload.single('image'), uploadAvatar);
router.post('/catalog', authenticateToken, upload.single('image'), uploadCatalogPhoto);
router.post('/group', authenticateToken, upload.single('image'), uploadGroupImage);

export default router;
