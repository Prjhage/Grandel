import React from 'react';
import './ListingShowSkeleton.css';

const ListingShowSkeleton = () => {
    return (
        <div className="container mt-3 page-fade listing-show-skeleton">
            <div className="row">
                <div className="col-lg-8">
                    {/* Title & Stats */}
                    <div className="skeleton-line title-skeleton mb-2"></div>
                    <div className="skeleton-line stats-skeleton mb-3"></div>

                    {/* Image Gallery Skeleton */}
                    <div className="skeleton-gallery-container mb-4">
                        <div className="skeleton-main-image"></div>
                    </div>

                    {/* Description & Details */}
                    <div className="skeleton-card mb-3 p-4">
                        <div className="skeleton-line mb-3" style={{ width: '30%' }}></div>
                        <div className="skeleton-line mb-2"></div>
                        <div className="skeleton-line mb-2"></div>
                        <div className="skeleton-line mb-4" style={{ width: '80%' }}></div>

                        <div className="d-flex gap-4">
                            <div className="skeleton-line" style={{ width: '120px', height: '1rem' }}></div>
                            <div className="skeleton-line" style={{ width: '150px', height: '1rem' }}></div>
                        </div>
                    </div>

                    {/* Amenities Skeleton */}
                    <div className="skeleton-card mb-4 p-4">
                        <div className="skeleton-line mb-3" style={{ width: '40%' }}></div>
                        <div className="row g-3">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="col-md-6 d-flex align-items-center gap-2">
                                    <div className="skeleton-circle" style={{ width: '20px', height: '20px' }}></div>
                                    <div className="skeleton-line" style={{ width: '60%' }}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    {/* Sticky Sidebar Skeletons */}
                    <div className="skeleton-card p-4 mb-3">
                        <div className="d-flex justify-content-between mb-3">
                            <div className="skeleton-line" style={{ width: '40%', height: '1.5rem' }}></div>
                            <div className="skeleton-line" style={{ width: '20%' }}></div>
                        </div>
                        <div className="skeleton-line mb-4" style={{ height: '3rem', borderRadius: '12px' }}></div>
                        <div className="skeleton-line mb-3" style={{ height: '3.5rem', borderRadius: '12px' }}></div>
                        <div className="skeleton-line" style={{ height: '3rem', borderRadius: '12px' }}></div>
                    </div>

                    <div className="skeleton-card p-4">
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <div className="skeleton-circle" style={{ width: '56px', height: '56px' }}></div>
                            <div>
                                <div className="skeleton-line" style={{ width: '100px', height: '1.1rem' }}></div>
                                <div className="skeleton-line mt-1" style={{ width: '60px' }}></div>
                            </div>
                        </div>
                        <div className="skeleton-line mb-3" style={{ height: '3rem' }}></div>
                        <div className="skeleton-line" style={{ height: '2.5rem', borderRadius: '25px' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingShowSkeleton;
