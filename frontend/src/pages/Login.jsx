import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import axios from '../config/axios';
import { useProfileCache } from '../components/ProfileCacheContext';
import '../config/firebase';
import './Auth.css';

const Login = ({ onLogin, showFlash }) => {
    const { clearCache } = useProfileCache();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
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
                // If Firebase login fails, we proceed to try legacy login with the backend
                console.log("Firebase login failed, attempting legacy login...");
            }

            // Send request to backend (with token if available, or just email/pass if not)
            const payload = token ? { ...formData, token, idToken: token } : formData;
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

            console.log("🚀 Login Attempt Details:");
            console.log("- URL:", axios.defaults.baseURL + "/login");
            console.log("- Payload Keys:", Object.keys(payload));
            console.log("- Authorization Header:", config.headers?.Authorization ? "PRESENT" : "MISSING");

            const res = await axios.post('/login', payload, config);
            console.log("✅ Login Response received:", res.status);

            if (res.data.success) {
                clearCache(); // Force fresh fetch on profile page
                onLogin(res.data.user);
                showFlash('Logged in successfully!', 'success');
                navigate('/listings');
            }
        } catch (err) {
            let msg = err.response?.data?.message || 'Login failed. Please try again.';
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                msg = 'Invalid email or password.';
            } else if (err.code === 'auth/weak-password') {
                msg = 'Password should be at least 6 characters.';
            }
            setError(msg);
        }
    };

    return (
        <div className="container login-overlay">
            <div className="login-card">
                <div className="login-header">
                    <i className="fa-solid fa-house fa-bounce" style={{ color: '#005af5', fontSize: '3rem' }}></i>
                    <h2>Welcome Back</h2>
                </div>

                {error && (
                    <div className="alert alert-danger text-center">
                        {error}
                    </div>
                )}

                <form className="login-form needs-validation" onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            required
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            id="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button type="submit" className="login-btn btn-success">Login</button>

                    <Link to="/signup" className="forgot-link mt-3">
                        Don't have an account? Sign Up
                    </Link>
                </form>
            </div>
        </div>
    );
};

export default Login;
