import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusIndex, setStatusIndex] = useState(0);
    
    const statusMessages = [
        "INITIALIZING CORE...",
        "FETCHING ASSETS...",
        "SYNCING DATABASE...",
        "OPTIMIZING UI...",
        "READY TO EXPLORE"
    ];

    useEffect(() => {
        // Progress counter (0 to 100 over 4 seconds)
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                // Random increments for a more "realistic" feel
                return Math.min(prev + Math.floor(Math.random() * 3) + 1, 100);
            });
        }, 100);

        // Status message cycling
        const statusInterval = setInterval(() => {
            setStatusIndex(prev => (prev + 1) % statusMessages.length);
        }, 900);

        // Start exit animation slightly before 5 seconds
        const exitTimer = setTimeout(() => {
            setIsExiting(true);
        }, 4400);

        // Notify parent to unmount after 5 seconds total
        const completeTimer = setTimeout(() => {
            onComplete();
        }, 5000);

        return () => {
            clearInterval(progressInterval);
            clearInterval(statusInterval);
            clearTimeout(exitTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    const brandName = "Grandel";
    
    return (
        <div className={`splash-overlay ${isExiting ? 'splash-exit' : ''}`}>
            {/* Ambient Background Elements */}
            <div className="splash-ambient-light light-1"></div>
            <div className="splash-ambient-light light-2"></div>
            
            <div className="splash-content">
                <div className="splash-logo-wrapper">
                    <div className="splash-shockwave"></div>
                    <div className="splash-logo-container">
                        <img src="/images/icon.png" alt="Grandel Icon" className="splash-icon-img" />
                    </div>
                </div>
                
                <div className="splash-brand-wrapper">
                    <h1 className="splash-brand">
                        {brandName.split('').map((char, index) => (
                            <span 
                                key={index} 
                                className="splash-letter" 
                                style={{ animationDelay: `${0.8 + index * 0.08}s` }}
                            >
                                {char}
                            </span>
                        ))}
                    </h1>
                    <div className="splash-brand-shimmer"></div>
                </div>
                
                {/* Advanced Loader UI */}
                <div className="splash-loader-container">
                    <div className="splash-loader-header">
                        <span className="splash-loader-status">{statusMessages[statusIndex]}</span>
                        <span className="splash-loader-percentage">{progress}%</span>
                    </div>
                    <div className="splash-loader-bar">
                        <div 
                            className="splash-loader-progress" 
                            style={{ width: `${progress}%` }}
                        >
                            <div className="splash-loader-beam"></div>
                        </div>
                    </div>
                    <div className="splash-loader-decor">
                        <div className="decor-line"></div>
                        <div className="decor-dot"></div>
                        <div className="decor-line"></div>
                    </div>
                </div>
            </div>
            
            <div className="splash-grain-overlay"></div>
        </div>
    );
};

export default SplashScreen;
