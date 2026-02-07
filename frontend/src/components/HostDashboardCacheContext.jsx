import React, { createContext, useContext, useState } from 'react';

// Create the context
const HostDashboardCacheContext = createContext(null);

// Custom hook to use the cache context
export const useHostDashboardCache = () => {
    const context = useContext(HostDashboardCacheContext);
    if (!context) {
        throw new Error('useHostDashboardCache must be used within a HostDashboardCacheProvider');
    }
    return context;
};

// Provider component
export const HostDashboardCacheProvider = ({ children }) => {
    const [cache, setCache] = useState({
        bookings: null,
        timestamp: null
    });

    /**
     * Get cached host dashboard data
     * @returns {Object|null} - Cached bookings data or null if no cache
     */
    const getCachedData = () => {
        if (!cache.bookings) {
            return null;
        }
        return {
            bookings: cache.bookings
        };
    };

    /**
     * Set cached host dashboard data
     * @param {Object} bookings - Bookings object { upcoming, confirmed, completed, cancelled }
     */
    const setCachedData = (bookings) => {
        setCache({
            bookings,
            timestamp: Date.now()
        });
    };

    /**
     * Clear all cached data
     */
    const clearCache = () => {
        setCache({
            bookings: null,
            timestamp: null
        });
    };

    const value = {
        getCachedData,
        setCachedData,
        clearCache,
        hasCache: !!cache.bookings
    };

    return (
        <HostDashboardCacheContext.Provider value={value}>
            {children}
        </HostDashboardCacheContext.Provider>
    );
};
