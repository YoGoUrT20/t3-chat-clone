import React from 'react';

function LiquidGlassButton({ icon, text, onClick, selected }) {
  return (
    <button
      className={`liquid-glass-btn relative overflow-hidden group flex items-center justify-center space-x-1 text-sm font-bold rounded-full ${selected ? 'selected' : ''}`}
      style={{ height: '36px', width: '97px', color: selected ? '#23232a' : '#E0E8FF', background: selected ? '#F5FBFF' : undefined }}
      onClick={onClick}
    >
      {icon && <span className="relative z-10">{icon}</span>}
      <span className="relative z-10">{text}</span>
      <style>{`
        .liquid-glass-btn {
          border: none;
          position: relative;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 
            inset -2px -2px 8px rgba(255, 255, 255, 0.3),
            inset 2px 2px 8px rgba(0, 0, 0, 0.3),
            0 8px 32px rgba(0, 0, 0, 0.2);
        }
        .liquid-glass-btn.selected {
          background: #F5FBFF !important;
          color: #23232a !important;
          box-shadow: 0 0 0 2px #F5FBFF, 0 8px 32px rgba(0,0,0,0.08);
        }
        .liquid-glass-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 9999px;
          padding: 1px;
          background: linear-gradient(
            315deg,
            rgba(255, 255, 255, 0.4) 0%,
            transparent 25%,
            transparent 75%,
            rgba(255, 255, 255, 0.4) 100%
          );
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: source-out;
        }
        .liquid-glass-btn:hover {
          transform: translateY(-2px);
          box-shadow: 
            inset -2px -2px 12px rgba(255, 255, 255, 0.4),
            inset 2px 2px 12px rgba(0, 0, 0, 0.4),
            0 12px 40px rgba(0, 0, 0, 0.3);
          background: rgba(255, 255, 255, 0.15);
        }
        .liquid-glass-btn:active {
          transform: translateY(0);
          box-shadow: 
            inset 2px 2px 10px rgba(0, 0, 0, 0.3),
            inset -3px -3px 10px rgba(255, 255, 255, 0.3),
            0 4px 16px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </button>
  );
}

export default LiquidGlassButton; 