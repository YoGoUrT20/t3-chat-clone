import React from 'react';

function Tooltip({ x, y, text, model, style }) {
  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        transform: 'translateX(-50%)',
        zIndex: 50,
        pointerEvents: 'none',
        ...style,
      }}
      className='px-2 py-1 rounded bg-zinc-900 text-white text-xs shadow-lg border border-zinc-700 select-none mt-1'
    >
      <div>{text}</div>
      {model && <div className='text-gray-400 mt-1'>{model}</div>}
    </div>
  );
}

export default Tooltip; 