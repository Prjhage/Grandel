import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer>
            <div className="footer-content">
                <div className="footer-section">
                    <h3>About Grandel</h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6 }}>
                        Grandel is the world's leading online marketplace for unique vacation
                        rentals and accommodations. We connect travelers with verified hosts
                        worldwide.
                    </p>
                </div>

                <div className="footer-section">
                    <h3>For Guests</h3>
                    <ul>
                        <li><Link to="/listings" onClick={() => window.scrollTo(0, 0)}>Browse Listings</Link></li>
                        <li><Link to="/listings" onClick={() => window.scrollTo(0, 0)}>Popular Destinations</Link></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h3>For Hosts</h3>
                    <ul>
                        <li><Link to="/listings/new" onClick={() => window.scrollTo(0, 0)}>Become a Host</Link></li>
                        <li><Link to="/listings/new" onClick={() => window.scrollTo(0, 0)}>Host Your Property</Link></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h3>Company</h3>
                    <ul>
                        <li><Link to="/privacy" onClick={() => window.scrollTo(0, 0)}>Privacy Policy</Link></li>
                        <li><Link to="/terms" onClick={() => window.scrollTo(0, 0)}>Terms & Conditions</Link></li>
                    </ul>
                </div>
            </div>

            <div className="f-info">
                <div className="f-info-socials">
                    <i className="fa-brands fa-square-instagram fa-lg mx-2"></i>
                    <i className="fa-brands fa-linkedin fa-lg mx-2"></i>
                </div>
                <div className="f-info-brand mb-2">
                    &copy; 2026 Grandel Private Limited. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
