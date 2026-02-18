import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../config/axios';
import './NewListing.css';

const amenitiesList = [
    'City skyline view',
    'Garden view',
    'Lake access',
    'Kitchen',
    'Wifi',
    'Dedicated workspace',
    'Free parking',
    'Pool',
    'TV',
    'Lift'
];

const compressImage = (file) => {
    return new Promise((resolve) => {
        if (!file || !file.type.startsWith('image/')) {
            resolve(file);
            return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 1200;
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
                } else {
                    if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                ctx.canvas.toBlob((blob) => {
                    const newFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
                    resolve(newFile);
                }, 'image/jpeg', 0.7);
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
};

const NewListing = ({ currUser, showFlash }) => {
    const navigate = useNavigate();
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        country: '',
        location: '',
        amenities: [],
        petsAllowed: false,
        petChargePerNight: 300,
        discount: 0,
        numRooms: 1,
        guestsPerRoom: 2,
        acceptHostTerms: false
    });
    const [validated, setValidated] = useState(false);
    const [mainImage, setMainImage] = useState(null);
    const [additionalImages, setAdditionalImages] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox' && name === 'amenities') {
            const amenity = value;
            setFormData(prev => ({
                ...prev,
                amenities: checked
                    ? [...prev.amenities, amenity]
                    : prev.amenities.filter(a => a !== amenity)
            }));
        } else if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleImageChange = (e) => {
        if (e.target.name === 'mainImage') {
            setMainImage(e.target.files[0]);
        } else {
            setAdditionalImages(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e) => {
        const form = e.currentTarget;
        e.preventDefault();

        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        setLoading(true);

        const data = new FormData();
        data.append('listing[title]', formData.title);
        data.append('listing[description]', formData.description);
        data.append('listing[price]', formData.price);
        data.append('listing[country]', formData.country);
        data.append('listing[location]', formData.location);
        data.append('listing[petsAllowed]', formData.petsAllowed);
        data.append('listing[petChargePerNight]', formData.petChargePerNight);
        data.append('listing[numRooms]', formData.numRooms);
        data.append('listing[guestsPerRoom]', formData.guestsPerRoom);
        data.append('listing[discount]', formData.discount);
        data.append('listing[acceptHostTerms]', formData.acceptHostTerms);

        formData.amenities.forEach(amenity => {
            data.append('listing[amenities]', amenity);
        });

        // Compress images before upload
        if (mainImage) {
            const compressedMain = await compressImage(mainImage);
            data.append('listing[image]', compressedMain);
        }

        if (additionalImages.length > 0) {
            const compressedAdditional = await Promise.all(additionalImages.map(img => compressImage(img)));
            compressedAdditional.forEach(img => {
                data.append('listing[images]', img);
            });
        }

        try {
            const res = await axios.post('/listings', data);
            showFlash('Listing created successfully!', 'success');
            navigate(`/listings/${res.data.listing._id}`);
        } catch (err) {
            setLoading(false);
            showFlash(err.response?.data?.message || 'Failed to create listing', 'error');
        }
    };

    const handleAcceptTerms = () => {
        setFormData(prev => ({ ...prev, acceptHostTerms: true }));
        setShowTermsModal(false);
    };

    return (
        <div className="container listing-overlay">
            <div className="listing-g-card">
                <div className="listing-header">
                    <i className="fa-solid fa-house listing-icon"></i>
                    <h2>Add Listing</h2>
                </div>

                <form className={`listing-form needs-validation ${validated ? 'was-validated' : ''}`} onSubmit={handleSubmit} noValidate>
                    {/* Title */}
                    <div className="lf-group">
                        <label>Title</label>
                        <input
                            type="text"
                            name="title"
                            placeholder="Title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                        />
                        <div className="invalid-feedback">Please enter a valid title.</div>
                    </div>

                    {/* Description */}
                    <div className="lf-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            rows="3"
                            required
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                        <div className="invalid-feedback">Please enter a brief description.</div>
                    </div>

                    {/* Main Image */}
                    <div className="lf-group">
                        <label>Main Image (Card Image)</label>
                        <input
                            type="file"
                            name="mainImage"
                            accept="image/*"
                            required
                            onChange={handleImageChange}
                        />
                        <div className="invalid-feedback">Main image is required.</div>
                    </div>

                    {/* Additional Images */}
                    <div className="lf-group">
                        <label>Additional Images (Optional)</label>
                        <input
                            type="file"
                            name="additionalImages"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                        />
                        <small className="text-muted">You can upload up to 5 images</small>
                    </div>

                    {/* Amenities */}
                    <div className="lf-group">
                        <label>What this place offers</label>
                        <div className="amenities-box">
                            {amenitiesList.map(amenity => (
                                <label key={amenity} className="amenity-item">
                                    <input
                                        type="checkbox"
                                        name="amenities"
                                        value={amenity}
                                        checked={formData.amenities.includes(amenity)}
                                        onChange={handleChange}
                                    />
                                    {amenity}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Price */}
                    <div className="lf-row">
                        <div className="lf-group">
                            <label>Price per night</label>
                            <input
                                type="number"
                                name="price"
                                placeholder="Price"
                                min="1"
                                required
                                value={formData.price}
                                onChange={handleChange}
                            />
                            <div className="invalid-feedback">Price should be at least 1.</div>
                        </div>
                    </div>

                    {/* Country */}
                    <div className="lf-group">
                        <label>Country</label>
                        <input
                            type="text"
                            name="country"
                            placeholder="Country"
                            required
                            value={formData.country}
                            onChange={handleChange}
                        />
                        <div className="invalid-feedback">Country name is required.</div>
                    </div>

                    {/* Location */}
                    <div className="lf-group">
                        <label>Location</label>
                        <input
                            type="text"
                            name="location"
                            placeholder="Location"
                            required
                            value={formData.location}
                            onChange={handleChange}
                        />
                        <div className="invalid-feedback">Location is required.</div>
                    </div>

                    {/* Room & Pet Settings */}
                    <div className="lf-group">
                        <h4>Room & Pet Settings</h4>
                        <p className="text-muted">Configure room count and pet policies for your listing</p>

                        <div className="lf-row">
                            <div className="lf-group half">
                                <label>Number of Rooms</label>
                                <input
                                    type="number"
                                    name="numRooms"
                                    min="1"
                                    required
                                    value={formData.numRooms}
                                    onChange={handleChange}
                                />
                                <div className="invalid-feedback">Min 1.</div>
                            </div>

                            <div className="lf-group half">
                                <label>Max Guests per Room</label>
                                <input
                                    type="number"
                                    name="guestsPerRoom"
                                    min="1"
                                    required
                                    value={formData.guestsPerRoom}
                                    onChange={handleChange}
                                />
                                <div className="invalid-feedback">Min 1.</div>
                                <small className="text-muted">Max people allowed in one room</small>
                            </div>
                        </div>

                        <div className="lf-row">
                            <div className="lf-group half">
                                <label>Pets Allowed</label>
                                <select
                                    name="petsAllowed"
                                    required
                                    value={formData.petsAllowed}
                                    onChange={(e) => setFormData(prev => ({ ...prev, petsAllowed: e.target.value === 'true' }))}
                                >
                                    <option value="false">No</option>
                                    <option value="true">Yes</option>
                                </select>
                            </div>

                            <div className="lf-group half">
                                <label>Pet Charge per Night (₹)</label>
                                <input
                                    type="number"
                                    name="petChargePerNight"
                                    min="0"
                                    required
                                    value={formData.petChargePerNight}
                                    onChange={handleChange}
                                />
                                <div className="invalid-feedback">Should be at least 0.</div>
                            </div>
                        </div>

                        <div className="lf-row">
                            <div className="lf-group">
                                <label>Early Bird Discount (%)</label>
                                <input
                                    type="number"
                                    name="discount"
                                    min="0"
                                    max="100"
                                    value={formData.discount}
                                    onChange={handleChange}
                                />
                                <small className="text-muted">Set 0 for no discount. Guests will see this as "Early Bird Discount" on booking.</small>
                            </div>
                        </div>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="form-check mt-4">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="acceptTerms"
                            name="acceptHostTerms"
                            checked={formData.acceptHostTerms}
                            onChange={handleChange}
                            required
                        />
                        <label className="form-check-label" htmlFor="acceptTerms">
                            I agree to the{' '}
                            <a href="#" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="terms-link">
                                Host Terms & Conditions
                            </a>
                        </label>
                        <div className="invalid-feedback">You must accept the terms before posting.</div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className={`listing-submit-btn ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <i className="fa-solid fa-circle-notch fa-spin"></i>
                                <span>CREATING...</span>
                            </>
                        ) : (
                            'ADD LISTING'
                        )}
                    </button>
                </form>
            </div>

            {/* Terms Modal */}
            {showTermsModal && (
                <div className="terms-modal active" onClick={() => setShowTermsModal(false)}>
                    <div className="terms-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-terms" onClick={() => setShowTermsModal(false)}>&times;</button>
                        <h3>Host Terms & Conditions</h3>
                        <p className="updated">Last updated: January 2026</p>

                        <div className="terms-scroll">
                            <h5>1. Hosting Eligibility</h5>
                            <p>You must be legally authorized to host the property listed on Grandel.</p>

                            <h5>2. Accurate Listings</h5>
                            <p>All listing details, images, and amenities must be accurate and truthful.</p>

                            <h5>3. Pricing & Availability</h5>
                            <p>Hosts are responsible for maintaining accurate pricing and availability.</p>

                            <h5>4. Token & Payment Policy</h5>
                            <p>Token amounts are adjusted in the final settlement. No offline payments allowed.</p>

                            <h5>5. Cancellations</h5>
                            <p>Host cancellations may result in penalties or account suspension.</p>

                            <h5>6. Refund Policy</h5>
                            <p>Refund eligibility depends on cancellation timing and booking policy.</p>

                            <h5>7. Safety & Cleanliness</h5>
                            <p>Hosts must provide a safe, clean, and hygienic environment.</p>

                            <h5>8. Platform Rights</h5>
                            <p>Grandel reserves the right to remove listings violating policies.</p>
                            <div className="mt-3 pt-3 border-top">
                                <Link to="/terms" target="_blank" className="btn btn-outline-dark btn-sm w-100">Read Full Terms & Conditions</Link>
                            </div>
                        </div>

                        <button className="btn btn-dark mt-3" onClick={handleAcceptTerms}>
                            I Understand & Agree
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewListing;
