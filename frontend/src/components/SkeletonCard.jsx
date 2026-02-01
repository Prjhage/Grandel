import React from 'react';
import './SkeletonCard.css';

const SkeletonCard = () => {
    return (
        <div className="skeleton-card">
            <div className="skeleton-image"></div>
            <div className="skeleton-body">
                <div className="skeleton-title"></div>
                <div className="skeleton-location"></div>
                <div className="skeleton-price"></div>
            </div>
        </div>
    );
};

export default SkeletonCard;
