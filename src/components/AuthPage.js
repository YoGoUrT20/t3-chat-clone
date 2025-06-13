import React, { useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LiquidGlassButton from './LiquidGlassButton';
import toast from 'react-hot-toast';

function QuiverLogo() {
  return (
    <span
      className='block mx-auto text-[32px] font-bold font-sans bg-gradient-to-r from-[#3bb0ff] to-[#a259ff] bg-clip-text text-transparent select-none'
      style={{ lineHeight: '1.2', letterSpacing: '-0.02em' }}
    >
      Quiver
    </span>
  );
}

function GoogleIcon() {
  return (
    <svg width='24' height='24' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <g clipPath='url(#clip0_993_124)'>
        <path d='M19.805 10.2305C19.805 9.55078 19.7483 8.86719 19.625 8.19922H10.2V12.0508H15.6017C15.3767 13.2852 14.6233 14.332 13.555 15.0352V17.2852H16.6017C18.4017 15.6367 19.805 13.2305 19.805 10.2305Z' fill='#4285F4'/>
        <path d='M10.2 20C12.7 20 14.8233 19.1836 16.6017 17.2852L13.555 15.0352C12.6017 15.667 11.4767 16.0352 10.2 16.0352C7.80167 16.0352 5.80167 14.3672 5.055 12.1992H1.90167V14.5156C3.70167 17.832 6.70167 20 10.2 20Z' fill='#34A853'/>
        <path d='M5.055 12.1992C4.85167 11.5664 4.73667 10.8984 4.73667 10.1992C4.73667 9.5 4.85167 8.83203 5.055 8.19922V5.88281H1.90167C1.30167 7.13281 1 8.61719 1 10.1992C1 11.7812 1.30167 13.2656 1.90167 14.5156L5.055 12.1992Z' fill='#FBBC05'/>
        <path d='M10.2 4.36328C11.5767 4.36328 12.8233 4.83203 13.8017 5.75781L16.6733 2.88672C14.8233 1.16797 12.7 0.199219 10.2 0.199219C6.70167 0.199219 3.70167 2.36719 1.90167 5.88281L5.055 8.19922C5.80167 6.03125 7.80167 4.36328 10.2 4.36328Z' fill='#EA4335'/>
      </g>
      <defs>
        <clipPath id='clip0_993_124'>
          <rect width='20' height='20' fill='white'/>
        </clipPath>
      </defs>
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
    <div className='main-bg relative min-h-screen w-full flex items-center justify-center overflow-hidden'>
      <div className='absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-blue-400/30 via-purple-400/20 to-pink-400/20 blur-3xl opacity-70 pointer-events-none' />
      <div className='absolute bottom-0 right-0 w-[340px] h-[340px] rounded-full bg-gradient-to-tr from-pink-400/30 via-blue-400/20 to-purple-400/20 blur-3xl opacity-60 pointer-events-none' />
      <div className='relative z-10 flex flex-col items-center justify-center w-full max-w-lg px-8 pt-28 pb-16 rounded-3xl shadow-2xl'>
        <div className='w-full flex flex-col items-center mb-8'>
          <div className='flex flex-row items-baseline justify-center gap-3'>
            <span className='text-2xl font-bold text-white'>Welcome to</span>
            <QuiverLogo />
          </div>
          <div className='mt-2 text-lg text-[#5e5e7a] dark:text-[#cfcfe7] text-center max-w-[420px]'>A playful, modern chat experience. Sign in to unlock your full potential and join the conversation.</div>
        </div>
        <button
          onClick={async () => {
            try {
              await signInWithGoogle();
            } catch (e) {
              toast.error('Failed to sign in with Google');
            }
          }}
          className='w-full mt-4 py-5 text-lg font-bold flex items-center justify-center gap-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 border-none text-white rounded-2xl shadow-lg hover:from-blue-500 hover:to-pink-600 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200/40 active:scale-98'
        >
          <span className='flex items-center justify-center'><GoogleIcon /></span>
          <span>Continue with Google</span>
        </button>
        <div className='w-full mt-8 text-xs text-center text-[#90808A] dark:text-[#bdbdbd]'>
          By continuing, you agree to our <a href='/terms-of-service' style={{ color: '#3bb0ff', textDecoration: 'underline' }}>Terms of Service</a> and <a href='/privacy-policy' style={{ color: '#3bb0ff', textDecoration: 'underline' }}>Privacy Policy</a>
        </div>
        <div className='absolute top-6 left-6'>
          <LiquidGlassButton
            onClick={() => navigate(-1)}
            icon={<ArrowLeft size={20} />}
            text={'Back'}
            variant={'rect'}
            style={{ background: 'rgba(255,255,255,0.22)', color: '#3bb0ff', fontWeight: 700 }}
          />
        </div>
      </div>
    </div>
  );
}

export default AuthPage; 