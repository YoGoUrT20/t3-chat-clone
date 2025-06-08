import React, { useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import SendButton from './SendButton';
import InputSettingsBar from './InputSettingsBar';

function MessageInput({ message, setMessage, onFirstMessageSent }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
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
          width: '750px', 
          marginLeft: 0,
          marginRight: 0,
          border: '1px solid #312B38',
          boxShadow: '0 0 0 10px #26202B, 0 0 0 11px #2D2231',
          paddingTop: '28px',
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
            style={{ minHeight: '40px', maxHeight: '120px', overflowY: 'auto', marginTop: 0, padding: 0 }}
          />
          <InputSettingsBar />
          <div className="absolute bottom-[10px] right-[10px]">
            <SendButton
              disabled={!message.trim()}
              onClick={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageInput; 