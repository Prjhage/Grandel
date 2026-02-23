import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        // Fallback for when getRedirectResult returns null but the user is actually signed in
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && (window.location.search.includes('apiKey=') || window.location.hash.includes('apiKey='))) {
                console.log("onAuthStateChanged triggered with user after redirect:", user.email);
                if (!loading) { // Avoid double-processing if result already caught it
                    setLoading(true);
                    try {
                        const token = await user.getIdToken();
                        console.log("Processing backend login from onAuthStateChanged...");
                        const res = await axios.post('/login', {
                            idToken: token,
                            token: token
                        }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        if (res.data.success) {
                            console.log("Backend login SUCCESSFUL from fallback");
                            clearCache();
                            onLogin(res.data.user);
                            showFlash('Logged in with Google!', 'success');
                            navigate('/listings');
                        }
                    } catch (err) {
                        console.error("Fallback Login Error:", err);
                    } finally {
                        setLoading(false);
                    }
                }
            }
        });
        return () => unsubscribe();
    }, [auth, navigate, onLogin, clearCache, showFlash, loading]);

    useEffect(() => {
        const handleRedirectResult = async () => {
            // Check if we just came back from a redirect
            // Firebase adds specific parameters to the URL after a redirect
            const isRedirectBack = window.location.search.includes('apiKey=') || window.location.hash.includes('apiKey=');

            if (isRedirectBack) {
                console.log("Detected possible redirect back from Google. Checking result...");
                setLoading(true);
            } else {
                console.log("No redirect parameters detected in URL.");
            }

            try {
                const result = await getRedirectResult(auth);
                if (result) {
                    console.log("Redirect result SUCCESSFULLY captured:", result.user.email);
                    setLoading(true); // Ensure loading is true while talking to backend
                    const user = result.user;
                    const token = await user.getIdToken();

                    const res = await axios.post('/login', {
                        idToken: token,
                        token: token
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    }).catch(err => {
                        console.error("Backend unreachable during redirect:", err);
                        const errorMsg = err.response?.data?.message || (err.code === 'ERR_NETWORK' ? "Cannot reach backend. Check VITE_API_BASE_URL." : err.message);
                        setError("BACKEND ERROR: " + errorMsg);
                        throw err;
                    });

                    if (res.data.success) {
                        console.log("Backend login SUCCESSFUL after redirect");
                        clearCache();
                        onLogin(res.data.user);
                        showFlash('Logged in with Google!', 'success');
                        navigate('/listings');
                    } else {
                        console.error("Backend login FAILED after redirect:", res.data);
                        setError(res.data.message || "Failed to finalize login.");
                    }
                } else if (isRedirectBack) {
                    console.warn("URL had redirect params but getRedirectResult returned NULL.");
                    setError("LOGIN ERROR: The browser blocked the redirect response. Try disabling 'Prevent Cross-Site Tracking' in Safari settings or use Chrome.");
                } else {
                    console.log("No redirect result found (normal mount).");
                }
            } catch (err) {
                console.error("CRITICAL Google Redirect Login Error:", err.code, err.message);
                let msg = err.message;
                if (err.code === 'auth/unauthorized-domain') {
                    msg = "CONFIG ERROR: This domain is not authorized in Firebase. Add " + window.location.hostname + " to 'Authorized Domains'.";
                } else if (err.code === 'auth/network-request-failed') {
                    msg = "NETWORK ERROR: Cannot reach Firebase. Check your internet connection.";
                }
                setError(msg);
            } finally {
                setLoading(false);
            }
        };

        // UI-level check for backend configuration
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!import.meta.env.VITE_API_BASE_URL && !isLocal) {
            setError("CONFIG ERROR: VITE_API_BASE_URL is missing in environment variables. Backend requests will fail.");
        }

        handleRedirectResult();

        // 🚀 Proactive Wake-up: Ping backend to wake up cold instance
        const wakeUpBackend = async () => {
            try {
                await axios.get('/current-user');
                console.log("Backend pinged successfully.");
            } catch (err) {
                console.warn("Backend wake-up ping failed:", err.message);
            }
        };
        wakeUpBackend();
    }, [auth, navigate, onLogin, clearCache, showFlash]);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            if (isMobile) {
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
            </div>
        </div>
    );
};

export default Login;


