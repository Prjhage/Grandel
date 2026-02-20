import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import './HostScanner.css';

const HostScanner = ({ currUser, showFlash }) => {
    const [scanResult, setScanResult] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState(null);
    const scannerRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Redir if not logged in or not host
        if (!currUser || currUser.role !== 'host') {
            navigate('/');
            return;
        }

        const scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: { width: 250, height: 250 },
        });

        scanner.render(onScanSuccess, onScanFailure);

        function onScanSuccess(decodedText, decodedResult) {
            scanner.clear();
            handleVerify(decodedText);
        }

        function onScanFailure(error) {
            // console.warn(`Code scan error = ${error}`);
        }

        return () => {
            scanner.clear();
        };
    }, [currUser, navigate]);

    const handleVerify = async (bookingId) => {
        setVerifying(true);
        setError(null);
        try {
            const res = await axios.get(`/api/bookings/verify/${bookingId}`);
            if (res.data.success) {
                setScanResult(res.data.booking);
                showFlash("Booking Verified Successfully!");
            }
        } catch (err) {
            console.error("Verification Error:", err);
            const msg = err.response?.data?.message || "Invalid or unauthorized QR code";
            setError(msg);
            showFlash(msg, "error");
        } finally {
            setVerifying(false);
        }
    };

    const resetScanner = () => {
        setScanResult(null);
        setError(null);
        window.location.reload(); // Simplest way to restart scanner
    };

    return (
        <div className="host-scanner-container">
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-lg-6 col-md-8 text-center">
                        <div className="scanner-header mb-4">
                            <h2 className="premium-title">Guest Check-in Scanner</h2>
                            <p className="text-muted">Scan the QR code on the guest's invoice to verify booking.</p>
                        </div>

                        {!scanResult && !error && (
                            <div className="scanner-wrapper">
                                <div id="reader" className="qr-reader-frame"></div>
                                <div className="scanner-instruction mt-3">
                                    <i className="fa-solid fa-camera me-2"></i>
                                    Place the QR code within the frame
                                </div>
                            </div>
                        )}

                        {verifying && (
                            <div className="verifying-status mt-4">
                                <div className="spinner-border text-danger" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-2 fw-bold">Verifying Booking ID...</p>
                            </div>
                        )}

                        {error && (
                            <div className="verification-failed-card animate__animated animate__shakeX">
                                <div className="error-icon mb-3">
                                    <i className="fa-solid fa-circle-xmark text-danger fa-4x"></i>
                                </div>
                                <h3 className="text-danger">Verification Failed</h3>
                                <div className="error-message p-3 bg-light border-start border-4 border-danger mb-4">
                                    {error}
                                </div>
                                <button onClick={resetScanner} className="btn btn-dark w-100 rounded-pill py-3">
                                    Try Again
                                </button>
                                <Link to="/profile/host" className="btn btn-link mt-3 text-muted">
                                    Back to Dashboard
                                </Link>
                            </div>
                        )}

                        {scanResult && (
                            <div className="verification-success-card animate__animated animate__fadeInUp">
                                <div className="success-badge mb-3">
                                    <i className="fa-solid fa-circle-check text-success fa-4x"></i>
                                </div>
                                <h3 className="text-success mb-4">Check-in Verified!</h3>

                                <div className="booking-details-box text-start p-4 mb-4">
                                    <div className="detail-item mb-3">
                                        <label className="text-muted small text-uppercase fw-bold">Guest Name</label>
                                        <div className="detail-value fs-5 fw-bold">{scanResult.guest.username}</div>
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-6 border-end">
                                            <label className="text-muted small text-uppercase fw-bold">Check-in</label>
                                            <div className="detail-value">{new Date(scanResult.startDate).toLocaleDateString()}</div>
                                        </div>
                                        <div className="col-6 ps-4">
                                            <label className="text-muted small text-uppercase fw-bold">Check-out</label>
                                            <div className="detail-value">{new Date(scanResult.endDate).toLocaleDateString()}</div>
                                        </div>
                                    </div>

                                    <div className="payment-alert-box p-3 rounded-4 mb-0">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="text-muted">Paid Online (20%)</span>
                                            <span className="text-success fw-bold">Rs. {scanResult.tokenPaid.toLocaleString()}</span>
                                        </div>
                                        <hr className="my-2 opacity-10" />
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="fw-bold">Balance to Collect (80%)</span>
                                            <span className="text-danger fw-bold fs-4">Rs. {scanResult.balanceDue.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="d-grid gap-2">
                                    <button onClick={resetScanner} className="btn btn-dark rounded-pill py-3">
                                        Scan Next Guest
                                    </button>
                                    <Link to="/profile/host" className="btn btn-outline-secondary rounded-pill py-3">
                                        Finish & Exit
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HostScanner;
