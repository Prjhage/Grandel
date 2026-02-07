// Utility function to get original Cloudinary image URL without any transformations
const getOriginalCloudinaryUrl = (url) => {
    if (!url || typeof url !== 'string') return url;

    // Check if it's a Cloudinary URL
    if (!url.includes('cloudinary.com')) return url;

    // Remove any transformation parameters
    // Pattern: /upload/[transformations]/
    // Replace with: /upload/
    const originalUrl = url.replace(/\/upload\/[^\/]+\//, '/upload/');

    return originalUrl;
};

// Export the utility
module.exports = { getOriginalCloudinaryUrl };
