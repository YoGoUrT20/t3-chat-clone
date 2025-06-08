import React from 'react';

function CategoryButton({ icon, text, onClick }) {
  return (
    <button 
      className="text-sm font-bold rounded-full flex items-center justify-center space-x-1 bg-[#27222D] hover:bg-[#362D3D] transition-colors border" 
      style={{ borderColor: '#302836', color: '#BFB3CB', height: '36px', width: '97px' }}
      onClick={onClick}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}

export default CategoryButton; 