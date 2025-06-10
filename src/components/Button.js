import React from 'react';

function Button({ icon, children, className = '', rounded = false, ...props }) {
  return (
    <button 
      className={`
        inline-flex items-center justify-center gap-2
        h-9 px-4 py-2 text-sm font-semibold
        border-2 border-blue-400/70
        text-blue-50 shadow-lg
        ${rounded ? 'rounded-full' : 'rounded-lg'} select-none
        bg-gradient-to-r from-blue-400/80 via-blue-500/80 to-blue-600/80
        transition-all duration-300 ease-in-out
        hover:from-blue-300 hover:via-blue-400/90 hover:to-blue-600
        focus:ring-2 focus:ring-blue-300/60
        ring-1 ring-blue-300/30
        ${className}
      `}
      style={{ boxShadow: '0 0 12px 2px rgba(80,180,255,0.18)' }}
      {...props}
    >
      {icon && <span className="material-icons text-base">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
}

export default Button; 