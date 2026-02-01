import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../config/axios';
import './Profile.css';

const Profile = ({ currUser, showFlash }) => {
    const [activeTab, setActiveTab] = useState('wishlist');
    const [wishlistListings, setWishlistListings] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [myListings, setMyListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);

    useEffect(() => {
        if (currUser) {
            fetchProfileData();
        }
    }, [currUser]);

    const fetchProfileData = async () => {
        try {
            const res = await axios.get('/profile');
            setWishlistListings(res.data.wishlistListings || []);
            setBookings(res.data.bookings || []);
            setMyListings(res.data.myListings || []);
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
        return <div className="container mt-5"><h3>Loading...</h3></div>;
    }

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
        <div className="profile-container">
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
            </div>

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
                <div className="tab-panel active">
                    {wishlistListings.length === 0 && (
                        <p className="empty">No wishlist items yet.</p>
                    )}
                    <div className="grid">
                        {wishlistListings.map(listing => (
                            <div key={listing._id} className="card">
                                <img src={listing.image?.url || '/images/fallback.jpg'} alt={listing.title} />
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
                    {bookings.length === 0 && (
                        <p className="empty">No bookings yet.</p>
                    )}
                    <div className="grid">
                        {bookings.map(booking => (
                            booking.listing && (
                                <div key={booking._id} className="card">
                                    <img src={booking.listing.image?.url || '/images/fallback.jpg'} alt={booking.listing.title} />
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
                    {(!myListings || myListings.length === 0) && (
                        <>
                            <p className="empty">You haven't created any listings yet.</p>
                            <Link to="/listings/new" className="btn btn-dark mt-2">Become a Host</Link>
                        </>
                    )}
                    <div className="grid">
                        {myListings.map(listing => (
                            <div key={listing._id} className="card">
                                <img src={listing.image?.url || '/images/fallback.jpg'} alt={listing.title} />
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
                                        {selectedBooking.listing.travelCompanion.places.map((place, idx) => (
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
                                        {selectedBooking.listing.travelCompanion.food.map((food, idx) => (
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
                                        {selectedBooking.travelCompanion.plan.map((day, idx) => (
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
