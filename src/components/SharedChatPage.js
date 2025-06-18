import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import Chat from './Chat';
import toast from 'react-hot-toast';
import MessageInput from './MessageInput';
import { models } from '../models';
import { useAuth } from '../AuthContext';
import { motion } from 'framer-motion';

function SharedChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [modelFamily, setModelFamily] = useState('gemini');
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const chatContainerRef = useRef(null);
  const isMobile = window.innerWidth <= 960;

  useEffect(() => {
    if (!user) {
      setSelectedModel(models.find(m => m.name === 'gemini-2.0-flash-lite'));
      return;
    }
    let defaultModelName = user?.defaultModel || localStorage.getItem('default_model');
    let model = defaultModelName ? models.find(m => m.name === defaultModelName) : null;
    if (!model) model = models.find(m => m.name === 'deepseek-v3-0324');
    const useOwnKey = (user && user.useOwnKey) || localStorage.getItem('use_own_api_key') === 'true';
    const hasSubscription = user && user.status === 'premium';
    if (!model || (model.apiKeyRequired && !useOwnKey) || (!model.freeAccess && !hasSubscription && !useOwnKey)) {
      model = models.find(m => (!m.apiKeyRequired || useOwnKey) && (m.freeAccess || hasSubscription || useOwnKey));
    }
    setSelectedModel(model);
  }, [user]);

  useEffect(() => {
    async function fetchSharedChat() {
      setLoading(true);
      try {
        const db = getFirestore();
        const docRef = doc(db, 'shared_chats', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMessages((data.messages || []).map((msg, i) => {
            let thinking = '';
            let mainContent = msg.content || msg.text || '';
            if ((msg.role === 'assistant' || msg.sender === 'llm') && typeof mainContent === 'string') {
              const thinkingMatch = mainContent.match(/<thinking>([\s\S]*?)<\/thinking>/);
              if (thinkingMatch) {
                thinking = thinkingMatch[1];
                mainContent = mainContent.replace(/<thinking>[\s\S]*?<\/thinking>/, '');
              }
            }
            return {
              id: i,
              sender: msg.role === 'user' ? 'user' : (msg.role === 'assistant' ? 'llm' : msg.role),
              text: mainContent,
              thinking,
              model: msg.model || data.model || null
            };
          }));
          setModelFamily(data.model?.split('/')[0] || 'gemini');
        } else {
          toast.error('Shared chat not found');
        }
      } catch (err) {
        toast.error('Failed to load shared chat');
      }
      setLoading(false);
    }
    if (id) fetchSharedChat();
  }, [id]);

  const handleSubmit = async (data) => {
    if (!data.prompt.trim() || !selectedModel) return;
    setCreating(true);
    try {
      const db = getFirestore();
      const newMessages = [
        ...messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
          model: m.model || selectedModel.openRouterName
        }))
      ];
      const convRef = await addDoc(collection(db, 'conversations'), {
        userId: user?.uid || 'anon',
        createdAt: Timestamp.now(),
        lastUsed: Timestamp.now(),
        model: selectedModel.openRouterName,
        modelDisplayName: selectedModel.displayName,
        messages: newMessages,
      });
      navigate(`/chat/${convRef.id}?prompt=${encodeURIComponent(data.prompt)}`);
    } catch (err) {
      toast.error('Failed to start new chat');
    }
    setCreating(false);
  };

  return (
    <motion.main
      className="flex flex-col min-h-screen w-full px-0 md:px-10 pt-2 md:pt-10 pb-0 relative rounded-xl"
      style={!isMobile ? { marginLeft: 'calc(18rem + 55px)' } : {}}
    >
      <div className="flex-1 flex flex-col items-center w-full">
        {loading ? (
          <div className='text-zinc-400 text-lg mt-20'>Loading shared chat...</div>
        ) : (
          <div
            ref={chatContainerRef}
            className="flex-1 w-full flex flex-col items-center overflow-y-auto hide-scrollbar"
            style={
              isMobile
                ? { maxHeight: 'calc(100vh - 100px)', height: 'calc(100vh - 100px)', overflowY: 'auto', width: '100%' }
                : { maxHeight: 'calc(100vh - 175px)', width: '100%' }
            }
          >
            <Chat
              modelFamily={modelFamily}
              messages={messages}
              loading={creating}
              showReasoning={showReasoning}
              setShowReasoning={setShowReasoning}
              chatContainerRef={chatContainerRef}
            />
          </div>
        )}
      </div>
      <div className="w-full" style={{ position: 'sticky', bottom: 0, zIndex: 40 }}>
        <MessageInput
          isLoading={creating}
          onSubmit={handleSubmit}
          onOpenOptions={() => {}}
          message={inputMessage}
          setMessage={setInputMessage}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />
      </div>
    </motion.main>
  );
}

export default SharedChatPage; 