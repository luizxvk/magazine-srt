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

        // Use R2 if configured, fallback to Cloudinary
        if (isR2Configured()) {
            imageUrl = await uploadPostImageR2(req.file.buffer, req.file.mimetype);
        } else {
            imageUrl = await uploadPostImageCloudinary(req.file.buffer);
        }

        res.json({ imageUrl });
    } catch (error) {
        console.error('Upload error:', error);
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

        if (isR2Configured()) {
            imageUrl = await uploadStoryImageR2(req.file.buffer, req.file.mimetype);
        } else {
            imageUrl = await uploadStoryImageCloudinary(req.file.buffer);
        }

        res.json({ imageUrl });
    } catch (error) {
        console.error('Upload error:', error);
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

        if (isR2Configured()) {
            imageUrl = await uploadAvatarR2(req.file.buffer, req.file.mimetype);
        } else {
            // Fallback to Cloudinary or local storage
            imageUrl = await uploadPostImageCloudinary(req.file.buffer);
        }

        res.json({ imageUrl });
    } catch (error) {
        console.error('Upload error:', error);
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
