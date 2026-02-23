import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import { auth } from '../config/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import './Auth.css';

const ForgotPassword = () => {
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Update email if navigation state changes
    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email);
        }
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            // 1. Ask the backend about this user's account type
            const res = await axios.post('/forgot-password', { email });

            if (res.data.success) {
                if (res.data.isFirebase) {
                    // 2. If it's a Google/Firebase account, trigger the Google reset flow
                    try {
                        await sendPasswordResetEmail(auth, email);
                        setMessage({
                            text: 'A reset email has been sent via Google. Please check your inbox (including Spam).',
                            type: 'success'
                        });
                    } catch (firebaseErr) {
                        setMessage({ text: 'Error triggering Google reset. Please try again.', type: 'danger' });
                    }
                } else {
                    // 3. If it's a local account, the backend already sent the Nodemailer email
                    setMessage({ text: res.data.message, type: 'success' });
                }
            }
        } catch (err) {
            console.error("Forgot Password Error:", err);
            setMessage({
                text: err.response?.data?.message || 'Failed to initiate password reset. Please try again.',
                type: 'danger'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-overlay">
            <div className="login-card" style={{ maxWidth: '500px' }}>
                <div className="auth-form-section w-100">
                    <div className="login-header">
                        <i className="fa-solid fa-key" style={{ color: '#6C3CE0', fontSize: '2.5rem' }}></i>
                        <h2>Forgot Password?</h2>
                        <p className="text-muted" style={{ fontSize: '0.9rem' }}>Enter your email to receive a reset link</p>
                    </div>

                    {message.text && (
                        <div className={`alert alert-${message.type} text-center`} style={{ fontSize: '0.8rem', padding: '10px' }}>
                            {message.text}
                        </div>
                    )}

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Email Address</label>
                            <div className="input-wrapper">
                                <i className="fa-solid fa-envelope input-icon"></i>
                                <input
                                    type="email"
                                    placeholder="Enter your registered email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'SENDING...' : 'SEND RESET LINK'}
                        </button>
                    </form>

                    <Link to="/login" className="forgot-link mt-4">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
