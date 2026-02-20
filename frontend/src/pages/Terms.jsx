import React from 'react';

const Terms = () => {
    return (
        <div className="container mt-5 mb-5 page-fade">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="legal-header text-center mb-5">
                        <div className="legal-badge mb-3">
                            <i className="fas fa-file-contract"></i>
                            <span>Terms of Service</span>
                        </div>
                        <h1 className="fw-bold display-5">Terms & Conditions</h1>
                        <p className="text-muted">Last updated: February 2026</p>
                    </div>

                    <div className="legal-content">
                        <section className="mb-5 p-4 border rounded-4 bg-light shadow-sm">
                            <h3>1. Agreement to Terms</h3>
                            <p className="mb-0">
                                These Terms constitute a legally binding agreement between you and Grandel. By using our platform,
                                you agree to be bound by these terms. Grandel provides an online marketplace that connects Guests with unique property Hosts.
                            </p>
                        </section>

                        <section className="mb-5">
                            <h3>2. Financial Terms & Token Payment</h3>
                            <p>Our platform operates on a specific payment structure to ensure reliability for both parties:</p>
                            <div className="p-4 bg-dark text-light rounded-4 mb-3 border">
                                <ul className="mb-0 list-unstyled">
                                    <li className="mb-3">
                                        <strong><i className="fas fa-shield-check text-danger me-2"></i>20% Token Amount:</strong>
                                        To confirm a booking, Guests must pay a 20% token amount via our secure payment gateway (Razorpay).
                                        This confirms your intent and secures the property.
                                    </li>
                                    <li>
                                        <strong><i className="fas fa-hand-holding-usd text-success me-2"></i>80% Remaining Balance:</strong>
                                        The remaining 80% of the booking price is to be paid <strong>directly to the Host</strong> upon arrival at the property.
                                    </li>
                                </ul>
                            </div>
                            <p className="small text-muted">
                                *All token payments are subject to our cancellation policy. Grandel acts as an intermediary for the 20% token payment only.
                            </p>
                        </section>

                        <section className="mb-5">
                            <h3>3. User Obligations</h3>
                            <div className="row g-4">
                                <div className="col-md-6 text-center p-3">
                                    <div className="p-3 border rounded-4 hover-lift">
                                        <i className="fas fa-user-check fa-2x mb-3 text-primary"></i>
                                        <h5>For Guests</h5>
                                        <p className="small text-muted mb-0">Provide accurate details, respect host house rules, and pay host directly upon arrival.</p>
                                    </div>
                                </div>
                                <div className="col-md-6 text-center p-3">
                                    <div className="p-3 border rounded-4 hover-lift">
                                        <i className="fas fa-home fa-2x mb-3 text-success"></i>
                                        <h5>For Hosts</h5>
                                        <p className="small text-muted mb-0">Ensure property accuracy, maintain verified status, and respect guest privacy during stays.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="mb-5">
                            <h3>4. Cancellations & Refunds</h3>
                            <p>
                                Cancellation policies are set by Hosts. In the event of a valid cancellation, the 20% token amount
                                will be handled according to our refund protocols. Please review the specific rules on the listing page before booking.
                            </p>
                        </section>

                        <section className="mb-5">
                            <h3>5. Limitation of Liability</h3>
                            <p>
                                Grandel is a platform connecting users. We are not responsible for the condition of properties,
                                the conduct of guests, or the performance of hosts. Users interact and transact at their own risk.
                            </p>
                        </section>

                        <section className="mb-5 border-top pt-5">
                            <h3>6. Contact Information</h3>
                            <p>
                                For disputes or clarifications, please contact:<br />
                                <strong>Email:</strong> support@grandel.com<br />
                                <strong>Address:</strong> Grandel Private Limited, Tech Park, Bangalore, India.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Terms;