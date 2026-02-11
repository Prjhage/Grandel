import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import axios from '../config/axios';
import { useProfileCache } from '../components/ProfileCacheContext';
import '../config/firebase';
import './Auth.css';

const Login = ({ onLogin, showFlash }) => {
    const { clearCache } = useProfileCache();
    const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'mobile'
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        phone: '',
        otp: ''
    });
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post('/send-otp', { phone: formData.phone });
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

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post('/verify-otp', { phone: formData.phone, code: formData.otp });
            if (res.data.success) {
                if (res.data.user) {
                    clearCache();
                    onLogin(res.data.user);
                    showFlash('Logged in successfully!', 'success');
                    navigate('/listings');
                } else {
                    showFlash(res.data.message || 'Verification successful.', 'info');
                }
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const auth = getAuth();
            let token = null;

            try {
                const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                token = await userCredential.user.getIdToken();
            } catch (err) {
                console.log("Firebase login failed, attempting legacy login...");
            }

            const payload = token ? { ...formData, token, idToken: token } : formData;
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

            const res = await axios.post('/login', payload, config);

            if (res.data.success) {
                clearCache();
                onLogin(res.data.user);
                showFlash('Logged in successfully!', 'success');
                navigate('/listings');
            }
        } catch (err) {
            let msg = err.response?.data?.message || 'Login failed. Please try again.';
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                msg = 'Invalid email or password.';
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
                        <h2>Welcome Back!</h2>
                    </div>

                    <div className="login-tabs mb-3 d-flex justify-content-center">
                        <button
                            className={`btn btn-sm ${loginMethod === 'email' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
                            onClick={() => { setLoginMethod('email'); setIsOtpSent(false); }}
                            style={{ borderRadius: '20px', padding: '5px 15px' }}
                        >
                            Username
                        </button>
                        <button
                            className={`btn btn-sm ${loginMethod === 'mobile' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setLoginMethod('mobile')}
                            style={{ borderRadius: '20px', padding: '5px 15px' }}
                        >
                            Mobile (OTP)
                        </button>
                    </div>

                    {error && (
                        <div className="alert alert-danger text-center" style={{ fontSize: '0.8rem', padding: '8px' }}>
                            {error}
                        </div>
                    )}

                    {loginMethod === 'email' ? (
                        <form className="login-form needs-validation" onSubmit={handleSubmit} noValidate>
                            <div className="form-group">
                                <label htmlFor="email" className="form-label">Username</label>
                                <div className="input-wrapper">
                                    <i className="fa-solid fa-user input-icon"></i>
                                    <input
                                        type="text"
                                        name="email"
                                        placeholder="Enter your username"
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
                                        placeholder="Enter your password"
                                        id="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="login-btn">LOGIN</button>
                        </form>
                    ) : (
                        <form className="login-form" onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp}>
                            {!isOtpSent ? (
                                <div className="form-group">
                                    <label htmlFor="phone" className="form-label">Mobile Number</label>
                                    <div className="input-wrapper">
                                        <i className="fa-solid fa-phone input-icon"></i>
                                        <input
                                            type="tel"
                                            name="phone"
                                            placeholder="+91 9876543210"
                                            required
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <button type="submit" className="login-btn" disabled={loading}>
                                        {loading ? 'Sending...' : 'Send OTP'}
                                    </button>
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label htmlFor="otp" className="form-label">Enter 6-digit OTP</label>
                                    <div className="input-wrapper">
                                        <i className="fa-solid fa-key input-icon"></i>
                                        <input
                                            type="text"
                                            name="otp"
                                            placeholder="000000"
                                            required
                                            id="otp"
                                            maxLength="6"
                                            value={formData.otp}
                                            onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                        />
                                    </div>
                                    <button type="submit" className="login-btn" disabled={loading}>
                                        {loading ? 'Verifying...' : 'Verify & Login'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-link btn-sm w-100 mt-2"
                                        onClick={() => setIsOtpSent(false)}
                                        style={{ color: '#6C3CE0', fontSize: '0.8rem', textDecoration: 'none' }}
                                    >
                                        Change Number
                                    </button>
                                </div>
                            )}
                        </form>
                    )}

                    <Link to="/signup" className="forgot-link mt-3">
                        Don't have an account? Sign Up
                    </Link>
                </div>

                {/* Right Side - Welcome Section with Cloud Waves */}
                <div className="auth-welcome-section">
                    <div className="welcome-content">
                        <h2>Hello, Friend!</h2>
                        <p>Enter your credentials and start your journey with us</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;


