import React, { useEffect } from 'react';
import { useAuth } from '../AuthContext';
import Button from './Button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_993_124)">
        <path d="M19.805 10.2305C19.805 9.55078 19.7483 8.86719 19.625 8.19922H10.2V12.0508H15.6017C15.3767 13.2852 14.6233 14.332 13.555 15.0352V17.2852H16.6017C18.4017 15.6367 19.805 13.2305 19.805 10.2305Z" fill="#4285F4"/>
        <path d="M10.2 20C12.7 20 14.8233 19.1836 16.6017 17.2852L13.555 15.0352C12.6017 15.667 11.4767 16.0352 10.2 16.0352C7.80167 16.0352 5.80167 14.3672 5.055 12.1992H1.90167V14.5156C3.70167 17.832 6.70167 20 10.2 20Z" fill="#34A853"/>
        <path d="M5.055 12.1992C4.85167 11.5664 4.73667 10.8984 4.73667 10.1992C4.73667 9.5 4.85167 8.83203 5.055 8.19922V5.88281H1.90167C1.30167 7.13281 1 8.61719 1 10.1992C1 11.7812 1.30167 13.2656 1.90167 14.5156L5.055 12.1992Z" fill="#FBBC05"/>
        <path d="M10.2 4.36328C11.5767 4.36328 12.8233 4.83203 13.8017 5.75781L16.6733 2.88672C14.8233 1.16797 12.7 0.199219 10.2 0.199219C6.70167 0.199219 3.70167 2.36719 1.90167 5.88281L5.055 8.19922C5.80167 6.03125 7.80167 4.36328 10.2 4.36328Z" fill="#EA4335"/>
      </g>
      <defs>
        <clipPath id="clip0_993_124">
          <rect width="20" height="20" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
}

function ChatLogo() {
  return (
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 247.7 53" style={{ height: '22px', color: '#E3BAD1', margin: '0 0 0 8px', display: 'inline', verticalAlign: 'middle' }}>
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
  );
}

function AuthPage() {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: 'linear-gradient(to top, #0F0A0D 0%, #1B1219 100%)' }}>
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center space-x-2 p-2 rounded-lg group"
        style={{ background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
        onMouseOver={e => e.currentTarget.style.background = '#261922'}
        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
      >
        <span className="w-8 h-8 flex items-center justify-center rounded-full">
          <ArrowLeft size={18} color="#F9F8FB" />
        </span>
        <span className="font-medium text-sm" style={{ color: '#F9F8FB' }}>Back to Chat</span>
      </button>
      <div className="flex flex-col items-center w-full max-w-md px-6 py-12">
        <div className="flex items-center justify-center mb-6 mt-2" style={{ whiteSpace: 'nowrap' }}>
          <h1 className="text-2xl font-extrabold mr-2" style={{ color: '#F9F8FB', letterSpacing: '-0.01em', display: 'inline', verticalAlign: 'middle' }}>Welcome to</h1>
          <ChatLogo />
        </div>
        <div className="text-base mb-6 text-center" style={{ color: '#E6CFDC', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>
          <span>Sign in below (we&apos;ll increase your message limits if you do😉)</span>
        </div>
        <Button
          onClick={signInWithGoogle}
          className="w-full py-7 text-base font-bold flex items-center justify-center gap-3 bg-gradient-to-r from-pink-700/90 via-pink-700/70 to-pink-700/90 border border-[#49152F] text-[#F4E9EE] mb-4 rounded-lg"
          icon={<GoogleIcon />}
        >
          Continue with Google
        </Button>
        <div className="text-xs text-center mt-2 whitespace-nowrap" style={{ color: '#90808A' }}>
          By continuing, you agree to our <a href="/terms-of-service" style={{ color: '#E5CEDB' }}>Terms of Service</a> and <a href="/privacy-policy" style={{ color: '#E5CEDB' }}>Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}

export default AuthPage; 