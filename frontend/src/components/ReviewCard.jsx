import React from 'react';
import './ReviewCard.css';

const ReviewCard = ({ title, data, icon }) => {
  return (
    <div className="review-card">
      <div className="review-card-header">
        {icon}
        <h3>{title}</h3>
      </div>
      <div className="review-card-body">
        {Object.entries(data).map(([key, value]) => (
          <div className="info-row" key={key}>
            <span className="info-key">{key}:</span>
            <span className="info-value">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewCard;