import React from 'react';
import './ChartControls.css';

const ChartControls = ({ options, selectedOption, onOptionChange }) => {
  return (
    <div className="chart-controls">
      {options.map((option) => (
        <button
          key={option.value}
          className={`control-button ${selectedOption === option.value ? 'active' : ''}`}
          onClick={() => onOptionChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default ChartControls;