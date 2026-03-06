import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

// Initialize R2 client (Cloudflare R2 is S3-compatible)
const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT, // e.g., https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'magazine-srt';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || ''; // e.g., https://cdn.magazine-srt.com

interface UploadOptions {
    buffer: Buffer;
    mimeType: string;
    folder?: string;
}

// Map mimeType to file extension
const getExtensionFromMimeType = (mimeType: string): string => {
    const mimeMap: { [key: string]: string } = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/bmp': 'bmp',
        'image/svg+xml': 'svg',
    };
    return mimeMap[mimeType] || 'jpg';
};

// Generate unique filename
const generateFileName = (mimeType: string, folder?: string): string => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = getExtensionFromMimeType(mimeType);
    const basePath = folder ? `${folder}/` : '';
    return `${basePath}${timestamp}-${randomString}.${extension}`;
};

// Upload file to R2
export const uploadToR2 = async ({ buffer, mimeType, folder }: UploadOptions): Promise<string> => {
    try {
        const fileName = generateFileName(mimeType, folder);
        
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: buffer,
            ContentType: mimeType,
        });

        await r2Client.send(command);

        // Return public URL
        return `${PUBLIC_URL}/${fileName}`;
    } catch (error) {
        console.error('R2 upload error:', error);
        throw new Error('Failed to upload to R2');
    }
};

// Upload post image
export const uploadPostImageR2 = async (buffer: Buffer, mimeType: string): Promise<string> => {
    return uploadToR2({ buffer, mimeType, folder: 'posts' });
};

// Upload story image
export const uploadStoryImageR2 = async (buffer: Buffer, mimeType: string): Promise<string> => {
    return uploadToR2({ buffer, mimeType, folder: 'stories' });
};

// Upload avatar
export const uploadAvatarR2 = async (buffer: Buffer, mimeType: string): Promise<string> => {
    return uploadToR2({ buffer, mimeType, folder: 'avatars' });
};

// Upload catalog photo
export const uploadCatalogPhotoR2 = async (buffer: Buffer, mimeType: string): Promise<string> => {
    return uploadToR2({ buffer, mimeType, folder: 'catalog' });
};

// Upload group image
export const uploadGroupImageR2 = async (buffer: Buffer, mimeType: string): Promise<string> => {
    return uploadToR2({ buffer, mimeType, folder: 'groups' });
};

// Delete file from R2
export const deleteFromR2 = async (fileUrl: string): Promise<void> => {
    try {
        // Extract key from URL
        const key = fileUrl.replace(`${PUBLIC_URL}/`, '');
        
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        await r2Client.send(command);
    } catch (error) {
        console.error('R2 delete error:', error);
        throw new Error('Failed to delete from R2');
    }
};

// Generate presigned URL for temporary access (optional)
export const getPresignedUrlR2 = async (key: string, expiresIn: number = 3600): Promise<string> => {
    try {
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        return await getSignedUrl(r2Client, command, { expiresIn });
    } catch (error) {
        console.error('R2 presigned URL error:', error);
        throw new Error('Failed to generate presigned URL');
    }
};

// Check if R2 is configured
export const isR2Configured = (): boolean => {
    return !!(
        process.env.R2_ENDPOINT &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET_NAME
    );
};

console.log('[R2 Service] Configuration check:');
console.log('- R2_ENDPOINT:', process.env.R2_ENDPOINT ? '✓ set' : '✗ not set');
console.log('- R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID ? '✓ set' : '✗ not set');
console.log('- R2_SECRET_ACCESS_KEY:', process.env.R2_SECRET_ACCESS_KEY ? '✓ set' : '✗ not set');
console.log('- R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME || 'magazine-srt (default)');
console.log('- R2_PUBLIC_URL:', process.env.R2_PUBLIC_URL ? '✓ set' : '✗ not set');
