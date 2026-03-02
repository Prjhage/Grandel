/**
 * Cloudinary Image Optimization Helper
 * Inject f_auto (format) and q_auto (quality) into Cloudinary URLs
 * Usage: optimizeUrl(listing.image.url, 'w_600,c_fill')
 */
export const optimizeUrl = (url, transformations = '') => {
    if (!url || !url.includes('cloudinary.com')) return url;

    // Check if URL already has transformations or needs them injected after /upload/
    const uploadPart = '/upload/';
    if (url.includes(uploadPart)) {
        const parts = url.split(uploadPart);
        // Default to auto format and quality if no transformations provided
        const defaultTransform = 'f_auto,q_auto';
        const combinedTransform = transformations 
            ? `${defaultTransform},${transformations}` 
            : defaultTransform;
        
        return `${parts[0]}${uploadPart}${combinedTransform}/${parts[1]}`;
    }

    return url;
};

export default optimizeUrl;
