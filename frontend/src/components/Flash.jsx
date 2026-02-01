import React from 'react';

const Flash = ({ message, type, onClose }) => {
    if (!message) return null;

    return (
        <div
            className={`alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show col-6 offset-3`}
            role="alert"
        >
            {message}
            <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
            ></button>
        </div>
    );
};

export default Flash;
