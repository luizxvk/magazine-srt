/**
 * Image Compression Utility
 * Reduces image size before upload to improve latency
 */

interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
}

const defaultOptions: CompressionOptions = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
    outputFormat: 'image/jpeg'
};

/**
 * Compress an image file to reduce size
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<string> - Base64 encoded compressed image
 */
export const compressImage = async (
    file: File | Blob,
    options: CompressionOptions = {}
): Promise<string> => {
    const opts = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > opts.maxWidth! || height > opts.maxHeight!) {
                    const ratio = Math.min(
                        opts.maxWidth! / width,
                        opts.maxHeight! / height
                    );
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                // Draw image with white background (for JPEGs)
                if (opts.outputFormat === 'image/jpeg') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Convert to base64
                const compressedBase64 = canvas.toDataURL(
                    opts.outputFormat,
                    opts.quality
                );

                resolve(compressedBase64);
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
    });
};

/**
 * Compress image from base64 string
 * @param base64 - The base64 encoded image
 * @param options - Compression options
 * @returns Promise<string> - Compressed base64 image
 */
export const compressBase64Image = async (
    base64: string,
    options: CompressionOptions = {}
): Promise<string> => {
    const opts = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            // Calculate new dimensions
            if (width > opts.maxWidth! || height > opts.maxHeight!) {
                const ratio = Math.min(
                    opts.maxWidth! / width,
                    opts.maxHeight! / height
                );
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            if (opts.outputFormat === 'image/jpeg') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
            }

            ctx.drawImage(img, 0, 0, width, height);

            const compressedBase64 = canvas.toDataURL(
                opts.outputFormat,
                opts.quality
            );

            resolve(compressedBase64);
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };
    });
};

/**
 * Get file size from base64 string (approximate)
 * @param base64 - The base64 string
 * @returns Size in KB
 */
export const getBase64Size = (base64: string): number => {
    // Remove data URL prefix if present
    const base64Data = base64.split(',')[1] || base64;
    // Base64 encoded size is ~1.37x the original size
    const sizeInBytes = (base64Data.length * 3) / 4;
    return Math.round(sizeInBytes / 1024);
};
