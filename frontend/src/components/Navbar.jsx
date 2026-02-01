import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ currUser, onLogout }) => {
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const searchContainerRef = useRef(null);
    const searchInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setIsSearchActive(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearchToggle = (e) => {
        e.stopPropagation();
        setIsSearchActive(true);
        setTimeout(() => {
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }, 100);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const query = formData.get('q');
        navigate(`/listings?q=${query}`);
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top" style={{ height: '70px' }}>
            <div className="container-fluid" style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                {/* LOGO */}
                <Link className="navbar-brand fw-bold" to="/">
                    <div className="navbar-brand-text">
                        <span className="navbar-brand-grand">Grand</span>
                        <span className="navbar-brand-el">el</span>
                    </div>
                    <i className="fa-solid fa-house navbar-brand-icon"></i>
                </Link>

                {/* SEARCH (MOVED) */}
                <div className={`search-wrapper mobile-center-search ${isMenuOpen ? 'menu-open' : ''}`}>
                    <div className={`search-container ${isSearchActive ? 'active' : ''}`} id="searchContainer" ref={searchContainerRef}>
                        <button
                            className="btn-search-init"
                            id="searchToggle"
                            aria-label="Open Search"
                            onClick={handleSearchToggle}
                        >
                            <i className="fa-solid fa-magnifying-glass"></i>
                        </button>

                        <form className="search-form" role="search" id="searchForm" onSubmit={handleSearchSubmit}>
                            <div className="search-input-group">
                                <i className="fa-solid fa-magnifying-glass search-inner-icon"></i>
                                <input
                                    className="form-control search-input"
                                    type="search"
                                    name="q"
                                    placeholder="Where are you going?"
                                    ref={searchInputRef}
                                />
                                <button className="btn-search-submit" type="submit">Search</button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="d-flex align-items-center ms-auto d-lg-none">
                    {currUser ? (
                        <div className="mobile-user-icon">
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
                <div className="collapse navbar-collapse" id="mainNavbar">
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
                    <div className="navbar-nav ms-lg-3">
                        {!currUser ? (
                            <div className="auth-links">
                                <Link to="/signup" className="auth-link signup">Sign up</Link>
                                <Link to="/login" className="auth-link login">Log in</Link>
                            </div>
                        ) : (
                            <div className="dropdown ms-lg-3 mt-2 mt-lg-0">
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
