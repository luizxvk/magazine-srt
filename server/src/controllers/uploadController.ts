import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { 
    uploadPostImageR2, 
    uploadStoryImageR2, 
    uploadAvatarR2, 
    uploadCatalogPhotoR2,
    uploadGroupImageR2,
    isR2Configured 
} from '../services/r2Service';
import { 
    uploadPostImage as uploadPostImageCloudinary, 
    uploadStoryImage as uploadStoryImageCloudinary 
} from '../services/cloudinaryService';

// Upload post image
export const uploadPostImage = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        let imageUrl: string;
        const r2Config = isR2Configured();
        console.log(`[uploadPostImage] R2 configured: ${r2Config}, file size: ${req.file.size} bytes`);

        // Use R2 if configured, fallback to Cloudinary
        if (r2Config) {
            console.log('[uploadPostImage] Using R2 storage');
            imageUrl = await uploadPostImageR2(req.file.buffer, req.file.mimetype);
        } else {
            console.log('[uploadPostImage] Using Cloudinary fallback');
            imageUrl = await uploadPostImageCloudinary(req.file.buffer);
        }

        console.log(`[uploadPostImage] Upload successful: ${imageUrl}`);
        res.json({ imageUrl });
    } catch (error) {
        console.error('[uploadPostImage] Upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
};

// Upload story image
export const uploadStoryImage = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        let imageUrl: string;
        const r2Config = isR2Configured();
        console.log(`[uploadStoryImage] R2 configured: ${r2Config}, file size: ${req.file.size} bytes`);

        if (r2Config) {
            console.log('[uploadStoryImage] Using R2 storage');
            imageUrl = await uploadStoryImageR2(req.file.buffer, req.file.mimetype);
        } else {
            console.log('[uploadStoryImage] Using Cloudinary fallback');
            imageUrl = await uploadStoryImageCloudinary(req.file.buffer);
        }

        console.log(`[uploadStoryImage] Upload successful: ${imageUrl}`);
        res.json({ imageUrl });
    } catch (error) {
        console.error('[uploadStoryImage] Upload error:', error);
        res.status(500).json({ error: 'Failed to upload story image' });
    }
};

// Upload avatar
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        let imageUrl: string;
        const r2Config = isR2Configured();
        console.log(`[uploadAvatar] R2 configured: ${r2Config}, file size: ${req.file.size} bytes`);

        if (r2Config) {
            console.log('[uploadAvatar] Using R2 storage');
            imageUrl = await uploadAvatarR2(req.file.buffer, req.file.mimetype);
        } else {
            console.log('[uploadAvatar] Avatar upload - R2 not configured, returning error');
            return res.status(503).json({ error: 'Storage service not configured' });
        }

        console.log(`[uploadAvatar] Upload successful: ${imageUrl}`);
        res.json({ imageUrl });
    } catch (error) {
        console.error('[uploadAvatar] Upload error:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
};

// Upload catalog photo
export const uploadCatalogPhoto = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        let imageUrl: string;

        if (isR2Configured()) {
            imageUrl = await uploadCatalogPhotoR2(req.file.buffer, req.file.mimetype);
        } else {
            imageUrl = await uploadPostImageCloudinary(req.file.buffer);
        }

        res.json({ imageUrl });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload catalog photo' });
    }
};

// Upload group image
export const uploadGroupImage = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        let imageUrl: string;

        if (isR2Configured()) {
            imageUrl = await uploadGroupImageR2(req.file.buffer, req.file.mimetype);
        } else {
            imageUrl = await uploadPostImageCloudinary(req.file.buffer);
        }

        res.json({ imageUrl });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload group image' });
    }
};
