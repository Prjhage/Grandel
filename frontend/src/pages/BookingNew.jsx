import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from '../config/axios';
import './BookingNew.css';

const BookingNew = ({ currUser, showFlash }) => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showTerms, setShowTerms] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [discountAvailable, setDiscountAvailable] = useState(false);

    // Guest data from query params
    const roomsDataSearch = searchParams.get('roomsData');
    const rooms = roomsDataSearch ? JSON.parse(roomsDataSearch) : [{ adults: 1, children: 0, infants: 0 }];
    const animals = parseInt(searchParams.get('animals')) || 0;

    const guests = {
        rooms: rooms,
        adults: rooms.reduce((acc, r) => acc + r.adults, 0),
        children: rooms.reduce((acc, r) => acc + r.children, 0),
        infants: rooms.reduce((acc, r) => acc + r.infants, 0),
        animals: animals,
        numRooms: rooms.length
    };

    useEffect(() => {
        const fetchListing = async () => {
            try {
                const res = await axios.get(`/listings/${id}`);
                setListing(res.data.listing || res.data);
                setDiscountAvailable(res.data.discountAvailable || false);
                setLoading(false);
            } catch (err) {
                showFlash('Error fetching listing details', 'error');
                navigate(`/listings/${id}`);
            }
        };
        fetchListing();
    }, [id]);

    const calculatePrice = () => {
        if (!listing || !startDate || !endDate) return null;

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end <= start) return null;

        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const PET_PRICE = listing.petChargePerNight || 300;

        const baseTotal = nights * listing.price * guests.numRooms;
        const petCost = guests.animals * PET_PRICE * nights;

        const subtotal = baseTotal + petCost;

        let discount = 0;
        const discountPercent = listing.discount || 0;
        if (discountPercent > 0 && discountAvailable) {
            discount = Math.round(subtotal * discountPercent / 100);
        }

        const discountedSubtotal = subtotal - discount;
        const gst = Math.round(discountedSubtotal * 0.18);
        const total = discountedSubtotal + gst;

        return {
            nights,
            baseTotal,
            petCost,
            subtotal,
            discount,
            gst,
            total
        };
    };

    const priceInfo = calculatePrice();

    const handleConfirm = async (e) => {
        e.preventDefault();
        if (!acceptedTerms) {
            showFlash('Please accept the Guest Terms & Conditions', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Initiate Booking (Create Razorpay Order)
            const initiateRes = await axios.post(`/listings/${id}/book/initiate`, {
                startDate,
                endDate,
                adults: guests.adults,
                children: guests.children,
                infants: guests.infants,
                animals: guests.animals,
                numRooms: guests.numRooms,
            });

            if (!initiateRes.data.success) {
                throw new Error(initiateRes.data.message || 'Failed to initiate booking');
            }

            const { order, key, tokenAmount, totalPrice } = initiateRes.data;

            // 2. Open Razorpay Checkout
            const options = {
                key: key,
                amount: order.amount,
                currency: order.currency,
                name: "Grandel Stays",
                description: `Booking for ${listing.title} (20% Token Amount)`,
                image: "https://res.cloudinary.com/dqu3s2x41/image/upload/v1707555555/logo_icon.png", // Start with a generic or app logo if you have one
                order_id: order.id,
                handler: async function (response) {
                    // 3. On Payment Success -> Verify & Create Booking
                    try {
                        const verifyRes = await axios.post(`/listings/${id}/book/verify`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            bookingDetails: {
                                startDate,
                                endDate,
                                adults: guests.adults,
                                children: guests.children,
                                infants: guests.infants,
                                animals: guests.animals,
                                numRooms: guests.numRooms,
                                acceptGuestTerms: true
                            }
                        });


                        if (verifyRes.data.success) {
                            showFlash('Booking Confirmed! Payment Successful.', 'success');
                            navigate('/profile');
                        } else {
                            showFlash('Payment verification failed. Please contact support.', 'error');
                            setIsSubmitting(false);
                        }
                    } catch (verifyErr) {
                        console.error("Verification Error:", verifyErr);
                        showFlash(verifyErr.response?.data?.message || 'Payment verification failed', 'error');
                        setIsSubmitting(false);
                    }
                },
                prefill: {
                    name: currUser?.username || "",
                    email: currUser?.email || "",
                    contact: currUser?.phone || ""
                },
                notes: {
                    address: "Grandel Booking"
                },
                theme: {
                    color: "#fe424d"
                },
                modal: {
                    ondismiss: function () {
                        setIsSubmitting(false);
                        showFlash('Payment cancelled', 'info');
                    }
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.open();

        } catch (err) {
            console.error("Booking Error:", err);
            showFlash(err.response?.data?.message || 'Booking initiation failed', 'error');
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="container booking-page-wrapper">
            {isSubmitting && (
                <div className="booking-loading-overlay">
                    <div className="loading-house">
                        <i className="fa-solid fa-house-chimney"></i>
                    </div>
                    <h4 className="mt-4 fw-bold text-dark">Confirming your stay...</h4>
                    <p className="text-muted">Please wait while we secure your booking</p>
                </div>
            )}
            <div className="booking-container">
                <div className="d-flex align-items-center gap-3 mb-4">
                    <button
                        className="btn btn-light rounded-circle d-flex align-items-center justify-content-center shadow-sm p-0"
                        style={{ width: '40px', height: '40px', border: '1px solid #eee' }}
                        onClick={() => navigate(`/listings/${id}`)}
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>
                    <h3 className="m-0">Confirm your booking</h3>
                </div>

                <div className="booking-info card border-0 bg-light p-3 mb-4">
                    <p><b>Listing:</b> <span>{listing.title}</span></p>
                    <p><b>Price per room:</b> <span>₹{listing.price.toLocaleString('en-IN')} / night</span></p>
                    <p><b>Guest:</b> <span>{currUser?.username}</span></p>
                </div>

                <div className="guest-summary-box mb-4">
                    <h6 className="fw-bold mb-2">Guest Allocation:</h6>
                    {guests.rooms.map((room, idx) => (
                        <div key={idx} className="small text-muted mb-1">
                            <b>Room {idx + 1}:</b> {room.adults} Adult{room.adults > 1 ? 's' : ''}
                            {room.children > 0 && `, ${room.children} Child${room.children > 1 ? 'ren' : ''}`}
                            {room.infants > 0 && `, ${room.infants} Infant${room.infants > 1 ? 's' : ''}`}
                        </div>
                    ))}
                    {guests.animals > 0 && <div className="small text-muted mt-2 border-top pt-1"><b>Total Pets:</b> {guests.animals}</div>}
                </div>

                <form onSubmit={handleConfirm}>
                    <div className="row mb-3">
                        <div className="col-6">
                            <label className="form-label fw-bold">Check-in</label>
                            <input
                                type="date"
                                className="form-control rounded-3"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="col-6">
                            <label className="form-label fw-bold">Check-out</label>
                            <input
                                type="date"
                                className="form-control rounded-3"
                                required
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {priceInfo && (
                        <div className="price-summary show p-3 rounded-3 mb-4">
                            <div className="price-row d-flex justify-content-between mb-2">
                                <span>Nights</span>
                                <span>{priceInfo.nights}</span>
                            </div>
                            <div className="price-row d-flex justify-content-between mb-2">
                                <span>₹{listing.price.toLocaleString('en-IN')} × {guests.numRooms} room{guests.numRooms > 1 ? 's' : ''} × {priceInfo.nights} night{priceInfo.nights > 1 ? 's' : ''}</span>
                                <span>₹{priceInfo.baseTotal.toLocaleString('en-IN')}</span>
                            </div>
                            {priceInfo.petCost > 0 && (
                                <div className="price-row d-flex justify-content-between mb-2">
                                    <div className="d-flex flex-column">
                                        <span>Pet fee</span>
                                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                            ₹{(listing.petChargePerNight || 300).toLocaleString('en-IN')} × {guests.animals} pet{guests.animals > 1 ? 's' : ''} × {priceInfo.nights} nights
                                        </small>
                                    </div>
                                    <span>₹{priceInfo.petCost.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <hr />
                            <div className="price-row d-flex justify-content-between mb-2">
                                <span>Subtotal</span>
                                <span>₹{priceInfo.subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            {priceInfo.discount > 0 && (
                                <div className="price-row d-flex justify-content-between mb-2" style={{ color: '#28a745' }}>
                                    <span>⚡ Early Bird Discount ({listing.discount}%)</span>
                                    <span>- ₹{priceInfo.discount.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div className="price-row d-flex justify-content-between mb-2">
                                <span>GST (18%)</span>
                                <span>₹{priceInfo.gst.toLocaleString('en-IN')}</span>
                            </div>
                            <hr />
                            <div className="price-row d-flex justify-content-between fw-bold fs-5">
                                <span>Total</span>
                                <span className="text-primary-custom">₹{priceInfo.total.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="price-row d-flex justify-content-between fw-bold mt-2 pt-2 border-top text-success">
                                <span>Pay Now (20% Token)</span>
                                <span>₹{Math.round(priceInfo.total * 0.20).toLocaleString('en-IN')}</span>
                            </div>
                            <p className="text-muted small mt-2">
                                ℹ Base price is per room. Max {listing.guestsPerRoom} guests allowed per room.
                            </p>
                        </div>
                    )}

                    <div className="form-check mt-3 mb-4">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="acceptGuestTerms"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            required
                        />
                        <label className="form-check-label" htmlFor="acceptGuestTerms">
                            I agree to the <button type="button" className="btn btn-link p-0 text-decoration-none fw-bold" onClick={() => setShowTerms(true)}>Guest Terms & Conditions</button>
                        </label>
                    </div>

                    <button
                        className="btn btn-confirm w-100 py-3 rounded-pill d-flex align-items-center justify-content-center gap-2"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                Processing Payment...
                            </>
                        ) : (
                            'Pay Token & Reserve'
                        )}
                    </button>
                </form>
            </div>

            {/* Terms Modal */}
            {showTerms && (
                <div className="terms-modal active" onClick={() => setShowTerms(false)}>
                    <div className="terms-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-terms" onClick={() => setShowTerms(false)}>&times;</button>
                        <h3 className="mb-3">Guest Terms & Conditions</h3>
                        <p className="text-muted small">Last updated: January 2026</p>
                        <div className="terms-scroll pe-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <h5>1. Booking Confirmation</h5>
                            <p>Your booking is confirmed only after successful payment and host approval.</p>
                            <h5>2. Token Amount Policy</h5>
                            <p>A token amount may be charged to reserve the property. This amount is adjusted in the final bill.</p>
                            <h5>3. Guest & Room Policy</h5>
                            <p>Base price is per room. The max number of guests allowed per room is {listing.guestsPerRoom || 2}.</p>
                            <h5>4. Pets & Animals</h5>
                            <p>Pets are allowed only if declared during booking and may incur a cleaning or service fee.</p>
                            <h5>5. Cancellation Policy</h5>
                            <p>Cancellation charges depend on the time of cancellation and the host’s policy.</p>
                            <h5>6. Refund Policy</h5>
                            <p>Refunds (if applicable) will be processed within 5–7 working days.</p>
                            <h5>7. Property Usage</h5>
                            <p>Guests must respect the property, neighborhood, and house rules.</p>
                            <h5>8. Platform Responsibility</h5>
                            <p>Stayerd is a booking platform and not responsible for host behavior or property conditions.</p>
                            <div className="mt-3 pt-3 border-top">
                                <Link to="/terms" target="_blank" className="btn btn-outline-dark btn-sm w-100">Read Full Terms & Conditions</Link>
                            </div>
                        </div>
                        <button className="btn btn-dark w-100 mt-4 py-2 rounded-3" onClick={() => { setAcceptedTerms(true); setShowTerms(false); }}>
                            I Understand & Agree
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingNew;
