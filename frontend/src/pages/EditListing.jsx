import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../config/axios';
import './EditListing.css';

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

const categories = [
    { value: 'trending', label: '🔥 Trending' },
    { value: 'rooms', label: '🛏 Rooms' },
    { value: 'iconic', label: '🏙 Iconic Cities' },
    { value: 'mountain', label: '🏔 Mountain' },
    { value: 'castles', label: '🏰 Castles' },
    { value: 'pools', label: '🏊 Amazing Pools' },
    { value: 'camping', label: '🏕 Camping' },
    { value: 'farms', label: '🚜 Farms' },
    { value: 'arctic', label: '❄ Arctic' },
    { value: 'domes', label: '🧊 Domes' },
    { value: 'boats', label: '🚤 Boats' },
    { value: 'forest', label: '🌲 Forest' },
    { value: 'lakefront', label: '🌊 Lakefront' },
    { value: 'beach', label: '🏖 Beach' },
    { value: 'urban', label: '🏙 Urban' },
    { value: 'countryside', label: '🏡 Countryside' }
];

const EditListing = ({ currUser, showFlash }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: '',
        country: '',
        location: '',
        amenities: [],
        maxGuests: 5,
        maxAdults: 5,
        maxChildren: 5,
        freeGuests: 3,
        petsAllowed: false,
        petChargePerNight: 300,
        extraGuestChargePerNight: 500
    });
    const [validated, setValidated] = useState(false);
    const [mainImage, setMainImage] = useState(null);
    const [additionalImages, setAdditionalImages] = useState([]);
    const [previewImage, setPreviewImage] = useState('');

    useEffect(() => {
        const fetchListing = async () => {
            try {
                const res = await axios.get(`/listings/${id}`);
                const listing = res.data.listing;

                // Initialize form with existing data
                setFormData({
                    title: listing.title || '',
                    description: listing.description || '',
                    price: listing.price || '',
                    category: listing.category || '',
                    country: listing.country || '',
                    location: listing.location || '',
                    amenities: listing.amenities || [],
                    maxGuests: listing.maxGuests || 5,
                    maxAdults: listing.maxAdults || 5,
                    maxChildren: listing.maxChildren || 5,
                    freeGuests: listing.freeGuests || 3,
                    petsAllowed: listing.petsAllowed || false,
                    petChargePerNight: listing.petChargePerNight || 300,
                    extraGuestChargePerNight: listing.extraGuestChargePerNight || 500
                });

                if (listing.image && listing.image.url) {
                    setPreviewImage(listing.image.url.replace('/upload', '/upload/w_250'));
                }

                setLoading(false);
            } catch (err) {
                console.error("Error fetching listing:", err);
                showFlash("Failed to load listing data", "error");
                navigate('/profile');
            }
        };
        fetchListing();
    }, [id, navigate, showFlash]);

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
            // Create a preview for the new image
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            if (e.target.files[0]) {
                reader.readAsDataURL(e.target.files[0]);
            }
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

        const data = new FormData();
        data.append('listing[title]', formData.title);
        data.append('listing[description]', formData.description);
        data.append('listing[price]', formData.price);
        data.append('listing[category]', formData.category);
        data.append('listing[country]', formData.country);
        data.append('listing[location]', formData.location);
        data.append('listing[maxGuests]', formData.maxGuests);
        data.append('listing[maxAdults]', formData.maxAdults);
        data.append('listing[maxChildren]', formData.maxChildren);
        data.append('listing[freeGuests]', formData.freeGuests);
        data.append('listing[petsAllowed]', formData.petsAllowed);
        data.append('listing[petChargePerNight]', formData.petChargePerNight);
        data.append('listing[extraGuestChargePerNight]', formData.extraGuestChargePerNight);

        formData.amenities.forEach(amenity => {
            data.append('listing[amenities]', amenity);
        });

        if (mainImage) {
            data.append('listing[image]', mainImage);
        }

        additionalImages.forEach(img => {
            data.append('listing[images]', img);
        });

        try {
            await axios.put(`/listings/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showFlash('Listing updated successfully!', 'success');
            navigate(`/listings/${id}`);
        } catch (err) {
            showFlash(err.response?.data?.message || 'Failed to update listing', 'error');
        }
    };

    if (loading) {
        return <div className="loading-container">Loading listing details...</div>;
    }

    return (
        <div className="listing-overlay">
            <div className="listing-g-card">
                <div className="listing-header">
                    <i className="fa-solid fa-pen-to-square listing-icon"></i>
                    <h2>Edit Listing</h2>
                </div>

                <form className="listing-form needs-validation" onSubmit={handleSubmit} noValidate>
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
                    </div>

                    {/* Main Image */}
                    <div className="lf-group">
                        <label>Main Image (Card Image)</label>
                        {previewImage && (
                            <div className="image-preview mb-2">
                                <img src={previewImage} alt="Preview" style={{ maxWidth: '200px', borderRadius: '8px' }} />
                                <p className="text-muted small">Current/Preview Image</p>
                            </div>
                        )}
                        <input
                            type="file"
                            name="mainImage"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        <small className="text-muted">Leave empty to keep current image</small>
                    </div>

                    {/* Additional Images */}
                    <div className="lf-group">
                        <label>Add More Images (Optional)</label>
                        <input
                            type="file"
                            name="additionalImages"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                        />
                        <small className="text-muted">New images will be added to the gallery</small>
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

                    {/* Price & Category */}
                    <div className="lf-row">
                        <div className="lf-group half">
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
                        </div>

                        <div className="lf-group half">
                            <label>Category</label>
                            <select name="category" required value={formData.category} onChange={handleChange}>
                                <option value="" disabled>Select category</option>
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
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
                        <small className="text-muted">Changing location will refresh AI travel suggestions</small>
                    </div>

                    {/* Guest & Pet Settings */}
                    <div className="lf-group">
                        <h4>Guest & Pet Settings</h4>

                        <div className="lf-row">
                            <div className="lf-group half">
                                <label>Maximum Total Guests</label>
                                <input
                                    type="number"
                                    name="maxGuests"
                                    min="1"
                                    max="20"
                                    required
                                    value={formData.maxGuests}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="lf-group half">
                                <label>Maximum Adults</label>
                                <input
                                    type="number"
                                    name="maxAdults"
                                    min="1"
                                    max="20"
                                    required
                                    value={formData.maxAdults}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="lf-row">
                            <div className="lf-group half">
                                <label>Maximum Children</label>
                                <input
                                    type="number"
                                    name="maxChildren"
                                    min="0"
                                    max="20"
                                    required
                                    value={formData.maxChildren}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="lf-group half">
                                <label>Free Guests</label>
                                <input
                                    type="number"
                                    name="freeGuests"
                                    min="0"
                                    max="20"
                                    required
                                    value={formData.freeGuests}
                                    onChange={handleChange}
                                />
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
                            </div>
                        </div>

                        <div className="lf-group">
                            <label>Extra Guest Charge per Night (₹)</label>
                            <input
                                type="number"
                                name="extraGuestChargePerNight"
                                min="0"
                                required
                                value={formData.extraGuestChargePerNight}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="form-actions mt-4">
                        <button type="submit" className="listing-submit-btn">UPDATE LISTING</button>
                        <button type="button" className="btn btn-outline-secondary w-100 mt-2" onClick={() => navigate(-1)}>CANCEL</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditListing;
