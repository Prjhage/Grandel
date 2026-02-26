import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import AdvancedSearchBar from './AdvancedSearchBar';
import './Navbar.css';

const Navbar = ({ currUser, onLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navbarCollapseRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Check if current page is Listings Index page (/listings) - for mobile search visibility
    const isListingsIndexPage = location.pathname === '/listings';

    const handleNavClose = () => {
        setIsMenuOpen(false);
    };

    useEffect(() => {
        handleNavClose();
    }, [location]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleLogoutAndClose = () => {
        onLogout();
        handleNavClose();
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top" style={{ height: '85px' }}>
            <div className="container-fluid" style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                {/* LOGO */}
                <Link className="navbar-brand fw-bold" to="/" onClick={handleNavClose}>
                    <div className="navbar-brand-text">
                        <span className="navbar-brand-grand">Grand</span>
                        <span className="navbar-brand-el">el</span>
                    </div>
                    <i className="fa-solid fa-house navbar-brand-icon"></i>
                </Link>

                {/* Global Advanced Search Bar */}
                <div className={`navbar-search-section ${location.pathname === '/' ? 'home-search' : ''} ${isListingsIndexPage ? 'is-listings-index' : ''}`}>
                    <AdvancedSearchBar />
                </div>

                <div className="d-flex align-items-center ms-auto d-lg-none">
                    {currUser ? (
                        <div className="mobile-user-icon dropdown me-2">
                            <button className="user-circle" data-bs-toggle="dropdown">
                                <i className="fa-solid fa-user"></i>
                            </button>

                            <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                                <li>
                                    <Link className="dropdown-item" to="/profile">
                                        <i className="fa-regular fa-user me-2"></i> Profile
                                    </Link>
                                </li>
                                {currUser.role === 'host' && (
                                    <li>
                                        <Link className="dropdown-item" to="/profile/host">
                                            <i className="fa-solid fa-tachometer-alt me-2"></i> Host Dashboard
                                        </Link>
                                    </li>
                                )}
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                    <button className="dropdown-item text-danger" onClick={onLogout}>
                                        <i className="fa-solid fa-arrow-right-from-bracket me-2"></i> Logout
                                    </button>
                                </li>
                            </ul>
                        </div>
                    ) : null}
                    {/* CUSTOM TOGGLER */}
                    <button
                        className={`navbar-toggler-custom ${isMenuOpen ? 'active' : ''}`}
                        type="button"
                        onClick={toggleMenu}
                    >
                        <span className="toggler-icon"></span>
                        <span className="toggler-icon"></span>
                        <span className="toggler-icon"></span>
                    </button>
                </div>

                {/* SIDEBAR OVERLAY */}
                {isMenuOpen && <div className="navbar-overlay" onClick={toggleMenu}></div>}

                {/* NAV SIDEBAR CONTENT */}
                <div className={`navbar-sidebar ${isMenuOpen ? 'open' : ''}`} id="mainNavbar">
                    <div className="sidebar-header d-lg-none">
                        <div className="sidebar-profile-card">
                            {currUser ? (
                                <>
                                    <div className="profile-info-group">
                                        <div className="user-avatar-premium">
                                            {currUser.avatar?.url ? (
                                                <img src={currUser.avatar.url} alt="User" />
                                            ) : (
                                                <i className="fa-solid fa-user"></i>
                                            )}
                                        </div>
                                        <div className="user-details-premium">
                                            <span className="user-name">{currUser.username}</span>
                                            <span className="user-email">{currUser.email}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="profile-info-group guest">
                                    <div className="user-avatar-premium">
                                        <i className="fa-solid fa-user-secret"></i>
                                    </div>
                                    <div className="user-details-premium">
                                        <span className="user-name">Guest User</span>
                                        <span className="user-email">Please log in</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="sidebar-body">
                        {/* LEFT LINKS */}
                        <ul className="navbar-nav">
                            <li className="nav-item stagger-item">
                                <Link className="nav-link" to="/listings" onClick={handleNavClose}>
                                    <i className="fa-solid fa-compass me-3"></i>Explore
                                </Link>
                            </li>
                            <li className="nav-item stagger-item">
                                <Link className="nav-link" to="/listings/new" onClick={handleNavClose}>
                                    <i className="fa-solid fa-house-chimney-user me-3"></i>Become a Host
                                </Link>
                            </li>
                            {currUser && (
                                <>
                                    <li className="nav-item stagger-item">
                                        <Link className="nav-link" to="/profile" onClick={handleNavClose}>
                                            <i className="fa-regular fa-user me-3"></i>My Profile
                                        </Link>
                                    </li>
                                    {currUser.role === 'host' && (
                                        <li className="nav-item stagger-item">
                                            <Link className="nav-link" to="/profile/host" onClick={handleNavClose}>
                                                <i className="fa-solid fa-chart-line me-3"></i>Host Dashboard
                                            </Link>
                                        </li>
                                    )}
                                </>
                            )}
                        </ul>

                        {/* AUTH / USER */}
                        <div className="navbar-auth-section">
                            {!currUser ? (
                                <div className="auth-links-sidebar">
                                    <Link to="/signup" className="stagger-item btn-signup-premium" onClick={handleNavClose}>Sign up</Link>
                                    <Link to="/login" className="stagger-item btn-login-premium" onClick={handleNavClose}>Log in</Link>
                                </div>
                            ) : (
                                <div className="stagger-item logout-section-sidebar">
                                    <button className="btn-logout-premium" onClick={() => { onLogout(); handleNavClose(); }}>
                                        <i className="fa-solid fa-power-off me-2"></i>Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="sidebar-footer">
                        <div className="sidebar-brand-mini">
                            <span className="grand">GRAND</span><span className="el">EL</span>
                        </div>
                        <div className="social-links-mini">
                            <i className="fa-brands fa-instagram"></i>
                            <i className="fa-brands fa-twitter"></i>
                            <i className="fa-brands fa-facebook-f"></i>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
