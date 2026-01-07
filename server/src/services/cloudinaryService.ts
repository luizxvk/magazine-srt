import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface UploadOptions {
    folder?: string;
    transformation?: object[];
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

/**
 * Upload image to Cloudinary CDN
 * Reduces database egress by serving images from CDN
 */
export const uploadToCloudinary = async (
    base64Data: string,
    options: UploadOptions = {}
): Promise<string | null> => {
    try {
        // Check if Cloudinary is configured
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
            console.warn('[Cloudinary] Not configured, using original data');
            return null;
        }

        const { folder = 'magazine-srt', transformation, resourceType = 'image' } = options;

        // Default transformations for optimization
        const defaultTransformation = [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }, // Serve WebP/AVIF when supported
            { dpr: 'auto' },
        ];

        const result = await cloudinary.uploader.upload(base64Data, {
            folder,
            resource_type: resourceType,
            transformation: transformation || defaultTransformation,
            // Optimization settings
            overwrite: false,
            unique_filename: true,
        });

        console.log(`[Cloudinary] Uploaded: ${result.public_id}, size reduced: ${result.bytes} bytes`);
        return result.secure_url;
    } catch (error) {
        console.error('[Cloudinary] Upload error:', error);
        return null;
    }
};

/**
 * Upload avatar with face-detection cropping
 */
export const uploadAvatar = async (base64Data: string): Promise<string | null> => {
    return uploadToCloudinary(base64Data, {
        folder: 'magazine-srt/avatars',
        transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
        ],
    });
};

/**
 * Upload post image with optimization
 */
export const uploadPostImage = async (base64Data: string): Promise<string | null> => {
    return uploadToCloudinary(base64Data, {
        folder: 'magazine-srt/posts',
        transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
        ],
    });
};

/**
 * Upload story image with optimization
 */
export const uploadStoryImage = async (base64Data: string): Promise<string | null> => {
    return uploadToCloudinary(base64Data, {
        folder: 'magazine-srt/stories',
        transformation: [
            { width: 1080, height: 1920, crop: 'limit' },
            { quality: 'auto:eco' }, // Lower quality for ephemeral content
            { fetch_format: 'auto' },
        ],
    });
};

/**
 * Delete image from Cloudinary
 */
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            return false;
        }
        
        await cloudinary.uploader.destroy(publicId);
        console.log(`[Cloudinary] Deleted: ${publicId}`);
        return true;
    } catch (error) {
        console.error('[Cloudinary] Delete error:', error);
        return false;
    }
};

/**
 * Check if URL is a Cloudinary URL
 */
export const isCloudinaryUrl = (url: string): boolean => {
    return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
};

/**
 * Extract public ID from Cloudinary URL
 */
export const getPublicIdFromUrl = (url: string): string | null => {
    try {
        const match = url.match(/\/v\d+\/(.+)\.\w+$/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
};

export default cloudinary;
