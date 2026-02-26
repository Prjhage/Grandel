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
                        <span className="sidebar-title">Menu</span>
                        <button className="btn-close-custom" onClick={toggleMenu}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    {/* LEFT */}
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link className="nav-link" to="/listings">Explore</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/listings/new">Become a Host</Link>
                        </li>
                    </ul>

                    {/* AUTH / USER */}
                    <div className="navbar-nav-auth">
                        {!currUser ? (
                            <div className="auth-links">
                                <Link to="/signup" className="auth-link signup">Sign up</Link>
                                <Link to="/login" className="auth-link login">Log in</Link>
                            </div>
                        ) : (
                            <div className="dropdown d-none d-lg-block">
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
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
