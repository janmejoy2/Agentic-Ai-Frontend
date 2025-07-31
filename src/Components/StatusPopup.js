import React from 'react';
import './StatusPopup.css';

const StatusPopup = ({ message, show }) => {
  if (!show) return null;
  return (
    <div className="status-popup-overlay">
      <div className="status-popup">
        <span>{message}</span>
        <div className="status-bar-container">
          <div className="status-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default StatusPopup;