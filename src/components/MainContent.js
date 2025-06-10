import React, { useState, useEffect, useRef } from 'react';
import { Newspaper, GraduationCap, Sparkles } from 'lucide-react';
import MessageInput from './MessageInput';
import { motion } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { CATEGORY_QUESTIONS, defaultQuestions } from '../constants';
import Chat from './Chat';
import { models } from '../models';
import LiquidGlassButton from './LiquidGlassButton';
import { getFirestore, collection, addDoc, doc, updateDoc, getDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function MainContent({ showSidebar, setShowSidebar }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const { user, apiKey } = useAuth();
  const [firstMessageSent, setFirstMessageSent] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedModel, setSelectedModel] = useState(() => models.find(m => m.name === 'deepseek-v3-0324'));
  const [lastUsedModelFamily, setLastUsedModelFamily] = useState('gemini');
  const [chatMessages, setChatMessages] = useState([]);
  const abortControllerRef = useRef(null);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    setMessage('');
  }, []); // Reset message when key changes (component remounts)

  useEffect(() => {
    if (id) {
      setChatLoading(true);
      // Load conversation by id
      const db = getFirestore();
      getDoc(doc(db, 'conversations', id)).then(convSnap => {
        if (convSnap.exists()) {
          const data = convSnap.data();
          setConversationId(id);
          setChatMessages(
            (data.messages || []).map((msg, i) => ({
              id: i,
              sender: msg.role === 'user' ? 'user' : (msg.role === 'assistant' ? 'llm' : msg.role),
              text: msg.content || msg.text || ''
            }))
          );
          setFirstMessageSent(true);
          setLastUsedModelFamily(data.model?.split('/')[0] || 'gemini');
        }
        setChatLoading(false);
      });
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setFirstMessageSent(false);
      setChatMessages([]);
      setConversationId(null);
      setSelectedCategory(null);
      setSelectedModel(models.find(m => m.name === 'deepseek-v3-0324'));
      setLastUsedModelFamily('gemini');
      setMessage('');
      setChatLoading(false);
    }
  }, [id]);

  const handleQuestionClick = (question) => {
    setMessage(question);
  };

  const handleSubmit = async (data, event, model) => {
    setFirstMessageSent(true);
    setMessage('');
    if (model && model.family) setLastUsedModelFamily(model.family);
    const userMsg = { role: 'user', content: data.prompt };
    const db = getFirestore();
    const modelObj = model || selectedModel;
    let convId = conversationId;
    const FUNCTIONS_URL = process.env.REACT_APP_FUNCTIONS_URL;

    if (!convId) {
      // Create new conversation
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
      // Trigger chat name generation in parallel (do not await)
      fetch(`${FUNCTIONS_URL}/chatNameFromMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey || '' },
        body: JSON.stringify({ chatid: convId, message: data.prompt }),
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.name) {
            const cached = JSON.parse(localStorage.getItem('conversations') || '{}');
            if (cached[convId]) {
              cached[convId].name = data.name;
              localStorage.setItem('conversations', JSON.stringify(cached));
            }
          }
        });
    } else {
      // Add message to existing conversation
      const convRef = doc(db, 'conversations', convId);
      await updateDoc(convRef, {
        messages: arrayUnion(userMsg),
        lastUsed: Timestamp.now(),
      });
    }
    const newMessages = [...chatMessages, { id: Date.now(), sender: 'user', text: data.prompt }];
    setChatMessages(newMessages);
    setLoading(true);
    const modelName = modelObj?.openRouterName || 'openai/gpt-4o';
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    // Get full conversation history
    let convoMessages = [userMsg];
    if (convId) {
      const convSnap = await getDoc(doc(db, 'conversations', convId));
      if (convSnap.exists()) {
        convoMessages = convSnap.data().messages || [userMsg];
      }
    }
    try {
      const res = await fetch(`${FUNCTIONS_URL}/llmStream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey || '' },
        body: JSON.stringify({ model: modelName, messages: convoMessages }),
        signal: controller.signal,
      });
      if (!res.body) throw new Error('No response body');
      const reader = res.body.getReader();
      let llmText = '';
      const processChunk = (chunk) => {
        chunk.split('data:').forEach(function processPart(part) {
          const trimmed = part.trim();
          if (trimmed) {
            try {
              const json = JSON.parse(trimmed);
              if (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) {
                llmText += json.choices[0].delta.content;
                setChatMessages(msgs => {
                  const last = msgs[msgs.length - 1];
                  if (last && last.sender === 'llm') {
                    return [...msgs.slice(0, -1), { ...last, text: llmText }];
                  } else {
                    return [...msgs, { id: Date.now() + 1, sender: 'llm', text: llmText }];
                  }
                });
              }
            } catch { }
          }
        });
      };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        processChunk(chunk);
      }
      // Save LLM response to conversation
      const convRef = doc(db, 'conversations', convId);
      await updateDoc(convRef, {
        messages: arrayUnion({ role: 'assistant', content: llmText }),
        lastUsed: Timestamp.now(),
      });
      setLoading(false);
      // Cache conversation in localStorage
      const cached = JSON.parse(localStorage.getItem('conversations') || '{}');
      cached[convId] = {
        id: convId,
        userId: user?.uid || 'anon',
        lastUsed: Timestamp.fromDate(new Date()).toDate().toISOString(),
        model: modelObj?.openRouterName || 'openai/gpt-4o',
        modelDisplayName: modelObj?.displayName || 'GPT-4o',
        messages: [...convoMessages, { role: 'assistant', content: llmText }],
      };
      localStorage.setItem('conversations', JSON.stringify(cached));
    } catch (err) {
      setChatMessages(msgs => [...msgs, { id: Date.now() + 2, sender: 'llm', text: 'Error: ' + (err.message || 'Unknown error') }]);
      setLoading(false);
    }
  };

  // Define the reroll handler as a variable so it can be referenced in the toast
  const handleReroll = async (llmMsg, newModel) => {
    setLoading(true);
    const modelObj = newModel;
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
      const res = await fetch(`${FUNCTIONS_URL}/llmStream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey || '' },
        body: JSON.stringify({ model: modelName, messages: convoMessages }),
      });
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
        setLoading(false);
        return;
      }
      if (!res.body) throw new Error('No response body');
      const reader = res.body.getReader();
      let llmText = '';
      // Insert a placeholder for the rerolled message
      setChatMessages(msgs => {
        const newMsgs = [...msgs];
        newMsgs.splice(llmMsgIdx, 0, { ...llmMsg, text: '', model: modelObj.name });
        return newMsgs;
      });
      const processChunk = (chunk) => {
        chunk.split('data:').forEach(function processPart(part) {
          const trimmed = part.trim();
          if (trimmed) {
            try {
              const json = JSON.parse(trimmed);
              if (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) {
                llmText += json.choices[0].delta.content;
                setChatMessages(msgs => {
                  const idx = msgs.findIndex(m => m.id === llmMsg.id);
                  if (idx === -1) return msgs;
                  const newMsgs = [...msgs];
                  newMsgs[idx] = { ...newMsgs[idx], text: llmText, model: modelObj.name };
                  return newMsgs;
                });
              }
            } catch { }
          }
        });
      };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        processChunk(chunk);
      }
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
      setLoading(false);
    }
  };

  return (
    <>
      {/* Always show the buttons in the top right */}
      {/* Removed settings and theme buttons */}
      <motion.main
        className="flex-1 flex flex-col p-6 md:p-10 pb-0 relative h-full border rounded-xl"
        style={{
          border: '1.5px solid rgba(80, 140, 255, 0.25)',
          borderRadius: '0.75rem',
          marginTop: '15px',
          background: 'linear-gradient(135deg, #23232a 0%, #18181b 100%)',
          boxShadow: '0 4px 32px 0 rgba(80,140,255,0.08)',
          animation: 'mainAreaGlow 3s ease-in-out infinite',
        }}
      >
        <style>{`
          @keyframes mainAreaGlow {
            0%, 100% { box-shadow: 0 4px 32px 0 rgba(80,140,255,0.08); }
            50% { box-shadow: 0 4px 32px 0 rgba(80,140,255,0.22); }
          }
        `}</style>
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
                    className="glass-question p-3 rounded-lg text-sm font-bold cursor-pointer transition-colors text-left border-b break-words whitespace-pre-line sm:whitespace-normal sm:break-normal overflow-x-auto"
                    style={{ borderBottomColor: '#29222E', wordBreak: 'break-word' }}
                    onClick={() => handleQuestionClick(q)}
                  >
                    {q}
                  </p>
                ))}
              </div>
            </div>
          )}
          {firstMessageSent && !chatLoading && (
            <div className="flex-1 w-full flex flex-col items-center overflow-y-auto hide-scrollbar" style={{ maxHeight: 'calc(100vh - 250px)' }}>
              <Chat
                modelFamily={lastUsedModelFamily}
                messages={chatLoading ? [] : chatMessages}
                onReroll={handleReroll}
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

        <MessageInput message={message} setMessage={setMessage} onFirstMessageSent={() => setFirstMessageSent(true)} onOpenOptions={() => { }} onSubmit={handleSubmit} isLoading={loading} selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
      </motion.main>
    </>
  );
}

export default MainContent; 