import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../config/axios';
import { useHostDashboardCache } from '../components/HostDashboardCacheContext';
import SkeletonCard from '../components/SkeletonCard';
import './HostDashboard.css';

const HostDashboard = ({ currUser, showFlash }) => {
    const [activeTab, setActiveTab] = useState('upcoming');
    const [bookings, setBookings] = useState({
        upcoming: [],
        confirmed: [],
        completed: [],
        cancelled: []
    });
    const [loading, setLoading] = useState(true);

    // Use the cache context
    const { getCachedData, setCachedData } = useHostDashboardCache();

    useEffect(() => {
        if (currUser) {
            fetchHostBookings();
        }
    }, [currUser]);

    const fetchHostBookings = async () => {
        try {
            // Check cache first
            const cachedData = getCachedData();

            if (cachedData) {
                // Use cached data - no loading state needed
                setBookings(cachedData.bookings);
                setLoading(false);
                return;
            }

            // No cache - fetch from API
            const res = await axios.get('/profile/host');
            const fetchedBookings = {
                upcoming: res.data.upcoming || [],
                confirmed: res.data.confirmed || [],
                completed: res.data.completed || [],
                cancelled: res.data.cancelled || []
            };

            setBookings(fetchedBookings);

            // Cache the results
            setCachedData(fetchedBookings);

            setLoading(false);
        } catch (err) {
            console.error('Error fetching host bookings:', err);
            setLoading(false);
        }
    };

    const updateBookingStatus = async (bookingId, status) => {
        if (status === 'cancelled' && !window.confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        try {
            await axios.post(`/profile/host/bookings/${bookingId}/status`, { status });
            showFlash(`Booking ${status}!`, 'success');
            fetchHostBookings();
        } catch (err) {
            showFlash(err.response?.data?.message || 'Failed to update booking', 'error');
        }
    };

    const renderBookings = (list) => {
        if (list.length === 0) {
            return (
                <div className="empty-state">
                    <i className="fas fa-calendar-times"></i>
                    <h5>No bookings found</h5>
                    <p>You don't have any bookings at the moment.</p>
                </div>
            );
        }

        return list.map(booking => (
            <div key={booking._id} className={`booking-card ${booking.status}`}>
                <div className="card-body">
                    <h5 className="card-title">
                        <i className="fas fa-home text-primary me-2"></i>
                        {booking.listing?.title || 'Untitled Listing'}
                    </h5>

                    <div className="booking-details">
                        <div className="detail-group">
                            <p>
                                <i className="fas fa-user text-info me-2"></i>
                                <strong>Guest:</strong> {booking.user?.username || 'N/A'}
                            </p>
                        </div>
                        <div className="detail-group">
                            <p>
                                <i className="fas fa-calendar-alt text-warning me-2"></i>
                                <strong>Dates:</strong> {new Date(booking.startDate).toDateString()} → {new Date(booking.endDate).toDateString()}
                            </p>
                            <p>
                                <i className="fas fa-rupee-sign text-success me-2"></i>
                                <strong>Total:</strong> ₹ {booking.totalPrice?.toLocaleString('en-IN') || 0}
                                {booking.discountApplied && (
                                    <span className="ms-2 badge bg-success-light text-success border-success-light">
                                        <i className="fas fa-bolt me-1"></i>
                                        Early Bird
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Guest Count Information */}
                    {booking.guests && (booking.guests.adults > 0 || booking.guests.children > 0 || booking.guests.infants > 0 || booking.guests.animals > 0) && (
                        <div className="guest-counts-wrapper">
                            <div className="guest-counts">
                                {booking.guests.adults > 0 && (
                                    <span className="guest-badge">
                                        <i className="fas fa-user-friends text-primary me-1"></i>
                                        {booking.guests.adults} Adult{booking.guests.adults > 1 ? 's' : ''}
                                    </span>
                                )}
                                {booking.guests.children > 0 && (
                                    <span className="guest-badge">
                                        <i className="fas fa-child text-info me-1"></i>
                                        {booking.guests.children} Child{booking.guests.children > 1 ? 'ren' : ''}
                                    </span>
                                )}
                                {booking.guests.infants > 0 && (
                                    <span className="guest-badge">
                                        <i className="fas fa-baby text-warning me-1"></i>
                                        {booking.guests.infants} Infant{booking.guests.infants > 1 ? 's' : ''}
                                    </span>
                                )}
                                {booking.guests.animals > 0 && (
                                    <span className="guest-badge">
                                        <i className="fas fa-paw text-danger me-1"></i>
                                        {booking.guests.animals} Pet{booking.guests.animals > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="card-actions-wrapper">
                        <span className={`status-badge ${booking.status} text-capitalize`}>
                            <i className="fas fa-circle me-1" style={{ fontSize: '0.6rem' }}></i>
                            {booking.status}
                        </span>

                        <div className="btn-group-custom">
                            {booking.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                                        className="btn btn-custom btn-success-custom"
                                    >
                                        <i className="fas fa-check me-1"></i> Confirm Booking
                                    </button>
                                    <button
                                        onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                                        className="btn btn-custom btn-danger-custom"
                                    >
                                        <i className="fas fa-times me-1"></i> Cancel Booking
                                    </button>
                                </>
                            )}
                            {booking.status === 'confirmed' && (
                                <button
                                    onClick={() => updateBookingStatus(booking._id, 'completed')}
                                    className="btn btn-custom btn-primary-custom"
                                >
                                    <i className="fas fa-check-circle me-1"></i> Mark as Completed
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        ));
    };

    if (!currUser) {
        return (
            <div className="container mt-5">
                <h3>Please login to view host dashboard</h3>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container host-dashboard mt-5">
                <div className="grid">
                    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="container host-dashboard">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="mb-0">🏠 Host Dashboard</h3>
                <Link to="/profile/host/scanner" className="btn btn-dark rounded-pill px-4">
                    <i className="fa-solid fa-qrcode me-2"></i> Scan Guest QR
                </Link>
            </div>

            <ul className="nav dashboard-tabs">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upcoming')}
                    >
                        Upcoming
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'confirmed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('confirmed')}
                    >
                        Confirmed
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'completed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('completed')}
                    >
                        Completed
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link text-danger ${activeTab === 'cancelled' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cancelled')}
                    >
                        Cancelled
                    </button>
                </li>
            </ul>

            <div className="tab-content">
                {activeTab === 'upcoming' && (
                    <div className="tab-pane fade show active">
                        {renderBookings(bookings.upcoming)}
                    </div>
                )}
                {activeTab === 'confirmed' && (
                    <div className="tab-pane fade show active">
                        {renderBookings(bookings.confirmed)}
                    </div>
                )}
                {activeTab === 'completed' && (
                    <div className="tab-pane fade show active">
                        {renderBookings(bookings.completed)}
                    </div>
                )}
                {activeTab === 'cancelled' && (
                    <div className="tab-pane fade show active">
                        {renderBookings(bookings.cancelled)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HostDashboard;
