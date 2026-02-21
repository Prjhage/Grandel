import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    getAuth,
    createUserWithEmailAndPassword,
    deleteUser,
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

const Signup = ({ onLogin, showFlash }) => {
    const { clearCache } = useProfileCache();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && (window.location.search.includes('apiKey=') || window.location.hash.includes('apiKey='))) {
                console.log("onAuthStateChanged triggered with user after redirect (signup):", user.email);
                if (!loading) {
                    setLoading(true);
                    try {
                        const token = await user.getIdToken();
                        console.log("Processing backend signup from onAuthStateChanged...");
                        const res = await axios.post('/signup', {
                            username: user.displayName || user.email.split('@')[0],
                            email: user.email,
                            idToken: token
                        }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        if (res.data.success) {
                            console.log("Backend signup SUCCESSFUL from fallback");
                            clearCache();
                            onLogin(res.data.user);
                            showFlash('Signed up with Google successfully!', 'success');
                            navigate('/listings');
                        }
                    } catch (err) {
                        console.error("Fallback Signup Error:", err);
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
            const isRedirectBack = window.location.search.includes('apiKey=') || window.location.hash.includes('apiKey=');

            if (isRedirectBack) {
                console.log("Detected possible redirect back (signup). Checking result...");
                setLoading(true);
            }

            try {
                const result = await getRedirectResult(auth);
                if (result) {
                    console.log("Redirect result SUCCESSFULLY captured (signup):", result.user.email);
                    setLoading(true);
                    const user = result.user;
                    const token = await user.getIdToken();

                    const res = await axios.post('/signup', {
                        username: user.displayName || user.email.split('@')[0],
                        email: user.email,
                        idToken: token
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (res.data.success) {
                        console.log("Backend signup SUCCESSFUL after redirect");
                        clearCache();
                        onLogin(res.data.user);
                        showFlash('Signed up with Google successfully!', 'success');
                        navigate('/listings');
                    } else {
                        console.error("Backend signup FAILED after redirect:", res.data);
                        setError(res.data.message || "Failed to finalize signup.");
                    }
                } else if (isRedirectBack) {
                    console.warn("URL had redirect params but getRedirectResult returned NULL (signup).");
                    setError("SIGNUP ERROR: The browser blocked the redirect response. Try another browser or check 'Cross-Site Tracking' settings.");
                }
            } catch (err) {
                console.error("CRITICAL Google Redirect Signup Error:", err.code, err.message);
                let msg = err.message;
                if (err.code === 'auth/unauthorized-domain') {
                    msg = "CONFIG ERROR: This domain is not authorized in Firebase. Add " + window.location.hostname + " to 'Authorized Domains'.";
                }
                setError(msg);
            } finally {
                setLoading(false);
            }
        };

        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!import.meta.env.VITE_API_BASE_URL && !isLocal) {
            setError("CONFIG ERROR: VITE_API_BASE_URL is missing in environment variables.");
        }

        handleRedirectResult();
    }, [auth, navigate, onLogin, clearCache, showFlash]);

    const handleGoogleSignup = async () => {
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

                const res = await axios.post('/signup', {
                    username: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    idToken: token
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data.success) {
                    clearCache();
                    onLogin(res.data.user);
                    showFlash('Signed up with Google successfully!', 'success');
                    navigate('/listings');
                }
            }
        } catch (err) {
            console.error("Google Signup Error:", err);
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
        let userCredential;
        let isNewFirebaseUser = false;

        try {
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

            const res = await axios.post('/signup', {
                ...formData,
                idToken: token
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                clearCache();
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
                        <i className="fa-solid fa-house" style={{ color: '#6C3CE0', fontSize: '2rem' }}></i>
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

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                        </button>

                        <div className="social-login-separator mt-4 mb-3">
                            <span>OR</span>
                        </div>

                        <button
                            type="button"
                            className="btn btn-outline-dark w-100 d-flex align-items-center justify-content-center"
                            onClick={handleGoogleSignup}
                            disabled={loading}
                            style={{ borderRadius: '10px', padding: '10px', fontSize: '0.9rem', fontWeight: '500' }}
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px', marginRight: '10px' }} />
                            Sign up with Google
                        </button>

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

