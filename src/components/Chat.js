import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { User, Bot, Copy, FileText, Lightbulb } from 'lucide-react';
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
import { useIsMobile } from '../hooks/use-mobile';
import ImagePreviewDialog from './ImagePreviewDialog';

const hastToText = (node) => {
  if (node.type === 'text') {
    return node.value;
  }
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(hastToText).join('');
  }
  return '';
};

function Chat({
  modelFamily,
  messages: propMessages,
  onReroll,
  loading,
  isStreaming,
  isThinking,
  selectedBranchId,
  setSelectedBranchId,
  branches = {},
  setBranches,
  branchLoading,
  setBranchLoading = () => {},
  onBranchesChange,
  isTemporaryChat,
  chatContainerRef,
}) {
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
  const fontFamily = localStorage.getItem('chat_font') || 'Roboto';
  const themeName = localStorage.getItem('chat_theme') || 'Glass';
  const themeObj = colorThemes.find(t => t.name === themeName) || colorThemes[0];
  const backgroundName = localStorage.getItem('chat_bg') || 'model-glow';
  const bgObj = backgroundOptions.find(b => b.value === backgroundName) || backgroundOptions[0];
  const glowType = localStorage.getItem('glow_type') || 'glow-blue-purple';
  const glowIntensity = (() => {
    const val = localStorage.getItem('glow_intensity');
    return val !== null ? parseFloat(val) : 0.7;
  })();
  const isMobile = useIsMobile();

  const msgRefs = useRef([])
  const bubbleRefs = useRef([])

  const [previewImage, setPreviewImage] = useState(null);
  const [previewImageAlt, setPreviewImageAlt] = useState('');

  // Add per-message reasoning state
  const [showReasoningMap, setShowReasoningMap] = useState({});

  const [ellipsis, setEllipsis] = useState('');

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

  useLayoutEffect(() => {
    if (scrollRef.current) {
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
  let lastLlmMsgId;
  if (Array.isArray(displayedMessages) && displayedMessages.length > 0) {
    const lastLlmIndex = [...displayedMessages].reverse().findIndex(m => m.role === 'assistant' || m.sender === 'llm');
    const lastLlmMsg = lastLlmIndex !== -1 ? displayedMessages[displayedMessages.length - 1 - lastLlmIndex] : null;
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
        const el = chatContainerRef.current;
        if (el) {
          el.scrollTop = el.scrollHeight - el.clientHeight;
        }
      }, 0);
    }
  }, [displayedMessages, chatContainerRef]);

  useEffect(() => {
    let interval;
    if (isStreaming) {
      interval = setInterval(() => {
        setEllipsis(e => (e.length >= 3 ? '' : e + '.'));
      }, 500);
    } else {
      setEllipsis('');
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  // Handler to toggle reasoning for a specific message
  const handleToggleReasoning = idx => {
    setShowReasoningMap(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <>
    
      <div
        ref={containerRef}
        className={`flex flex-col gap-4 w-full mx-auto py-4 px-2`}
        style={Object.assign({}, isMobile ? {} : { maxWidth: 700 }, { paddingBottom: 100 })}
      >
        <AnimatePresence initial={false}>
          {displayedMessages.filter(Boolean).map((msg, idx, arr) => {
            const isUser = msg.role === 'user' || msg.sender === 'user';
            const key = 'msg_' + idx;
            if (!msgRefs.current[idx]) msgRefs.current[idx] = null
            const msgRefCb = el => { msgRefs.current[idx] = el }
            const msgBg = (msg.role === 'user' || msg.sender === 'user') ? themeObj.user.bg : themeObj.assistant.bg;
            let msgText = (msg.role === 'user' || msg.sender === 'user') ? themeObj.user.text : themeObj.assistant.text;
            const themeType = themeObj.themeType;
            if (themeType === 'dark') msgText = '#E0E8FF';
            if (themeType === 'light') msgText = '#2A222E';
            let msgContent = typeof msg.text === 'string' && msg.text.length > 0 ? msg.text : (msg.content || '');
            let contentArray = Array.isArray(msgContent) ? msgContent : null;
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
            // Find displayName for the model
            let modelKey = msg.model || msg.modelName || msg.model_name || msg.openRouterName || ''
            let modelObj = models.find(m => m.name === modelKey || m.openRouterName === modelKey)
            if (!modelObj && modelKey) {
              modelObj = models.find(m => m.openRouterName && (m.openRouterName.toLowerCase() === modelKey.toLowerCase() || modelKey.toLowerCase().includes(m.openRouterName.toLowerCase())))
            }
            const modelDisplayName = modelObj ? modelObj.displayName : modelKey
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`} style={{ position: (bgObj.value === 'glow-under' || (bgObj.value === 'model-glow' && !isUser)) ? 'relative' : undefined }}>
                  {(bgObj.value === 'glow-under' || (bgObj.value === 'model-glow' && !isUser)) && (() => {
                    const randomOffset = ((Math.sin(idx * 9301 + 49297) * 233280) % 1) * 40 + 10;
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
                    {(msg.role === 'assistant' || msg.sender === 'llm') && msg.thinking && msg.thinking.trim() !== '' && (
                      <>
                        <div
                          onClick={() => handleToggleReasoning(idx)}
                          style={{
                            fontStyle: 'italic',
                            color: '#BFB3CB',
                            opacity: 0.7,
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: 4,
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 14,
                            userSelect: 'none',
                          }}
                          aria-label={showReasoningMap[idx] ? 'Hide reasoning' : 'Show reasoning'}
                          tabIndex={0}
                        >
                          <Lightbulb size={16} style={{ marginRight: 6, opacity: 0.8 }} />
                          {isStreaming && (msg.id === lastLlmMsgId || msg.messageId === lastLlmMsgId)
                            ? <span>{modelDisplayName || 'Model'} is reasoning{ellipsis}</span>
                            : <span>{showReasoningMap[idx] ? 'Hide reasoning' : 'Show reasoning'}</span>
                          }
                        </div>
                      </>
                    )}
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
                      {contentArray ? contentArray.map((c, i) => c.type === 'text' ? c.text : '').join(' ') : msgContent}
                    </div>
                    {contentArray ? (
                      <>
                        <AnimatePresence initial={false}>
                          {msg.thinking && showReasoningMap[idx] && (
                            <motion.div
                              key='reasoning'
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.22, ease: 'easeOut' }}
                              style={{ fontStyle: 'italic', color: '#BFB3CB', opacity: 0.7, display: 'flex', alignItems: 'center', marginBottom: 4 }}
                            >
                              <Lightbulb size={16} style={{ marginRight: 6, opacity: 0.8 }} />
                              <span>{msg.thinking}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {contentArray.filter(c => c.type === 'text').map((c, i) => (
                          <span key={'text-' + i}>{c.text}</span>
                        ))}
                        {contentArray.filter(c => c.type === 'image_url').map((c, i) => (
                          <div key={'img-' + i} style={{ marginTop: 8, marginBottom: 8 }}>
                            <img src={c.image_url.url} alt='uploaded' style={{ maxWidth: 240, maxHeight: 240, borderRadius: 12, border: '1px solid #ccc', cursor: 'pointer' }} onClick={() => { setPreviewImage(c.image_url.url); setPreviewImageAlt(c.image_url.url); }} />
                          </div>
                        ))}
                        {contentArray.filter(c => c.type === 'file' && c.file && c.file.file_data && c.file.filename && c.file.file_data.startsWith('data:application/pdf')).map((c, i) => (
                          <div key={'pdf-' + i} style={{ marginTop: 8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <a href={c.file.file_data} target='_blank' rel='noopener noreferrer' style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#8E80A0' }}>
                              <FileText className='h-8 w-8 text-red-400' />
                              <span style={{ marginLeft: 8, textDecoration: 'underline' }}>{c.file.filename}</span>
                            </a>
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        <AnimatePresence initial={false}>
                          {msg.thinking && showReasoningMap[idx] && (
                            <motion.div
                              key='reasoning-md'
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.22, ease: 'easeOut' }}
                              style={{ fontStyle: 'italic', color: '#BFB3CB', opacity: 0.7, display: 'flex', alignItems: 'center', marginBottom: 4 }}
                            >
                              <Lightbulb size={16} style={{ marginRight: 6, opacity: 0.8 }} />
                              <span>{msg.thinking}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <ReactMarkdown
                          rehypePlugins={[rehypeHighlight]}
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({node, inline, className, children, ...props}) {
                              const match = /language-(\w+)/.exec(className || '')
                              if (inline || !match) {
                                return <code className='bg-[#2A222E] px-1 py-0.5 rounded text-[#E0E8FF] font-mono text-sm' {...props}>{children}</code>
                              }
                              const codeString = node.children.map(hastToText).join('');
                              const lineCount = codeString.split('\n').length;
                              const buttonClass = lineCount === 2
                                ? 'absolute top-6 right-4 p-1 rounded hover:bg-[#332940] transition opacity-70 group-hover:opacity-100'
                                : 'absolute top-3 right-2 p-1 rounded hover:bg-[#332940] transition opacity-70 group-hover:opacity-100';
                              return (
                                <pre className={`chatMarkdownPre bg-[#2A222E] p-3 rounded-lg overflow-x-auto my-2 relative group ${styles.chatMarkdownPre}`} style={{ maxWidth: 600, overflowX: 'auto' }}>
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
                              return <li className='my-1'>{children}</li>;
                            },
                            hr(props) {
                              return <hr style={{ margin: '16px 0', border: 0, borderTop: '2px solid ', opacity: 0.7 }} {...props} />;
                            },
                            a({href, children, ...props}) {
                              return (
                                <a
                                  href={href}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  style={{ color: '#38bdf8', textDecoration: 'underline', wordBreak: 'break-all' }}
                                  {...props}
                                >
                                  {children}
                                </a>
                              );
                            },
                          }}
                        >
                          {msgContent}
                        </ReactMarkdown>
                      </>
                    )}
                    {(msg.role === 'assistant' || msg.sender === 'llm') && modelKey && (
                      <div style={{ fontSize: '0.75rem', color: msgText, marginTop: 4, opacity: 0.7 }}>
                        Model: {modelDisplayName}
                      </div>
                    )}
                    {isUser && Array.isArray(msg.images) && msg.images.length > 0 && (
                      <div className='flex flex-wrap gap-2 mt-2'>
                        {msg.images.map((img, i) => (
                          img.type === 'application/pdf' || (img.type && img.type.includes('pdf')) ? (
                            <div key={i} style={{ display: 'inline-block', maxWidth: 240, maxHeight: 240 }}>
                              <a href={img.data} target='_blank' rel='noopener noreferrer' style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#8E80A0' }}>
                                <FileText className='h-8 w-8 text-red-400' />
                                <span style={{ marginLeft: 8, textDecoration: 'underline' }}>{img.name || 'PDF file'}</span>
                              </a>
                            </div>
                          ) : (
                            <div key={i} style={{ display: 'inline-block', maxWidth: 240, maxHeight: 240 }}>
                              <img
                                src={img.data}
                                alt={img.name || 'uploaded'}
                                style={{ maxWidth: 180, maxHeight: 180, borderRadius: 12, border: '1px solid #ccc', background: '#18141c', cursor: 'pointer' }}
                                onClick={() => { setPreviewImage(img.data); setPreviewImageAlt(img.name || 'uploaded'); }}
                              />
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                  {isUser && (
                    <div className='flex items-end ml-2'>
                      <span className='bg-[#2A222E] p-2 rounded-full'><User size={20} className='text-[#BFB3CB]' /></span>
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
                    className='bg-white/5 backdrop-blur-lg rounded-[24px] shadow-xl p-8 max-w-xl w-full focus:outline-none border border-white/60 text-[#BFB3CB] pointer-events-auto relative'
                    style={{ maxWidth: 600, boxShadow: '0 0 12px 2px rgba(255,255,255,0.10)' }}
                  >
                    <div className='flex flex-col items-center gap-4'>
                      <span className='text-lg font-semibold'>Share this chat</span>
                      <input
                        className='w-full px-4 py-2 rounded-xl bg-white/20 text-[#F4E9EE] border border-white/30 text-center backdrop-blur-md shadow-md font-medium focus:outline-none focus:ring-2 focus:ring-white/40 transition'
                        value={shareUrl}
                        readOnly
                        onFocus={e => e.target.select()}
                      />
                      <button
                        className='px-3 py-2 md:px-4 md:py-2 rounded border transition-all text-sm md:text-base border-[#ececec] dark:border-[#232228] bg-transparent text-[#0e0e10] dark:text-white hover:border-[#DC749E] hover:text-[#DC749E] font-bold'
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
      <ImagePreviewDialog previewImage={previewImage} previewImageAlt={previewImageAlt} setPreviewImage={setPreviewImage} setPreviewImageAlt={setPreviewImageAlt} />
    </>
  );
}

export default Chat; 
