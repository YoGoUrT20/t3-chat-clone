import React from 'react';

function Button({ icon, children, className = '', ...props }) {
  return (
    <button 
      className={`
        inline-flex items-center justify-center gap-2
        h-9 px-4 py-2 text-sm font-semibold
        border border-[#49152F]
        text-[#EFBED9] shadow-sm
        rounded-lg select-none
        bg-gradient-to-r from-pink-700/90 via-pink-700/70 to-pink-700/90
        transition-all duration-300 ease-in-out
        hover:from-[#78173F] hover:via-[#78173F]/90 hover:to-[#78173F]
        dark:from-pink-900/30 dark:via-pink-900/20 dark:to-pink-900/30
        dark:hover:from-[#78173F]/80 dark:hover:via-[#78173F]/70 dark:hover:to-[#78173F]/80
        dark:active:from-pink-800/50 dark:active:via-pink-800/40 dark:active:to-pink-800/50
        ${className}
      `}
      {...props}
    >
      {icon && <span className="material-icons text-base">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
}

export default Button; 