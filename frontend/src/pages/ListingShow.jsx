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
    const [guests, setGuests] = useState({
        rooms: [{ adults: 1, children: 0, infants: 0 }],
        animals: 0
    });
    const [showGuestDropdown, setShowGuestDropdown] = useState(false);
    const [showMobileReserve, setShowMobileReserve] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [travelCompanion, setTravelCompanion] = useState(location.state?.listing?.travelCompanion || { places: [], food: [] });
    const [nearbyPlaces, setNearbyPlaces] = useState(location.state?.listing?.nearbyPlaces || []);
    const [hostStats, setHostStats] = useState({ reviewsCount: 0, avgRating: 0 });

    useEffect(() => {
        fetchListing();
        setCurrentImageIndex(0); // Reset to first image when listing changes
    }, [id]);

    // Keyboard navigation for carousel
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!listing) return;
            const allImages = [];
            if (listing.image?.url) allImages.push(listing.image);
            if (listing.images?.length) allImages.push(...listing.images);
            if (allImages.length === 0) return;

            if (e.key === 'ArrowLeft') {
                handlePrevImage(allImages);
            } else if (e.key === 'ArrowRight') {
                handleNextImage(allImages);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [listing, currentImageIndex]);

    // Toggle body class when mobile reserve drawer is open to hide chatbot icon
    useEffect(() => {
        if (showMobileReserve) {
            document.body.classList.add('mobile-reserve-open');
        } else {
            document.body.classList.remove('mobile-reserve-open');
        }
        return () => document.body.classList.remove('mobile-reserve-open');
    }, [showMobileReserve]);

    const fetchListing = async () => {
        try {
            const res = await axios.get(`/listings/${id}`);
            const data = res.data.listing || res.data;
            setListing(data);

            // Sync travelCompanion priority (top-level res.data > listing property)
            const tc = res.data.travelCompanion || data.travelCompanion || { places: [], food: [] };
            setTravelCompanion(tc);

            // Merge discountAvailable
            if (res.data.discountAvailable !== undefined) {
                data.discountAvailable = res.data.discountAvailable;
            }
            setListing(data);
            setHostStats({
                reviewsCount: res.data.hostReviewsCount || 0,
                avgRating: res.data.hostAvgRating || 0
            });
            setLoading(false);
        } catch (err) {
            console.error('Error fetching listing:', err);
            showFlash('Error loading listing', 'error');
            setLoading(false);
        }
    };

    const updateGuestRooms = (action, roomIndex = null, type = null, delta = null) => {
        if (action === 'addRoom') {
            const maxRooms = listing?.numRooms || 1;
            if (guests.rooms.length >= maxRooms) return;
            setGuests(prev => ({
                ...prev,
                rooms: [...prev.rooms, { adults: 1, children: 0, infants: 0 }]
            }));
        } else if (action === 'removeRoom') {
            if (guests.rooms.length <= 1) return;
            setGuests(prev => {
                const newRooms = [...prev.rooms];
                newRooms.splice(roomIndex, 1);
                return { ...prev, rooms: newRooms };
            });
        } else if (action === 'updateGuest') {
            const room = guests.rooms[roomIndex];
            const newValue = room[type] + delta;

            if (newValue < 0) return;
            if (type === 'adults' && newValue < 1) return;

            const maxGuestsPerRoom = listing?.guestsPerRoom || 2;
            const currentTotalInRoom = room.adults + room.children;
            const newTotalInRoom = (type === 'adults' || type === 'children') ? currentTotalInRoom + delta : currentTotalInRoom;

            if (newTotalInRoom > maxGuestsPerRoom) return;

            setGuests(prev => {
                const newRooms = [...prev.rooms];
                newRooms[roomIndex] = { ...newRooms[roomIndex], [type]: newValue };
                return { ...prev, rooms: newRooms };
            });
        } else if (action === 'updateAnimals') {
            const newValue = guests.animals + delta;
            if (newValue < 0) return;
            setGuests(prev => ({ ...prev, animals: newValue }));
        }
    };

    const calculatePrice = () => {
        if (!listing) return 0;
        const basePrice = listing.price;
        const petCharge = listing.petChargePerNight || 300;

        let total = (basePrice * guests.rooms.length) + (guests.animals * petCharge);

        const discountPercent = listing.discount || 0;
        if (discountPercent > 0 && listing.discountAvailable) {
            total = total * (1 - discountPercent / 100);
        }

        return Math.round(total);
    };

    const getGuestSummary = () => {
        const totalRooms = guests.rooms.length;
        const totalAdults = guests.rooms.reduce((acc, r) => acc + r.adults, 0);
        const totalChildren = guests.rooms.reduce((acc, r) => acc + r.children, 0);
        const totalInfants = guests.rooms.reduce((acc, r) => acc + r.infants, 0);
        const totalPaying = totalAdults + totalChildren;

        let summary = `${totalRooms} room${totalRooms > 1 ? 's' : ''}, ${totalPaying} guest${totalPaying > 1 ? 's' : ''}`;
        if (totalInfants > 0) {
            summary += `, ${totalInfants} infant${totalInfants > 1 ? 's' : ''}`;
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
    const handleNextImage = (allImages) => {
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    };
    const handlePrevImage = (allImages) => {
        setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
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
                                <div className="carousel-item-wrapper">
                                    <img
                                        key={currentImageIndex}
                                        src={allImages[currentImageIndex]?.url || '/images/fallback.jpg'}
                                        alt={`View ${currentImageIndex + 1}`}
                                        onClick={() => setSelectedImage(allImages[currentImageIndex]?.url || '/images/fallback.jpg')}
                                    />
                                </div>
                            </div>

                            {/* Navigation Arrows - Only show if more than 1 image */}
                            {allImages.length > 1 && (
                                <>
                                    <button
                                        className="carousel-nav-btn prev"
                                        onClick={() => handlePrevImage(allImages)}
                                        aria-label="Previous image"
                                    >
                                        <i className="fa-solid fa-chevron-left"></i>
                                    </button>
                                    <button
                                        className="carousel-nav-btn next"
                                        onClick={() => handleNextImage(allImages)}
                                        aria-label="Next image"
                                    >
                                        <i className="fa-solid fa-chevron-right"></i>
                                    </button>
                                </>
                            )}

                            <div className="image-count-badge">
                                <i className="fa-solid fa-camera me-1"></i> {currentImageIndex + 1} / {allImages.length}
                            </div>

                        </div>

                        {/* Listing Details */}
                        <div className="card-body pt-0">
                            <div className="listing-info-subcard">
                                <div className="subcard-header">
                                    <h5 className="subcard-title mb-3">About this place</h5>
                                    <p className="card-text description-text">{listing.description}</p>
                                </div>

                                <div className="subcard-details mb-3">
                                    <div className="detail-item mt-2">
                                        <i className="fa-solid fa-location-dot me-2"></i>
                                        <span>{listing.location}, {listing.country}</span>
                                    </div>
                                    <div className="detail-item mt-2">
                                        <i className="fa-solid fa-door-open me-2"></i>
                                        <span>{listing.numRooms} Room{listing.numRooms > 1 ? 's' : ''} · {listing.guestsPerRoom} Guest{listing.guestsPerRoom > 1 ? 's' : ''} per room</span>
                                    </div>
                                </div>

                                {isOwner && (
                                    <div className="subcard-actions mt-4 pt-3 border-top">
                                        <div className="d-flex gap-2">
                                            <Link to={`/listings/${listing._id}/edit`} className="btn btn-warning flex-grow-1 edit-btn">
                                                <i className="fa-solid fa-pen-to-square me-1"></i> Edit
                                            </Link>
                                            <button className="btn btn-outline-danger" onClick={handleDeleteListing}>
                                                <i className="fa-solid fa-trash-can me-1"></i> Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Amenities */}
                    {listing?.amenities?.length > 0 && (
                        <div className="amenities-card p-3 border rounded shadow-sm bg-white mt-3">
                            <h4>What this place offers</h4>
                            <div className="amenities-grid">
                                {listing?.amenities?.map((amenity, idx) => (
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
                    {listing?.reviews?.length > 0 && typeof listing.reviews[0] === 'object' && (
                        <div className="mt-4" id="reviews-section">
                            <h4 className="mb-4">All Reviews</h4>
                            <div className="row">
                                {listing?.reviews?.map((review) => (
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
                                                {review.comment?.length > 140 ? review.comment.slice(0, 140) + '...' : (review.comment || "")}
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
                    {(nearbyPlaces?.length > 0 || travelCompanion?.places?.length > 0 || travelCompanion?.food?.length > 0) && (
                        <div className="nearby-section mb-4 p-3 border rounded shadow-sm bg-white">
                            <h5 className="mb-3"><i className="fa-solid fa-map-location-dot me-2 text-primary-custom"></i>Around this place</h5>

                            {(nearbyPlaces?.length > 0 || travelCompanion?.places?.length > 0) && (
                                <>
                                    <h6 className="text-primary-custom mb-2"><i className="fa-solid fa-location-dot me-2"></i>Places to Visit</h6>
                                    <div className="row g-2 mb-3">
                                        {(nearbyPlaces?.length > 0 ? nearbyPlaces : (travelCompanion?.places || [])).map((place, idx) => (
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

                            {travelCompanion?.food?.length > 0 && (
                                <>
                                    <h6 className="text-primary-custom mb-2"><i className="fa-solid fa-utensils me-2"></i>Local Food</h6>
                                    <div className="row g-2">
                                        {travelCompanion?.food?.map((f, idx) => (
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
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(`${listing.title}, ${listing.location}, ${listing.country}`)}&z=14&ie=UTF8&iwloc=B&output=embed`}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            style={{ width: '100%', height: '420px', border: 0, borderRadius: '16px' }}
                        ></iframe>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="sidebar-sticky">
                        {/* Reserve Card (Desktop) */}
                        <div className="d-none d-md-block">
                            <div className="reserve-card p-3 border rounded shadow-sm bg-white mb-3">
                                <div className="price-info mb-3">
                                    <span className="final-price">₹{calculatePrice().toLocaleString('en-IN')}</span>
                                    <span className="night-text"> / night</span>
                                    {listing.discount > 0 && listing.discountAvailable && (
                                        <div className="discount-applied-tag mt-1">
                                            <i className="fa-solid fa-bolt me-1"></i>
                                            {listing.discount}% Early Bird Discount
                                        </div>
                                    )}
                                </div>

                                <div className="guest-box" onClick={() => setShowGuestDropdown(!showGuestDropdown)}>
                                    <div className="d-flex flex-column">
                                        <label className="m-0 fw-bold small">GUESTS</label>
                                        <div className="text-muted small mt-1">{getGuestSummary()}</div>
                                    </div>
                                    <i className={`fa-solid fa-chevron-down ms-2 ${showGuestDropdown ? 'rotate-180' : ''}`}></i>
                                </div>

                                {listing.petsAllowed && (
                                    <div className="mt-2 px-1">
                                        <span className="text-success small fw-500">
                                            <i className="fa-solid fa-paw me-1"></i>
                                            Pets allowed (₹{listing.petChargePerNight || 300}/night)
                                        </span>
                                    </div>
                                )}

                                <div className={`guest-dropdown ${showGuestDropdown ? 'open' : ''}`}>
                                    <div className="rooms-scroll-area pt-2 px-3">
                                        {guests.rooms.map((room, idx) => (
                                            <div key={idx} className="room-allocation-block mb-3 pb-2 border-bottom">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <h6 className="m-0">Room {idx + 1}</h6>
                                                    {guests.rooms.length > 1 && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger py-0 px-2"
                                                            style={{ fontSize: '0.7rem' }}
                                                            onClick={(e) => { e.stopPropagation(); updateGuestRooms('removeRoom', idx); }}
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="guest-row">
                                                    <div>
                                                        <strong>Adults</strong>
                                                        <small>Ages 13+</small>
                                                    </div>
                                                    <div className="counter">
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); updateGuestRooms('updateGuest', idx, 'adults', -1); }}>−</button>
                                                        <span>{room.adults}</span>
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); updateGuestRooms('updateGuest', idx, 'adults', 1); }}>+</button>
                                                    </div>
                                                </div>

                                                <div className="guest-row">
                                                    <div>
                                                        <strong>Children</strong>
                                                        <small>Ages 2-12</small>
                                                    </div>
                                                    <div className="counter">
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); updateGuestRooms('updateGuest', idx, 'children', -1); }}>−</button>
                                                        <span>{room.children}</span>
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); updateGuestRooms('updateGuest', idx, 'children', 1); }}>+</button>
                                                    </div>
                                                </div>

                                                <div className="guest-row">
                                                    <div>
                                                        <strong>Infants</strong>
                                                        <small>Under 2</small>
                                                    </div>
                                                    <div className="counter">
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); updateGuestRooms('updateGuest', idx, 'infants', -1); }}>−</button>
                                                        <span>{room.infants}</span>
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); updateGuestRooms('updateGuest', idx, 'infants', 1); }}>+</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="px-3 pb-2">
                                        <div className="d-flex justify-content-between align-items-center mb-3 mt-2">
                                            <button
                                                type="button"
                                                className="btn btn-outline-dark btn-sm w-100"
                                                disabled={guests.rooms.length >= (listing?.numRooms || 1)}
                                                onClick={(e) => { e.stopPropagation(); updateGuestRooms('addRoom'); }}
                                            >
                                                <i className="fa-solid fa-plus me-1"></i> Add Room
                                            </button>
                                        </div>

                                        {listing.petsAllowed && (
                                            <div className="guest-row border-top pt-2">
                                                <div>
                                                    <strong>Pets</strong>
                                                    <small>Allowed</small>
                                                </div>
                                                <div className="counter">
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); updateGuestRooms('updateAnimals', null, null, -1); }}>−</button>
                                                    <span>{guests.animals}</span>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); updateGuestRooms('updateAnimals', null, null, 1); }}>+</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="guest-dropdown-info border-top pt-2">
                                        <div className="info-item">
                                            <i className="fa-solid fa-hotel"></i>
                                            <span>Max {listing.numRooms || 1} room{listing.numRooms > 1 ? 's' : ''} available</span>
                                        </div>
                                        <div className="info-item">
                                            <i className="fa-solid fa-users"></i>
                                            <span>Max {listing.guestsPerRoom || 2} guest{listing.guestsPerRoom > 1 ? 's' : ''} per room</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing Breakdown */}
                                {(guests.rooms.length > 1 || guests.animals > 0) && (
                                    <div className="mt-3 p-3 rounded-3 bg-light border-dashed">
                                        <div className="d-flex justify-content-between small text-muted mb-1">
                                            <span>{guests.rooms.length} room{guests.rooms.length > 1 ? 's' : ''} × ₹{listing.price.toLocaleString('en-IN')}</span>
                                            <span>₹{(listing.price * guests.rooms.length).toLocaleString('en-IN')}</span>
                                        </div>
                                        {guests.animals > 0 && (
                                            <div className="d-flex justify-content-between small text-muted">
                                                <span>{guests.animals} pet{guests.animals > 1 ? 's' : ''} × ₹{(listing.petChargePerNight || 300).toLocaleString('en-IN')}</span>
                                                <span>₹{(guests.animals * (listing.petChargePerNight || 300)).toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button className="reserve-btn mt-3" onClick={() => {
                                    if (!currUser) {
                                        showFlash('Please login to reserve', 'error');
                                        return;
                                    }
                                    const params = new URLSearchParams({
                                        roomsData: JSON.stringify(guests.rooms),
                                        animals: guests.animals
                                    });
                                    navigate(`/listings/${id}/book?${params.toString()}`);
                                }}>Reserve</button>

                                <div className="charge-details-box mt-3 p-2 rounded">
                                    <p className="m-0 small text-muted">
                                        <i className="fa-solid fa-circle-info me-1"></i>
                                        Base price is per room.
                                    </p>
                                    {listing.petsAllowed && (
                                        <p className="m-0 small text-muted mt-1">
                                            <i className="fa-solid fa-paw me-1"></i>
                                            Pet charge: ₹{(listing.petChargePerNight || 300).toLocaleString('en-IN')}/night.
                                        </p>
                                    )}
                                </div>
                                <p className="charge-note text-center mt-2 mb-0 text-muted small">You won't be charged yet</p>
                            </div>
                        </div>

                        {/* Host Sidebar Card */}
                        <div className="host-sidebar-card p-3 border rounded shadow-sm bg-white">
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
                                    <strong className="d-block">{hostStats.reviewsCount}</strong>
                                    <small style={{ fontSize: '0.8rem' }}>Reviews</small>
                                </div>
                                <div className="border-start border-end px-3">
                                    <strong className="d-block">{hostStats.avgRating?.toFixed(1) || '0.0'}★</strong>
                                    <small style={{ fontSize: '0.8rem' }}>Rating</small>
                                </div>
                                <div>
                                    <strong className="d-block">1</strong>
                                    <small style={{ fontSize: '0.8rem' }}>Years</small>
                                </div>
                            </div>
                            <div className="mb-3">
                                <small className="text-muted d-block mb-1">Response rate: <strong>97%</strong></small>
                                <small className="text-muted d-block">Responds within an hour</small>
                            </div>
                            <button className="btn btn-outline-dark w-100 rounded-pill">Message host</button>
                        </div>
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
                <div className="drawer-body">
                    <div className="mb-4 border-bottom pb-3">
                        <div className="d-flex align-items-baseline gap-2">
                            <span className="fs-2 fw-bold">₹{calculatePrice().toLocaleString('en-IN')}</span>
                            <span className="text-muted">/ night</span>
                        </div>
                        <div className="text-muted small mt-1">{getGuestSummary()}</div>
                    </div>

                    <div className="rooms-scroll-area px-1">
                        {guests.rooms.map((room, idx) => (
                            <div key={idx} className="room-allocation-block mb-3 p-3 border rounded bg-light">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="m-0 fw-bold">Room {idx + 1}</h6>
                                    {guests.rooms.length > 1 && (
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger py-1 px-3"
                                            onClick={() => updateGuestRooms('removeRoom', idx)}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <div className="guest-row">
                                    <div>
                                        <strong>Adults</strong>
                                        <small className="d-block text-muted">Ages 13+</small>
                                    </div>
                                    <div className="counter">
                                        <button type="button" onClick={() => updateGuestRooms('updateGuest', idx, 'adults', -1)}>−</button>
                                        <span>{room.adults}</span>
                                        <button type="button" onClick={() => updateGuestRooms('updateGuest', idx, 'adults', 1)}>+</button>
                                    </div>
                                </div>

                                <div className="guest-row">
                                    <div>
                                        <strong>Children</strong>
                                        <small className="d-block text-muted">Ages 2-12</small>
                                    </div>
                                    <div className="counter">
                                        <button type="button" onClick={() => updateGuestRooms('updateGuest', idx, 'children', -1)}>−</button>
                                        <span>{room.children}</span>
                                        <button type="button" onClick={() => updateGuestRooms('updateGuest', idx, 'children', 1)}>+</button>
                                    </div>
                                </div>

                                <div className="guest-row">
                                    <div>
                                        <strong>Infants</strong>
                                        <small className="d-block text-muted">Under 2</small>
                                    </div>
                                    <div className="counter">
                                        <button type="button" onClick={() => updateGuestRooms('updateGuest', idx, 'infants', -1)}>−</button>
                                        <span>{room.infants}</span>
                                        <button type="button" onClick={() => updateGuestRooms('updateGuest', idx, 'infants', 1)}>+</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mb-3 mt-2">
                        <button
                            type="button"
                            className="btn btn-outline-dark btn-sm w-100 py-2"
                            disabled={guests.rooms.length >= (listing?.numRooms || 1)}
                            onClick={() => updateGuestRooms('addRoom')}
                        >
                            <i className="fa-solid fa-plus me-1"></i> Add Room
                        </button>
                    </div>

                    {listing.petsAllowed && (
                        <div className="guest-row border-top pt-3">
                            <div>
                                <strong>Pets</strong>
                                <small className="d-block text-muted">Allowed</small>
                            </div>
                            <div className="counter">
                                <button type="button" onClick={() => updateGuestRooms('updateAnimals', null, null, -1)}>−</button>
                                <span>{guests.animals}</span>
                                <button type="button" onClick={() => updateGuestRooms('updateAnimals', null, null, 1)}>+</button>
                            </div>
                        </div>
                    )}

                    <div className="guest-dropdown-info mt-3 rounded border">
                        <div className="info-item">
                            <i className="fa-solid fa-hotel"></i>
                            <span>Max {listing.numRooms || 1} room{listing.numRooms > 1 ? 's' : ''} available</span>
                        </div>
                        <div className="info-item">
                            <i className="fa-solid fa-users"></i>
                            <span>Max {listing.guestsPerRoom || 2} guest{listing.guestsPerRoom > 1 ? 's' : ''} per room</span>
                        </div>
                    </div>

                    {/* Pricing Breakdown */}
                    {(guests.rooms.length > 1 || guests.animals > 0) && (
                        <div className="mt-3 p-3 rounded-3 bg-light border-dashed">
                            <div className="d-flex justify-content-between small text-muted mb-1">
                                <span>{guests.rooms.length} room{guests.rooms.length > 1 ? 's' : ''} × ₹{listing.price.toLocaleString('en-IN')}</span>
                                <span>₹{(listing.price * guests.rooms.length).toLocaleString('en-IN')}</span>
                            </div>
                            {guests.animals > 0 && (
                                <div className="d-flex justify-content-between small text-muted">
                                    <span>{guests.animals} pet{guests.animals > 1 ? 's' : ''} × ₹{(listing.petChargePerNight || 300).toLocaleString('en-IN')}</span>
                                    <span>₹{(guests.animals * (listing.petChargePerNight || 300)).toLocaleString('en-IN')}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <button className="reserve-btn mt-4" onClick={() => {
                        if (!currUser) {
                            showFlash('Please login to reserve', 'error');
                            return;
                        }
                        const params = new URLSearchParams({
                            roomsData: JSON.stringify(guests.rooms),
                            animals: guests.animals
                        });
                        navigate(`/listings/${id}/book?${params.toString()}`);
                    }}>Reserve</button>
                    <p className="charge-note text-center mt-2 text-muted small">You won't be charged yet</p>
                </div>
            </div>

            {showMobileReserve && (
                <div className="mobile-drawer-overlay" onClick={() => setShowMobileReserve(false)}></div>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div className="image-modal active" onClick={() => setSelectedImage(null)}>
                    <button className="close-modal" onClick={() => setSelectedImage(null)}>×</button>
                    <img src={selectedImage} alt="Full size" />
                </div>
            )}
        </div>
    );
};

export default ListingShow;
