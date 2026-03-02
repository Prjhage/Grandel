import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../config/axios';
import { useProfileCache } from '../components/ProfileCacheContext';
import SkeletonCard from '../components/SkeletonCard';
import { optimizeUrl } from '../utils/cloudinaryHelper';
import './Profile.css';

const Profile = ({ currUser, showFlash }) => {
    const [activeTab, setActiveTab] = useState('wishlist');
    const [wishlistListings, setWishlistListings] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [myListings, setMyListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [imagesLoaded, setImagesLoaded] = useState({});
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [profileForm, setProfileForm] = useState({
        username: currUser?.username || '',
        email: currUser?.email || ''
    });
    const [error, setError] = useState('');

    // Use the cache context
    const { getCachedData, setCachedData } = useProfileCache();

    useEffect(() => {
        if (currUser) {
            fetchProfileData();
            // Sync form data
            setProfileForm({
                username: currUser.username || '',
                email: currUser.email || ''
            });
        }
    }, [currUser]);

    const fetchProfileData = async () => {
        try {
            // Check cache first
            const cachedData = getCachedData();

            if (cachedData) {
                // Use cached data - no loading state needed
                setWishlistListings(cachedData.wishlistListings || []);
                setBookings(cachedData.bookings || []);
                setMyListings(cachedData.myListings || []);
                setLoading(false);
                return;
            }

            // No cache - fetch from API
            const res = await axios.get('/profile');
            const fetchedWishlist = res.data.wishlistListings || [];
            const fetchedBookings = res.data.bookings || [];
            const fetchedMyListings = res.data.myListings || [];

            setWishlistListings(fetchedWishlist);
            setBookings(fetchedBookings);
            setMyListings(fetchedMyListings);

            // Cache the results
            setCachedData(fetchedWishlist, fetchedBookings, fetchedMyListings);

            setLoading(false);
        } catch (err) {
            console.error('Error fetching profile data:', err);
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            await axios.post('/profile/photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showFlash('Profile photo updated!', 'success');
            window.location.reload();
        } catch (err) {
            showFlash('Failed to update photo', 'error');
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;

        try {
            await axios.delete(`/bookings/${bookingId}`);
            showFlash('Booking cancelled', 'success');
            fetchProfileData();
        } catch (err) {
            showFlash('Failed to cancel booking', 'error');
        }
    };

    const handleDeleteListing = async (listingId) => {
        if (!window.confirm('Are you sure you want to delete this listing?')) return;

        try {
            await axios.delete(`/listings/${listingId}`);
            showFlash('Listing deleted', 'success');
            fetchProfileData();
        } catch (err) {
            showFlash('Failed to delete listing', 'error');
        }
    };

    const handleDownloadInvoice = async (bookingId) => {
        try {
            const res = await axios.get(`/bookings/${bookingId}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice_${bookingId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            showFlash('Failed to download invoice', 'error');
        }
    };

    if (!currUser) {
        return (
            <div className="container mt-5">
                <h3>Please login to view your profile</h3>
                <Link to="/login" className="btn btn-dark mt-3">Login</Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="profile-container">
                <div className="profile-tabs">
                    <div className="tab-btn active" style={{ width: '100px', height: '38px', opacity: 0.5 }}></div>
                    <div className="tab-btn" style={{ width: '100px', height: '38px', opacity: 0.5 }}></div>
                </div>
                <div className="grid">
                    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }


    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        try {
            const updateData = {
                username: profileForm.username,
                email: profileForm.email
            };

            const res = await axios.put('/profile', updateData);
            if (res.data.success) {
                showFlash('Profile updated successfully!', 'success');
                setEditMode(false);
                window.location.reload();
            }
        } catch (err) {
            showFlash(err.response?.data?.message || 'Failed to update profile', 'error');
        }
    };

    const getAvatarDisplay = () => {
        if (currUser.avatar?.url) {
            return <img src={currUser.avatar.url} alt="Profile" className="avatar" />;
        } else if (typeof currUser.avatar === 'string') {
            return <img src={currUser.avatar} alt="Profile" className="avatar" />;
        } else {
            return (
                <div className="avatar">
                    <i className="fa-solid fa-user"></i>
                </div>
            );
        }
    };

    return (
        <div className="container profile-container">
            {/* User Header */}
            <div className="profile-header">
                <div className="avatar-upload" onClick={() => document.getElementById('avatar-input').click()}>
                    {getAvatarDisplay()}
                    <div className="avatar-overlay">
                        <i className="fa-solid fa-camera"></i>
                    </div>
                    <input
                        type="file"
                        id="avatar-input"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleAvatarUpload}
                    />
                </div>
                <div>
                    <h3>{currUser.username}</h3>
                    <p>{currUser.email}</p>
                    <small className="text-muted">Click avatar to change profile photo</small>
                </div>
            </div>

            {/* Tabs */}
            <div className="profile-tabs">
                <button
                    className={`tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
                    onClick={() => setActiveTab('wishlist')}
                >
                    ❤️ Wishlist
                </button>
                <button
                    className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('bookings')}
                >
                    📦 Bookings
                </button>
                <button
                    className={`tab-btn ${activeTab === 'mylistings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mylistings')}
                >
                    🏠 My Listings
                </button>
                <button
                    className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    ⚙️ Settings
                </button>
            </div>

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
                <div className="tab-panel active">
                    {wishlistListings?.length === 0 && (
                        <p className="empty">No wishlist items yet.</p>
                    )}
                    <div className="grid">
                        {wishlistListings?.map(listing => (
                            <div key={listing._id} className="card stagger-item">
                                <img
                                    src={optimizeUrl(listing.image?.url, 'w_400,c_fill') || '/images/fallback.jpg'}
                                    className={`img-fade-in ${imagesLoaded[listing._id] ? 'loaded' : ''}`}
                                    alt={listing.title}
                                    loading="lazy"
                                    onLoad={() => setImagesLoaded(prev => ({ ...prev, [listing._id]: true }))}
                                />
                                <h5>{listing.title}</h5>
                                <p className="price">₹ {listing.price?.toLocaleString('en-IN')} / night</p>
                                <div className="p-3 mt-auto">
                                    <Link to={`/listings/${listing._id}`} className="btn btn-info w-100">
                                        <i className="fa-solid fa-eye me-1"></i> View
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
                <div className="tab-panel active">
                    {bookings?.length === 0 && (
                        <p className="empty">No bookings yet.</p>
                    )}
                    <div className="grid">
                        {bookings?.map(booking => (
                            booking.listing && (
                                <div key={booking._id} className="card stagger-item">
                                    <img
                                        src={optimizeUrl(booking.listing.image?.url, 'w_400,c_fill') || '/images/fallback.jpg'}
                                        className={`img-fade-in ${imagesLoaded[booking._id] ? 'loaded' : ''}`}
                                        alt={booking.listing.title}
                                        loading="lazy"
                                        onLoad={() => setImagesLoaded(prev => ({ ...prev, [booking._id]: true }))}
                                    />
                                    <h5>{booking.listing.title}</h5>
                                    <p>
                                        {new Date(booking.startDate).toDateString()} → {new Date(booking.endDate).toDateString()}
                                    </p>
                                    <p className="price">₹ {booking.totalPrice?.toLocaleString('en-IN')}</p>

                                    <div className="mb-2">
                                        <span className={`badge bg-secondary text-capitalize`}>
                                            {booking.status}
                                        </span>
                                    </div>

                                    {/* Weather Preview */}
                                    {booking.travelCompanion?.weather?.temp && booking.travelCompanion.weather.temp !== 'N/A' && (
                                        <p style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: '#444' }}>
                                            <i className="fa-solid fa-cloud-sun text-primary"></i>
                                            <strong> {booking.travelCompanion.weather.temp}</strong> • {booking.travelCompanion.weather.condition}
                                        </p>
                                    )}

                                    {/* Actions */}
                                    <div className="booking-card-actions">
                                        <div className="primary-actions">
                                            <Link to={`/listings/${booking.listing._id}`} className="btn btn-info">
                                                <i className="fa-solid fa-eye me-1"></i> View
                                            </Link>
                                            <button onClick={() => handleDownloadInvoice(booking._id)} className="btn btn-dark">
                                                <i className="fa-solid fa-file-invoice me-1"></i> Invoice
                                            </button>
                                        </div>

                                        {booking.travelCompanion && (
                                            <button
                                                type="button"
                                                className="btn btn-outline-primary btn-sm w-100"
                                                onClick={() => setSelectedBooking(booking)}
                                            >
                                                ✨ View AI Plan
                                            </button>
                                        )}

                                        <div className="danger-zone">
                                            <button onClick={() => handleCancelBooking(booking._id)} className="btn btn-cancel">
                                                Cancel Booking
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            )}

            {/* My Listings Tab */}
            {activeTab === 'mylistings' && (
                <div className="tab-panel active">
                    {(!myListings || myListings?.length === 0) && (
                        <>
                            <p className="empty">You haven't created any listings yet.</p>
                            <Link to="/listings/new" className="btn btn-dark mt-2">Become a Host</Link>
                        </>
                    )}
                    <div className="grid">
                        {myListings?.map(listing => (
                            <div key={listing._id} className="card stagger-item">
                                <img
                                    src={optimizeUrl(listing.image?.url, 'w_400,c_fill') || '/images/fallback.jpg'}
                                    className={`img-fade-in ${imagesLoaded[listing._id + '_host'] ? 'loaded' : ''}`}
                                    alt={listing.title}
                                    loading="lazy"
                                    onLoad={() => setImagesLoaded(prev => ({ ...prev, [listing._id + '_host']: true }))}
                                />
                                <h5>{listing.title}</h5>
                                <p className="price">₹ {listing.price?.toLocaleString('en-IN')} / night</p>

                                <div className="my-listing-actions">
                                    <div className="primary-actions">
                                        <Link to={`/listings/${listing._id}`} className="btn btn-info">
                                            <i className="fa-solid fa-eye me-1"></i> View
                                        </Link>
                                        <Link to={`/listings/${listing._id}/edit`} className="btn btn-warning">
                                            <i className="fa-solid fa-pen-to-square me-1"></i> Edit
                                        </Link>
                                    </div>

                                    <div className="danger-zone">
                                        <button onClick={() => handleDeleteListing(listing._id)} className="btn btn-danger btn-delete">
                                            <i className="fa-solid fa-trash-can me-1"></i> Delete Listing
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="tab-panel active">
                    <div className="settings-card card p-4 shadow-sm border-0">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="m-0 fw-bold">Account Settings</h4>
                            <button
                                className={`btn rounded-pill px-4 ${editMode ? 'btn-outline-danger' : 'btn-outline-primary'}`}
                                onClick={() => {
                                    setEditMode(!editMode);
                                    if (!editMode) {
                                        setProfileForm({
                                            username: currUser.username,
                                            email: currUser.email
                                        });
                                    }
                                }}
                            >
                                {editMode ? 'Cancel' : 'Edit Profile'}
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProfile}>
                            <div className="mb-4">
                                <label className="form-label small text-muted text-uppercase fw-bold">Username</label>
                                <div className="input-group border rounded-3 p-1">
                                    <span className="input-group-text bg-transparent border-0"><i className="fa-solid fa-user"></i></span>
                                    <input
                                        type="text"
                                        className="form-control border-0 bg-transparent shadow-none"
                                        value={profileForm.username}
                                        disabled={!editMode}
                                        onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label small text-muted text-uppercase fw-bold">Email Address</label>
                                <div className="input-group border rounded-3 p-1">
                                    <span className="input-group-text bg-transparent border-0"><i className="fa-solid fa-envelope"></i></span>
                                    <input
                                        type="email"
                                        className="form-control border-0 bg-transparent shadow-none"
                                        value={profileForm.email}
                                        disabled={!editMode}
                                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            {editMode && (
                                <button type="submit" className="btn btn-dark w-100 py-3 rounded-pill fw-bold shadow-sm">
                                    SAVE CHANGES
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* AI Plan Modal */}
            {selectedBooking && (
                <div className="ai-modal active" onClick={() => setSelectedBooking(null)}>
                    <div className="ai-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h5>🧭 Smart Travel Companion</h5>
                            <button className="btn-close" onClick={() => setSelectedBooking(null)}>×</button>
                        </div>

                        <div className="modal-body">
                            {/* Weather */}
                            {selectedBooking.travelCompanion?.weather?.temp && (
                                <div className="alert alert-info mb-4">
                                    🌤 <strong>Weather:</strong> {selectedBooking.travelCompanion.weather.temp} | {selectedBooking.travelCompanion.weather.condition} | Humidity: {selectedBooking.travelCompanion.weather.humidity}
                                </div>
                            )}

                            {/* Places */}
                            {selectedBooking.listing?.travelCompanion?.places?.length > 0 && (
                                <>
                                    <h5 className="text-primary mb-3">📍 Places to Visit</h5>
                                    <div className="row g-3 mb-4">
                                        {selectedBooking.listing?.travelCompanion?.places?.map((place, idx) => (
                                            <div key={idx} className="col-md-4">
                                                <div className="card shadow-sm h-100">
                                                    <img src={place.image || '/images/placeholder.jpg'} style={{ height: '180px', objectFit: 'cover' }} alt={place.name} />
                                                    <div className="card-body text-center">
                                                        <h6 className="fw-bold">{place.name}</h6>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Food */}
                            {selectedBooking.listing?.travelCompanion?.food?.length > 0 && (
                                <>
                                    <h5 className="text-primary mb-3">🍽 Local Food</h5>
                                    <div className="row g-3 mb-4">
                                        {selectedBooking.listing?.travelCompanion?.food?.map((food, idx) => (
                                            <div key={idx} className="col-md-3">
                                                <div className="card shadow-sm h-100">
                                                    <img src={food.image || '/images/placeholder-food.jpg'} style={{ height: '160px', objectFit: 'cover' }} alt={food.name} />
                                                    <div className="card-body text-center">
                                                        <h6 className="fw-bold">{food.name}</h6>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Day Plan */}
                            {selectedBooking.travelCompanion?.plan?.length > 0 && (
                                <>
                                    <h5 className="text-primary mb-3">🗓 Day-wise Itinerary</h5>
                                    <ul className="list-group">
                                        {selectedBooking.travelCompanion?.plan?.map((day, idx) => (
                                            <li key={idx} className="list-group-item">{day}</li>
                                        ))}
                                    </ul>
                                </>
                            )}

                            {/* Budget */}
                            {selectedBooking.travelCompanion?.budget && (
                                <>
                                    <h6 className="text-primary mt-3">
                                        <i className="fa-solid fa-wallet"></i> Daily Budget Estimate
                                    </h6>
                                    <ul className="list-group list-group-flush">
                                        <li className="list-group-item">🍽 Food: {selectedBooking.travelCompanion.budget.food}</li>
                                        <li className="list-group-item">🚕 Transport: {selectedBooking.travelCompanion.budget.transport}</li>
                                        <li className="list-group-item">🎟 Attractions: {selectedBooking.travelCompanion.budget.attractions}</li>
                                        <li className="list-group-item fw-bold">📊 Total / day: {selectedBooking.travelCompanion.budget.dailyTotal}</li>
                                    </ul>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
