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

    const handleNavClose = () => {
        if (navbarCollapseRef.current && navbarCollapseRef.current.classList.contains('show')) {
            const bsCollapse = new window.bootstrap.Collapse(navbarCollapseRef.current, { toggle: false });
            bsCollapse.hide();
            setIsMenuOpen(false);
        }
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
                <div className={`navbar-search-section ${location.pathname === '/' ? 'home-search' : ''}`}>
                    <AdvancedSearchBar />
                </div>

                <div className="d-flex align-items-center ms-auto d-lg-none">
                    {currUser ? (
                        <div className="mobile-user-icon dropdown">
                            <button className="user-circle" data-bs-toggle="dropdown">
                                <i className="fa-solid fa-user"></i>
                            </button>

                            <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                                <li>
                                    <Link className="dropdown-item" to="/profile" onClick={handleNavClose}>
                                        <i className="fa-regular fa-user me-2"></i> Profile
                                    </Link>
                                </li>
                                {currUser.role === 'host' && (
                                    <li>
                                        <Link className="dropdown-item" to="/profile/host" onClick={handleNavClose}>
                                            <i className="fa-solid fa-tachometer-alt me-2"></i> Host Dashboard
                                        </Link>
                                    </li>
                                )}
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                    <button className="dropdown-item text-danger" onClick={handleLogoutAndClose}>
                                        <i className="fa-solid fa-arrow-right-from-bracket me-2"></i> Logout
                                    </button>
                                </li>
                            </ul>
                        </div>
                    ) : null}
                    {/* TOGGLER */}
                    <button
                        className="navbar-toggler"
                        type="button"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        data-bs-toggle="collapse"
                        data-bs-target="#mainNavbar"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>
                </div>

                {/* NAV CONTENT */}
                <div className="collapse navbar-collapse" id="mainNavbar" ref={navbarCollapseRef}>
                    {/* LEFT */}
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link className="nav-link" to="/listings" onClick={handleNavClose}>Explore</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/listings/new" onClick={handleNavClose}>Become a Host</Link>
                        </li>
                    </ul>

                    {/* AUTH / USER */}
                    <div className="navbar-nav ms-lg-3">
                        {!currUser ? (
                            <div className="auth-links">
                                <Link to="/signup" className="auth-link signup" onClick={handleNavClose}>Sign up</Link>
                                <Link to="/login" className="auth-link login" onClick={handleNavClose}>Log in</Link>
                            </div>
                        ) : (
                            <div className="dropdown ms-lg-3 mt-2 mt-lg-0">
                                <button className="user-circle" data-bs-toggle="dropdown">
                                    <i className="fa-solid fa-user"></i>
                                </button>

                                <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                                    <li>
                                        <Link className="dropdown-item" to="/profile" onClick={handleNavClose}>
                                            <i className="fa-regular fa-user me-2"></i> Profile
                                        </Link>
                                    </li>
                                    {currUser.role === 'host' && (
                                        <li>
                                            <Link className="dropdown-item" to="/profile/host" onClick={handleNavClose}>
                                                <i className="fa-solid fa-tachometer-alt me-2"></i> Host Dashboard
                                            </Link>
                                        </li>
                                    )}
                                    <li><hr className="dropdown-divider" /></li>
                                    <li>
                                        <button className="dropdown-item text-danger" onClick={handleLogoutAndClose}>
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
