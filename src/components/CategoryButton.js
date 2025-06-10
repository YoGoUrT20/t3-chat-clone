import React from 'react';

function CategoryButton({ icon, text, onClick }) {
  return (
    <button 
      className="text-sm font-bold rounded-full flex items-center justify-center space-x-1 bg-blue-900/60 hover:bg-blue-800/80 transition-colors border border-blue-400/30 shadow-md" 
      style={{ color: '#E0E8FF', height: '36px', width: '97px' }}
      onClick={onClick}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}

export default CategoryButton; 