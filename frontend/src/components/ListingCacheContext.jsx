import React, { createContext, useContext, useState } from 'react';

// Create the context
const ListingCacheContext = createContext(null);

// Custom hook to use the cache context
export const useListingCache = () => {
    const context = useContext(ListingCacheContext);
    if (!context) {
        throw new Error('useListingCache must be used within a ListingCacheProvider');
    }
    return context;
};

// Provider component
export const ListingCacheProvider = ({ children }) => {
    const [cache, setCache] = useState({
        listings: null,
        userWishlist: null,
        filters: null,
        timestamp: null
    });

    const [showCache, setShowCache] = useState({}); // { [id]: { listing, travelCompanion, nearbyPlaces, hostStats, timestamp } }

    /**
     * Get cached data if filters match
     * @param {Object} currentFilters - { category, sort, q }
     * @returns {Object|null} - Cached data or null if no match
     */
    const getCachedData = (currentFilters) => {
        if (!cache.listings || !cache.filters) {
            return null;
        }

        // Check if filters match (including geolocation)
        const filtersMatch =
            cache.filters.category === currentFilters.category &&
            cache.filters.sort === currentFilters.sort &&
            cache.filters.q === currentFilters.q &&
            cache.filters.lat === currentFilters.lat &&
            cache.filters.lng === currentFilters.lng;

        if (filtersMatch) {
            return {
                listings: cache.listings,
                userWishlist: cache.userWishlist
            };
        }

        return null;
    };

    /**
     * Set cached data with current filters
     * @param {Array} listings - Listings array
     * @param {Array} userWishlist - User wishlist array
     * @param {Object} filters - Current filters { category, sort, q }
     */
    const setCachedData = (listings, userWishlist, filters) => {
        setCache({
            listings,
            userWishlist,
            filters,
            timestamp: Date.now()
        });
    };

    /**
     * Get cached show data for a specific listing ID
     * @param {string} id - Listing ID
     * @returns {Object|null} - Cached show data or null if not found
     */
    const getCachedShow = (id) => {
        const cached = showCache[id];
        if (!cached) return null;

        // Optional: Cache expiration (e.g., 5 minutes)
        if (Date.now() - cached.timestamp > 5 * 60 * 1000) {
            return null;
        }

        return cached;
    };

    /**
     * Set cached show data for a specific listing ID
     * @param {string} id - Listing ID
     * @param {Object} data - { listing, travelCompanion, nearbyPlaces, hostStats }
     */
    const setCachedShow = (id, data) => {
        setShowCache(prev => ({
            ...prev,
            [id]: {
                ...data,
                timestamp: Date.now()
            }
        }));
    };

    /**
     * Clear all cached data
     */
    const clearCache = () => {
        setCache({
            listings: null,
            userWishlist: null,
            filters: null,
            timestamp: null
        });
        setShowCache({});
    };

    const value = {
        getCachedData,
        setCachedData,
        getCachedShow,
        setCachedShow,
        clearCache,
        hasCache: !!cache.listings
    };

    return (
        <ListingCacheContext.Provider value={value}>
            {children}
        </ListingCacheContext.Provider>
    );
};
