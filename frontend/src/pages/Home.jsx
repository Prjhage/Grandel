import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import SkeletonCard from '../components/SkeletonCard';
import { useListingCache } from '../components/ListingCacheContext';
import './Home.css';

const Home = ({ currUser }) => {
    const [featuredListings, setFeaturedListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFAQ, setActiveFAQ] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Scroll Reveal Animation
        const handleScroll = () => {
            const reveals = document.querySelectorAll('.reveal');
            for (let i = 0; i < reveals.length; i++) {
                const windowHeight = window.innerHeight;
                const elementTop = reveals[i].getBoundingClientRect().top;
                const elementVisible = 150;

                if (elementTop < windowHeight - elementVisible) {
                    reveals[i].classList.add('active');
                } else {
                    reveals[i].classList.remove('active');
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        // Trigger once on load
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const { getCachedData, setCachedData } = useListingCache();

    useEffect(() => {
        const fetchListings = async () => {
            try {
                // Check cache first using a special 'featured' key
                const cached = getCachedData({ q: '__featured__' });
                if (cached) {
                    setFeaturedListings(cached.listings);
                    setLoading(false);
                    return;
                }

                const res = await axios.get('/api/featured');

                if (res.data && Array.isArray(res.data.featuredListings)) {
                    setFeaturedListings(res.data.featuredListings);
                    setCachedData(res.data.featuredListings, [], { q: '__featured__' });
                }
                setLoading(false);
            } catch (err) {
                console.error("Error fetching listings", err);
                setLoading(false);
            }
        };

        fetchListings();
    }, []);

    const toggleFAQ = (index) => {
        setActiveFAQ(activeFAQ === index ? null : index);
    };

    const handleSeedDB = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/seed-db');
            alert(res.data);
            window.location.reload();
        } catch (err) {
            console.error("Seeding error:", err);
            const msg = err.response?.data || err.message || "Unknown error";
            alert(`Seeding Failed: ${msg}`);
            setLoading(false);
        }
    };

    return (
        <div className="home-page page-fade">
            {/* Hero Section - Desktop Only */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-glass-card">
                        <div className="hero-text-center">
                            <h1>
                                Welcome to <span>Grandel</span>
                            </h1>
                            <p>Discover unique places to stay and create unforgettable travel experiences around the world</p>
                            <div className="hero-buttons">
                                <Link to="/listings" className="btn-primary-custom">Explore Listings</Link>
                                {!currUser ? (
                                    <Link to="/signup" className="btn-secondary-custom">Become a Host</Link>
                                ) : (
                                    <Link to="/listings/new" className="btn-secondary-custom">Create Listing</Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Precision Elements - Floating Cards */}
                    <div className="hero-floating-card card-1">
                        <div className="card-icon" style={{ background: 'rgba(255, 56, 92, 0.2)', padding: '10px', borderRadius: '12px' }}>
                            <i className="fas fa-star" style={{ color: '#ff385c' }}></i>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Top Rated</div>
                            <div style={{ fontWeight: '700' }}>Premium Stays</div>
                        </div>
                    </div>

                    <div className="hero-floating-card card-2">
                        <div className="card-icon" style={{ background: 'rgba(67, 206, 162, 0.2)', padding: '10px', borderRadius: '12px' }}>
                            <i className="fas fa-shield-check" style={{ color: '#43cea2' }}></i>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Verified</div>
                            <div style={{ fontWeight: '700' }}>Host Guarantee</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mobile Hero Section */}
            <section className="mobile-hero-section">
                <div className="house-wrapper">

                    <div className="house-roof"></div>
                    <div className="house-chimney"></div>

                    <div className="house-body">
                        <h1>Welcome to Grandel</h1>
                        <p>Discover unique places to stay and create unforgettable travel experiences</p>

                        <div className="hero-buttons">
                            <Link to="/listings" className="btn-primary-custom">Explore Listings</Link>

                            {!currUser ? (
                                <Link to="/signup" className="btn-secondary-custom">Become a Host</Link>
                            ) : (
                                <Link to="/listings/new" className="btn-secondary-custom">Create Listing</Link>
                            )}
                        </div>
                    </div>

                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="features-container">
                    <h2 className="section-title reveal">Why Choose Grandel?</h2>
                    <div className="features-grid">
                        <div className="feature-card reveal">
                            <div className="feature-icon">
                                <i className="fas fa-shield-alt"></i>
                            </div>
                            <h3>100% Safe & Secure</h3>
                            <p>Your safety is our priority. All transactions are secure and all hosts are verified.</p>
                        </div>
                        <div className="feature-card reveal">
                            <div className="feature-icon">
                                <i className="fas fa-map-location-dot"></i>
                            </div>
                            <h3>Unique Locations</h3>
                            <p>Choose from thousands of unique properties in different cities and countries.</p>
                        </div>
                        <div className="feature-card reveal">
                            <div className="feature-icon">
                                <i className="fas fa-headset"></i>
                            </div>
                            <h3>24/7 Support</h3>
                            <p>Our customer support team is always ready to help you with any issues.</p>
                        </div>
                        <div className="feature-card reveal">
                            <div className="feature-icon">
                                <i className="fas fa-star"></i>
                            </div>
                            <h3>Verified Reviews</h3>
                            <p>Read authentic reviews from real guests who have stayed at properties.</p>
                        </div>
                        <div className="feature-card reveal">
                            <div className="feature-icon">
                                <i className="fas fa-wallet"></i>
                            </div>
                            <h3>Best Prices</h3>
                            <p>Get competitive prices with no hidden charges. What you see is what you pay.</p>
                        </div>
                        <div className="feature-card reveal">
                            <div className="feature-icon">
                                <i className="fas fa-mobile-alt"></i>
                            </div>
                            <h3>Easy Booking</h3>
                            <p>Book your stay in just a few clicks using our user-friendly platform.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works">
                <div className="how-it-works-container">
                    <h2 className="section-title reveal">How It Works</h2>
                    <div className="steps-grid">
                        <div className="step-card reveal">
                            <div className="step-number">1</div>
                            <h3>Browse & Search</h3>
                            <p>Explore thousands of unique listings and filter by your preferences, price range, and amenities.</p>
                        </div>
                        <div className="step-card reveal">
                            <div className="step-number">2</div>
                            <h3>Select & Check</h3>
                            <p>View detailed photos, read reviews, check availability, and check the exact location on our map.</p>
                        </div>
                        <div className="step-card reveal">
                            <div className="step-number">3</div>
                            <h3>Book Your Stay</h3>
                            <p>Complete the booking process securely. Payment is easy and you'll get instant confirmation.</p>
                        </div>
                        <div className="step-card reveal">
                            <div className="step-number">4</div>
                            <h3>Enjoy & Review</h3>
                            <p>Have an amazing stay and share your experience by leaving a review to help other travelers.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Listings Section */}
            <section className="featured-listings-section">
                <div className="featured-listings-container">
                    <h2 className="section-title reveal">Featured Listings</h2>
                    <p style={{ textAlign: 'center', color: '#666', fontSize: '1.1rem', marginBottom: '30px' }}>
                        Discover some of our most popular and highly-rated properties
                    </p>

                    {loading ? (
                        <div className="featured-listings-grid">
                            {[...Array(3)].map((_, i) => (
                                <SkeletonCard key={`skeleton-${i}`} />
                            ))}
                        </div>
                    ) : featuredListings.length > 0 ? (
                        <div className="featured-listings-grid">
                            {[...featuredListings]
                                .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
                                .slice(0, 3)
                                .map((listing) => (
                                    <div key={listing._id} className="listing-card reveal" onClick={() => navigate(`/listings/${listing._id}`, { state: { listing } })}>
                                        <img src={listing.image?.url || '/images/fallback.jpg'} alt={listing.title} className="listing-image" />
                                        <div className="listing-content">
                                            <h3 className="listing-title">{listing.title}</h3>
                                            <div className="listing-location">
                                                <i className="fas fa-map-marker-alt"></i>
                                                <span>{listing.location}</span>
                                            </div>
                                            <div className="listing-rating">
                                                <i className="fas fa-star"></i>
                                                {listing.avgRating ? listing.avgRating.toFixed(1) : 'N/A'}
                                                {listing.reviews?.length > 0 && ` (${listing.reviews.length} reviews)`}
                                            </div>
                                            <div className="listing-price">₹{listing.price}/night</div>
                                            <button className="listing-button">View Details</button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="empty-listings">
                            <p>No featured listings found.</p>
                            <Link to="/listings" className="btn-primary-custom">Browse All Listings</Link>
                            <div className="mt-3">
                                <button onClick={handleSeedDB} className="btn btn-sm btn-outline-secondary">Seed Database (Populate Data)</button>
                            </div>
                        </div>
                    )}

                    <div style={{ textAlign: 'center' }}>
                        <Link to="/listings" className="view-all-button">View All Listings</Link>
                    </div>
                </div>
            </section>

            {/* Stats Section
            <section className="stats-section">
                <div className="stats-container">
                    <div className="stat-item reveal">
                        <h4>5,000+</h4>
                        <p>Properties Listed</p>
                    </div>
                    <div className="stat-item reveal">
                        <h4>50,000+</h4>
                        <p>Happy Guests</p>
                    </div>
                    <div className="stat-item reveal">
                        <h4>100+</h4>
                        <p>Cities Covered</p>
                    </div>
                    <div className="stat-item reveal">
                        <h4>4.8/5</h4>
                        <p>Average Rating</p>
                    </div>
                </div>
            </section> */}

            {/* Videos Section */}
            <section className="video-section" id="video-section">
                <div className="video-container">
                    <h2 className="section-title reveal">Watch How It Works</h2>
                    <div className="videos-grid">
                        <div className="video-wrapper reveal">
                            <div className="video-content">
                                <video className="video-iframe" controls muted loop>
                                    <source src="/videos/guest-video.mp4" type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                                <div className="video-info">
                                    <h3>How to Book a Stay</h3>
                                    <p>Learn how to easily find and book your perfect stay with our simple booking process.</p>
                                </div>
                            </div>
                        </div>

                        <div className="video-wrapper reveal">
                            <div className="video-content">
                                <video className="video-iframe" controls muted loop>
                                    <source src="/videos/host-video.mp4" type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                                <div className="video-info">
                                    <h3>How to Create a Listing</h3>
                                    <p>Step-by-step guide to listing your property and start earning money with Stayerd.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="faq-section">
                <div className="faq-container">
                    <h2 className="section-title reveal">Frequently Asked Questions</h2>

                    {[
                        { q: "How do I become a host on Grandel?", a: "Simply click on \"Become a Host\" in the navigation bar, fill in your property details, upload photos, and set your price. Once verified by our team, your listing will be live for guests to book." },
                        { q: "What is the 20% token payment?", a: "To confirm your booking and protect both guests and hosts, we require a 20% token payment via Razorpay. The remaining 80% is paid directly to the host upon arrival." },
                        { q: "How does host verification work?", a: "We verify all hosts through a multi-step process including identity checks and property verification to ensure a safe and premium experience for all our guests." },
                        { q: "Can I use the AI chatbot for recommendations?", a: "Yes! Our intelligent chatbot can help you find the perfect stay based on your preferences, budget, and desired location. Just click the chat icon to start." }
                    ].map((item, index) => (
                        <div className="faq-item reveal" key={index}>
                            <div className="faq-question" onClick={() => toggleFAQ(index)}>
                                <h3>{item.q}</h3>
                                <span className="faq-icon">
                                    <i className={`fas fa-chevron-down`} style={{ transform: activeFAQ === index ? 'rotate(180deg)' : 'rotate(0deg)' }}></i>
                                </span>
                            </div>
                            <div className={`faq-answer ${activeFAQ === index ? 'active' : ''}`}>
                                <p>{item.a}</p>
                            </div>
                        </div>
                    ))}

                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <h2 className="reveal">Ready to Get Grandel?</h2>
                <p className="reveal">Join thousands of travelers and hosts who trust Grandel for amazing travel experiences</p>
                <div className="hero-buttons reveal">
                    {!currUser ? (
                        <>
                            <Link to="/listings" className="btn-primary-custom">Browse Listings</Link>
                            <Link to="/signup" className="btn-secondary-custom">Create Account</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/listings" className="btn-primary-custom">Explore Listings</Link>
                            <Link to="/listings/new" className="btn-secondary-custom">Create a Listing</Link>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Home;
