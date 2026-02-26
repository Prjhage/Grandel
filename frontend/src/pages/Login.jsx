import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    getAuth,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    onAuthStateChanged
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
    const isProcessing = useRef(false);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        const handleAuthResult = async () => {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isRedirectBack = window.location.search.includes('apiKey=') || window.location.hash.includes('apiKey=');
            const isPending = sessionStorage.getItem('pending_google_auth') === 'true';

            // Only show loading if we are actually expecting a redirect result
            if (isRedirectBack || (isMobile && isPending)) {
                setLoading(true);
            }

            try {
                // Always try to catch a redirect result if it exists
                let result = await getRedirectResult(auth);

                if (result) {
                    await processGoogleUser(result.user);
                    sessionStorage.removeItem('pending_google_auth');
                }
            } catch (err) {
                sessionStorage.removeItem('pending_google_auth');
                handleAuthError(err);
            } finally {
                // If we didn't find a result and weren't clearly redirecting, stop loading
                if (!isRedirectBack && !isPending) setLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            const isPending = sessionStorage.getItem('pending_google_auth') === 'true';
            if (user && isPending) {
                console.log("onAuthStateChanged: Catching user for pending login.");
                // Aggressively try to process if user is authenticated in Firebase
                await processGoogleUser(user);
                sessionStorage.removeItem('pending_google_auth');
            }
        });

        // Removed: let isProcessing = false; // This was a local variable, now using useRef

        const processGoogleUser = async (firebaseUser) => {
            if (isProcessing.current) return; // Use useRef
            isProcessing.current = true; // Use useRef
            console.log("🚀 Starting backend handshake for user:", firebaseUser.email);
            setLoading(true);
            try {
                const token = await firebaseUser.getIdToken();
                console.log("🔑 ID Token retrieved successfully.");
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                if (isMobile) {
                    // alert("Token retrieved, talking to backend...");
                }

                const res = await axios.post('/login', {
                    idToken: token,
                    token: token
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                console.log("📡 Backend response received:", res.status, res.data);

                if (res.data.success) {
                    clearCache();
                    onLogin(res.data.user);
                    showFlash('Logged in with Google!', 'success');
                    // Small delay to ensure state updates
                    setTimeout(() => navigate('/listings'), 100);
                } else {
                    console.error("❌ Backend login refused:", res.data.message);
                    setError(res.data.message || "Login refused by server.");
                    isProcessing.current = false; // Allow retry on failure
                }
            } catch (err) {
                isProcessing.current = false; // Reset on error
                const backendMsg = err.response?.data?.message || err.message;

                // Check if we got an HTML response (indicates 404/wrong URL)
                if (typeof err.response?.data === 'string' && err.response.data.includes('<!DOCTYPE html>')) {
                    setError("API ERROR: Backend returned HTML. Your API link might be wrong.");
                } else {
                    setError(backendMsg);
                }
            } finally {
                setLoading(false);
            }
        };

        const handleAuthError = (err) => {
            console.error("Google Auth Error:", err.code, err.message);
            let msg = err.message;
            if (err.code === 'auth/unauthorized-domain') {
                msg = "DOMAIN ERROR: This domain is not authorized in Firebase.";
            } else if (err.code === 'auth/popup-closed-by-user') {
                return; // User closed popup
            }
            setError(msg);
        };

        handleAuthResult();
        return () => unsubscribe();
    }, [auth, navigate, onLogin, clearCache, showFlash]);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            sessionStorage.setItem('pending_google_auth', 'true');

            if (isMobile) {
                console.log("📱 Mobile device detected. Starting Redirect...");
                await signInWithRedirect(auth, googleProvider);
            } else {
                const result = await signInWithPopup(auth, googleProvider);
                const user = result.user;
                const token = await user.getIdToken();

                const res = await axios.post('/login', {
                    idToken: token,
                    token: token
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(err => {
                    console.error("Backend unreachable during popup login:", err);
                    const errorMsg = err.response?.data?.message || (err.code === 'ERR_NETWORK' ? "Cannot reach backend. Check VITE_API_BASE_URL." : err.message);
                    setError("BACKEND ERROR: " + errorMsg);
                    throw err;
                });

                if (res.data.success) {
                    clearCache();
                    onLogin(res.data.user);
                    showFlash('Logged in with Google!', 'success');
                    navigate('/listings');
                }
            }
        } catch (err) {
            console.error("Google Login Error:", err);
            setError(err.response?.data?.message || err.message);
        } finally {
            if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                setLoading(false);
            }
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
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || (err.response && err.response.status === 401)) {
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

                        <div className="text-end mb-3">
                            <Link
                                to="/forgot-password"
                                state={{ email: formData.email?.includes('@') ? formData.email : '' }}
                                title="Click here to reset your password"
                                className="forgot-link"
                                style={{ fontSize: '0.8rem' }}
                            >
                                Forgot Password?
                            </Link>
                        </div>

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
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px', marginRight: '10px' }} />
                            Login with Google
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


