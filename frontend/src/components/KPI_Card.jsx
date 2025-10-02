// frontend/src/components/KPI_Card.jsx
import React from 'react';
import './KPI_Card.css';

const KPI_Card = ({ title, value, icon }) => {
  return (
    <div className="kpi-card">
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-content">
        <p className="kpi-value">{value}</p>
        <h4 className="kpi-title">{title}</h4>
      </div>
    </div>
  );
};

export default KPI_Card;