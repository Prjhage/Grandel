import React from 'react';

const Privacy = () => {
    return (
        <div className="container mt-5 mb-5 page-fade">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="legal-header text-center mb-5">
                        <div className="legal-badge mb-3">
                            <i className="fas fa-shield-alt"></i>
                            <span>Trusted Platform</span>
                        </div>
                        <h1 className="fw-bold display-5">Privacy Policy</h1>
                        <p className="text-muted">Last updated: February 2026</p>
                    </div>

                    <div className="legal-content">
                        <section className="mb-5">
                            <h3>1. Introduction</h3>
                            <p>
                                Welcome to Grandel. Your privacy is paramount to us. As a premier travel and accommodation platform,
                                we are dedicated to protecting your personal data and providing a secure environment for our community of Guests and Hosts.
                                This policy outlines our practices regarding data collection, usage, and protection.
                            </p>
                        </section>

                        <section className="mb-5">
                            <h3>2. Data We Collect</h3>
                            <p>To provide a seamless experience, Grandel collects several types of information:</p>
                            <div className="data-box p-4 bg-light rounded-4 mb-3 border">
                                <ul className="list-unstyled mb-0">
                                    <li className="mb-3"><strong><i className="fas fa-id-card text-primary me-2"></i>Identity Data:</strong> Legal name, profile picture, and for Hosts, government-issued identification for verification.</li>
                                    <li className="mb-3"><strong><i className="fas fa-envelope text-primary me-2"></i>Contact Data:</strong> Email address, phone number, and billing/shipping addresses.</li>
                                    <li className="mb-3"><strong><i className="fas fa-credit-card text-primary me-2"></i>Transaction Data:</strong> Payment details for the 20% token amount via Razorpay, and history of bookings/payouts.</li>
                                    <li><strong><i className="fas fa-laptop text-primary me-2"></i>Technical Data:</strong> IP address, device type, and interaction data with our platform.</li>
                                </ul>
                            </div>
                        </section>

                        <section className="mb-5">
                            <h3>3. How We Use Your Data</h3>
                            <p>We process your information for the following purposes:</p>
                            <ul>
                                <li><strong>Service Delivery:</strong> Managing bookings, processing token payments via Razorpay, and facilitating communication between Guest and Host.</li>
                                <li><strong>Verification:</strong> Maintaining platform safety through host identity and property verification.</li>
                                <li><strong>Improvement:</strong> Utilizing analytics to enhance the Grandel interface and recommendation engine.</li>
                                <li><strong>Legal Compliance:</strong> Adhering to tax regulations and security protocols.</li>
                            </ul>
                        </section>

                        <section className="mb-5">
                            <h3>4. Third-Party Services</h3>
                            <p>
                                We partner with trusted third-party providers such as <strong>Razorpay</strong> for secure 20% token payments and
                                <strong>Cloudinary</strong> for property image hosting. These providers have their own privacy policies governing your data.
                            </p>
                        </section>

                        <section className="mb-5 p-4 border rounded-4 bg-dark text-light shadow-sm">
                            <h3>5. Contact Our Privacy Team</h3>
                            <p className="mb-2">For any queries regarding your data rights or this policy, please reach out to us:</p>
                            <p className="mb-0">
                                <strong>Email:</strong> privacy@grandel.com<br />
                                <strong>Support:</strong> support@grandel.com<br />
                                <strong>Address:</strong> Grandel Private Limited, Tech Park, Bangalore, India.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Privacy;