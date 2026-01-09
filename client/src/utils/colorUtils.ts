/**
 * Utility functions for color manipulation and contrast adjustment
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : null;
}

/**
 * Calculate relative luminance of a color (WCAG formula)
 */
function getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((c) => {
        const sRGB = c / 255;
        return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Check if a color is light (needs darkening for text on dark backgrounds)
 */
export function isLightColor(hex: string): boolean {
    const rgb = hexToRgb(hex);
    if (!rgb) return false;
    
    const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
    return luminance > 0.5; // Light colors have high luminance
}

/**
 * Darken and saturate a color for better visibility on dark backgrounds
 * This is used for pastel colors to make them more vibrant and visible
 */
export function getDarkerSaturatedColor(hex: string): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    // Convert RGB to HSL
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    // Increase saturation and decrease lightness for pastel colors
    if (l > 0.7) {
        s = Math.min(1, s + 0.3); // Increase saturation
        l = Math.max(0.4, l - 0.3); // Decrease lightness
    } else if (l > 0.5) {
        s = Math.min(1, s + 0.2);
        l = Math.max(0.5, l - 0.15);
    }

    // Convert HSL back to RGB
    function hslToRgb(h: number, s: number, l: number) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    const newRgb = hslToRgb(h, s, l);
    return `#${[newRgb.r, newRgb.g, newRgb.b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Get the appropriate color for text/icons based on whether it's light or dark
 * Light colors (pastels) will be darkened and saturated
 * Dark colors will be used as-is
 */
export function getContrastColor(hex: string): string {
    return isLightColor(hex) ? getDarkerSaturatedColor(hex) : hex;
}

/**
 * Get color suitable for backgrounds and gradients (use original color)
 */
export function getBackgroundColor(hex: string): string {
    return hex;
}
