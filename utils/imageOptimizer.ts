
/**
 * Utility to optimize images using a robust global CDN (wsrv.nl).
 * This is a standard "big site" strategy to serve optimized WebP images
 * without requiring complex backend configuration.
 * 
 * @param url The original image URL
 * @param width Optional target width
 * @param quality Optional quality (1-100), defaults to 80
 * @param format Optional format, defaults to 'webp'
 */
export const getOptimizedImageUrl = (
    url: string,
    width?: number,
    quality: number = 80,
    format: 'webp' | 'jpeg' | 'png' = 'webp'
): string => {
    if (!url) return '';

    // If it's already a base64 string or a blob, return as is
    if (url.startsWith('data:') || url.startsWith('blob:')) {
        return url;
    }

    try {
        // Use wsrv.nl (Weserv) as a global image CDN/Proxy
        // It's free, fast, and standard for on-the-fly optimization
        const baseUrl = 'https://wsrv.nl/';
        const params = new URLSearchParams();

        // Pass the original URL
        params.append('url', url);

        // Optimization parameters
        if (width) params.append('w', width.toString());
        params.append('q', quality.toString());
        params.append('output', format);

        // 'af' = adaptive filter (better compression)
        // 'il' = interlace (progressive loading)
        params.append('af', '');
        params.append('il', '');

        return `${baseUrl}?${params.toString()}`;
    } catch (e) {
        console.warn('Failed to optimize image URL:', e);
        return url;
    }
};

/**
 * Helper to get the original URL (stripping the CDN proxy if present)
 */
export const getOriginalImageUrl = (url: string): string => {
    if (!url) return '';

    // If it's a Weserv URL, extract the original 'url' param
    if (url.includes('wsrv.nl')) {
        try {
            const urlObj = new URL(url);
            const originalUrl = urlObj.searchParams.get('url');
            if (originalUrl) return originalUrl;
        } catch (e) {
            return url;
        }
    }

    return url;
};
