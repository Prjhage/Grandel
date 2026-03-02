import React, { createContext, useContext, useState } from 'react';

// Create the context
const ProfileCacheContext = createContext(null);

// Custom hook to use the cache context
export const useProfileCache = () => {
    const context = useContext(ProfileCacheContext);
    if (!context) {
        throw new Error('useProfileCache must be used within a ProfileCacheProvider');
    }
    return context;
};

// Provider component
export const ProfileCacheProvider = ({ children }) => {
    const [cache, setCache] = useState({
        wishlistListings: null,
        bookings: null,
        myListings: null,
        timestamp: null
    });

    /**
     * Get cached profile data
     * @returns {Object|null} - Cached data or null if no cache
     */
    const getCachedData = () => {
        if (!cache.wishlistListings && !cache.bookings && !cache.myListings) {
            return null;
        }
        return {
            wishlistListings: cache.wishlistListings,
            bookings: cache.bookings,
            myListings: cache.myListings
        };
    };

    /**
     * Set cached profile data
     * @param {Array} wishlistListings - Wishlist listings array
     * @param {Array} bookings - Bookings array
     * @param {Array} myListings - My listings array
     */
    const setCachedData = (wishlistListings, bookings, myListings) => {
        setCache({
            wishlistListings,
            bookings,
            myListings,
            timestamp: Date.now()
        });
    };

    /**
     * Optimistically add a listing to the cached wishlist
     * @param {Object} listing - Full listing object
     */
    const addToWishlist = (listing) => {
        setCache(prev => {
            if (!prev.wishlistListings) return prev;
            // Avoid duplicates
            if (prev.wishlistListings.some(l => l._id === listing._id)) return prev;

            return {
                ...prev,
                wishlistListings: [listing, ...prev.wishlistListings],
                timestamp: Date.now()
            };
        });
    };

    /**
     * Optimistically remove a listing from the cached wishlist
     * @param {string} id - Listing ID
     */
    const removeFromWishlist = (id) => {
        setCache(prev => {
            if (!prev.wishlistListings) return prev;

            return {
                ...prev,
                wishlistListings: prev.wishlistListings.filter(l => l._id !== id),
                timestamp: Date.now()
            };
        });
    };

    /**
     * Clear all cached data
     */
    const clearCache = () => {
        setCache({
            wishlistListings: null,
            bookings: null,
            myListings: null,
            timestamp: null
        });
    };

    const value = {
        getCachedData,
        setCachedData,
        clearCache,
        addToWishlist,
        removeFromWishlist,
        hasCache: !!(cache.wishlistListings || cache.bookings || cache.myListings)
    };

    return (
        <ProfileCacheContext.Provider value={value}>
            {children}
        </ProfileCacheContext.Provider>
    );
};
