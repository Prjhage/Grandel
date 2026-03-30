import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    getAuth,
    signInWithEmailAndPassword,
    signInWithPopup
} from 'firebase/auth';
import axios from '../config/axios';
import { useProfileCache } from '../components/ProfileCacheContext';
import { auth, googleProvider } from '../config/firebase';
import './Auth.css';

const Login = ({ onLogin, showFlash }) => {
    const { clearCache } = useProfileCache();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const token = await result.user.getIdToken();

            const res = await axios.post('/login', {
                idToken: token,
                token: token
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                clearCache();
                onLogin(res.data.user);
                showFlash('Logged in with Google!', 'success');
                navigate('/listings');
            } else {
                setError(res.data.message || 'Login refused by server.');
            }
        } catch (err) {
            if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
                // User closed the popup — not an error
            } else if (err.code === 'auth/unauthorized-domain') {
                setError('This domain is not authorized. Check Firebase console.');
            } else if (err.code === 'ERR_NETWORK') {
                setError('Cannot reach the server. Please try again.');
            } else {
                setError(err.response?.data?.message || err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

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
            console.error(err);
            let msg = err.response?.data?.message || 'Login failed. Please check your connection.';
            if (err.code === 'ECONNABORTED') {
                msg = 'TIMEOUT: Server is taking too long to respond. Try again in a few seconds.';
            } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || (err.response && err.response.status === 401)) {
                msg = 'Invalid email or password.';
            } else if (err.code === 'ERR_NETWORK') {
                msg = 'Cannot reach the server. It might be waking up, please try again in a few seconds.';
            }
            setError(msg);
        } finally {
            setLoading(false);
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

                    {error && (
                        <div className="alert alert-danger text-center" style={{ fontSize: '0.8rem', padding: '8px' }}>
                            {error}
                        </div>
                    )}

                    <form className="login-form needs-validation" onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Username / Email</label>
                            <div className="input-wrapper">
                                <i className="fa-solid fa-user input-icon"></i>
                                <input
                                    type="text"
                                    name="email"
                                    placeholder="Enter your username or email"
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

                        {/* <div className="text-end mb-3">
                            <Link
                                to="/forgot-password"
                                state={{ email: formData.email?.includes('@') ? formData.email : '' }}
                                title="Click here to reset your password"
                                className="forgot-link"
                                style={{ fontSize: '0.8rem' }}
                            >
                                Forgot Password?
                            </Link>
                        </div> */}

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'LOGGING IN...' : 'LOGIN'}
                        </button>

                        <div className="social-login-separator mt-4 mb-3">
                            <span>OR</span>
                        </div>

                        <button
                            type="button"
                            className="btn btn-outline-dark w-100 d-flex align-items-center justify-content-center"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            style={{ borderRadius: '10px', padding: '10px', fontSize: '0.9rem', fontWeight: '500' }}
                        >
                            {loading ? (
                                <>
                                    <i className="fa-solid fa-circle-notch fa-spin me-2"></i>
                                    LOGGING IN...
                                </>
                            ) : (
                                <>
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px', marginRight: '10px' }} />
                                    Login with Google
                                </>
                            )}
                        </button>
                    </form>

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
            </div >
        </div >
    );
};

export default Login;


