import React, { useState, useEffect } from 'react';
import { Newspaper, Sun, Settings2, GraduationCap, Sparkles } from 'lucide-react';
import CategoryButton from './CategoryButton';
import MessageInput from './MessageInput';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';

function MainContent() {
  const [message, setMessage] = useState('');
  const [showSettingsTooltip, setShowSettingsTooltip] = useState(false);
  const [showThemeTooltip, setShowThemeTooltip] = useState(false);
  const [settingsTooltipPos, setSettingsTooltipPos] = useState({ top: 0, left: 0 });
  const [themeTooltipPos, setThemeTooltipPos] = useState({ top: 0, left: 0 });
  const settingsBtnRef = React.useRef(null);
  const themeBtnRef = React.useRef(null);
  const { user } = useAuth();
  const [firstMessageSent, setFirstMessageSent] = useState(false);

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

  const handleQuestionClick = (question) => {
    setMessage(question);
  };

  return (
    <>
      <div className="fixed -right-3 top-0 z-20 h-16 w-28 max-sm:hidden" style={{ clipPath: 'inset(0px 12px 0px 0px)' }}>
        <div className="group pointer-events-none absolute top-3.5 z-10 -mb-8 h-32 w-full origin-top transition-all ease-snappy" style={{ boxShadow: '10px -10px 8px 2px hsl(var(--gradient-noise-top))' }}>
          <svg className="absolute -right-8 h-9 origin-top-left skew-x-[30deg] overflow-visible" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 128 32" xmlSpace="preserve">
            <line stroke="#1A1319" strokeWidth="2px" shapeRendering="optimizeQuality" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeMiterlimit="10" x1="1" y1="0" x2="128" y2="0"></line>
            <path className="translate-y-[0.5px]" fill="#1A1319" shapeRendering="optimizeQuality" strokeWidth="1px" strokeLinecap="round" strokeMiterlimit="10" vectorEffect="non-scaling-stroke" d="M0,0c5.9,0,10.7,4.8,10.7,10.7v10.7c0,5.9,4.8,10.7,10.7,10.7H128V0" stroke="#1A1319"></path>
          </svg>
          <div className="absolute right-12 top-0 flex flex-col items-center z-30 pointer-events-auto">
            <div className="relative">
              <button
                ref={settingsBtnRef}
                className="p-2 hover:bg-gray-700 transition-colors"
                onMouseEnter={() => setShowSettingsTooltip(true)}
                onMouseLeave={() => setShowSettingsTooltip(false)}
              >
                <Settings2 size={16} style={{ color: '#E7D0DD' }} />
              </button>
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
            </div>
          </div>
          <div className="absolute top-0 right-4 flex flex-col items-center space-y-2 z-30 pointer-events-auto">
            <div className="relative">
              <button
                ref={themeBtnRef}
                className="p-2 hover:bg-gray-700 transition-colors"
                onMouseEnter={() => setShowThemeTooltip(true)}
                onMouseLeave={() => setShowThemeTooltip(false)}
              >
                <Sun size={18} style={{ color: '#E7D0DD' }} />
              </button>
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
          </div>
        </div>
      </div>
      <main className="flex-1 flex flex-col p-6 md:p-10 pb-0 relative h-full border rounded-xl" style={{ border: '1px solid #322028', borderRadius: '0.75rem', marginTop: '15px', background: '#221D27' }}>
        <header className="flex justify-end items-center mb-10"></header>

        <div className="flex-1 flex flex-col items-center">
          {!message.trim() && (
            <div className="w-full max-w-2xl animate-scale-in" style={{ marginTop: '100px' }}>
              <h2 className="text-3xl font-semibold mb-8 text-left">How can I help you, Yehor?</h2>

              <div className="flex flex-wrap gap-2 mb-6">
                <CategoryButton
                  icon={<Sparkles className="text-sm" size={16} />}
                  text="Create"
                />
                <CategoryButton
                  icon={<Newspaper className="text-sm" size={16} />}
                  text="Explore"
                />
                <CategoryButton
                  icon={<span className="material-icons text-sm">code</span>}
                  text="Code"
                />
                <CategoryButton
                  icon={<GraduationCap className="text-sm" size={16} />}
                  text="Learn"
                />
              </div>

              <div className="w-full">
                <p
                  className="p-3 rounded-lg text-sm font-bold cursor-pointer hover:bg-[#2C2532] transition-colors text-left border-b"
                  style={{ borderBottomColor: '#29222E', color: '#BFB3CB' }}
                  onClick={() => handleQuestionClick('How does AI work?')}
                >
                  How does AI work?
                </p>
                <p
                  className="p-3 rounded-lg text-sm font-bold cursor-pointer hover:bg-[#2C2532] transition-colors text-left border-b"
                  style={{ borderBottomColor: '#29222E', color: '#BFB3CB' }}
                  onClick={() => handleQuestionClick('Are black holes real?')}
                >
                  Are black holes real?
                </p>
                <p
                  className="p-3 rounded-lg text-sm font-bold cursor-pointer hover:bg-[#2C2532] transition-colors text-left border-b"
                  style={{ borderBottomColor: '#29222E', color: '#BFB3CB' }}
                  onClick={() => handleQuestionClick('How many R\'s are in the word "strawberry"?')}
                >
                  How many R&apos;s are in the word &quot;strawberry&quot;?
                </p>
                <p
                  className="p-3 rounded-lg text-sm font-bold cursor-pointer hover:bg-[#2C2532] transition-colors text-left"
                  style={{ color: '#BFB3CB' }}
                  onClick={() => handleQuestionClick('What is the meaning of life?')}
                >
                  What is the meaning of life?
                </p>
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
      </main>
    </>
  );
}

export default MainContent; 