import React, { useState, useEffect } from 'react';
import Button from './Button';
import { PanelLeft, Search, LogIn, X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function SidePanel({ onReset, visible, setVisible }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (windowWidth <= 960) return null;

  return (
    <motion.aside
      initial={false}
      animate={{
        width: visible ? 255 : 0,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        padding: visible ? '1rem' : '0',
      }}
      transition={{ type: 'tween', duration: 0.15 }}
      className={`left-panel-bg space-y-6 flex flex-col overflow-hidden`}
      style={{ background: 'linear-gradient(to top, #0F0A0D 0%, #1B1219 100%)' }}
    >
      <div className="relative flex items-center justify-center h-10" style={{ marginTop: '-10px' }}>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="absolute left-0 p-1 rounded hover:bg-[#2A232B] transition-colors"
          style={{ transition: 'background 0.2s', background: 'transparent', border: 'none', padding: 0, margin: 0, cursor: 'pointer', left: '3px', top: '20px' }}
          aria-label="Close side panel"
        >
          <PanelLeft size={16} color="#E3BAD1" />
        </button>
        <div className="h-3.5 select-none flex items-center justify-center w-full" onClick={onReset} style={{ cursor: 'pointer' }}>
          <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 247.7 53" className="size-full" style={{ color: '#E3BAD1' }}>
            <path fill="currentColor" d="M205.6,50.3c1.9-1,3.5-2.2,4.7-3.6v4.4v0.4h0.4h7.7h0.4v-0.4V13.5v-0.4h-0.4h-7.7h-0.4v0.4v4.3c-1.2-1.4-2.8-2.6-4.6-3.5c-2.2-1.2-4.8-1.8-7.8-1.8c-3.3,0-6.3,0.8-9,2.5c-2.7,1.7-4.9,4-6.4,6.9l0,0c-1.6,3-2.4,6.4-2.4,10.2c0,3.8,0.8,7.3,2.4,10.3c1.6,3,3.7,5.4,6.4,7.1c2.7,1.7,5.7,2.6,8.9,2.6C200.6,52.1,203.3,51.5,205.6,50.3z M208.7,25.7l0.3,0.5c0.8,1.7,1.2,3.7,1.2,6c0,2.5-0.5,4.7-1.5,6.6c-1,1.9-2.4,3.3-4,4.2c-1.6,1-3.4,1.5-5.3,1.5c-1.9,0-3.6-0.5-5.3-1.5c-1.7-1-3-2.4-4-4.3c-1-1.9-1.5-4.1-1.5-6.6c0-2.5,0.5-4.7,1.5-6.5c1-1.8,2.3-3.2,4-4.1c1.6-1,3.4-1.4,5.3-1.4c1.9,0,3.7,0.5,5.3,1.4C206.4,22.5,207.7,23.9,208.7,25.7z"></path>
            <path fill="currentColor" d="M99.6,21.4L99.6,21.4l-0.3,0.5c-1.6,3-2.4,6.5-2.4,10.4s0.8,7.4,2.4,10.4c1.6,3,3.8,5.3,6.6,7c2.8,1.7,6,2.5,9.6,2.5c4.5,0,8.2-1.2,11.3-3.5c3-2.3,5.1-5.4,6.2-9.3l0.1-0.5h-0.5h-8.3H124l-0.1,0.3c-0.7,1.9-1.7,3.3-3.1,4.3c-1.4,0.9-3.1,1.4-5.3,1.4c-3,0-5.4-1.1-7.2-3.3l0,0c-1.8-2.2-2.7-5.3-2.7-9.3c0-4,0.9-7,2.7-9.2c1.8-2.2,4.2-3.2,7.2-3.2c2.2,0,3.9,0.5,5.3,1.5c1.4,1,2.4,2.4,3.1,4.2l0.1,0.3h0.3h8.3h0.5l-0.1-0.5c-1-4.1-3.1-7.3-6.1-9.5c-3-2.2-6.8-3.3-11.4-3.3c-3.6,0-6.8,0.8-9.6,2.5l0,0C103.2,16.4,101.1,18.6,99.6,21.4z"></path>
            <g>
              <polygon fill="currentColor" points="237.8,13.2 237.8,3.9 229.1,3.9 229.1,13.2 224.8,13.2 224.8,20.5 229.1,20.5 229.1,52.1 230,51.2 230,51.2 232,49.2 237.8,43.2 237.8,20.5 246.8,20.5 246.8,13.2 "></polygon>
              <path fill="currentColor" d="M71.7,3.4H51.5l-7.1,7.2h18.8"></path>
              <path fill="currentColor" d="M166.8,14.5l-0.1-0.1c-2.3-1.3-4.9-1.9-7.7-1.9c-2.4,0-4.6,0.5-6.7,1.3c-1.6,0.7-3,1.7-4.2,2.8V0.1l-8.6,8.8v42.7h8.6V30.1c0-3.2,0.8-5.7,2.4-7.3c1.6-1.7,3.7-2.5,6.4-2.5s4.8,0.8,6.4,2.5c1.6,1.7,2.3,4.2,2.3,7.4v21.4h8.5V29c0-3.5-0.6-6.4-1.9-8.9C170.8,17.6,169,15.7,166.8,14.5z"></path>
              <path fill="currentColor" d="M43,3.4H0v0.5l0,0v3.2v3.7h3.5l0,0h11.9v40.8H24V10.7h11.8L43,3.4z"></path>
            </g>
            <path fill="currentColor" d="M71.9,25.4l-0.2-0.2h0c-2.2-2.3-5.3-3.7-9.1-4.2L73.4,9.8V3.4H54.8l-9.4,7.2h17.7L52.5,21.8v5.9h7c2.5,0,4.4,0.7,5.9,2.2c1.4,1.4,2.1,3.4,2.1,6.1c0,2.6-0.7,4.7-2.1,6.2c-1.4,1.5-3.4,2.2-5.9,2.2c-2.5,0-4.4-0.7-5.7-2c-1.4-1.4-2.1-3.1-2.3-5.2l0-0.5h-8.1l0,0.5c0.2,4.6,1.8,8.1,4.8,10.5c2.9,2.4,6.7,3.7,11.3,3.7c5,0,9-1.4,11.9-4.2c2.9-2.8,4.4-6.6,4.4-11.3C75.6,31.5,74.4,28,71.9,25.4z"></path>
            <rect x="84.3" y="44.2" fill="currentColor" width="6.9" height="6.9"></rect>
          </svg>
        </div>
      </div>
      
      <Button onClick={onReset} style={{ marginTop: '8px' }}>New Chat</Button>
      
      <div className="flex items-center pb-1 border-b" style={{ borderColor: '#322028', borderBottomWidth: '1px', marginTop: '16px'}}>
        <span className="flex items-center justify-center pl-1">
          <Search size={15} color="#E7D0DD" />
        </span>
        <input 
          className="text-sm w-full pl-3 pr-3 py-1.5 rounded-lg focus:outline-none focus:ring-0 bg-transparent border-none placeholder-custom-search"
          style={{ color: '#EFEEF1', caretColor: '#fff' }}
          placeholder="Search your threads..." 
          type="text"
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => setSearchValue('')}
            onMouseOver={e => e.currentTarget.style.background = '#2A232B'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            className="p-2 transition-colors rounded ml-1"
            style={{ background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer' }}
            aria-label="Clear search"
          >
            <X size={16} color="#E7D0DD" />
          </button>
        )}
      </div>
      
      <nav className="flex-grow overflow-y-auto mb-12"></nav>
      <div>
        {user ? (
          <button
            onClick={() => navigate('/settings/subscription')}
            className="flex items-center space-x-2 p-2 rounded-lg w-full group hover:bg-[#2A232B] transition-colors"
            style={{ background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer' }}
          >
            <img 
              alt={user.displayName}
              className="w-8 h-8 rounded-full"
              style={{ border: '1px solid #3B3337' }}
              src={user.photoURL}
            />
            <div className="flex flex-col items-start">
              <p className="font-medium text-sm">{user.displayName}</p>
              <p className="text-xs">Free</p>
            </div>
          </button>
        ) : loading ? null : (
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center space-x-2 p-2 rounded-lg w-full group hover:bg-[#2A232B] transition-colors"
            style={{ background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', position: 'relative', top: '-5px' }}
          >
            <span className="w-8 h-8 flex items-center justify-center rounded-full">
              <LogIn size={16} color="#E7D0DD" />
            </span>
            <div className="flex flex-col items-start">
              <p className="font-medium text-sm" style={{ color: '#E7D0DD' }}>Login</p>
            </div>
          </button>
        )}
      </div>
    </motion.aside>
  );
}

export default SidePanel; 