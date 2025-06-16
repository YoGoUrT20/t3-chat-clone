import React, { useState, useEffect, useRef } from 'react';
import { User, Bot, Copy, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { AnimatePresence, motion } from 'framer-motion';
import rehypeHighlight from 'rehype-highlight';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import styles from './Chat.module.css';
import { useParams, useLocation } from 'react-router-dom';
import { colorThemes, backgroundOptions, glowOptions, modelFamilyGlowGradients } from '../constants';
import remarkGfm from 'remark-gfm';
import { models } from '../models'
import ActionButtons from './ActionButtons';
import TableWithActions from './TableWithActions';
import { useIsMobile } from '../hooks/use-mobile';

function Chat({ modelFamily, messages: propMessages, onReroll, loading, isThinking, selectedBranchId, setSelectedBranchId, branches = {}, setBranches, branchLoading, setBranchLoading = () => {}, onBranchesChange, isTemporaryChat, chatContainerRef }) {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
  const scrollRef = useRef(null);
  const containerRef = useRef(null);
  const [displayedMessages, setDisplayedMessages] = useState([]);
  const [visibleCount, setVisibleCount] = useState(2);
  const revealTimeouts = useRef([]);
  const { id: chatId } = useParams();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const location = useLocation();
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(null);
  const branchDropdownRef = useRef(null);
  const fontFamily = localStorage.getItem('chat_font') || 'Inter';
  const themeName = localStorage.getItem('chat_theme') || 'Classic';
  const themeObj = colorThemes.find(t => t.name === themeName) || colorThemes[0];
  const backgroundName = localStorage.getItem('chat_bg') || 'default'
  const bgObj = backgroundOptions.find(b => b.value === backgroundName) || backgroundOptions[0]
  const glowType = localStorage.getItem('glow_type') || 'glow-blue-purple';
  const glowIntensity = (() => {
    const val = localStorage.getItem('glow_intensity');
    return val !== null ? parseFloat(val) : 0.7;
  })();
  const isMobile = useIsMobile();

  const msgRefs = useRef([])
  const bubbleRefs = useRef([])

 

  useEffect(() => {
    // Only run fetchBranches if setBranchLoading is a real function (not the default no-op)
    if (isTemporaryChat || setBranchLoading.toString() === '() => {}') return;
    async function fetchBranches() {
      setBranchLoading(true);
      try {
        const FUNCTIONS_URL = process.env.REACT_APP_FUNCTIONS_URL;
        const apiKey = localStorage.getItem('apiKey') || '';
        const res = await fetch(`${FUNCTIONS_URL}/getChatWithBranches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
          body: JSON.stringify({ chatid: chatId }),
        });
        if (!res.ok) throw new Error('Failed to load branches');
        const data = await res.json();
        setBranches(data.branches || {});
        setSelectedBranchId(Object.keys(data.branches || { root: 1 })[0] || 'root');
      } catch (err) {
        toast.error('Failed to load branches');
      }
      setBranchLoading(false);
    }
    if (chatId) fetchBranches();
  }, [chatId, isTemporaryChat, setBranchLoading, setBranches, setSelectedBranchId]);

  useEffect(() => {
    revealTimeouts.current.forEach(clearTimeout);
    revealTimeouts.current = [];
    // If on root branch or branches is empty, show propMessages
    if (selectedBranchId === 'root' || Object.keys(branches).length === 0) {
      setDisplayedMessages(propMessages);
      setVisibleCount(propMessages.length);
      return;
    }
    // Only set displayedMessages from branches if not on root branch and branches is not empty
    if (selectedBranchId !== 'root' && Object.keys(branches).length > 0) {
      const branch = branches[selectedBranchId] || { messages: [] };
      const branchMessages = branch.messages || [];
      if (!branchMessages || branchMessages.length === 0) {
        setDisplayedMessages([]);
        setVisibleCount(2);
        return;
      }
      setVisibleCount(branchMessages.length);
      setDisplayedMessages(branchMessages);
    }
    // Only clear timeouts on unmount
    return () => {
      revealTimeouts.current.forEach(clearTimeout);
      revealTimeouts.current = [];
    };
  }, [branches, selectedBranchId, propMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      // Always scroll to the last message on load or when displayedMessages change
      scrollRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [displayedMessages]);

  useEffect(() => {
    // If on root branch and not loading branches, sync displayedMessages with propMessages
    if (selectedBranchId === 'root' && !branchLoading && Array.isArray(propMessages) && propMessages.length > 0) {
      setDisplayedMessages(propMessages);
      setVisibleCount(propMessages.length);
    }
  }, [propMessages, selectedBranchId, branchLoading]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target)) {
        setBranchDropdownOpen(null);
      }
    }
    if (branchDropdownOpen !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [branchDropdownOpen]);

  useEffect(() => {
    if (!onBranchesChange) return;
    onBranchesChange(branches, selectedBranchId);
  }, [branches, selectedBranchId, onBranchesChange]);

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

  const handleCreateBranch = async (parentMessageId, idx) => {
    // Always use 'msg_' + idx for parentMessageId to match backend expectations
    const realParentId = 'msg_' + idx;
    const branchId = 'branch_' + Math.random().toString(36).slice(2, 10);
    try {
      const FUNCTIONS_URL = process.env.REACT_APP_FUNCTIONS_URL;
      const apiKey = localStorage.getItem('apiKey') || '';
      const res = await fetch(`${FUNCTIONS_URL}/createBranch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ chatid: chatId, parentMessageId: realParentId, branchId }),
      });
      if (!res.ok) throw new Error('Failed to create branch');
      const data = await res.json();
      setBranches(prev => ({ ...prev, [branchId]: data.branch }));
      setSelectedBranchId(branchId);
      toast.success('Branch created');
    } catch (err) {
      toast.error('Failed to create branch');
    }
  };


  const branchOptions = Object.values(branches).map(b => ({ id: b.id, label: b.id === 'root' ? 'Main' : b.id }));
  const branch = branches[selectedBranchId] || branches.root || { messages: [] };
  const branchMessages = branch.messages || [];
  let lastLlmMsgId;
  if (selectedBranchId === 'root' && !branchLoading && Array.isArray(displayedMessages)) {
    const lastLlmIndex = [...displayedMessages].reverse().findIndex(m => m.role === 'assistant' || m.sender === 'llm');
    const lastLlmMsg = lastLlmIndex !== -1 ? displayedMessages[displayedMessages.length - 1 - lastLlmIndex] : null;
    lastLlmMsgId = lastLlmMsg ? lastLlmMsg.id || lastLlmMsg.messageId : null;
  } else {
    const lastLlmIndex = [...branchMessages].reverse().findIndex(m => m.role === 'assistant' || m.sender === 'llm');
    const lastLlmMsg = lastLlmIndex !== -1 ? branchMessages[branchMessages.length - 1 - lastLlmIndex] : null;
    lastLlmMsgId = lastLlmMsg ? lastLlmMsg.id || lastLlmMsg.messageId : null;
  }

  const handleShare = async () => {
    if (location.pathname.startsWith('/shared/')) {
      const url = window.location.href;
      setShareUrl(url);
      setShareOpen(true);
      return;
    }
    if (!chatId) {
      toast.error('Chat ID not found');
      return;
    }
    try {
      const FUNCTIONS_URL = process.env.REACT_APP_FUNCTIONS_URL;
      const apiKey = localStorage.getItem('apiKey') || '';
      const res = await fetch(`${FUNCTIONS_URL}/createSharedChat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ chatid: chatId }),
      });
      if (!res.ok) throw new Error('Failed to create shared chat');
      const data = await res.json();
      const url = `${window.location.origin}/shared/${data.sharedId}`;
      setShareUrl(url);
      setShareOpen(true);
    } catch (err) {
      toast.error('Failed to share chat');
    }
  };

  useEffect(() => {
    const syntaxTheme = localStorage.getItem('syntax_theme') || 'github-dark';
    document.querySelectorAll('link[data-syntax-theme]').forEach(link => link.remove())
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.type = 'text/css'
    link.href = `/node_modules/highlight.js/styles/${syntaxTheme}.css`
    link.setAttribute('data-syntax-theme', 'true')
    document.head.appendChild(link)
    return () => {
      link.remove()
    }
  }, [])

  useEffect(() => {
    if (chatContainerRef && chatContainerRef.current && displayedMessages.length > 0) {
      setTimeout(() => {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }, 0);
    }
  }, [displayedMessages, chatContainerRef]);

  return (
    <>
    
      <div
        ref={containerRef}
        className={`flex flex-col gap-4 w-full mx-auto py-4 px-2`}
        style={isMobile ? {} : { maxWidth: 700 }}
      >
        <AnimatePresence initial={false}>
          {displayedMessages.filter(Boolean).map((msg, idx, arr) => {
            const isUser = msg.role === 'user' || msg.sender === 'user';
            const key = msg.id || msg.messageId || ('msg_' + idx);
            if (!msgRefs.current[idx]) msgRefs.current[idx] = null
            const msgRefCb = el => { msgRefs.current[idx] = el }
            const msgBg = (msg.role === 'user' || msg.sender === 'user') ? themeObj.user.bg : themeObj.assistant.bg;
            let msgText = (msg.role === 'user' || msg.sender === 'user') ? themeObj.user.text : themeObj.assistant.text;
            const themeType = themeObj.themeType;
            if (themeType === 'dark') msgText = '#E0E8FF';
            if (themeType === 'light') msgText = '#2A222E';
            let msgContent = msg.content || msg.text || ''
            let glowGradient = '';
            if (bgObj.value === 'model-glow' && (msg.role === 'assistant' || msg.sender === 'llm')) {
              let modelName = (msg.model || msg.modelName || msg.model_name || '').toLowerCase()
              let modelObj = models.find(m => (m.name && m.name.toLowerCase() === modelName) || (m.openRouterName && m.openRouterName.toLowerCase() === modelName))
              if (!modelObj && modelName) {
                modelObj = models.find(m => m.openRouterName && modelName.startsWith(m.openRouterName.toLowerCase()))
              }
              let family = modelObj ? modelObj.family : null
              if (family && modelFamilyGlowGradients[family]) {
                glowGradient = modelFamilyGlowGradients[family]
              } else {
                const found = glowOptions.find(opt => opt.value === glowType)
                glowGradient = found ? found.gradient : glowOptions[0].gradient
              }
            } else if (bgObj.value === 'glow-under') {
              const found = glowOptions.find(opt => opt.value === glowType)
              glowGradient = found ? found.gradient : glowOptions[0].gradient
            }
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`} style={{ position: (bgObj.value === 'glow-under' || (bgObj.value === 'model-glow' && !isUser)) ? 'relative' : undefined }}>
                  {(bgObj.value === 'glow-under' || (bgObj.value === 'model-glow' && !isUser)) && (() => {
                    // Deterministic random offset for each message
                    const randomOffset = ((Math.sin(idx * 9301 + 49297) * 233280) % 1) * 20 - 10; // -10 to +10
                    return (
                      <div
                        style={{
                          position: 'absolute',
                          left: `calc(50% + ${randomOffset}%)`,
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '60%',
                          height: '60%',
                          minWidth: 60,
                          minHeight: 60,
                          padding: 60,
                          zIndex: 0,
                          pointerEvents: 'none',
                          filter: `blur(100px)`,
                          willChange: 'filter',
                          opacity: glowIntensity * 0.7,
                          background: glowGradient,
                          borderRadius: '50%',
                          transition: 'width 0.2s, height 0.2s, filter 0.2s, opacity 0.2s',
                        }}
                      />
                    );
                  })()}
                  {(msg.role === 'assistant' || msg.sender === 'llm') && (
                    <div className='flex items-end mr-2'>
                      <span className='bg-[#2A222E] p-2 rounded-full'><Bot size={20} className='text-[#BFB3CB]' /></span>
                    </div>
                  )}
                  <div ref={(bgObj.value === 'glow-under' || (bgObj.value === 'model-glow' && !isUser)) ? msgRefCb : undefined} className={`max-w-[70%] px-4 py-2 rounded-xl text-base ${(msg.role === 'user' || msg.sender === 'user') ? 'rounded-br-none self-end' : 'rounded-bl-none self-start'}`}
                    style={{
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                      fontFamily,
                      background: msgBg,
                      color: msgText,
                      position: 'relative',
                      zIndex: 1,
                      maxWidth: '80vw',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Render a hidden message bubble for width measurement */}
                    <div
                      ref={el => { bubbleRefs.current[idx] = el }}
                      style={{
                        position: 'absolute',
                        visibility: 'hidden',
                        height: 0,
                        overflow: 'hidden',
                        pointerEvents: 'none',
                        whiteSpace: 'pre-wrap',
                        fontFamily,
                        fontSize: '1rem',
                        fontWeight: 400,
                        maxWidth: '70%',
                        padding: '0.5rem 1rem',
                        boxSizing: 'border-box',
                        borderRadius: 20,
                        background: msgBg,
                        color: msgText,
                      }}
                    >
                      {msgContent}
                    </div>
                    <ReactMarkdown
                      rehypePlugins={[rehypeHighlight]}
                      remarkPlugins={[remarkGfm]}
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
                            <pre className={`chatMarkdownPre bg-[#2A222E] p-3 rounded-lg overflow-x-auto my-2 relative group ${styles.chatMarkdownPre}`}>
                              <code className={'text-[#E0E8FF] font-mono text-sm ' + (className || '')}>{children}</code>
                              <button
                                className={buttonClass}
                                onClick={() => handleCopy(codeString)}
                                type='button'
                                tabIndex={0}
                                aria-label='Copy code'
                                style={{ position: 'absolute' }}
                              >
                                <Copy size={16} className='text-[#BFB3CB]' />
                              </button>
                            </pre>
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
                        table({children, ...props}) {
                          return <TableWithActions>{children}</TableWithActions>;
                        },
                        thead({children, ...props}) {
                          return <thead className='bg-[#2A222E]'>{children}</thead>;
                        },
                        tbody({children, ...props}) {
                          return <tbody>{children}</tbody>;
                        },
                        tr({children, ...props}) {
                          return <tr className='border-b border-[#332940] last:border-0'>{children}</tr>;
                        },
                        th({children, ...props}) {
                          return <th className='px-3 py-2 text-left font-semibold text-[#F9B4D0] bg-[#2A222E]'>{children}</th>;
                        },
                        td({children, ...props}) {
                          return <td className='px-3 py-2 text-[#E0E8FF]'>{children}</td>;
                        },
                      }}
                    >{msg.content || msg.text}</ReactMarkdown>
                  </div>
                  {(msg.role === 'user' || msg.sender === 'user') && (
                    <div className='flex items-end ml-2'>
                      <span className='bg-[#4D1F39] p-2 rounded-full'><User size={20} className='text-[#F4E9EE]' /></span>
                    </div>
                  )}
                </div>
                {(msg.role === 'assistant' || msg.sender === 'llm') && (msg.id === lastLlmMsgId || msg.messageId === lastLlmMsgId) && (msg.content || msg.text) && visibleCount === displayedMessages.length && !loading && !branchLoading && (
                  <ActionButtons
                    msg={msg}
                    idx={idx}
                    lastLlmMsgId={lastLlmMsgId}
                    isTemporaryChat={isTemporaryChat}
                    branchDropdownOpen={branchDropdownOpen}
                    setBranchDropdownOpen={setBranchDropdownOpen}
                    branchDropdownRef={branchDropdownRef}
                    branchOptions={branchOptions}
                    selectedBranchId={selectedBranchId}
                    setSelectedBranchId={setSelectedBranchId}
                    branchLoading={branchLoading}
                    handleCreateBranch={handleCreateBranch}
                    handleShare={handleShare}
                    handleCopy={handleCopy}
                    tooltip={tooltip}
                    showTooltip={showTooltip}
                    hideTooltip={hideTooltip}
                    onReroll={onReroll}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {isThinking && (
          <div className='flex w-full justify-center py-4'>
            <span className='flex items-center gap-2 text-[#BFB3CB] text-base'>
              <Loader2 className='animate-spin' size={20} />
              Thinking...
            </span>
          </div>
        )}
        <div ref={scrollRef} />
      </div>
      <DialogPrimitive.Root open={shareOpen} onOpenChange={setShareOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0' />
          <AnimatePresence>
            {shareOpen && (
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
                    <div className='flex flex-col items-center gap-4'>
                      <span className='text-lg font-semibold'>Share this chat</span>
                      <input
                        className='w-full px-3 py-2 rounded bg-[#2A222E] text-[#BFB3CB] border border-[#332940] text-center'
                        value={shareUrl}
                        readOnly
                        onFocus={e => e.target.select()}
                      />
                      <button
                        className='px-4 py-2 rounded bg-[#4D1F39] text-[#F4E9EE] hover:bg-[#6A2B4D] transition font-semibold'
                        onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success('Copied!'); }}
                      >Copy link</button>
                    </div>
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