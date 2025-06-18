import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';

export function useConversations() {
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(true);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoadingConvos(false);
      return;
    }
    const db = getFirestore();
    const q = query(
      collection(db, 'conversations'),
      where('userId', '==', user.uid),
      orderBy('lastUsed', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const convos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setConversations(convos);
      setLoadingConvos(false);
    });
    return () => unsub();
  }, [user]);

  const filteredConvos = searchValue.trim()
    ? conversations.filter(conv => {
        const search = searchValue.trim().toLowerCase();
        return (
          (conv.name || '').toLowerCase().includes(search) ||
          (conv.modelDisplayName || '').toLowerCase().includes(search) ||
          (conv.messages?.[0]?.content || '').toLowerCase().includes(search)
        );
      })
    : conversations.slice(0, 100);
  const hasResults = filteredConvos.length > 0;

  function groupConversations(convos) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    const groups = { Today: [], Yesterday: [], Earlier: [] };
    convos.forEach(conv => {
      let last = conv.lastUsed;
      if (last && typeof last.toDate === 'function') last = last.toDate();
      else if (typeof last === 'string') last = new Date(last);
      else if (!(last instanceof Date)) last = new Date();
      if (isSameDay(last, today)) groups.Today.push(conv);
      else if (isSameDay(last, yesterday)) groups.Yesterday.push(conv);
      else groups.Earlier.push(conv);
    });
    return groups;
  }
  const groupedConvos = groupConversations(filteredConvos);

  return {
    conversations,
    loadingConvos,
    searchValue,
    setSearchValue,
    filteredConvos,
    groupedConvos,
    hasResults,
    user,
  };
}

export async function deleteConversation(conversationId) {
  const db = getFirestore();
  const convRef = doc(db, 'conversations', conversationId);
  await deleteDoc(convRef);
}

export async function deleteConversationsBulk(conversationIds) {
  const db = getFirestore();
  for (const id of conversationIds) {
    const convRef = doc(db, 'conversations', id);
    await deleteDoc(convRef);
  }
} 