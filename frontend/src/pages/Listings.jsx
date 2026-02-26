import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from '../config/axios';
import SkeletonCard from '../components/SkeletonCard';
import { useListingCache } from '../components/ListingCacheContext';
import './Listings.css';

const Listings = ({ currUser }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [userWishlist, setUserWishlist] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Use the cache context
    const { getCachedData, setCachedData, prefetchListing } = useListingCache();

    const sort = searchParams.get('sort') || '';

    useEffect(() => {
        setPage(1);
        setListings([]);
        setHasMore(true);
        fetchListings(1, true);
    }, [searchParams]);

    const fetchListings = async (pageNum, isInitial = false) => {
        try {
            if (isInitial) setLoading(true);
            else setLoadingMore(true);

            const currentFilters = Object.fromEntries(searchParams.entries());
            currentFilters.sort = sort;
            currentFilters.page = pageNum;

            const res = await axios.get('/listings', { params: { ...currentFilters, limit: 12 } });
            const fetchedListings = res.data.allListings || [];
            const fetchedWishlist = res.data.userWishlist || [];

            if (isInitial) {
                setListings(fetchedListings);
                setUserWishlist(fetchedWishlist);
            } else {
                setListings(prev => [...prev, ...fetchedListings]);
            }

            setHasMore(fetchedListings.length === 12);
            setLoading(false);
            setLoadingMore(false);
        } catch (err) {
            console.error('Error fetching listings:', err);
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchListings(nextPage);
        }
    };

    const handleSortChange = (e) => {
        const newSort = e.target.value;
        const params = new URLSearchParams(searchParams);
        if (newSort) params.set('sort', newSort);
        else params.delete('sort');
        setSearchParams(params, { replace: true });
    };

    const toggleWishlist = async (listingId) => {
        // ... (existing logic)
        if (!currUser) {
            alert('Please login to save to wishlist');
            return;
        }
        const btn = document.querySelector(`.listing-card[data-id="${listingId}"] .wishlist-btn`);
        if (btn) {
            btn.classList.add('burst');
            setTimeout(() => btn.classList.remove('burst'), 600);
        }
        try {
            await axios.post(`/wishlist/${listingId}`);
            const isSaved = userWishlist.includes(listingId);
            if (isSaved) setUserWishlist(userWishlist.filter(id => id !== listingId));
            else setUserWishlist([...userWishlist, listingId]);
        } catch (err) {
            console.error('Error toggling wishlist:', err);
        }
    };


    return (
        <div className="container listings-page page-fade">

            {/* Filters Wrapper */}
            <div className="filters-wrapper justify-content-end">
                <div className="d-flex align-items-center">
                    <div className="sort-dropdown">
                        <select id="sortSelect" className="form-select" value={sort} onChange={handleSortChange}>
                            <option value="">Sort by</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="rating">Average Rating</option>
                        </select>
                    </div>
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
            <div className="row row-cols-lg-4 row-cols-md-2 row-cols-2 gy-4 mt-lg-3 mt-2">
                {loading ? (
                    // Show 8 skeletons while loading
                    [...Array(8)].map((_, i) => (
                        <div key={`skeleton-${i}`} className="col">
                            <SkeletonCard />
                        </div>
                    ))
                ) : (
                    listings.map((listing) => {
                        const price = listing.price;
                        const avgRating = listing.avgRating || 0;
                        const reviewCount = listing.reviews?.length || 0;

                        return (
                            <Link
                                key={listing._id}
                                to={`/listings/${listing._id}`}
                                state={{ listing }}
                                style={{ textDecoration: 'none', color: 'black' }}
                                onMouseEnter={() => prefetchListing(listing._id, axios)}
                            >
                                <div className="card col listing-card" data-id={listing._id}>
                                    <div className="card-img-container">
                                        <img
                                            src={listing.image?.url || '/images/fallback.jpg'}
                                            className="card-img-top"
                                            alt="listing_image"
                                            onError={(e) => { e.target.src = '/images/fallback.jpg'; }}
                                        />
                                        {listing.discount > 0 && listing.discountAvailable && (
                                            <div className="early-bird-badge">
                                                <i className="fa-solid fa-bolt"></i> {listing.discount}% Early Bird
                                            </div>
                                        )}
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
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>

            {/* Load More Trigger */}
            {hasMore && (
                <div className="load-more-container d-flex justify-content-center mt-5 mb-5">
                    <button
                        className="btn btn-outline-dark rounded-pill px-5 py-2"
                        onClick={loadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Loading...
                            </>
                        ) : 'Show more'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Listings;
