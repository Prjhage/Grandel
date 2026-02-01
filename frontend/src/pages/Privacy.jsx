import React from 'react';

const Privacy = () => {
    return (
        <div className="container mt-5 mb-5 page-fade">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <h1 className="mb-4 fw-bold">Privacy Policy</h1>
                    <p className="text-muted mb-5">Last updated: January 2026</p>

                    <section className="mb-5">
                        <h3>1. Introduction</h3>
                        <p>
                            Welcome to Grandel. We value your privacy and are committed to protecting your personal data.
                            This privacy policy explains how we look after your personal data when you visit our website
                            and tells you about your privacy rights and how the law protects you.
                        </p>
                    </section>

                    <section className="mb-5">
                        <h3>2. Information We Collect</h3>
                        <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
                        <ul>
                            <li><strong>Identity Data:</strong> includes username, first name, last name.</li>
                            <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
                            <li><strong>Transaction Data:</strong> includes details about payments to and from you and other details of services you have purchased from us.</li>
                            <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
                        </ul>
                    </section>

                    <section className="mb-5">
                        <h3>3. How We Use Your Information</h3>
                        <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                        <ul>
                            <li>To register you as a new customer.</li>
                            <li>To process and deliver your booking including managing payments, fees and charges.</li>
                            <li>To manage our relationship with you which will include notifying you about changes to our terms or privacy policy.</li>
                            <li>To improve our website, products/services, marketing, customer relationships and experiences.</li>
                        </ul>
                    </section>

                    <section className="mb-5">
                        <h3>4. Data Security</h3>
                        <p>
                            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.
                            In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
                        </p>
                    </section>

                    <section className="mb-5">
                        <h3>5. Contact Us</h3>
                        <p>
                            If you have any questions about this privacy policy or our privacy practices, please contact us at:
                            <br />
                            <strong>Email:</strong> privacy@grandel.com
                            <br />
                            <strong>Address:</strong> Grandel Private Limited, Tech Park, Bangalore, India.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Privacy;