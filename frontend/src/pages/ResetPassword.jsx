import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../config/axios';
import './Auth.css';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            return setMessage({ text: 'Passwords do not match.', type: 'danger' });
        }

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const res = await axios.post(`/reset-password/${token}`, { password: formData.password });
            if (res.data.success) {
                setMessage({ text: 'Password successfully reset! Redirecting to login...', type: 'success' });
                setTimeout(() => navigate('/login'), 3000);
            }
        } catch (err) {
            console.error("Reset Password Error:", err);
            setMessage({
                text: err.response?.data?.message || 'Failed to reset password. Link may be invalid or expired.',
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
                        <i className="fa-solid fa-lock-open" style={{ color: '#6C3CE0', fontSize: '2.5rem' }}></i>
                        <h2>Reset Password</h2>
                        <p className="text-muted" style={{ fontSize: '0.9rem' }}>Enter your new secure password</p>
                    </div>

                    {message.text && (
                        <div className={`alert alert-${message.type} text-center`} style={{ fontSize: '0.8rem', padding: '10px' }}>
                            {message.text}
                        </div>
                    )}

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <div className="input-wrapper">
                                <i className="fa-solid fa-lock input-icon"></i>
                                <input
                                    type="password"
                                    placeholder="Enter new password"
                                    required
                                    minlength="6"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <div className="input-wrapper">
                                <i className="fa-solid fa-shield-halved input-icon"></i>
                                <input
                                    type="password"
                                    placeholder="Confirm new password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'RESETTING...' : 'RESET PASSWORD'}
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

export default ResetPassword;
