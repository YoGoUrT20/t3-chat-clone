import React, { useState } from 'react';
import { User, Bot, RefreshCw, Share2, Copy, GitBranch } from 'lucide-react';
import toast from 'react-hot-toast';

function Chat() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'llm', text: 'Hello! How can I assist you today?' },
    { id: 2, sender: 'user', text: 'Can you help me with a React question?' },
    { id: 3, sender: 'llm', text: 'Of course! What do you need to know about React?' },
    { id: 4, sender: 'user', text: 'How do I use hooks?' },
  ]);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });

  const lastLlmIndex = [...messages].reverse().findIndex(m => m.sender === 'llm');
  const lastLlmMsgId = lastLlmIndex !== -1 ? messages[messages.length - 1 - lastLlmIndex].id : null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const showTooltip = (e, text) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.bottom,
      text,
    });
  };
  const hideTooltip = () => {
    setTooltip({ visible: false, x: 0, y: 0, text: '' });
  };

  return (
    <div className='flex flex-col gap-4 w-full max-w-2xl mx-auto py-8 px-2'>
      {messages.map((msg) => (
        <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}> 
          <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
            {msg.sender === 'llm' && (
              <div className='flex items-end mr-2'>
                <span className='bg-[#2A222E] p-2 rounded-full'><Bot size={20} className='text-[#BFB3CB]' /></span>
              </div>
            )}
            <div className={`max-w-[70%] px-4 py-2 rounded-xl text-base font-medium ${msg.sender === 'user' ? 'bg-[#4D1F39] text-[#F4E9EE] rounded-br-none' : 'bg-[#201B25] text-[#BFB3CB] rounded-bl-none'}`}>{msg.text}</div>
            {msg.sender === 'user' && (
              <div className='flex items-end ml-2'>
                <span className='bg-[#4D1F39] p-2 rounded-full'><User size={20} className='text-[#F4E9EE]' /></span>
              </div>
            )}
          </div>
          {msg.sender === 'llm' && msg.id === lastLlmMsgId && (
            <div className='flex gap-2 mt-2 ml-10 relative'>
              <button className='p-2 rounded-lg hover:bg-[#332940] transition' onClick={() => toast('Reroll not implemented')}
                onMouseEnter={e => showTooltip(e, 'Reroll answer')}
                onMouseLeave={hideTooltip}
              > <RefreshCw size={16} className='text-[#BFB3CB]' /> </button>
              <button className='p-2 rounded-lg hover:bg-[#332940] transition' onClick={() => toast('Share not implemented')}
                onMouseEnter={e => showTooltip(e, 'Share')}
                onMouseLeave={hideTooltip}
              > <Share2 size={16} className='text-[#BFB3CB]' /> </button>
              <button className='p-2 rounded-lg hover:bg-[#332940] transition' onClick={() => handleCopy(msg.text)}
                onMouseEnter={e => showTooltip(e, 'Copy message')}
                onMouseLeave={hideTooltip}
              > <Copy size={16} className='text-[#BFB3CB]' /> </button>
              <button className='p-2 rounded-lg hover:bg-[#332940] transition' onClick={() => toast('New branch not implemented')}
                onMouseEnter={e => showTooltip(e, 'New branch')}
                onMouseLeave={hideTooltip}
              > <GitBranch size={16} className='text-[#BFB3CB]' /> </button>
              {tooltip.visible && tooltip.text && (
                <div
                  style={{
                    position: 'fixed',
                    left: tooltip.x,
                    top: tooltip.y + 8,
                    transform: 'translateX(-50%)',
                    zIndex: 50,
                    pointerEvents: 'none',
                  }}
                  className='px-2 py-1 rounded bg-zinc-900 text-white text-xs shadow-lg border border-zinc-700 select-none mt-1'
                >
                  {tooltip.text}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Chat; 