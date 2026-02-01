import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword } from 'firebase/auth';
import axios from '../config/axios';
import '../config/firebase';
import './Auth.css';

const Signup = ({ onLogin, showFlash }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        phone: ''
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

            const res = await axios.post('/signup', { ...formData, token, idToken: token }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
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
                <div className="login-header">
                    <i className="fa-solid fa-house fa-bounce" style={{ color: '#005af5', fontSize: '3rem' }}></i>
                    <h2>Grandel</h2>
                </div>

                {error && (
                    <div className="alert alert-danger text-center">
                        {error}
                    </div>
                )}

                <form className="login-form needs-validation" onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="username" className="form-label">Username</label>
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            required
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email address"
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

                    <div className="form-group">
                        <label htmlFor="phone" className="form-label">Mobile Number</label>
                        <input
                            type="tel"
                            name="phone"
                            id="phone"
                            placeholder="10-digit mobile number"
                            required
                            pattern="[0-9]{10}"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <button type="submit" className="login-btn btn-success">Sign Up</button>

                    <p className="text-center mt-3 small text-muted">
                        By signing up, you agree to our <Link to="/terms" target="_blank" className="text-decoration-none">Terms</Link> & <Link to="/privacy" target="_blank" className="text-decoration-none">Privacy Policy</Link>
                    </p>

                    <Link to="/login" className="forgot-link mt-3">
                        Already have an account? Login
                    </Link>
                </form>
            </div>
        </div>
    );
};

export default Signup;
