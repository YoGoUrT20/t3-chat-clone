import React, { useState, useEffect, useRef } from 'react';
import { Newspaper, GraduationCap, Sparkles, MessagesSquare,  Settings } from 'lucide-react';
import MessageInput from './MessageInput';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { CATEGORY_QUESTIONS, defaultQuestions } from '../constants';
import Chat from './Chat';
import { models } from '../models';
import LiquidGlassButton from './LiquidGlassButton';
import { getFirestore, collection, addDoc, doc, updateDoc, getDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import MobileHistory from './MobileHistory';
import { Button } from './ui/button';
import { useIsMobile } from '../hooks/use-mobile';

function MainContent({ showSidebar, setShowSidebar }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const { user, apiKey } = useAuth();
  const [firstMessageSent, setFirstMessageSent] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedModel, setSelectedModel] = useState(() => {
    // Try to get default model from localStorage
    let defaultModelName = localStorage.getItem('default_model');
    let model = defaultModelName ? models.find(m => m.name === defaultModelName) : null;
    // Fallback to deepseek-v3-0324
    if (!model) model = models.find(m => m.name === 'deepseek-v3-0324');
    // If still not accessible or blocked, pick first accessible model
    if (!model || model.apiKeyRequired || (!model.freeAccess && !localStorage.getItem('use_own_api_key') && !localStorage.getItem('subscription_active'))) {
      model = models.find(m => !m.apiKeyRequired && (m.freeAccess || localStorage.getItem('use_own_api_key') === 'true' || localStorage.getItem('subscription_active') === 'true'));
    }
    return model;
  });
  const [lastUsedModelFamily, setLastUsedModelFamily] = useState('gemini');
  const [chatMessages, setChatMessages] = useState([]);
  const abortControllerRef = useRef(null);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [branches, setBranches] = useState({});
  const [selectedBranchId, setSelectedBranchId] = useState('root');
  const [branchLoading, setBranchLoading] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const isMobile = useIsMobile();
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const chatContainerRef = useRef(null);

  const backgroundOptions = [
    { name: 'Default', value: 'default' },
    { name: 'Glowing Blue', value: 'glow-blue', style: { background: 'radial-gradient(circle at 60% 40%, #3bb0ff 0%, #a259ff 100%)', boxShadow: '0 0 80px 10px #3bb0ff88' } },
    { name: 'Glowing Pink', value: 'glow-pink', style: { background: 'radial-gradient(circle at 40% 60%, #ff70a6 0%, #ff9770 100%)', boxShadow: '0 0 80px 10px #ff70a688' } },
    { name: 'Model: Gemini', value: 'model-gemini', style: { background: 'radial-gradient(circle at 60% 40%, #9168C0 0%, #1BA1E3 100%)' } },
    { name: 'Model: Llama', value: 'model-llama', image: '/llama.svg', style: { background: '#fff url(/llama.svg) center/cover no-repeat' } },
    { name: 'Model: Claude', value: 'model-claude', image: '/claude.svg', style: { background: '#fff url(/claude.svg) center/cover no-repeat' } },
    { name: 'Model: DeepSeek', value: 'model-deepseek', image: '/deepseek.svg', style: { background: '#fff url(/deepseek.svg) center/cover no-repeat' } },
    { name: 'Model: Qwen', value: 'model-qwen', image: '/qwen.svg', style: { background: '#fff url(/qwen.svg) center/cover no-repeat' } },
    { name: 'Model: Grok', value: 'model-grok', image: '/grok.svg', style: { background: '#fff url(/grok.svg) center/cover no-repeat' } },
    { name: 'Quiver Logo', value: 'quiver', image: '/quiver.svg', style: { background: '#fff url(/quiver.svg) center/cover no-repeat' } },
    { name: 'Logo 192', value: 'logo192', image: '/logo192.png', style: { background: '#fff url(/logo192.png) center/cover no-repeat' } },
    { name: 'Logo 512', value: 'logo512', image: '/logo512.png', style: { background: '#fff url(/logo512.png) center/cover no-repeat' } },
  ]
  const backgroundName = localStorage.getItem('chat_bg') || 'default'
  const bgObj = backgroundOptions.find(b => b.value === backgroundName) || backgroundOptions[0]

  useEffect(() => {
    setMessage('');
  }, []); // Reset message when key changes (component remounts)

  useEffect(() => {
    if (id) {
      setChatLoading(true);
      // Load conversation by id
      const db = getFirestore();
      getDoc(doc(db, 'conversations', id)).then(async convSnap => {
        if (convSnap.exists()) {
          const data = convSnap.data();
          setConversationId(id);
          setChatMessages(
            (data.messages || []).map((msg, i) => ({
              id: i,
              sender: msg.role === 'user' ? 'user' : (msg.role === 'assistant' ? 'llm' : msg.role),
              text: msg.content || msg.text || '',
              model: msg.model || data.model || null
            }))
          );
          setFirstMessageSent(true);
          setLastUsedModelFamily(data.model?.split('/')[0] || 'gemini');

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
      // Check for ongoing stream for this chat
      fetch(`${process.env.REACT_APP_FUNCTIONS_URL}/getOngoingStream?chat_id=${id}`)
        .then(res => {
          if (res.status === 404) return null;
          return res.body;
        })
        .then(async body => {
          if (!body) return;
          const reader = body.getReader();
          setIsThinking(false);
          // As tokens arrive, update the message immediately
          const processPart = (part, llmTextRef) => {
            const trimmed = part.trim();
            if (!trimmed) return;
            if (trimmed.startsWith(':')) {
              if (trimmed.includes('OPENROUTER PROCESSING')) setIsThinking(true);
              return;
            }
            if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.slice(5).trim();
              if (dataStr === '[DONE]') return;
              try {
                const json = JSON.parse(dataStr);
                const text =
                  (json.reasoning) ||
                  (json.content) ||
                  (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content);
                if (text) {
                  llmTextRef.current += text;
                  setIsThinking(false);
                  setChatMessages(msgs => {
                    const last = msgs[msgs.length - 1];
                    if (last && last.sender === 'llm') {
                      return [...msgs.slice(0, -1), { ...last, text: llmTextRef.current }];
                    } else {
                      return [...msgs, { id: Date.now() + 1, sender: 'llm', text: llmTextRef.current }];
                    }
                  });
                }
              } catch {}
            }
          };
          const llmTextRef = { current: '' };
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = new TextDecoder().decode(value);
            chunk.split('\n').forEach(part => processPart(part, llmTextRef));
          }
          setIsThinking(false);
          setLoading(false);
        });
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setFirstMessageSent(false);
      setChatMessages([]);
      setConversationId(null);
      setSelectedCategory(null);
      setLastUsedModelFamily('gemini');
      setMessage('');
      setChatLoading(false);
    }
  }, [id]);

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
      if (!model || model.apiKeyRequired && !useOwnKey || (!model.freeAccess && !hasSubscription && !useOwnKey)) {
        model = models.find(m => (!m.apiKeyRequired || useOwnKey) && (m.freeAccess || hasSubscription || useOwnKey));
      }
      setSelectedModel(model);
    }
  }, [user, id]);

  const handleQuestionClick = (question) => {
    setMessage(question);
  };

  const handleBranchesChange = (newBranches, newSelectedBranchId) => {
    setBranches(newBranches);
    setSelectedBranchId(newSelectedBranchId);
  };

  const handleToggleTemporaryChat = () => {
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
  };

  const handleSubmit = async (data, event, model) => {
    if (isTemporaryChat) {
      setFirstMessageSent(true);
      setMessage('');
      if (model && model.family) setLastUsedModelFamily(model.family);
      const userMsg = { role: 'user', content: data.prompt, model: model?.openRouterName || 'openai/gpt-4o' };
      const modelObj = model || selectedModel;
      const newMessages = [...chatMessages, { id: Date.now(), sender: 'user', text: data.prompt }];
      setChatMessages(newMessages);
      setLoading(true);
      setIsThinking(false);
      const modelName = modelObj?.openRouterName || 'openai/gpt-4o';
      const apiKey = localStorage.getItem('apiKey') || '';
      const streamId = uuidv4();
      let fromIndex = 0;
      debugStreamState('handleSubmit - start', { streamId, fromIndex, prompt: data.prompt });
      try {
        const res = await fetch(`${process.env.REACT_APP_FUNCTIONS_URL}/llmStreamResumable`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey || '' },
          body: JSON.stringify({ model: modelName, messages: [userMsg], streamId, fromIndex }),
        });
        if (res.status === 429) {
          try {
            const data = await res.json();
            if (data && data.error === 'rate_limit') {
              toast.error(data.message, { icon: <Sparkles size={18} /> });
              setIsThinking(false);
              setLoading(false);
              return;
            }
          } catch {}
        }
        if (!res.body) throw new Error('No response body');
        const reader = res.body.getReader();
        setIsThinking(false);
        const processChunk = (chunk, llmTextRef) => {
          chunk.split('\n').forEach(function processPart(part) {
            const trimmed = part.trim();
            if (!trimmed) return;
            if (trimmed.startsWith(':')) {
              if (trimmed.includes('OPENROUTER PROCESSING')) setIsThinking(true);
              return;
            }
            if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.slice(5).trim();
              if (dataStr === '[DONE]') return;
              try {
                const json = JSON.parse(dataStr);
                const text =
                  (json.reasoning) ||
                  (json.content) ||
                  (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content);
                if (text) {
                  llmTextRef.current += text;
                  setIsThinking(false);
                  setChatMessages(msgs => {
                    const last = msgs[msgs.length - 1];
                    if (last && last.sender === 'llm') {
                      return [...msgs.slice(0, -1), { ...last, text: llmTextRef.current }];
                    } else {
                      return [...msgs, { id: Date.now() + 1, sender: 'llm', text: llmTextRef.current }];
                    }
                  });
                  fromIndex++;
                  debugStreamState('handleSubmit - token', { streamId, fromIndex, partialResponse: llmTextRef.current });
                }
              } catch {}
            }
          });
        };
        const llmTextRef = { current: '' };
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = new TextDecoder().decode(value);
          processChunk(chunk, llmTextRef);
        }
        setIsThinking(false);
        setLoading(false);
      } catch (err) {
        setChatMessages(msgs => [...msgs, { id: Date.now() + 2, sender: 'llm', text: 'Error: ' + (err.message || 'Unknown error') }]);
        setIsThinking(false);
        setLoading(false);
      }
      return;
    }
    if (user) {
      const db = getFirestore()
      const userRef = doc(db, 'users', user.uid)
      const snap = await getDoc(userRef)
      let messagesLeft = 20
      let resetAt = null
      const now = Date.now()
      if (snap.exists()) {
        const d = snap.data()
        messagesLeft = typeof d.messagesLeft === 'number' ? d.messagesLeft : 20
        resetAt = typeof d.resetAt === 'number' ? d.resetAt : null
      }
      if (!resetAt || now > resetAt) {
        messagesLeft = 20
        resetAt = now + 8 * 60 * 60 * 1000
      }
      if (messagesLeft <= 0) {
        toast.error('Message limit reached. Wait for reset.')
        return
      }
      await updateDoc(userRef, { messagesLeft: messagesLeft - 1, resetAt })
    }
    setFirstMessageSent(true);
    setMessage('');
    if (model && model.family) setLastUsedModelFamily(model.family);
    const userMsg = { role: 'user', content: data.prompt, model: model?.openRouterName || 'openai/gpt-4o' };
    const db = getFirestore();
    const modelObj = model || selectedModel;
    let convId = conversationId;
    const FUNCTIONS_URL = process.env.REACT_APP_FUNCTIONS_URL;

    if (selectedBranchId && selectedBranchId !== 'root' && convId) {
      // Add message to branch
      const apiKey = localStorage.getItem('apiKey') || '';
      const res = await fetch(`${FUNCTIONS_URL}/addMessageToBranch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ chatid: convId, branchId: selectedBranchId, message: userMsg }),
      });
      if (!res.ok) {
        toast.error('Failed to add message to branch');
        return;
      }
      const dataBranch = await res.json();
      setBranches(prev => ({ ...prev, [selectedBranchId]: dataBranch.branch }));
      setMessage('');
      setFirstMessageSent(true);
      setLoading(true);
      setIsThinking(false);
      // Now stream LLM response for this branch
      let branchMessages = dataBranch.branch.messages || [];
      branchMessages = [...branchMessages, userMsg];
      const modelName = modelObj?.openRouterName || 'openai/gpt-4o';
      const apiKey2 = localStorage.getItem('apiKey') || '';
      const res2 = await fetch(`${FUNCTIONS_URL}/llmStreamResumable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey2 },
        body: JSON.stringify({ model: modelName, messages: branchMessages, chat_id: convId }),
      });
      if (res2.status === 429) {
        try {
          const data = await res2.json();
          if (data && data.error === 'rate_limit') {
            toast.error(data.message, { icon: <Sparkles size={18} /> });
            setIsThinking(false);
            setLoading(false);
            return;
          }
        } catch {}
      }
      if (!res2.body) throw new Error('No response body');
      const reader = res2.body.getReader();
      setIsThinking(false);
      const processBranchChunk = (chunk, llmTextRef) => {
        chunk.split('\n').forEach(function processPart(part) {
          const trimmed = part.trim();
          if (!trimmed) return;
          if (trimmed.startsWith(':')) {
            if (trimmed.includes('OPENROUTER PROCESSING')) setIsThinking(true);
            return;
          }
          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') return;
            try {
              const json = JSON.parse(dataStr);
              const text =
                (json.reasoning) ||
                (json.content) ||
                (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content);
              if (text) {
                llmTextRef.current += text;
                setIsThinking(false);
                setBranches(prev => {
                  const updated = { ...prev };
                  if (updated[selectedBranchId]) {
                    const msgs = updated[selectedBranchId].messages || [];
                    if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
                      msgs[msgs.length - 1].content = llmTextRef.current;
                    } else {
                      msgs.push({ role: 'assistant', content: llmTextRef.current, model: modelObj?.openRouterName || 'openai/gpt-4o' });
                    }
                    updated[selectedBranchId] = { ...updated[selectedBranchId], messages: [...msgs] };
                  }
                  return updated;
                });
              }
            } catch {}
          }
        });
      };
      const llmTextBranchRef = { current: '' };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        processBranchChunk(chunk, llmTextBranchRef);
      }
      setIsThinking(false);
      setLoading(false);
    } else {
      if (!convId) {
        // Create new conversation in Firestore with the user message
        const convRef = await addDoc(collection(db, 'conversations'), {
          userId: user?.uid || 'anon',
          createdAt: Timestamp.now(),
          lastUsed: Timestamp.now(),
          model: modelObj?.openRouterName || 'openai/gpt-4o',
          modelDisplayName: modelObj?.displayName || 'GPT-4o',
          messages: [userMsg],
        });
        convId = convRef.id;
        setConversationId(convId);
        if (id !== convId) {
          navigate(`/chat/${convId}`, { replace: true });
        }
      } else {
        // Always append user message to Firestore for existing conversation
        const convRef = doc(db, 'conversations', convId);
        await updateDoc(convRef, {
          messages: arrayUnion(userMsg),
          lastUsed: Timestamp.now(),
        });
      }
    }
    const newMessages = [...chatMessages, { id: Date.now(), sender: 'user', text: data.prompt }];
    setChatMessages(newMessages);
    setLoading(true);
    setIsThinking(false);
    const modelName = modelObj?.openRouterName || 'openai/gpt-4o';
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let convoMessages = [userMsg];
    // Always send the full conversation history for context
    if (convId) {
      const convSnap = await getDoc(doc(db, 'conversations', convId));
      if (convSnap.exists()) {
        convoMessages = convSnap.data().messages ? [...convSnap.data().messages, userMsg] : [userMsg];
      }
    }
    try {
      const res = await fetch(`${FUNCTIONS_URL}/llmStreamResumable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey || '' },
        body: JSON.stringify({ model: modelName, messages: convoMessages, chat_id: convId }),
      });
      if (res.status === 429) {
        try {
          const data = await res.json();
          if (data && data.error === 'rate_limit') {
            toast.error(data.message, { icon: <Sparkles size={18} /> });
            setIsThinking(false);
            setLoading(false);
            return;
          }
        } catch {}
      }
      if (res.status === 500) {
        toast.error('We ran out of free quota. :(');
        setIsThinking(false);
        setLoading(false);
        return;
      }
      if (!res.body) throw new Error('No response body');
      const reader = res.body.getReader();
      setIsThinking(false);
      const processChunk = (chunk, llmTextRef) => {
        chunk.split('\n').forEach(function processPart(part) {
          const trimmed = part.trim();
          if (!trimmed) return;
          if (trimmed.startsWith(':')) {
            if (trimmed.includes('OPENROUTER PROCESSING')) setIsThinking(true);
            return;
          }
          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') return;
            try {
              const json = JSON.parse(dataStr);
              const text =
                (json.reasoning) ||
                (json.content) ||
                (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content);
              if (text) {
                llmTextRef.current += text;
                setIsThinking(false);
                setChatMessages(msgs => {
                  const last = msgs[msgs.length - 1];
                  if (last && last.sender === 'llm') {
                    return [...msgs.slice(0, -1), { ...last, text: llmTextRef.current }];
                  } else {
                    return [...msgs, { id: Date.now() + 1, sender: 'llm', text: llmTextRef.current }];
                  }
                });
              }
            } catch {}
          }
        });
      };
      const llmTextRef = { current: '' };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        processChunk(chunk, llmTextRef);
      }
      setIsThinking(false);
      setLoading(false);
    } catch (err) {
      setChatMessages(msgs => [...msgs, { id: Date.now() + 2, sender: 'llm', text: 'Error: ' + (err.message || 'Unknown error') }]);
      setIsThinking(false);
      setLoading(false);
    }
  };

  // Restore handleReroll function
  const handleReroll = async (llmMsg, newModel) => {
    setLoading(true);
    setIsThinking(false);
    const modelObj = models.find(m => m.name === newModel);
    const modelName = modelObj?.openRouterName || 'openai/gpt-4o';
    const FUNCTIONS_URL = process.env.REACT_APP_FUNCTIONS_URL;
    // Find the user message before this llm message
    const llmMsgIdx = chatMessages.findIndex(m => m.id === llmMsg.id);
    let userMsg = null;
    for (let i = llmMsgIdx - 1; i >= 0; i--) {
      if (chatMessages[i].sender === 'user') {
        userMsg = chatMessages[i];
        break;
      }
    }
    if (!userMsg) {
      setIsThinking(false);
      setLoading(false);
      return;
    }
    // Get conversation history up to and including this user message
    let convoMessages = [];
    for (let i = 0; i <= llmMsgIdx; i++) {
      if (chatMessages[i].sender === 'user') {
        convoMessages.push({ role: 'user', content: chatMessages[i].text });
      } else if (chatMessages[i].sender === 'llm' && chatMessages[i].id !== llmMsg.id) {
        convoMessages.push({ role: 'assistant', content: chatMessages[i].text });
      }
    }
    // Add the user message again to reroll
    convoMessages.push({ role: 'user', content: userMsg.text });
    // Remove the old LLM message to trigger exit animation
    setChatMessages(msgs => msgs.filter(m => m.id !== llmMsg.id));
    await new Promise(res => setTimeout(res, 120));
    try {
      const res = await fetch(`${FUNCTIONS_URL}/llmStreamResumable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey || '' },
        body: JSON.stringify({ model: modelName, messages: convoMessages, chat_id: conversationId }),
      });
      if (res.status === 429) {
        try {
          const data = await res.json();
          if (data && data.error === 'rate_limit') {
            toast.error(data.message, { icon: <Sparkles size={18} /> });
            setIsThinking(false);
            setLoading(false);
            return;
          }
        } catch {}
      }
      if (res.status === 500) {
        toast.error(
          <span>
            Error 500 from model endpoint.<br />
            <button
              className='underline text-pink-300 ml-1'
              onClick={() => handleReroll(llmMsg, newModel)}
            >Reroll again</button>
          </span>
        );
        setIsThinking(false);
        setLoading(false);
        return;
      }
      if (!res.body) throw new Error('No response body');
      const reader = res.body.getReader();
      setIsThinking(false);
      const processRerollChunk = (chunk, llmTextRef) => {
        chunk.split('\n').forEach(function processPart(part) {
          const trimmed = part.trim();
          if (!trimmed) return;
          if (trimmed.startsWith(':')) {
            if (trimmed.includes('OPENROUTER PROCESSING')) setIsThinking(true);
            return;
          }
          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') return;
            try {
              const json = JSON.parse(dataStr);
              const text =
                (json.reasoning) ||
                (json.content) ||
                (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content);
              if (text) {
                llmTextRef.current += text;
                setIsThinking(false);
                setChatMessages(msgs => {
                  const idx = msgs.findIndex(m => m.id === llmMsg.id);
                  if (idx === -1) return msgs;
                  const newMsgs = [...msgs];
                  newMsgs[idx] = { ...newMsgs[idx], text: llmTextRef.current, model: modelObj.openRouterName };
                  return newMsgs;
                });
              }
            } catch {}
          }
        });
      };
      const llmTextRerollRef = { current: '' };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        processRerollChunk(chunk, llmTextRerollRef);
      }
      setIsThinking(false);
      setLoading(false);
    } catch (err) {
      toast.error(
        <span>
          Error: {err.message || 'Unknown error'}<br />
          <button
            className='underline text-pink-300 ml-1'
            onClick={() => handleReroll(llmMsg, newModel)}
          >Reroll again</button>
        </span>
      );
      setChatMessages(msgs => [...msgs, { id: Date.now() + 2, sender: 'llm', text: 'Error: ' + (err.message || 'Unknown error') }]);
      setIsThinking(false);
      setLoading(false);
    }
  };

  // Add debug logging to stream persistence
  function debugStreamState(label, state) {
    console.log(`[STREAM DEBUG] ${label}:`, JSON.stringify(state));
  }

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
        className="flex-1 flex flex-col px-0 md:px-10 pt-2 md:pt-10 pb-0 relative h-full rounded-xl"
        style={bgObj.style}
      >
        {bgObj.image && (
          <div className='w-full flex justify-center mt-4'>
            <img src={bgObj.image} alt={bgObj.name} style={{ maxWidth: 240, maxHeight: 240, opacity: 0.18, borderRadius: 24, position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 0, pointerEvents: 'none' }} />
          </div>
        )}
        <header className="flex justify-end items-center mb-10"></header>

        <div className="flex-1 flex flex-col items-center">
          {!firstMessageSent && !message.trim() && (
            <div className="w-full max-w-2xl animate-scale-in" style={{ marginTop: '100px' }}>
              <h2 className="text-3xl font-semibold mb-8 text-left">
                {user ? `How can I help you, ${user.displayName.split(' ')[0]}?` : 'How can I help you?'}
              </h2>

              <div className="flex flex-wrap gap-2 mb-6">
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

              <div className="w-full">
                <style>{`
                  .glass-question {
                    color: #E0E8FF;
                    background: transparent;
                    transition: background 0.2s, color 0.2s;
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
                  >
                    {q}
                  </p>
                ))}
              </div>
            </div>
          )}
          {firstMessageSent && !chatLoading && (
            <div
              ref={chatContainerRef}
              className={`flex-1 w-full flex flex-col items-center overflow-y-auto hide-scrollbar`}
              style={
                isMobile
                  ? { maxHeight: 'calc(100vh - 120px)', height: 'calc(100vh - 120px)', overflowY: 'auto' }
                  : { maxHeight: 'calc(100vh - 250px)' }
              }
            >
              <Chat
                modelFamily={lastUsedModelFamily}
                messages={selectedBranchId !== 'root' && branches[selectedBranchId] ? branches[selectedBranchId].messages : chatLoading ? [] : chatMessages}
                onReroll={handleReroll}
                loading={loading}
                isThinking={isThinking}
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
              {chatLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'rgba(32,27,37,0.85)' }}>
                  <span className="text-zinc-400 text-lg">Loading chat...</span>
                </div>
              )}
            </div>
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

        <MessageInput
          message={message}
          setMessage={setMessage}
          onFirstMessageSent={() => setFirstMessageSent(true)}
          onOpenOptions={() => { }}
          onSubmit={handleSubmit}
          isLoading={loading}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          isTemporaryChat={isTemporaryChat}
          onStartTemporaryChat={handleToggleTemporaryChat}
        />
      </motion.main>
    </>
  );
}

export default MainContent;