import React from 'react';
import { FaMicrophone } from 'react-icons/fa';
import './CommandBar.css';

const CommandBar = ({ onOpen }) => {
  return (
    <div className="command-bar" onClick={onOpen} role="button" tabIndex="0">
      <p className="command-bar-placeholder">
        دستور خود را تایپ کنید یا روی میکروفون کلیک کنید...
      </p>
      <button className="command-bar-button" aria-label="Open command modal">
        <FaMicrophone />
      </button>
    </div>
  );
};

export default CommandBar;