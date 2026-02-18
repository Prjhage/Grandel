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

const EditListing = ({ currUser, showFlash }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
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
        guestsPerRoom: 2
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
                    country: listing.country || '',
                    location: listing.location || '',
                    amenities: listing.amenities || [],
                    petsAllowed: listing.petsAllowed || false,
                    petChargePerNight: listing.petChargePerNight || 300,
                    discount: listing.discount || 0,
                    numRooms: listing.numRooms || 1,
                    guestsPerRoom: listing.guestsPerRoom || 2
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
        data.append('listing[country]', formData.country);
        data.append('listing[location]', formData.location);
        data.append('listing[petsAllowed]', formData.petsAllowed);
        data.append('listing[petChargePerNight]', formData.petChargePerNight);
        data.append('listing[numRooms]', formData.numRooms);
        data.append('listing[guestsPerRoom]', formData.guestsPerRoom);
        data.append('listing[discount]', formData.discount);

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

                    {/* Room & Pet Settings */}
                    <div className="lf-group">
                        <h4>Room & Pet Settings</h4>

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
