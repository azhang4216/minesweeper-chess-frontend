import React from 'react';
import './Loader.css';

const Loader = () => {
    return (
        <div className="loader-container">
            <div className="spinner"></div>
            <p>Waiting for an opponent to join...</p>
        </div>
    );
};

export default Loader;