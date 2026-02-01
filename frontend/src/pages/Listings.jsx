import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from '../config/axios';
import SkeletonCard from '../components/SkeletonCard';
import './Listings.css';

const categories = [
    { name: 'Trending', icon: 'fa-fire', value: 'trending' },
    { name: 'Rooms', icon: 'fa-bed', value: 'rooms' },
    { name: 'Iconic Cities', icon: 'fa-mountain-city', value: 'iconic' },
    { name: 'Mountain', icon: 'fa-mountain', value: 'mountain' },
    { name: 'Castles', icon: 'fa-fort-awesome', iconClass: 'fa-brands', value: 'castles' },
    { name: 'Amazing Pools', icon: 'fa-person-swimming', value: 'pools' },
    { name: 'Camping', icon: 'fa-campground', value: 'camping' },
    { name: 'Farms', icon: 'fa-tractor', value: 'farms' },
    { name: 'Arctic', icon: 'fa-snowman', value: 'arctic' },
    { name: 'Domes', icon: 'fa-igloo', value: 'domes' },
    { name: 'Boats', icon: 'fa-ship', value: 'boats' },
    { name: 'Forest', icon: 'fa-tree', value: 'forest' },
    { name: 'Lakefront', icon: 'fa-water', value: 'lakefront' },
    { name: 'Beach', icon: 'fa-umbrella-beach', value: 'beach' },
    { name: 'Urban', icon: 'fa-city', value: 'urban' },
    { name: 'Countryside', icon: 'fa-house-chimney', value: 'countryside' },
];

const Listings = ({ currUser }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTax, setShowTax] = useState(false);
    const [userWishlist, setUserWishlist] = useState([]);

    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || '';
    const q = searchParams.get('q') || '';

    useEffect(() => {
        fetchListings();
    }, [category, sort, q]);

    const fetchListings = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (category) params.append('category', category);
            if (sort) params.append('sort', sort);
            if (q) params.append('q', q);

            const res = await axios.get(`/listings?${params.toString()}`);
            setListings(res.data.allListings || []);
            setUserWishlist(res.data.userWishlist || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching listings:', err);
            setLoading(false);
        }
    };

    const handleSortChange = (e) => {
        const newSort = e.target.value;
        const params = new URLSearchParams(searchParams);
        if (newSort) {
            params.set('sort', newSort);
        } else {
            params.delete('sort');
        }
        setSearchParams(params);
    };

    const handleCategoryClick = (catValue) => {
        const params = new URLSearchParams(searchParams);
        if (catValue) {
            params.set('category', catValue);
        } else {
            params.delete('category');
        }
        setSearchParams(params);
    };

    const toggleWishlist = async (listingId) => {
        if (!currUser) {
            alert('Please login to save to wishlist');
            return;
        }

        // Add burst class for animation
        const btn = document.querySelector(`.listing-card[data-id="${listingId}"] .wishlist-btn`);
        if (btn) {
            btn.classList.add('burst');
            setTimeout(() => btn.classList.remove('burst'), 600);
        }

        try {
            // Toggle wishlist via API
            await axios.post(`/wishlist/${listingId}`);

            const isSaved = userWishlist.includes(listingId);
            if (isSaved) {
                setUserWishlist(userWishlist.filter(id => id !== listingId));
            } else {
                setUserWishlist([...userWishlist, listingId]);
            }
        } catch (err) {
            console.error('Error toggling wishlist:', err);
        }
    };

    return (
        <div className="listings-page page-fade">
            {/* Filters Wrapper */}
            <div className="filters-wrapper">
                <div id="filters">
                    <div className="filters-inner">
                        {categories.map((cat) => (
                            <div
                                key={cat.value}
                                className={`filter ${category === cat.value ? 'active' : ''}`}
                                onClick={() => handleCategoryClick(cat.value)}
                            >
                                <div>
                                    <i className={`${cat.iconClass || 'fa-solid'} ${cat.icon}`} style={{ fontSize: '1.2rem' }}></i>
                                </div>
                                <p style={{ fontSize: '0.75rem' }}>{cat.name}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sort Dropdown */}
                <div className="sort-dropdown">
                    <select id="sortSelect" className="form-select" value={sort} onChange={handleSortChange}>
                        <option value="">Sort by</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="rating">Average Rating</option>
                    </select>
                </div>

                {/* Tax Icon */}
                <div
                    className={`tax-icon ${showTax ? 'active' : ''}`}
                    title="Display total after taxes"
                    onClick={() => setShowTax(!showTax)}
                >
                    <i className="fa-solid fa-calculator"></i>
                </div>
            </div>

            {/* No Results */}
            {!loading && listings.length === 0 && (
                <div className="no-results">
                    <i className="fa-regular fa-face-frown"></i>
                    <h4>Sorry, no stays found</h4>
                    <p>Try adjusting your search or explore other destinations.</p>
                    <Link to="/listings" className="btn btn-dark mt-2">Clear search</Link>
                </div>
            )}

            {/* Listings Grid */}
            <div className="row row-cols-lg-4 row-cols-md-2 row-cols-2 mt-3 gy-4">
                {loading ? (
                    // Show 8 skeletons while loading
                    [...Array(8)].map((_, i) => (
                        <div key={`skeleton-${i}`} className="col">
                            <SkeletonCard />
                        </div>
                    ))
                ) : (
                    listings.map((listing) => {
                        const price = showTax ? listing.price * 1.18 : listing.price;
                        const avgRating = listing.avgRating || 0;
                        const reviewCount = listing.reviews?.length || 0;

                        return (
                            <Link
                                key={listing._id}
                                to={`/listings/${listing._id}`}
                                state={{ listing }}
                                style={{ textDecoration: 'none', color: 'black' }}
                            >
                                <div className="card col listing-card" data-id={listing._id}>
                                    <div className="card-img-container">
                                        <img
                                            src={listing.image?.url || '/images/fallback.jpg'}
                                            className="card-img-top"
                                            alt="listing_image"
                                            onError={(e) => { e.target.src = '/images/fallback.jpg'; }}
                                        />
                                        {reviewCount > 0 && (
                                            <div className="image-overlay-info">
                                                <span className="overlay-rating">
                                                    <i className="fa-solid fa-star"></i> {avgRating.toFixed(1)}
                                                </span>
                                                <span className="overlay-divider">|</span>
                                                <span className="overlay-reviews">
                                                    {reviewCount}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Wishlist Button */}
                                    <button
                                        type="button"
                                        className={`wishlist-btn ${userWishlist.includes(listing._id) ? 'saved' : ''}`}
                                        aria-label="Save to wishlist"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleWishlist(listing._id);
                                        }}
                                    >
                                        <i className="fa-regular fa-heart"></i>
                                        <i className="fa-solid fa-heart"></i>
                                    </button>

                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <b className="text-truncate listing-card-title" style={{ maxWidth: '80%', paddingLeft: '0.5rem' }}>{listing.title}</b>
                                        </div>
                                        <p className="card-text text-muted listing-card-location" style={{ fontSize: '0.9rem' }}>
                                            {listing.location}, {listing.country}
                                        </p>
                                        <p className="card-text">
                                            <span className="price-val">₹{Math.round(price).toLocaleString('en-IN')}</span>/night
                                            {showTax && <i className="tax-info"> +18% GST</i>}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Listings;
