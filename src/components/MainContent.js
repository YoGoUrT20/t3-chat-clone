import React, { useState, useEffect } from 'react';
import { Newspaper, Sun, Settings2, GraduationCap, Sparkles, PanelLeft, Search, Plus } from 'lucide-react';
import CategoryButton from './CategoryButton';
import MessageInput from './MessageInput';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import Button from './Button';
import { CATEGORY_QUESTIONS } from '../constants';

function MainContent({ showSidebar, setShowSidebar }) {
  const [message, setMessage] = useState('');
  const [showSettingsTooltip, setShowSettingsTooltip] = useState(false);
  const [showThemeTooltip, setShowThemeTooltip] = useState(false);
  const [settingsTooltipPos, setSettingsTooltipPos] = useState({ top: 0, left: 0 });
  const [themeTooltipPos, setThemeTooltipPos] = useState({ top: 0, left: 0 });
  const settingsBtnRef = React.useRef(null);
  const themeBtnRef = React.useRef(null);
  const { user } = useAuth();
  const [firstMessageSent, setFirstMessageSent] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const leftSettingsBtnRef = React.useRef(null);
  const leftThemeBtnRef = React.useRef(null);

  const defaultQuestions = [
    'How does AI work?',
    'Are black holes real?',
    'How many R\'s are in the word "strawberry"?',
    'What is the meaning of life?',
  ];

  useEffect(() => {
    setMessage('');
  }, []); // Reset message when key changes (component remounts)

  useEffect(() => {
    if (showSettingsTooltip && settingsBtnRef.current) {
      const rect = settingsBtnRef.current.getBoundingClientRect();
      setSettingsTooltipPos({
        top: rect.bottom + 8 + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX - 16,
      });
    }
  }, [showSettingsTooltip]);

  useEffect(() => {
    if (showThemeTooltip && themeBtnRef.current) {
      const rect = themeBtnRef.current.getBoundingClientRect();
      setThemeTooltipPos({
        top: rect.bottom + 8 + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX - 32,
      });
    }
  }, [showThemeTooltip]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const handleQuestionClick = (question) => {
    setMessage(question);
  };

  return (
    <>
      {/* Sidebar button for mobile */}
      {windowWidth <= 960 && !showSidebar && (
        <div className="fixed left-[-12px] top-[-2px] z-30 h-16 w-28" style={{ clipPath: 'inset(0px 0px 0px 12px)' }}>
          <div className="group pointer-events-auto absolute top-3.5 z-10 -mb-8 h-32 w-full origin-top transition-all ease-snappy">
            <svg className="absolute -right-8 h-9 origin-top-left overflow-visible mt-0.5 translate-x-[74px] skew-x-[-30deg] -scale-x-100 max-sm:hidden" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 128 32" xmlSpace="preserve">
              <line stroke="#1A1319" strokeWidth="2px" shapeRendering="optimizeQuality" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeMiterlimit="10" x1="1" y1="0" x2="128" y2="0"></line>
              <path stroke="#1A1319" className="translate-y-[0.5px]" fill="#1A1319" shapeRendering="optimizeQuality" strokeWidth="1px" strokeLinecap="round" strokeMiterlimit="10" vectorEffect="non-scaling-stroke" d="M0,0c5.9,0,10.7,4.8,10.7,10.7v10.7c0,5.9,4.8,10.7,10.7,10.7H128V0"></path>
            </svg>
            <button
              className="absolute left-[14px] top-0 p-2 transition-colors rounded hover:bg-[#2A232B]"
              style={{ zIndex: 40 }}
              onClick={() => setShowSidebar(true)}
              type="button"
            >
              <span className="sr-only">Open sidebar</span>
              <PanelLeft size={16} color="#E3BAD1" />
            </button>
          </div>
        </div >
      )
      }
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ type: 'tween', duration: 0.15 }}
            className="fixed -right-3 top-0 z-20 h-16 w-28 max-sm:hidden"
            style={{ clipPath: 'inset(0px 12px 0px 0px)' }}
          >
            {/* Decorative SVG hidden to prevent sticking out visually */}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Always show the buttons in the top right */}
      <div className="fixed right-0 top-0 flex flex-row items-center z-30 pointer-events-auto max-sm:hidden" style={{ marginTop: '14px' }}>
        <div style={{ background: !showSidebar ? '#19171D' : 'transparent', borderRadius: '8px', padding: '0 8px', display: 'flex', alignItems: 'center' }}>
          <button
            ref={settingsBtnRef}
            className="p-2 transition-colors rounded"
            style={{ position: 'relative', zIndex: 1, background: !showSidebar ? '#19171D' : 'transparent' }}
            onMouseOver={e => e.currentTarget.style.background = '#2A232B'}
            onMouseOut={e => e.currentTarget.style.background = !showSidebar ? '#19171D' : 'transparent'}
            onMouseEnter={() => setShowSettingsTooltip(true)}
            onMouseLeave={() => setShowSettingsTooltip(false)}
          >
            <Settings2 size={16} style={{ color: '#E7D0DD' }} />
          </button>
          <button
            ref={themeBtnRef}
            className="p-2 transition-colors rounded ml-1"
            style={{ position: 'relative', zIndex: 1, background: !showSidebar ? '#19171D' : 'transparent' }}
            onMouseOver={e => e.currentTarget.style.background = '#2A232B'}
            onMouseOut={e => e.currentTarget.style.background = !showSidebar ? '#19171D' : 'transparent'}
            onMouseEnter={() => setShowThemeTooltip(true)}
            onMouseLeave={() => setShowThemeTooltip(false)}
          >
            <Sun size={18} style={{ color: '#E7D0DD' }} />
          </button>
        </div>
        {ReactDOM.createPortal(
          <AnimatePresence>
            {showSettingsTooltip && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.08, duration: 0.18 } }}
                exit={{ opacity: 0, y: 8, transition: { duration: 0.12 } }}
                style={{
                  position: 'fixed',
                  top: settingsTooltipPos.top,
                  left: settingsTooltipPos.left,
                  transform: 'translateX(-50%)',
                  zIndex: 9999,
                  color: '#E2CBD8',
                }}
                className="px-2 py-1 bg-black text-xs rounded whitespace-nowrap"
              >
                Settings
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
        {ReactDOM.createPortal(
          <AnimatePresence>
            {showThemeTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.08, duration: 0.18 } }}
                exit={{ opacity: 0, y: 8, transition: { duration: 0.12 } }}
                style={{
                  position: 'fixed',
                  top: themeTooltipPos.top,
                  left: themeTooltipPos.left,
                  transform: 'translateX(-50%)',
                  zIndex: 9999,
                  color: '#E2CBD8',
                }}
                className="px-2 py-1 bg-black text-xs rounded whitespace-nowrap"
              >
                Theme
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
      {/* Left-side settings and theme buttons (mirroring right-side) */}
      {windowWidth > 960 && !showSidebar && (
        <>
          <div className="fixed left-2 top-[-1] flex flex-col items-center z-30 pointer-events-auto max-sm:hidden" style={{ marginTop: '14px' }}>
            <div className="relative flex flex-row items-center justify-center" style={{ width: '96px', height: '40px', background: '#19171D', borderRadius: '8px', padding: '0 4px' }}>
              <button
                ref={leftSettingsBtnRef}
                className="p-2 transition-colors rounded"
                style={{ position: 'relative', zIndex: 1, background: '#19171D' }}
                onClick={() => setShowSidebar(true)}
                onMouseOver={e => e.currentTarget.style.background = '#2A232B'}
                onMouseOut={e => e.currentTarget.style.background = '#19171D'}
              >
                <PanelLeft size={16} style={{ color: '#E7D0DD' }} />
              </button>
              <button
                className="p-2 transition-colors rounded ml-1"
                style={{ position: 'relative', zIndex: 1, background: '#19171D' }}
                onMouseOver={e => e.currentTarget.style.background = '#2A232B'}
                onMouseOut={e => e.currentTarget.style.background = '#19171D'}
              >
                <Search size={16} style={{ color: '#E7D0DD' }} />
              </button>
              <button
                ref={leftThemeBtnRef}
                className="p-2 rounded ml-1"
                style={{ position: 'relative', zIndex: 1, background: '#19171D', opacity: 0.5, pointerEvents: 'none' }}
                tabIndex={-1}
                aria-disabled="true"
              >
                <Plus size={18} style={{ color: '#E7D0DD' }} />
              </button>
            </div>
          </div>
        </>
      )}
      <motion.main
        className="flex-1 flex flex-col p-6 md:p-10 pb-0 relative h-full border rounded-xl"
        style={{
          border: '1px solid #322028',
          borderRadius: '0.75rem',
          marginTop: '15px',
          background: '#221D27',
        }}
      >
        <header className="flex justify-end items-center mb-10"></header>

        <div className="flex-1 flex flex-col items-center">
          {!message.trim() && (
            <div className="w-full max-w-2xl animate-scale-in" style={{ marginTop: '100px' }}>
              <h2 className="text-3xl font-semibold mb-8 text-left">
                {user ? `How can I help you, ${user.displayName.split(' ')[0]}?` : 'How can I help you?'}
              </h2>

              <div className="flex flex-wrap gap-2 mb-6">
                {['Create', 'Explore', 'Code', 'Learn'].map((cat) => (
                  selectedCategory === cat ? (
                    <Button
                      key={cat}
                      icon={
                        cat === 'Create' ? <Sparkles className="text-sm" size={16} /> :
                          cat === 'Explore' ? <Newspaper className="text-sm" size={16} /> :
                            cat === 'Code' ? <span className="material-icons text-sm">code</span> :
                              <GraduationCap className="text-sm" size={16} />
                      }
                      onClick={() => setSelectedCategory(null)}
                      rounded={true}
                    >
                      {cat}
                    </Button>
                  ) : (
                    <CategoryButton
                      key={cat}
                      icon={
                        cat === 'Create' ? <Sparkles className="text-sm" size={16} /> :
                          cat === 'Explore' ? <Newspaper className="text-sm" size={16} /> :
                            cat === 'Code' ? <span className="material-icons text-sm">code</span> :
                              <GraduationCap className="text-sm" size={16} />
                      }
                      text={cat}
                      onClick={() => setSelectedCategory(cat)}
                    />
                  )
                ))}
              </div>

              <div className="w-full">
                {(selectedCategory
                  ? CATEGORY_QUESTIONS[selectedCategory]
                  : defaultQuestions
                ).map((q, i) => (
                  <p
                    key={i}
                    className="p-3 rounded-lg text-sm font-bold cursor-pointer hover:bg-[#2C2532] transition-colors text-left border-b"
                    style={{ borderBottomColor: '#29222E', color: '#BFB3CB' }}
                    onClick={() => handleQuestionClick(q)}
                  >
                    {q}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Banner for terms and privacy policy, always above the input */}
        {!user && !firstMessageSent && (
          <div className="flex items-center justify-center mx-auto mb-6" style={{ background: '#201B25', color: '#ACA1B7', width: '430px', height: '54px', borderRadius: '12px 12px 0 0', border: '1px solid #2A222E', zIndex: 10, marginBottom: '100px', padding: 0 }}>
            <span style={{ color: '#ACA1B7', fontSize: '14px', fontWeight: 500, lineHeight: '1.2' }}>
              Make sure you agree to our <a href="/terms-of-service" style={{ color: '#fff', textDecoration: 'underline' }}>Terms</a> and our <a href="/privacy-policy" style={{ color: '#fff', textDecoration: 'underline' }}>Privacy Policy</a>
            </span>
          </div>
        )}

        <MessageInput message={message} setMessage={setMessage} onFirstMessageSent={() => setFirstMessageSent(true)} />
      </motion.main>
    </>
  );
}

export default MainContent; 