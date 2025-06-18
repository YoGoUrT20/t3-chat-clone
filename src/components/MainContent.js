import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Newspaper, GraduationCap, Sparkles, MessagesSquare,  Settings, Ghost, Globe, LogIn } from 'lucide-react';
import MessageInput from './MessageInput';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { CATEGORY_QUESTIONS, defaultQuestions, backgroundOptions } from '../constants';
import Chat from './Chat';
import { models } from '../models';
import LiquidGlassButton from './LiquidGlassButton';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import MobileHistory from './MobileHistory';
import { Button } from './ui/button';
import { useIsMobile } from '../hooks/use-mobile';
import handleReroll from '../lib/handleReroll';
import handleSubmit from '../lib/handleSubmit';
import FirestoreStreamListener from './FirestoreStreamListener';
import { matchModelFromName } from '../lib/utils';
import styles from './ModelSelection.module.css';
import Tooltip from './Tooltip';
import { createPortal } from 'react-dom';

function MainContent({ showSidebar, setShowSidebar }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState('');
  const { user, apiKey } = useAuth();
  const [firstMessageSent, setFirstMessageSent] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [lastUsedModelFamily, setLastUsedModelFamily] = useState('gemini');
  const [chatMessages, setChatMessages] = useState([]);
  const [messagesLeft, setMessagesLeft] = useState(20);
  const [resetAt, setResetAt] = useState(null);
  const getGuestMessageCount = () => {
    const val = localStorage.getItem('guest_message_count');
    return val ? parseInt(val, 10) : 0;
  };
  const setGuestMessageCount = (val) => {
    localStorage.setItem('guest_message_count', String(val));
  };
  const abortControllerRef = useRef(null);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [branches, setBranches] = useState({});
  const [selectedBranchId, setSelectedBranchId] = useState('root');
  const [branchLoading, setBranchLoading] = useState(true);
  const [isTemporaryChat, setIsTemporaryChat] = useState(!user);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const isMobile = useIsMobile();
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const chatContainerRef = useRef(null);
  const isTemporaryChatRef = useRef(isTemporaryChat)
  const [firestoreStreamActive, setFirestoreStreamActive] = useState(false);
  const [firestoreStreamInfo, setFirestoreStreamInfo] = useState({ streamId: null, messageId: null });
  const lastPlaceholderIdRef = useRef(null);
  const lastStreamMessageIdRef = useRef(null);
  const chatMessagesRef = useRef(chatMessages);
  const firestoreStreamInfoRef = useRef(firestoreStreamInfo);
  const webSearchEnableToastShown = useRef(false);
  const webSearchDisableToastShown = useRef(false);
  const [iconTooltip, setIconTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
  const [modelSelectionOpen, setModelSelectionOpen] = useState(false);
  const [toolSelectionOpen, setToolSelectionOpen] = useState(false);

  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  useEffect(() => {
    firestoreStreamInfoRef.current = firestoreStreamInfo;
  }, [firestoreStreamInfo]);

  useEffect(() => { isTemporaryChatRef.current = isTemporaryChat }, [isTemporaryChat])

  // Always force temporary chat for guests
  useEffect(() => {
    if (!user) {
      setIsTemporaryChat(true);
      setConversationId(null);
      setChatMessages([]);
      setFirstMessageSent(false);
      setSelectedCategory(null);
      setLastUsedModelFamily('gemini');
      setMessage('');
      setChatLoading(false);
      // Always select gemini-2.0-flash-lite for guests if no model is selected
      setSelectedModel(models.find(m => m.name === 'gemini-2.0-flash-lite'));
      return;
    }
    if (!id) {
      // New chat: select default model
      let defaultModelName = user?.defaultModel || localStorage.getItem('default_model');
      let model = defaultModelName ? models.find(m => m.name === defaultModelName) : null;
      if (!model) model = models.find(m => m.name === 'deepseek-v3-0324');
      const useOwnKey = (user && user.useOwnKey) || localStorage.getItem('use_own_api_key') === 'true';
      const hasSubscription = user && user.status === 'premium';
      if (!model || (model.apiKeyRequired && !useOwnKey) || (!model.freeAccess && !hasSubscription && !useOwnKey)) {
        model = models.find(m => (!m.apiKeyRequired || useOwnKey) && (m.freeAccess || hasSubscription || useOwnKey));
      }
      setSelectedModel(model);
      return;
    }
    setChatLoading(true);
    const db = getFirestore();
    getDoc(doc(db, 'conversations', id)).then(async convSnap => {
      let loadedMessages = [];
      if (convSnap.exists()) {
        const data = convSnap.data();
        if (firestoreStreamActive) {
          setChatLoading(false);
          return;
        }
        loadedMessages = (data.messages || []).map((msg, i) => {
          let thinking = '';
          let mainContent = msg.content || msg.text || '';
          if ((msg.role === 'assistant' || msg.sender === 'llm') && typeof mainContent === 'string') {
            const thinkingMatch = mainContent.match(/<thinking>([\s\S]*?)<\/thinking>/);
            if (thinkingMatch) {
              thinking = thinkingMatch[1];
              mainContent = mainContent.replace(/<thinking>[\s\S]*?<\/thinking>/, '');
            }
          }
          const mapped = {
            id: i,
            sender: msg.role === 'user' ? 'user' : (msg.role === 'assistant' ? 'llm' : msg.role),
            text: mainContent,
            thinking,
            model: msg.model || data.model || null
          };
          if (msg.images) mapped.images = msg.images;
          if (msg.id) mapped.messageId = msg.id;
          return mapped;
        });
        setConversationId(id);
        setChatMessages(loadedMessages);
        setFirstMessageSent(true);
        setLastUsedModelFamily(data.model?.split('/')[0] || 'gemini');
        // --- Model selection for existing chat ---
        let lastMsgModelName = null;
        if (loadedMessages.length > 0) {
          // Find last message with a model
          for (let i = loadedMessages.length - 1; i >= 0; i--) {
            if (loadedMessages[i].model) {
              lastMsgModelName = loadedMessages[i].model;
              break;
            }
          }
        }
        let model = null;
        if (lastMsgModelName) {
          model = matchModelFromName(models, lastMsgModelName);
        }
        if (!model) {
          // fallback to default model logic
          let defaultModelName = user?.defaultModel || localStorage.getItem('default_model');
          model = defaultModelName ? models.find(m => m.name === defaultModelName) : null;
          if (!model) model = models.find(m => m.name === 'deepseek-v3-0324');
          const useOwnKey = (user && user.useOwnKey) || localStorage.getItem('use_own_api_key') === 'true';
          const hasSubscription = user && user.status === 'premium';
          if (!model || (model.apiKeyRequired && !useOwnKey) || (!model.freeAccess && !hasSubscription && !useOwnKey)) {
            model = models.find(m => (!m.apiKeyRequired || useOwnKey) && (m.freeAccess || hasSubscription || useOwnKey));
          }
        }
        setSelectedModel(model);
        // --- Fetch branches and set them in state ---
        try {
          const FUNCTIONS_URL = process.env.REACT_APP_FUNCTIONS_URL;
          const apiKey = localStorage.getItem('apiKey') || '';
          const res = await fetch(`${FUNCTIONS_URL}/getChatWithBranches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
            body: JSON.stringify({ chatid: id }),
          });
          if (res.ok) {
            const branchData = await res.json();
            setBranches(branchData.branches || {});
            setSelectedBranchId(Object.keys(branchData.branches || { root: 1 })[0] || 'root');
            setBranchLoading(false);
          } else {
            setBranches({});
            setSelectedBranchId('root');
            setBranchLoading(false);
          }
        } catch {
          setBranches({});
          setSelectedBranchId('root');
          setBranchLoading(false);
        }
        // --- End fetch branches ---
      }
      setChatLoading(false);
    });
  }, [id, user]);

  // Effect 2: Check Firestore stream doc and add placeholder/listener if needed
  useEffect(() => {
    if (!id || !firstMessageSent || !user) return;
  
    const checkStream = async () => {
      const streamDocRef = doc(getFirestore(), 'streams', id);
      const streamDocSnap = await getDoc(streamDocRef);
  
      if (streamDocSnap.exists()) {
        const streamData = streamDocSnap.data();
  
        if (streamData && streamData.messageid && !streamData.finished) {
          if (lastStreamMessageIdRef.current !== streamData.messageid) {
            const alreadyExists = chatMessagesRef.current.some(m => m.sender === 'llm' && m.messageId === streamData.messageid);
            
            if (alreadyExists) {
              if (firestoreStreamInfoRef.current.messageId !== streamData.messageid) {
                setFirestoreStreamInfo({ streamId: id, messageId: streamData.messageid });
                setFirestoreStreamActive(true);
              }
            } else if (lastPlaceholderIdRef.current !== streamData.messageid) {
              lastPlaceholderIdRef.current = streamData.messageid;
              setChatMessages(prevMsgs => [
                ...prevMsgs,
                {
                  id: streamData.messageid,
                  messageId: streamData.messageid,
                  sender: 'llm',
                  text: '',
                  model: streamData.model || null,
                },
              ]);
              setTimeout(() => {
                setFirestoreStreamInfo({ streamId: id, messageId: streamData.messageid });
                setFirestoreStreamActive(true);
              }, 0);
            }
          }
        }
      }
    };
  
    checkStream();
  }, [id, firstMessageSent, user]);

  useEffect(() => {
    if (!id || !user) {
      setFirstMessageSent(false);
      setChatMessages([]);
      setConversationId(null);
      setSelectedCategory(null);
      setLastUsedModelFamily('gemini');
      setMessage('');
      setChatLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    if (user && !id) {
      let defaultModelName = user.defaultModel;
      if (!defaultModelName) {
        defaultModelName = localStorage.getItem('default_model');
      }
      let model = defaultModelName ? models.find(m => m.name === defaultModelName) : null;
      if (!model) model = models.find(m => m.name === 'deepseek-v3-0324');
      // If still not accessible or blocked, pick first accessible model
      const useOwnKey = (user && user.useOwnKey) || localStorage.getItem('use_own_api_key') === 'true';
      const hasSubscription = user && user.status === 'premium';
      if (!model || (model.apiKeyRequired && !useOwnKey) || (!model.freeAccess && !hasSubscription && !useOwnKey)) {
        model = models.find(m => (!m.apiKeyRequired || useOwnKey) && (m.freeAccess || hasSubscription || useOwnKey));
      }
      setSelectedModel(model);
    }
  }, [user, id]);

  useEffect(() => {
    const handleTempChat = () => {
      if (typeof handleToggleTemporaryChat === 'function') {
        handleToggleTemporaryChat()
        toast.success('Started temporary chat')
      }
    }
    const handleSelectModel = () => {
      if (typeof window.openModelSelectMenu === 'function') {
        window.openModelSelectMenu()
      }
    }
    window.addEventListener('temp-chat', handleTempChat)
    window.addEventListener('select-model', handleSelectModel)
    return () => {
      window.removeEventListener('temp-chat', handleTempChat)
      window.removeEventListener('select-model', handleSelectModel)
    }
  }, [])

  const handleQuestionClick = (question) => {
    setMessage(question);
  };

  const handleBranchesChange = (newBranches, newSelectedBranchId) => {
    setBranches(newBranches);
    setSelectedBranchId(newSelectedBranchId);
  };

  const handleToggleTemporaryChat = () => {
    if (!user) return; // Guests are always in temp mode
    if (isTemporaryChat) {
      setIsTemporaryChat(false);
      setFirstMessageSent(false);
      setChatMessages([]);
      setConversationId(null);
      setBranches({});
      setSelectedBranchId('root');
      setBranchLoading(false);
    } else {
      setIsTemporaryChat(true);
      setFirstMessageSent(false);
      setChatMessages([]);
      setConversationId(null);
      setBranches({});
      setSelectedBranchId('root');
      setBranchLoading(false);
    }
    navigate('/');
  };

  // Remove the old handleReroll function and replace with a wrapper that calls the imported one
  const handleRerollWrapper = (llmMsg, newModel) => {
    handleReroll({
      llmMsg,
      newModel,
      chatMessages,
      setChatMessages,
      setLoading,
      apiKey,
      conversationId: user ? conversationId : null,
      toast,
      Sparkles,
      handleReroll: handleRerollWrapper,
      FUNCTIONS_URL: process.env.REACT_APP_FUNCTIONS_URL,
      useWebSearch,
      selectedBranchId,
    });
  };

  // New handleSubmit wrapper for MessageInput
  const handleSubmitWrapper = (data, event, model) => {
    if (!user) {
      const currentCount = getGuestMessageCount();
      if (currentCount >= 5) {
        toast.error("You've reached the 5-message limit for guests. Please sign in to continue.");
        return;
      }
      setGuestMessageCount(currentCount + 1);
    }
    handleSubmit({
      data,
      event,
      model,
      isTemporaryChat: !user || isTemporaryChat,
      setFirstMessageSent,
      setMessage,
      setLastUsedModelFamily,
      chatMessages,
      setChatMessages,
      setLoading,
      user,
      selectedModel,
      conversationId: user ? conversationId : null,
      setConversationId: user ? setConversationId : () => {},
      navigate,
      id: user ? id : null,
      toast,
      Sparkles,
      selectedBranchId,
      branches,
      setBranches,
      branchLoading,
      setBranchLoading,
      apiKey,
      FUNCTIONS_URL: process.env.REACT_APP_FUNCTIONS_URL,
      abortControllerRef,
      useWebSearch,
    });
    // Refetch quota after sending
    setTimeout(async () => {
      if (!user) return;
      const db = getFirestore();
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setMessagesLeft(typeof data.messagesLeft === 'number' ? data.messagesLeft : 20);
        setResetAt(typeof data.resetAt === 'number' ? data.resetAt : null);
      }
    }, 500);
  };

  // Firestore stream listener callback
  const handleFirestoreStreamUpdate = useCallback(({ message, finished }) => {
    const messageId = firestoreStreamInfoRef.current.messageId;
    if (!messageId) return;

    setChatMessages(msgs => {
      const msgIndex = msgs.findIndex(m => m.messageId === messageId);
      if (msgIndex !== -1) {
        // Parse <thinking>...</thinking> and main content from the incoming message
        let thinking = '';
        let mainContent = message || '';
        const thinkingMatch = mainContent.match(/<thinking>([\s\S]*?)<\/thinking>/);
        if (thinkingMatch) {
          thinking = thinkingMatch[1];
          mainContent = mainContent.replace(/<thinking>[\s\S]*?<\/thinking>/, '');
        }

        const updated = [...msgs];
        updated[msgIndex] = { ...updated[msgIndex], text: mainContent, thinking };
        return updated;
      }
      return msgs;
    });

    if (finished) {
      setFirestoreStreamActive(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      setUseWebSearch(prev => {
        const next = !prev;
        if (next && !webSearchEnableToastShown.current) {
          toast.success('Web search enabled');
          webSearchEnableToastShown.current = true;
          webSearchDisableToastShown.current = false;
        } else if (!next && !webSearchDisableToastShown.current) {
          toast.success('Web search disabled');
          webSearchDisableToastShown.current = true;
          webSearchEnableToastShown.current = false;
        }
        return next;
      });
    };
    window.addEventListener('enable-search-tool', handler);
    return () => window.removeEventListener('enable-search-tool', handler);
  }, []);

  const backgroundName = localStorage.getItem('chat_bg') || 'model-glow';
  const bgObj = backgroundOptions.find(b => b.value === backgroundName) || backgroundOptions[0];

  // Handler for model selection open/close
  const handleModelSelectionOpen = (open) => {
    setModelSelectionOpen(open);
  };

  // Handler for tool selection open/close
  const handleToolSelectionOpen = (open) => {
    setToolSelectionOpen(open);
  };

  // --- Auto-submit prompt from query param (for shared chat fork) ---
  useEffect(() => {
    if (!id) return;
    const params = new URLSearchParams(location.search);
    const prompt = params.get('prompt');
    if (
      prompt &&
      chatMessages.length > 0 &&
      // Check if the prompt hasn't been added as a user message yet
      !chatMessages.some(m => m.sender === 'user' && m.text === prompt)
    ) {
      handleSubmitWrapper({ prompt }, null, selectedModel);
      params.delete('prompt');
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    }
  }, [id, location.search, chatMessages, selectedModel, conversationId]);

  useEffect(() => {
    async function fetchQuota() {
      if (!user) return;
      const db = getFirestore();
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setMessagesLeft(typeof data.messagesLeft === 'number' ? data.messagesLeft : 20);
        setResetAt(typeof data.resetAt === 'number' ? data.resetAt : null);
      }
    }
    fetchQuota();
  }, [user, id]);

  return (
    <>
      {isMobile && (
        <div className='fixed top-4 right-4 z-50 flex gap-2' style={{ minWidth: 48 }}>
          <Button
            variant='outline'
            className='flex items-center justify-center bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 focus:ring-2 focus:ring-neutral-700 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 ease-in-out border border-transparent focus:border-neutral-700 h-10 w-10 rounded-lg p-0'
            onClick={() => navigate('/settings')}
            aria-label='Settings'
          >
            <Settings className='w-5 h-5' />
          </Button>
          <Button
            variant='outline'
            className='flex items-center justify-center bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 focus:ring-2 focus:ring-neutral-700 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 ease-in-out border border-transparent focus:border-neutral-700 h-10 w-10 rounded-lg p-0'
            onClick={() => setShowMobileHistory(true)}
            aria-label='History'
          >
            <MessagesSquare className='w-5 h-5' />
          </Button>
          {!user && (
            <Button
              variant='outline'
              className='flex items-center justify-center bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 focus:ring-2 focus:ring-neutral-700 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 ease-in-out border border-transparent focus:border-neutral-700 h-10 w-10 rounded-lg p-0'
              onClick={() => navigate('/auth')}
              aria-label='Login'
            >
              <LogIn className='w-5 h-5' />
            </Button>
          )}
        </div>
      )}
      <AnimatePresence>
        {isMobile && showMobileHistory && (
          <motion.div
            key='mobile-history-overlay'
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className='fixed inset-0 z-50 bg-black bg-opacity-80 flex flex-col'
          >
            <div className='flex justify-end p-4'>
              <Button
                variant='ghost'
                className='bg-[#232228] text-white rounded-full shadow-lg p-2'
                style={{ width: 40, height: 40 }}
                onClick={() => setShowMobileHistory(false)}
              >
                <span style={{ fontSize: 24, lineHeight: 1 }}>&times;</span>
              </Button>
            </div>
            <div className='flex-1 overflow-y-auto'>
              <MobileHistory onSelectChat={() => setShowMobileHistory(false)} topPadding='0.5rem' />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.main
        className="flex flex-col min-h-screen w-full px-0 md:px-10 pt-2 md:pt-10 pb-0 relative rounded-xl"
        style={Object.assign({}, bgObj.style, !isMobile ? { marginLeft: 'calc(18rem + 55px)' } : {})}
      >
        {bgObj.image && (
          <div className='w-full flex justify-center mt-4'>
            <img src={bgObj.image} alt={bgObj.name} style={{ maxWidth: 240, maxHeight: 240, opacity: 0.18, borderRadius: 24, position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 0, pointerEvents: 'none' }} />
          </div>
        )}
        <header className="flex justify-end items-center mb-10"></header>

        <div className="flex-1 flex flex-col items-center w-full">
          {!firstMessageSent && !message.trim() && (
            <div className="w-full flex justify-center items-center animate-scale-in" style={{ marginTop: '100px', minHeight: 320 }}>
              <div style={{ maxWidth: 430, width: '100%' }}>
                <h2 className="text-3xl font-semibold mb-8 text-left">
                  {user ? `How can I help you, ${user.displayName.split(' ')[0]}?` : 'How can I help you?'}
                </h2>

                <div className="flex flex-wrap gap-2 mb-6 justify-start">
                  {['Create', 'Explore', 'Code', 'Learn'].map((cat) => (
                    <LiquidGlassButton
                      key={cat}
                      icon={
                        cat === 'Create' ? <Sparkles className="text-sm" size={16} /> :
                          cat === 'Explore' ? <Newspaper className="text-sm" size={16} /> :
                            cat === 'Code' ? <span className="material-icons text-sm">code</span> :
                              <GraduationCap className="text-sm" size={16} />
                      }
                      text={cat}
                      onClick={() => setSelectedCategory(cat)}
                      selected={selectedCategory === cat}
                    />
                  ))}
                </div>

                <div className="w-full flex flex-col items-start" style={{ maxWidth: 430 }}>
                  <style>{`
                    .glass-question {
                      color: #E0E8FF;
                      background: transparent;
                      transition: background 0.2s, color 0.2s;
                      display: inline-block;
                      width: auto;
                      max-width: 100%;
                    }
                    .glass-question:hover {
                      background: rgba(255,255,255,0.07);
                      color: #E0E8FF;
                    }
                  `}</style>
                  {(selectedCategory
                    ? CATEGORY_QUESTIONS[selectedCategory]
                    : defaultQuestions
                  ).map((q, i) => (
                    <p
                      key={i}
                      className="glass-question p-3 rounded-lg text-sm font-bold cursor-pointer transition-colors text-left break-words whitespace-pre-line sm:whitespace-normal sm:break-normal overflow-x-auto"
                      onClick={() => handleQuestionClick(q)}
                      style={{ marginBottom: 4, minWidth: 0 }}
                    >
                      {q}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
          {firstMessageSent && !chatLoading && (
            <div
              ref={chatContainerRef}
              className={`flex-1 w-full flex flex-col items-center overflow-y-auto hide-scrollbar`}
              style={
                isMobile
                  ? { maxHeight: 'calc(100vh - 100px)', height: 'calc(100vh - 100px)', overflowY: 'auto', width: '100%' }
                  : { maxHeight: 'calc(100vh - 175px)', width: '100%' }
              }
            >
              <Chat
                modelFamily={lastUsedModelFamily}
                messages={selectedBranchId !== 'root' && branches[selectedBranchId] ? branches[selectedBranchId].messages : chatLoading ? [] : chatMessages}
                onReroll={handleRerollWrapper}
                loading={loading}
                isStreaming={loading || firestoreStreamActive}
                selectedBranchId={selectedBranchId}
                setSelectedBranchId={setSelectedBranchId}
                branches={branches}
                setBranches={setBranches}
                branchLoading={branchLoading}
                setBranchLoading={setBranchLoading}
                onBranchesChange={handleBranchesChange}
                isTemporaryChat={isTemporaryChat}
                chatContainerRef={chatContainerRef}
              />
              {firestoreStreamActive && firestoreStreamInfo.streamId && firestoreStreamInfo.messageId && (
                <FirestoreStreamListener
                  streamId={firestoreStreamInfo.streamId}
                  messageId={firestoreStreamInfo.messageId}
                  onUpdate={handleFirestoreStreamUpdate}
                />
              )}
              {chatLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'rgba(32,27,37,0.85)' }}>
                  <span className="text-zinc-400 text-lg">Loading chat...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Banner for terms and privacy policy, always above the input */}
        {!user && !firstMessageSent && !modelSelectionOpen && !toolSelectionOpen && (
          <div
            className={`flex items-center justify-center mx-auto mb-6 ${styles.liquidGlassCard}`}
            style={{
              width: isMobile ? 'calc(100% - 40px)' : '430px',
              maxWidth: '430px',
              height: '54px',
              borderRadius: '12px 12px 0 12px',
              zIndex: 50,
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: isMobile ? '154px' : '104px', // 54px (banner) + 50px higher than sticky input
              padding: '0 10px'
            }}
          >
            <span style={{ color: '#ACA1B7', fontSize: '14px', fontWeight: 500, lineHeight: '1.2', textAlign: 'center' }}>
              Make sure you agree to our <a href="/terms-of-service" style={{ color: '#fff', textDecoration: 'underline' }}>Terms</a> and our <a href="/privacy-policy" style={{ color: '#fff', textDecoration: 'underline' }}>Privacy Policy</a>
            </span>
          </div>
        )}

        {/* Current model display above MessageInput, compact, left-shifted, beige text, underlined, with tooltip, no icon */}
        {selectedModel && (
          <div
            className={`z-30 flex items-center justify-center ${isMobile ? '' : 'fixed'} ${isMobile ? '' : 'bottom-[100px] md:bottom-[85px]'}`}
            style={
              isMobile
                ? {
                    position: 'fixed',
                    bottom: 80,
                    left: 0,
                    width: '100%',
                    minHeight: 28,
                    borderRadius: 8,
                    padding: '0.15rem 0.7rem',
                    marginBottom: 0,
                    justifyContent: 'flex-start',
                    display: 'flex',
                    zIndex: 30,
                  }
                : {
                    left: 850, // minimum left value in px
                    width: 'auto',
                    minHeight: 28,
                    borderRadius: 8,
                    padding: '0.15rem 0.7rem',
                    pointerEvents: 'none',
                    position: 'fixed',
                    bottom: '85px',
                    zIndex: 30,
                  }
            }
          >
            <span
              className='flex items-center gap-2 bg-[#F9B4D0]/30 text-white px-2 py-0.5 rounded text-xs font-bold ml-2'
              style={{ pointerEvents: 'auto', fontSize: 14, fontWeight: 600, letterSpacing: 0.1 }}
            >
              {selectedModel.displayName}
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: '0.5rem' }}>
                {isTemporaryChat && (
                  <span
                    onMouseEnter={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setIconTooltip({ visible: true, x: rect.left + rect.width / 2, y: rect.top - 32, text: 'Temporary chat (messages are not saved)' });
                    }}
                    onMouseLeave={() => setIconTooltip(iconTooltip => ({ ...iconTooltip, visible: false }))}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <Ghost size={17} style={{ color: '#fff', opacity: 0.95 }} />
                  </span>
                )}
                {useWebSearch && (
                  <span
                    onMouseEnter={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setIconTooltip({ visible: true, x: rect.left + rect.width / 2, y: rect.top - 32, text: 'Web search enabled for this chat' });
                    }}
                    onMouseLeave={() => setIconTooltip(iconTooltip => ({ ...iconTooltip, visible: false }))}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <Globe size={17} style={{ color: '#fff', opacity: 0.95 }} />
                  </span>
                )}
              </span>
            </span>
            {iconTooltip.visible && iconTooltip.text && createPortal(
              <Tooltip x={iconTooltip.x} y={iconTooltip.y} text={iconTooltip.text} />,
              document.body
            )}
          </div>
        )}

        {/* MessageInput always at the bottom, outside the flex-1 content */}
        <div className="w-full" style={{ position: 'sticky', bottom: 0, zIndex: 40 }}>
          <MessageInput
            message={message}
            setMessage={setMessage}
            onFirstMessageSent={() => setFirstMessageSent(true)}
            onOpenOptions={handleModelSelectionOpen}
            onOpenTools={handleToolSelectionOpen}
            onSubmit={handleSubmitWrapper}
            isLoading={loading}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            isTemporaryChat={isTemporaryChat}
            onStartTemporaryChat={handleToggleTemporaryChat}
            useWebSearch={useWebSearch}
            setUseWebSearch={setUseWebSearch}
            messagesLeft={messagesLeft}
            resetAt={resetAt}
            user={user}
          />
        </div>
      </motion.main>
    </>
  );
}

export default MainContent;
