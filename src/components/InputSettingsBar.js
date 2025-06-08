import React from 'react';
import { Paperclip, Globe } from 'lucide-react';

function InputSettingsBar({ children }) {
  return (
    <div className="flex items-center text-xs font-bold w-full" style={{ color: '#E3CDDA' }}>
      <div className="flex items-center space-x-1">
        <button
          className="flex items-center space-x-1 transition-colors px-4 py-2"
          style={{ color: '#E3CDDA', background: 'transparent', borderRadius: '6px', position: 'relative', top: '-12px' }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#332C39'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <span style={{ fontSize: '0.9rem' }}>Gemini 2.5 Flash</span>
          <span className="material-icons text-sm" style={{ color: '#E3CDDA' }}>keyboard_arrow_down</span>
        </button>
        <button className="flex items-center justify-center rounded-full border px-2 py-2 transition-colors" style={{ borderColor: '#3A333F', height: '32px', color: '#E3CDDA', position: 'relative', top: '-12px' }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#332C39'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = ''}>
          <Globe size={16} style={{ color: '#E3CDDA' }} />
          <span className="ml-1">Search</span>
        </button>
        <button className="flex items-center justify-center w-6 h-6 rounded-full border transition-colors" style={{ borderColor: '#3A333F', height: '32px', width: '36px', color: '#E3CDDA', position: 'relative', top: '-12px' }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#332C39'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = ''}>
          <Paperclip size={16} style={{ color: '#E3CDDA' }} />
        </button>
      </div>
      <div className="flex-1" />
      {children}
    </div>
  );
}

export default InputSettingsBar; 