import React from 'react';

function SendButton({ disabled, onClick, className = '' }) {
  const buttonColor = disabled ? '#3C2235' : '#4D1F39';
  const borderColor = '#4C273D';
  
  return (
    <div className="relative group">
      <button 
        className={`
          inline-flex items-center justify-center
          w-[40px] h-[40px]
          text-white
          rounded-lg select-none
          transition-all duration-300 ease-in-out
          ${disabled ? 'cursor-not-allowed opacity-70' : 'hover:opacity-80 cursor-pointer'}
          ${className}
        `}
        style={{ backgroundColor: buttonColor, border: `1.5px solid ${borderColor}` }}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
      >
        <span className="material-icons text-base">arrow_upward</span>
      </button>
      
      {disabled && (
        <div
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none"
          style={{ color: '#E2CBD8' }}
        >
          message requires text
        </div>
      )}
    </div>
  );
}

export default SendButton; 