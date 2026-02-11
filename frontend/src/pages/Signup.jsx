import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword } from 'firebase/auth';
import axios from '../config/axios';
import { useProfileCache } from '../components/ProfileCacheContext';
import '../config/firebase';
import './Auth.css';

const Signup = ({ onLogin, showFlash }) => {
    const { clearCache } = useProfileCache();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        phone: '',
        otp: ''
    });
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleSendOtp = async () => {
        if (!formData.phone || formData.phone.length < 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const cleanPhone = formData.phone.startsWith('+91') ? formData.phone : `+91${formData.phone}`;
            const res = await axios.post('/send-otp', { phone: cleanPhone });
            if (res.data.success) {
                setIsOtpSent(true);
                showFlash('OTP sent to your mobile!', 'success');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setError('');
        setLoading(true);
        try {
            const cleanPhone = formData.phone.startsWith('+91') ? formData.phone : `+91${formData.phone}`;
            const res = await axios.post('/verify-otp', { phone: cleanPhone, code: formData.otp });
            if (res.data.success) {
                setIsVerified(true);
                showFlash('Mobile number verified!', 'success');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isVerified) {
            setError('Please verify your mobile number first.');
            return;
        }
        setError('');
        let userCredential;
        let isNewFirebaseUser = false;

        try {
            const auth = getAuth();

            try {
                userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                isNewFirebaseUser = true;
            } catch (firebaseErr) {
                if (firebaseErr.code === 'auth/email-already-in-use') {

                    try {
                        userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                        isNewFirebaseUser = false;
                    } catch (loginErr) {
                        throw firebaseErr;
                    }
                } else {
                    throw firebaseErr;
                }
            }

            const token = await userCredential.user.getIdToken();

            // Ensure phone number format matches what was verified
            const cleanPhone = formData.phone.startsWith('+91') ? formData.phone : `+91${formData.phone}`;

            const res = await axios.post('/signup', {
                ...formData,
                phone: cleanPhone,  // Send the +91 prefixed phone
                token,
                idToken: token
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                clearCache(); // Force fresh fetch on profile page
                onLogin(res.data.user);
                showFlash('Account created successfully!', 'success');
                navigate('/listings');
            }
        } catch (err) {
            console.error(err);


            if (isNewFirebaseUser && userCredential && userCredential.user) {
                await deleteUser(userCredential.user).catch(e => console.error("Error cleaning up user:", e));
            }

            let msg = 'Signup failed. Please try again.';
            if (err.response?.data?.message) {
                msg = err.response.data.message;
            } else if (err.message) {
                msg = err.message;
            }

            if (err.code === 'auth/email-already-in-use') {
                msg = 'Email is already registered.';
            } else if (err.code === 'auth/weak-password') {
                msg = 'Password should be at least 6 characters.';
            }
            setError(msg);
        }
    };

    return (
        <div className="login-overlay">
            <div className="login-card">
                {/* Left Side - Form Section */}
                <div className="auth-form-section">
                    <div className="login-header">
                        <i className="fa-solid fa-house" style={{ color: '#6C3CE0', fontSize: '2.5rem' }}></i>
                        <h2>Hello, Friend!</h2>
                    </div>

                    {error && (
                        <div className="alert alert-danger text-center">
                            {error}
                        </div>
                    )}

                    <form className="login-form needs-validation" onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label htmlFor="username" className="form-label">Username</label>
                            <div className="input-wrapper">
                                <i className="fa-solid fa-user input-icon"></i>
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Choose a username"
                                    required
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Email</label>
                            <div className="input-wrapper">
                                <i className="fa-solid fa-envelope input-icon"></i>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="example@gmail.com"
                                    required
                                    id="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">Password</label>
                            <div className="input-wrapper">
                                <i className="fa-solid fa-lock input-icon"></i>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Create a password"
                                    id="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone" className="form-label">Mobile Number</label>
                            <div className="input-with-action">
                                <div className="input-wrapper" style={{ flex: 1 }}>
                                    <i className="fa-solid fa-phone input-icon"></i>
                                    <input
                                        type="tel"
                                        name="phone"
                                        id="phone"
                                        placeholder="10-digit mobile number"
                                        required
                                        disabled={isVerified}
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                {!isVerified && (
                                    <button
                                        type="button"
                                        className="btn btn-sm action-btn"
                                        onClick={handleSendOtp}
                                        disabled={loading || isOtpSent}
                                    >
                                        {isOtpSent ? 'Resend' : 'Send'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {isOtpSent && !isVerified && (
                            <div className="form-group">
                                <label htmlFor="otp" className="form-label">Verification Code</label>
                                <div className="input-with-action">
                                    <div className="input-wrapper" style={{ flex: 1 }}>
                                        <i className="fa-solid fa-key input-icon"></i>
                                        <input
                                            type="text"
                                            name="otp"
                                            id="otp"
                                            placeholder="Enter 6-digit OTP"
                                            maxLength="6"
                                            value={formData.otp}
                                            onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-sm action-btn"
                                        onClick={handleVerifyOtp}
                                        disabled={loading}
                                    >
                                        {loading ? '...' : 'Verify'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {isVerified && (
                            <div className="text-success small mb-3">
                                <i className="fa-solid fa-circle-check"></i> Phone Verified
                            </div>
                        )}

                        <div className="terms-checkbox">
                            <input type="checkbox" id="terms" required />
                            <label htmlFor="terms" style={{ margin: 0 }}>
                                I read and agree to <Link to="/terms" target="_blank">Terms & Conditions</Link>
                            </label>
                        </div>

                        <button type="submit" className="login-btn" disabled={!isVerified}>CREATE ACCOUNT</button>

                        <Link to="/login" className="forgot-link mt-3">
                            Already have an account? Sign in
                        </Link>
                    </form>
                </div>

                {/* Right Side - Welcome Section with Cloud Waves */}
                <div className="auth-welcome-section">
                    <div className="welcome-content">
                        <h2>Glade to see you!</h2>
                        <p>Welcome! Please fill the blanks to sign up your account</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;

