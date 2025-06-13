import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import Chat from './Chat';
import toast from 'react-hot-toast';
import MessageInput from './MessageInput';
import { models } from '../models';

function SharedChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [modelFamily, setModelFamily] = useState('gemini');
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedModel] = useState(() => models.find(m => m.name === 'deepseek-v3-0324'));
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function fetchSharedChat() {
      setLoading(true);
      try {
        const db = getFirestore();
        const docRef = doc(db, 'shared_chats', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMessages((data.messages || []).map((msg, i) => ({
            id: i,
            sender: msg.role === 'user' ? 'user' : (msg.role === 'assistant' ? 'llm' : msg.role),
            text: msg.content || msg.text || '',
            model: msg.model || data.model || null
          })));
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
    if (!data.prompt.trim()) return;
    setCreating(true);
    try {
      const db = getFirestore();
      // Prepare new chat messages: all shared + new user message
      const newMessages = [
        ...messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
          model: m.model || selectedModel.openRouterName
        })),
        { role: 'user', content: data.prompt, model: selectedModel.openRouterName }
      ];
      // Create new chat
      const convRef = await addDoc(collection(db, 'conversations'), {
        userId: 'anon',
        createdAt: Timestamp.now(),
        lastUsed: Timestamp.now(),
        model: selectedModel.openRouterName,
        modelDisplayName: selectedModel.displayName,
        messages: newMessages,
      });
      navigate(`/chat/${convRef.id}`);
    } catch (err) {
      toast.error('Failed to start new chat');
    }
    setCreating(false);
  };

  return (
    <div className='flex-1 flex flex-col items-center w-full h-full'>
      {loading ? (
        <div className='text-zinc-400 text-lg mt-20'>Loading shared chat...</div>
      ) : (
        <>
          <div className='flex-1 w-full flex flex-col items-center overflow-y-auto hide-scrollbar' style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <Chat modelFamily={modelFamily} messages={messages} loading={creating} />
          </div>
          <div className='w-full max-w-2xl mx-auto px-2 pb-4'>
            <MessageInput
              isLoading={creating}
              onSubmit={handleSubmit}
              onOpenOptions={() => {}}
              message={inputMessage}
              setMessage={setInputMessage}
              selectedModel={selectedModel}
              setSelectedModel={() => {}}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default SharedChatPage; 