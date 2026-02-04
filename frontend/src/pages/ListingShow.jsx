import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import './ListingShow.css';

const amenityIcons = {
    'City skyline view': 'fa-city',
    'Garden view': 'fa-tree',
    'Lake access': 'fa-water',
    'Kitchen': 'fa-utensils',
    'Wifi': 'fa-wifi',
    'Dedicated workspace': 'fa-briefcase',
    'Free parking': 'fa-car',
    'Pool': 'fa-person-swimming',
    'TV': 'fa-tv',
    'Lift': 'fa-elevator'
};

const ListingShow = ({ currUser, showFlash }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [listing, setListing] = useState(location.state?.listing || null);
    const [loading, setLoading] = useState(!location.state?.listing);
    const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
    const [hoverRating, setHoverRating] = useState(0);
    const [guests, setGuests] = useState({ adult: 1, child: 0, infant: 0, animals: 0 });
    const [showGuestDropdown, setShowGuestDropdown] = useState(false);
    const [showMobileReserve, setShowMobileReserve] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [travelCompanion, setTravelCompanion] = useState(location.state?.listing?.travelCompanion || { places: [], food: [] });
    const [nearbyPlaces, setNearbyPlaces] = useState(location.state?.listing?.nearbyPlaces || []);

    useEffect(() => {
        fetchListing();
    }, [id]);

    // Toggle body class when mobile reserve drawer is open to hide chatbot icon
    useEffect(() => {
        if (showMobileReserve) {
            document.body.classList.add('mobile-reserve-open');
        } else {
            document.body.classList.remove('mobile-reserve-open');
        }
        return () => document.body.classList.remove('mobile-reserve-open');
    }, [showMobileReserve]);

    // Close navbar on route change (mobile)
    useEffect(() => {
        const navBar = document.querySelector('.navbar-collapse');
        if (navBar && navBar.classList.contains('show')) {
            navBar.classList.remove('show');
        }
    }, [location]);

    const fetchListing = async () => {
        try {
            const res = await axios.get(`/listings/${id}`);
            const data = res.data.listing || res.data;
            setListing(data);

            // Sync travelCompanion priority (top-level res.data > listing property)
            const tc = res.data.travelCompanion || data.travelCompanion || { places: [], food: [] };
            setTravelCompanion(tc);

            if (res.data.nearbyPlaces) setNearbyPlaces(res.data.nearbyPlaces);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching listing:', err);
            showFlash('Error loading listing', 'error');
            setLoading(false);
        }
    };

    const updateGuest = (type, delta) => {
        const newValue = guests[type] + delta;
        if (newValue < 0) return;
        if (type === 'adult' && newValue < 1) return;

        const maxGuests = listing?.maxGuests || 5;
        const totalPayingGuests = (type === 'adult' || type === 'child')
            ? guests.adult + guests.child + delta
            : guests.adult + guests.child;

        if ((type === 'adult' || type === 'child') && totalPayingGuests > maxGuests) {
            return;
        }

        setGuests(prev => ({ ...prev, [type]: newValue }));
    };

    const calculatePrice = () => {
        if (!listing) return 0;
        const basePrice = listing.price;
        const freeGuests = listing.freeGuests || 3;
        const extraGuestCharge = listing.extraGuestChargePerNight || 500;
        const petCharge = listing.petChargePerNight || 300;
        const payingGuests = guests.adult + guests.child;
        const extraGuests = Math.max(0, payingGuests - freeGuests);
        return basePrice + (extraGuests * extraGuestCharge) + (guests.animals * petCharge);
    };

    const getGuestSummary = () => {
        const paying = guests.adult + guests.child;
        let summary = paying === 1 ? '1 guest' : `${paying} guests`;
        if (guests.infant > 0) {
            summary += `, ${guests.infant} infant${guests.infant > 1 ? 's' : ''}`;
        }
        if (guests.animals > 0) {
            summary += `, ${guests.animals} pet${guests.animals > 1 ? 's' : ''}`;
        }
        return summary;
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!currUser) {
            showFlash('Please login to leave a review', 'error');
            return;
        }
        if (reviewForm.rating === 0) {
            showFlash('Please select a rating', 'error');
            return;
        }

        try {
            await axios.post(`/listings/${id}/reviews`, {
                review: { rating: reviewForm.rating, comment: reviewForm.comment }
            });
            showFlash('Review added successfully!', 'success');
            setReviewForm({ rating: 0, comment: '' });
            fetchListing(); // Refresh to show new review
        } catch (err) {
            showFlash(err.response?.data?.message || 'Failed to add review', 'error');
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;

        try {
            await axios.delete(`/listings/${id}/reviews/${reviewId}`);
            showFlash('Review deleted', 'success');
            fetchListing();
        } catch (err) {
            showFlash('Failed to delete review', 'error');
        }
    };

    const handleDeleteListing = async () => {
        if (!window.confirm('Are you sure you want to delete this listing?')) return;

        try {
            await axios.delete(`/listings/${id}`);
            showFlash('Listing deleted', 'success');
            navigate('/listings');
        } catch (err) {
            showFlash('Failed to delete listing', 'error');
        }
    };

    if (loading) {
        return <div className="container mt-5"><h3>Loading...</h3></div>;
    }

    if (!listing) {
        return <div className="container mt-5"><h3>Listing not found</h3></div>;
    }

    // Handle potential partial data where Owner might be missing or just an ID
    const ownerId = listing.Owner?._id || (typeof listing.Owner === 'string' ? listing.Owner : null);
    const isOwner = currUser && ownerId && currUser._id === ownerId;
    // Only show review section if we have owner data to avoid flicker
    const canReview = currUser && !isOwner && ownerId;

    // Combine all images for the carousel
    const allImages = [];
    if (listing.image?.url) allImages.push(listing.image);
    if (listing.images?.length) allImages.push(...listing.images);
    if (allImages.length === 0) allImages.push({ url: '/images/fallback.jpg' });

    return (
        <div className="container mt-3 page-fade listing-show-page">
            <div className="row">
                <div className="col-lg-8">
                    <h3>{listing.title}</h3>
                    <div className="listing-rating-summary mb-3 d-flex align-items-center gap-2">
                        <span className="fw-bold">★ {listing.avgRating?.toFixed(1) || 'N/A'}</span>
                        <span className="text-muted">·</span>
                        <span
                            className="text-decoration-underline fw-medium"
                            style={{ cursor: 'pointer' }}
                            onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            {listing.reviews?.length || 0} reviews
                        </span>
                        {listing.location && (
                            <>
                                <span className="text-muted">·</span>
                                <span
                                    className="text-decoration-underline fw-medium"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' })}
                                >
                                    {listing.location}, {listing.country}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Image Gallery */}
                    <div className="card show-card listing-main-card">
                        <div className="listing-gallery-container">
                            <div className="listing-image-carousel">
                                {allImages.map((img, idx) => (
                                    <div key={idx} className="carousel-item-wrapper">
                                        <img
                                            src={img.url}
                                            alt={`View ${idx + 1}`}
                                            onClick={() => setSelectedImage(img.url)}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="image-count-badge">
                                <i className="fa-solid fa-camera me-1"></i> {allImages.length} Photos
                            </div>

                        </div>

                        {/* Listing Details */}
                        <div className="card-body">
                            <div className="listing-details-container">
                                <div className="listing-info w-100">
                                    <p className="card-text">{listing.description}</p>
                                    <p className="card-text">{listing.category}</p>
                                    <p className="card-text">
                                        Location: {listing.location}, {listing.country}
                                    </p>
                                </div>

                                {isOwner && (
                                    <div className="listing-actions">
                                        <Link to={`/listings/${listing._id}/edit`} className="btn btn-warning edit-btn">
                                            Edit
                                        </Link>
                                        <button className="btn btn-danger" onClick={handleDeleteListing}>
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Amenities */}
                    {listing.amenities && listing.amenities.length > 0 && (
                        <div className="amenities-card p-3 border rounded shadow-sm bg-white mt-3">
                            <h4>What this place offers</h4>
                            <div className="amenities-grid">
                                {listing.amenities.map((amenity, idx) => (
                                    <div key={idx} className="amenity-item">
                                        <i className={`fa-solid ${amenityIcons[amenity] || 'fa-check'}`}></i>
                                        <span>{amenity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Leave a Review */}
                    {canReview && (
                        <>
                            <hr />
                            <h4>Leave a Review</h4>
                            <form onSubmit={handleReviewSubmit} noValidate>
                                <div className="mb-3">
                                    <label className="form-label">Rating</label>
                                    <div className="star-rating-input d-flex align-items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((num) => (
                                            <i
                                                key={num}
                                                className={`fa-star ${num <= (hoverRating || reviewForm.rating) ? 'fa-solid' : 'fa-regular'}`}
                                                style={{
                                                    cursor: 'pointer',
                                                    color: '#FFD700',
                                                    fontSize: '1.8rem',
                                                    transition: 'transform 0.1s'
                                                }}
                                                onMouseEnter={() => setHoverRating(num)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                onClick={() => setReviewForm(prev => ({ ...prev, rating: num }))}
                                            />
                                        ))}
                                        <span className="ms-2 text-muted small">
                                            {hoverRating || reviewForm.rating ? `${hoverRating || reviewForm.rating}/5` : ''}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-3 mt-3">
                                    <label htmlFor="comment" className="form-label">Comments</label>
                                    <textarea
                                        name="comment"
                                        id="comment"
                                        cols="30"
                                        rows="4"
                                        className="form-control"
                                        required
                                        value={reviewForm.comment}
                                        onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                    ></textarea>
                                </div>

                                <button className="btn btn-outline-dark  " style={{ fontSize: '15px' }}>Submit</button>
                            </form>
                            <hr />
                        </>
                    )}

                    {/* All Reviews */}
                    {listing.reviews && listing.reviews.length > 0 && typeof listing.reviews[0] === 'object' && (
                        <div className="mt-4" id="reviews-section">
                            <h4 className="mb-4">All Reviews</h4>
                            <div className="row">
                                {listing.reviews.map((review) => (
                                    <div key={review._id} className="col-6 col-md-6 mb-4">
                                        <div className="review-card">
                                            <div className="review-header">
                                                <img
                                                    src={review.author?.avatar || '/image/default-user.png'}
                                                    className="review-avatar"
                                                    alt="user"
                                                />
                                                <div>
                                                    <strong>{review.author?.username || 'Anonymous'}</strong>
                                                </div>
                                            </div>

                                            <div className="review-meta">
                                                <span className="stars">
                                                    {[...Array(5)].map((_, i) => (
                                                        <i key={i} className={`fa-star ${i < review.rating ? 'fa-solid' : 'fa-regular'}`} style={{ color: '#FFD700' }}></i>
                                                    ))}
                                                </span>
                                                <small className="text-muted ms-2">
                                                    {review.createdAt ? new Date(review.createdAt).toDateString() : ''}
                                                </small>
                                            </div>

                                            <p className="review-text">
                                                {review.comment.length > 140 ? review.comment.slice(0, 140) + '...' : review.comment}
                                            </p>

                                            {currUser && review.author && currUser._id === review.author._id && (
                                                <button
                                                    className="btn btn-sm btn-outline-dark mt-2"
                                                    onClick={() => handleDeleteReview(review._id)}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Around this place (Nearby) */}
                    {((nearbyPlaces && nearbyPlaces.length > 0) || (travelCompanion.places && travelCompanion.places.length > 0) || (travelCompanion.food && travelCompanion.food.length > 0)) && (
                        <div className="nearby-section mb-4 p-3 border rounded shadow-sm bg-white">
                            <h5 className="mb-3"><i className="fa-solid fa-map-location-dot me-2 text-primary-custom"></i>Around this place</h5>

                            {((nearbyPlaces && nearbyPlaces.length > 0) || (travelCompanion.places && travelCompanion.places.length > 0)) && (
                                <>
                                    <h6 className="text-primary-custom mb-2"><i className="fa-solid fa-location-dot me-2"></i>Places to Visit</h6>
                                    <div className="row g-2 mb-3">
                                        {(nearbyPlaces && nearbyPlaces.length > 0 ? nearbyPlaces : (travelCompanion.places || [])).map((place, idx) => (
                                            <div key={idx} className="col-lg-4 col-md-4 col-sm-6">
                                                <div className="card h-100 border-0 shadow-sm mini-suggestion-card">
                                                    <img
                                                        src={place.image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e'}
                                                        className="card-img-top p-1 rounded"
                                                        style={{ height: '120px', objectFit: 'cover' }}
                                                        alt={place.name}
                                                    />
                                                    <div className="card-body p-2 text-center">
                                                        <a href={`https://www.google.com/maps?q=${encodeURIComponent(place.name)}`} target="_blank" rel="noopener noreferrer" className="text-decoration-none text-dark">
                                                            <small className="fw-bold d-block text-truncate" style={{ fontSize: '15px' }}>{place.name}</small>

                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {travelCompanion.food && travelCompanion.food.length > 0 && (
                                <>
                                    <h6 className="text-primary-custom mb-2"><i className="fa-solid fa-utensils me-2"></i>Local Food</h6>
                                    <div className="row g-2">
                                        {travelCompanion.food.map((f, idx) => (
                                            <div key={idx} className="col-lg-4 col-md-4 col-sm-6">
                                                <div className="card h-100 border-0 shadow-sm mini-suggestion-card">
                                                    <img src={f.image || '/images/placeholder-food.jpg'} className="card-img-top p-1 rounded" style={{ height: '120px', objectFit: 'cover' }} alt={f.name} />
                                                    <div className="card-body p-2 text-center">
                                                        <small className="fw-bold d-block text-truncate" style={{ fontSize: '15px' }}>{f.name}</small>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Map */}
                    <h3 id="map-section">Where you'll be</h3>
                    <div className="listing-map col-12 mt-5 px-0">
                        <iframe
                            src={`https://www.google.com/maps?q=${encodeURIComponent(`${listing.title}, ${listing.location}, ${listing.country}`)}&z=14&output=embed`}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            style={{ width: '100%', height: '420px', border: 0, borderRadius: '16px' }}
                        ></iframe>
                    </div>
                </div>

                {/* Sidebar - Reservation Card & Host Info */}
                <div className="col-lg-4">
                    <div className="sidebar-sticky">
                        {/* Reserve Card (Desktop) */}
                        <div className="d-none d-md-block">
                            <div className="reserve-card p-3 border rounded shadow-sm bg-white mb-3">
                                <div className="price-info mb-3">
                                    <span className="final-price">₹{calculatePrice().toLocaleString('en-IN')}</span>
                                    <span className="night-text"> / night</span>
                                </div>


                                {/* Guest Selector */}
                                <div className={`guest-box guest-toggle ${showGuestDropdown ? 'open' : ''}`} onClick={() => setShowGuestDropdown(!showGuestDropdown)}>
                                    <span>{getGuestSummary()}</span>
                                    <i className="fa-solid fa-chevron-down"></i>
                                </div>

                                <div className={`guest-dropdown ${showGuestDropdown ? 'open' : ''}`}>
                                    <div className="guest-row">
                                        <div>
                                            <strong>Adults</strong>
                                            <small>Ages 13+</small>
                                        </div>
                                        <div className="counter">
                                            <button type="button" onClick={() => updateGuest('adult', -1)}>−</button>
                                            <span>{guests.adult}</span>
                                            <button type="button" onClick={() => updateGuest('adult', 1)}>+</button>
                                        </div>
                                    </div>

                                    <div className="guest-row">
                                        <div>
                                            <strong>Children</strong>
                                            <small>Ages 2-12</small>
                                        </div>
                                        <div className="counter">
                                            <button type="button" onClick={() => updateGuest('child', -1)}>−</button>
                                            <span>{guests.child}</span>
                                            <button type="button" onClick={() => updateGuest('child', 1)}>+</button>
                                        </div>
                                    </div>

                                    <div className="guest-row">
                                        <div>
                                            <strong>Infants</strong>
                                            <small>Under 2</small>
                                        </div>
                                        <div className="counter">
                                            <button type="button" onClick={() => updateGuest('infant', -1)}>−</button>
                                            <span>{guests.infant}</span>
                                            <button type="button" onClick={() => updateGuest('infant', 1)}>+</button>
                                        </div>
                                    </div>

                                    {listing.petsAllowed && (
                                        <div className="guest-row">
                                            <div>
                                                <strong>Pets</strong>
                                                <small>Allowed</small>
                                            </div>
                                            <div className="counter">
                                                <button type="button" onClick={() => updateGuest('animals', -1)}>−</button>
                                                <span>{guests.animals}</span>
                                                <button type="button" onClick={() => updateGuest('animals', 1)}>+</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="guest-dropdown-info">
                                        <div className="info-item">
                                            <i className="fa-solid fa-users"></i>
                                            <span>Max {listing.maxGuests || 5} guests allowed</span>
                                        </div>
                                        <div className="info-item">
                                            <i className={`fa-solid ${listing.petsAllowed ? 'fa-paw' : 'fa-ban'}`}></i>
                                            <span>Pets {listing.petsAllowed ? 'Allowed' : 'Not Allowed'}</span>
                                        </div>
                                    </div>
                                </div>

                                <button className="reserve-btn" onClick={() => {
                                    if (!currUser) {
                                        showFlash('Please login to reserve', 'error');
                                        return;
                                    }
                                    const params = new URLSearchParams({
                                        adults: guests.adult,
                                        children: guests.child,
                                        infants: guests.infant,
                                        animals: guests.animals
                                    });
                                    navigate(`/listings/${id}/book?${params.toString()}`);
                                }}>Reserve</button>
                                <div className="charge-details-box mt-3 p-2 rounded">
                                    <p className="m-0 small text-muted">
                                        <i className="fa-solid fa-circle-info me-1"></i>
                                        First {listing.freeGuests || 3} guests stay free. Extra guests incur ₹{(listing.extraGuestChargePerNight || 500).toLocaleString('en-IN')}/night.
                                    </p>
                                    {listing.petsAllowed && (
                                        <p className="m-0 small text-muted">
                                            <i className="fa-solid fa-paw me-1"></i>
                                            Pet charge: ₹{(listing.petChargePerNight || 300).toLocaleString('en-IN')}/night.
                                        </p>
                                    )}
                                </div>
                                <p className="charge-note text-muted">You won't be charged yet</p>
                            </div>
                        </div>

                        {/* Host Info */}
                        <div className="host-sidebar-card">
                            <div className="d-flex align-items-center gap-3 mb-3">
                                <div className="position-relative">
                                    <img
                                        src="/images/default-user.png"
                                        style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
                                        alt="Host"
                                    />
                                    <span className="position-absolute bottom-0 end-0 bg-danger text-white rounded-circle d-flex align-items-center justify-content-center"
                                        style={{ width: '18px', height: '18px', fontSize: '10px', border: '2px solid white' }}>
                                        <i className="fa-solid fa-check"></i>
                                    </span>
                                </div>
                                <div>
                                    <h5 className="m-0">{listing.Owner?.username || 'Host'}</h5>
                                    <small className="text-muted">Host</small>
                                </div>
                            </div>

                            <div className="d-flex justify-content-between text-center border-top border-bottom py-3 mb-3">
                                <div>
                                    <strong className="d-block">{listing.reviews?.length || 0}</strong>
                                    <small style={{ fontSize: '0.8rem' }}>Reviews</small>
                                </div>
                                <div className="border-start border-end px-3">
                                    <strong className="d-block">{listing.avgRating?.toFixed(2) || 'N/A'}★</strong>
                                    <small style={{ fontSize: '0.8rem' }}>Rating</small>
                                </div>
                                <div>
                                    <strong className="d-block">
                                        {listing.Owner?.createdAt ? Math.max(1, new Date().getFullYear() - new Date(listing.Owner.createdAt).getFullYear()) : 1}
                                    </strong>
                                    <small style={{ fontSize: '0.8rem' }}>Years</small>
                                </div>
                            </div>

                            <div className="mb-3">
                                <small className="text-muted d-block mb-1">Response rate: <strong>97%</strong></small>
                                <small className="text-muted d-block">Responds within an hour</small>
                            </div>

                            <button className="btn btn-outline-dark w-100 rounded-pill">
                                Message host
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Reserve Bar */}
                <div className="mobile-reserve-bar d-md-none">
                    <div className="mobile-price">
                        ₹{listing.price.toLocaleString('en-IN')} / night
                    </div>
                    <button className="mobile-reserve-btn" onClick={() => setShowMobileReserve(true)}>
                        Reserve
                    </button>
                </div>

                {/* Mobile Reserve Drawer */}
                <div className={`mobile-reserve-drawer d-md-none ${showMobileReserve ? 'open' : ''}`}>
                    <div className="drawer-header">
                        <h4>Reserve</h4>
                        <button className="close-drawer" onClick={() => setShowMobileReserve(false)}>×</button>
                    </div>

                    <div className="drawer-body mb-3">
                        {/* Price & Guest Summary */}
                        <div className="mb-4 border-bottom pb-3">
                            <div className="d-flex align-items-baseline gap-2">
                                <span className="fs-2 fw-bold">₹{calculatePrice().toLocaleString('en-IN')}</span>
                                <span className="text-muted">/ night</span>
                            </div>
                            <div className="text-muted small mt-1">{getGuestSummary()}</div>
                        </div>

                        <div className="guest-row">
                            <div>
                                <strong>Adults</strong>
                                <small className="d-block text-muted">Ages 13+</small>
                            </div>
                            <div className="counter">
                                <button type="button" onClick={() => updateGuest('adult', -1)}>−</button>
                                <span>{guests.adult}</span>
                                <button type="button" onClick={() => updateGuest('adult', 1)}>+</button>
                            </div>
                        </div>

                        <div className="guest-row">
                            <div>
                                <strong>Children</strong>
                                <small className="d-block text-muted">Ages 2-12</small>
                            </div>
                            <div className="counter">
                                <button type="button" onClick={() => updateGuest('child', -1)}>−</button>
                                <span>{guests.child}</span>
                                <button type="button" onClick={() => updateGuest('child', 1)}>+</button>
                            </div>
                        </div>

                        <div className="guest-row">
                            <div>
                                <strong>Infants</strong>
                                <small className="d-block text-muted">Under 2</small>
                            </div>
                            <div className="counter">
                                <button type="button" onClick={() => updateGuest('infant', -1)}>−</button>
                                <span>{guests.infant}</span>
                                <button type="button" onClick={() => updateGuest('infant', 1)}>+</button>
                            </div>
                        </div>

                        {listing.petsAllowed && (
                            <div className="guest-row">
                                <div>
                                    <strong>Pets</strong>
                                    <small className="d-block text-muted">Allowed</small>
                                </div>
                                <div className="counter">
                                    <button type="button" onClick={() => updateGuest('animals', -1)}>−</button>
                                    <span>{guests.animals}</span>
                                    <button type="button" onClick={() => updateGuest('animals', 1)}>+</button>
                                </div>
                            </div>
                        )}

                        {/* Guest Info & Policies */}
                        <div className="guest-dropdown-info mt-3 rounded border">
                            <div className="info-item">
                                <i className="fa-solid fa-users"></i>
                                <span>Max {listing.maxGuests || 5} guests allowed</span>
                            </div>
                            <div className="info-item">
                                <i className={`fa-solid ${listing.petsAllowed ? 'fa-paw' : 'fa-ban'}`}></i>
                                <span>Pets {listing.petsAllowed ? 'Allowed' : 'Not Allowed'}</span>
                            </div>
                        </div>

                        {/* Charge Details */}
                        <div className="charge-details-box mt-3 p-2 rounded">
                            <p className="m-0 small text-muted">
                                <i className="fa-solid fa-circle-info me-1"></i>
                                First {listing.freeGuests || 3} guests stay free. Extra guests incur ₹{(listing.extraGuestChargePerNight || 500).toLocaleString('en-IN')}/night.
                            </p>
                            {listing.petsAllowed && (
                                <p className="m-0 small text-muted mt-1">
                                    <i className="fa-solid fa-paw me-1"></i>
                                    Pet charge: ₹{(listing.petChargePerNight || 300).toLocaleString('en-IN')}/night.
                                </p>
                            )}
                        </div>
                    </div>

                    <button className="reserve-btn" onClick={() => {
                        if (!currUser) {
                            showFlash('Please login to reserve', 'error');
                            return;
                        }
                        const params = new URLSearchParams({
                            adults: guests.adult,
                            children: guests.child,
                            infants: guests.infant,
                            animals: guests.animals
                        });
                        navigate(`/listings/${id}/book?${params.toString()}`);
                    }}>
                        Reserve
                    </button>
                </div>

                {showMobileReserve && (
                    <div
                        className="d-md-none"
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            zIndex: 1999
                        }}
                        onClick={() => setShowMobileReserve(false)}
                    ></div>
                )}


                {/* Image Modal */}
                {selectedImage && (
                    <div className="image-modal active" onClick={() => setSelectedImage(null)}>
                        <button className="close-modal" onClick={() => setSelectedImage(null)}>×</button>
                        <img src={selectedImage} alt="Full size" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListingShow;
