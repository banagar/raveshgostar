// frontend/src/components/FloatingActionButton.jsx
import React from 'react';
import { FaMicrophone } from 'react-icons/fa';
import './FloatingActionButton.css';

const FloatingActionButton = ({ onClick }) => {
  return (
    <button className="fab" onClick={onClick} title="ثبت دستور جدید">
      <FaMicrophone />
    </button>
  );
};

export default FloatingActionButton;