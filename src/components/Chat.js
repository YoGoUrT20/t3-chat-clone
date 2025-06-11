import React, { useState, useEffect, useRef } from 'react';
import { User, Bot, RefreshCw, Share2, Copy, GitBranch } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import RerollModelSelector from './RerollModelSelector';
import { AnimatePresence, motion } from 'framer-motion';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import styles from './Chat.module.css';
import Tooltip from './Tooltip';

function Chat({ modelFamily, messages, onReroll }) {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
  const [rerollOpen, setRerollOpen] = useState(false);
  const [rerollMsg, setRerollMsg] = useState(null);
  const scrollRef = useRef(null);
  const containerRef = useRef(null);
  const [displayedMessages, setDisplayedMessages] = useState([]);
  const [visibleCount, setVisibleCount] = useState(2);
  const revealTimeouts = useRef([]);

  // Subject to change
  const familyBgColors = {
    gemini: 'bg-gradient-to-r from-blue-400/30 to-blue-700/40 text-blue-100',
    chatgpt: 'bg-gradient-to-r from-green-400/30 to-green-700/40 text-green-100',
    claude: 'bg-gradient-to-r from-yellow-300/30 to-yellow-600/40 text-yellow-900',
    llama: 'bg-gradient-to-r from-purple-300/30 to-purple-700/40 text-purple-100',
    deepseek: 'bg-gradient-to-r from-pink-300/30 to-pink-700/40 text-pink-100',
    grok: 'bg-gradient-to-r from-orange-300/30 to-orange-700/40 text-orange-100',
    qwen: 'bg-gradient-to-r from-red-300/30 to-red-700/40 text-red-100',
  };
  const llmBg = familyBgColors[modelFamily] || 'bg-[#201B25] text-[#BFB3CB]';

  const lastLlmIndex = [...messages].reverse().findIndex(m => m.sender === 'llm');
  const lastLlmMsg = lastLlmIndex !== -1 ? messages[messages.length - 1 - lastLlmIndex] : null;
  const lastLlmMsgId = lastLlmMsg ? lastLlmMsg.id : null;

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

  useEffect(() => {
    revealTimeouts.current.forEach(clearTimeout);
    revealTimeouts.current = [];
    if (!messages || messages.length === 0) {
      setDisplayedMessages([]);
      setVisibleCount(2);
      return;
    }
    const localMessages = [...messages];
    setVisibleCount(localMessages.length);
    setDisplayedMessages(localMessages);
    return () => {
      revealTimeouts.current.forEach(clearTimeout);
      revealTimeouts.current = [];
    };
  }, [messages]);

  // Scroll handler to load more messages when scrolled to top
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    function handleScroll() {
      if (container.scrollTop === 0 && messages.length > displayedMessages.length) {
        setVisibleCount(count => {
          const newCount = Math.min(messages.length, count + 10);
          setDisplayedMessages(messages.slice(messages.length - newCount));
          return newCount;
        });
      }
    }
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages, displayedMessages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [displayedMessages]);

  return (
    <>
      <div
        ref={containerRef}
        className='flex flex-col gap-4 w-full max-w-2xl mx-auto py-8 px-2'
      >
        <AnimatePresence initial={false}>
          {displayedMessages.filter(Boolean).map((msg, idx, arr) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                {msg.sender === 'llm' && (
                  <div className='flex items-end mr-2'>
                    <span className='bg-[#2A222E] p-2 rounded-full'><Bot size={20} className='text-[#BFB3CB]' /></span>
                  </div>
                )}
                <div className={`max-w-[70%] px-4 py-2 rounded-xl text-base ${msg.sender === 'user' ? 'bg-[#4D1F39] text-[#F4E9EE] rounded-br-none' : `${llmBg} rounded-bl-none`}`} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  <ReactMarkdown
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      code({node, inline, className, children, ...props}) {
                        if (inline) {
                          return <code className='bg-[#2A222E] px-1 py-0.5 rounded text-[#E0E8FF] font-mono text-sm'>{children}</code>;
                        }
                        const codeString = String(children).trim();
                        const lineCount = codeString.split('\n').length;
                        const buttonClass = lineCount === 2
                          ? 'absolute top-6 right-4 p-1 rounded hover:bg-[#332940] transition opacity-70 group-hover:opacity-100'
                          : 'absolute top-3 right-2 p-1 rounded hover:bg-[#332940] transition opacity-70 group-hover:opacity-100';
                        return (
                          <div className='relative group'>
                            <pre className={`chat-markdown-pre bg-[#2A222E] p-3 rounded-lg overflow-x-auto my-2 ${styles.chatMarkdownPre}`}><code className={'text-[#E0E8FF] font-mono text-sm ' + (className || '')}>{children}</code></pre>
                            <button
                              className={buttonClass}
                              onClick={() => handleCopy(codeString)}
                              type='button'
                              tabIndex={0}
                              aria-label='Copy code'
                            >
                              <Copy size={16} className='text-[#BFB3CB]' />
                            </button>
                          </div>
                        );
                      },
                      ul({children, ...props}) {
                        return <ul className='list-disc pl-6 my-2'>{children}</ul>;
                      },
                      ol({children, ...props}) {
                        return <ol className='list-decimal pl-6 my-2'>{children}</ol>;
                      },
                      li({children, ...props}) {
                        return <li className='mb-1'>{children}</li>;
                      },
                      strong({children, ...props}) {
                        return <strong className='font-bold text-[#F9B4D0]'>{children}</strong>;
                      },
                    }}
                  >{msg.text}</ReactMarkdown>
                </div>
                {msg.sender === 'user' && (
                  <div className='flex items-end ml-2'>
                    <span className='bg-[#4D1F39] p-2 rounded-full'><User size={20} className='text-[#F4E9EE]' /></span>
                  </div>
                )}
              </div>
              {msg.sender === 'llm' && msg.id === lastLlmMsgId && (
                <div className='flex gap-2 mt-2 ml-10 relative'>
                  <button className='p-2 rounded-lg hover:bg-[#332940] transition' onClick={() => { setRerollOpen(true); setRerollMsg(msg); }}
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
                    <Tooltip x={tooltip.x} y={tooltip.y} text={tooltip.text} />
                  )}
                </div>
              )}
              {/* Error message if last message is user and no LLM response follows */}
              {msg.sender === 'user' && idx === arr.length - 1 && (!arr.some((m, i) => i > idx && m.sender === 'llm')) && (
                <div className='flex w-full justify-end mt-2'>
                  <div className='flex items-center gap-2 bg-[#3B232B] text-[#F9B4D0] px-4 py-2 rounded-xl max-w-[70%]'>
                    <RefreshCw size={18} className='text-[#F9B4D0]' />
                    <span>Request was unsuccessful. Please try again.</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={scrollRef} />
      </div>
      <DialogPrimitive.Root open={rerollOpen} onOpenChange={setRerollOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0' />
          <AnimatePresence>
            {rerollOpen && (
              <DialogPrimitive.Content forceMount asChild>
                <div className='fixed inset-0 z-50 flex items-center justify-center pointer-events-none'>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className='rounded-2xl shadow-2xl p-8 max-w-xl w-full focus:outline-none border border-[#332940] backdrop-blur-xl bg-[#201B25]/60 text-[#BFB3CB] pointer-events-auto relative'
                    style={{ maxWidth: 600, background: 'rgba(32,27,37,0.55)', boxShadow: '0 8px 40px 0 rgba(32,27,37,0.25), 0 1.5px 8px 0 rgba(255,255,255,0.08) inset', backdropFilter: 'blur(24px)' }}
                  >
                    {rerollMsg && (
                      <RerollModelSelector
                        currentModelName={rerollMsg.model}
                        onSelect={model => {
                          setRerollOpen(false);
                          if (onReroll) onReroll(rerollMsg, model);
                        }}
                      />
                    )}
                    <DialogPrimitive.Close asChild>
                      <button className='absolute top-4 right-4 p-2 rounded hover:bg-[#332940]/60 transition'>
                        <span className='sr-only'>Close</span>
                        <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M6 6L14 14M14 6L6 14' stroke='#BFB3CB' strokeWidth='2' strokeLinecap='round' /></svg>
                      </button>
                    </DialogPrimitive.Close>
                  </motion.div>
                </div>
              </DialogPrimitive.Content>
            )}
          </AnimatePresence>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

export default Chat; 