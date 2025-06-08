import React, { useRef, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import SendButton from './SendButton';
import InputSettingsBar from './InputSettingsBar';

function MessageInput({ message, setMessage, onFirstMessageSent }) {
  const textareaRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSendMessage = () => {
    if (message.trim()) {
      toast.success('Message sent!');
      setMessage('');
      if (onFirstMessageSent) {
        onFirstMessageSent();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 w-full flex justify-center">
      <div 
        className="input-area-bg p-3 rounded-t-xl relative" 
        style={{ 
          width: Math.min(750, windowWidth - 40) + 'px',
          maxWidth: '100%',
          margin: '0 auto',
          marginTop: windowWidth > 960 ? 64 : 0,
          border: '1px solid #312B38',
          boxShadow: '0 0 0 7px #26202B, 0 0 0 8px #2D2231',
          background: '#2C2430',
          height: '128px',
        }}>
        <div className="flex flex-col gap-3 relative">
          <textarea 
            ref={textareaRef}
            className="bg-transparent w-full focus:outline-none text-gray-300 placeholder-message-input border-none resize-none custom-placeholder p-0"
            placeholder="Type your message here..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px', overflowY: 'auto', marginTop: 0, padding: 0, height: '48px', color: '#EFEEF1' }}
          />
          <div className="absolute left-[-12px] bottom-[-60px] w-full">
            <InputSettingsBar>
              <div className="ml-2 relative" style={{ top: '-18px', right: '-14px' }}>
                <SendButton
                  disabled={!message.trim()}
                  onClick={handleSendMessage}
                />
              </div>
            </InputSettingsBar>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageInput; 