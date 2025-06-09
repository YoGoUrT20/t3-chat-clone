import React, { useState, useEffect } from 'react';
import { Newspaper, GraduationCap, Sparkles } from 'lucide-react';
import CategoryButton from './CategoryButton';
import MessageInput from './MessageInput';
import { motion } from 'framer-motion';
import { useAuth } from '../AuthContext';
import Button from './Button';
import { CATEGORY_QUESTIONS, defaultQuestions } from '../constants';
import Chat from './Chat';

function MainContent() {
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const [firstMessageSent, setFirstMessageSent] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    setMessage('');
  }, []); // Reset message when key changes (component remounts)


  const handleQuestionClick = (question) => {
    setMessage(question);
  };

  const handleSubmit = () => {
    setFirstMessageSent(true);
    setMessage('');
  };

  return (
    <>
      {/* Always show the buttons in the top right */}
      {/* Removed settings and theme buttons */}
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
          {!firstMessageSent && !message.trim() && (
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
                    className="p-3 rounded-lg text-sm font-bold cursor-pointer hover:bg-[#2C2532] transition-colors text-left border-b break-words whitespace-pre-line sm:whitespace-normal sm:break-normal overflow-x-auto"
                    style={{ borderBottomColor: '#29222E', color: '#BFB3CB', wordBreak: 'break-word' }}
                    onClick={() => handleQuestionClick(q)}
                  >
                    {q}
                  </p>
                ))}
              </div>
            </div>
          )}
          {firstMessageSent && (
            <Chat />
          )}
        </div>

        {/* Banner for terms and privacy policy, always above the input */}
        {!user && !firstMessageSent && (
          <div className="flex items-center justify-center mx-auto mb-6" style={{ background: '#201B25', color: '#ACA1B7', width: '430px', height: '54px', borderRadius: '12px 12px 0 0', border: '1px solid #2A222E', zIndex: 10, marginBottom: '-1px', padding: 0 }}>
            <span style={{ color: '#ACA1B7', fontSize: '14px', fontWeight: 500, lineHeight: '1.2' }}>
              Make sure you agree to our <a href="/terms-of-service" style={{ color: '#fff', textDecoration: 'underline' }}>Terms</a> and our <a href="/privacy-policy" style={{ color: '#fff', textDecoration: 'underline' }}>Privacy Policy</a>
            </span>
          </div>
        )}

        <MessageInput message={message} setMessage={setMessage} onFirstMessageSent={() => setFirstMessageSent(true)} onOpenOptions={() => { }} onSubmit={handleSubmit} isLoading={false} />
      </motion.main>
    </>
  );
}

export default MainContent; 