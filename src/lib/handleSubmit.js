import { getFirestore, collection, addDoc, doc, updateDoc, getDoc, arrayUnion, Timestamp } from 'firebase/firestore';

const handleSubmit = async ({
  data,
  event,
  model,
  isTemporaryChat,
  setFirstMessageSent,
  setMessage,
  setLastUsedModelFamily,
  chatMessages,
  setChatMessages,
  setLoading,
  user,
  selectedModel,
  conversationId,
  setConversationId,
  navigate,
  id,
  toast,
  Sparkles,
  selectedBranchId,
  branches,
  setBranches,
  branchLoading,
  setBranchLoading,
  apiKey,
  FUNCTIONS_URL,
  abortControllerRef,
  useWebSearch,
  debugStreamState
}) => {
  if (isTemporaryChat) {
    setFirstMessageSent(true);
    setMessage('');
    if (model && model.family) setLastUsedModelFamily(model.family);
    const userMsg = { role: 'user', content: data.prompt };
    if (Array.isArray(data.images) && data.images.length > 0) {
      userMsg.images = data.images;
    }
    // Always assign a unique id to userMsg
    userMsg.id = Date.now().toString() + Math.random().toString(36).slice(2);
    const modelObj = model || selectedModel;
    if (!modelObj || !modelObj.openRouterName) {
      toast.error('Please select a model before sending a message.', { icon: <Sparkles size={18} /> });
      setLoading(false);
      return;
    }
    const newMessages = [...chatMessages, { id: Date.now(), sender: 'user', text: data.prompt, images: data.images && data.images.length > 0 ? data.images : undefined }];
    setChatMessages(newMessages);
    setLoading(true);
    const modelName = modelObj.openRouterName;
    const apiKeyLocal = apiKey || '';
    const streamId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    let fromIndex = 0;
    debugStreamState && debugStreamState('handleSubmit - start', { streamId, fromIndex, prompt: data.prompt });
    try {
      const res = await fetch(`${FUNCTIONS_URL}/llmStreamResumable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKeyLocal },
        body: JSON.stringify({ model: modelName, messages: [userMsg], streamId, fromIndex, images: data.images, useWebSearch }),
      });
      if (res.status === 429) {
        try {
          const data = await res.json();
          if (data && data.error === 'rate_limit') {
            toast.error(data.message, { icon: <Sparkles size={18} /> });
            setLoading(false);
            return;
          }
        } catch {}
      }
      if (res.status === 500) {
        toast.error('We ran out of free quota. :(');
        setLoading(false);
        return;
      }
      if (!res.ok) {
        let errorMsg = `Stream error: ${res.status} ${res.statusText}`;
        try {
          const data = await res.json();
          if (data && data.error) errorMsg += ` - ${data.error}`;
        } catch {}
        toast.error(errorMsg, { icon: <Sparkles size={18} /> });
        setLoading(false);
        return;
      }
      if (!res.body) throw new Error('No response body');
      const reader = res.body.getReader();
      const processChunk = (chunk, llmTextRef, llmThinkingRef) => {
        chunk.split('\n').forEach(function processPart(part) {
          const trimmed = part.trim();
          if (!trimmed) return;
          if (trimmed.startsWith(':')) {
            return;
          }
          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') return;
            try {
              const json = JSON.parse(dataStr);
              let text = '';
              let reasoning = '';
              if (json.reasoning) reasoning = json.reasoning;
              if (json.content) text = json.content;
              if (json.choices && json.choices[0] && json.choices[0].delta) {
                if (json.choices[0].delta.reasoning) reasoning = json.choices[0].delta.reasoning;
                if (json.choices[0].delta.content) text = json.choices[0].delta.content;
              }
              if (reasoning) {
                llmThinkingRef.current += reasoning;
              }
              if (text) {
                llmTextRef.current += text;
              }
              if (reasoning || text) {
                setChatMessages(msgs => {
                  const last = msgs[msgs.length - 1];
                  if (last && last.sender === 'llm') {
                    return [
                      ...msgs.slice(0, -1),
                      { ...last, text: llmTextRef.current, thinking: llmThinkingRef.current, model: modelObj?.openRouterName }
                    ];
                  } else {
                    return [
                      ...msgs,
                      { id: Date.now() + 1, sender: 'llm', text: llmTextRef.current, thinking: llmThinkingRef.current, model: modelObj?.openRouterName }
                    ];
                  }
                });
              }
            } catch {}
          }
        });
      };
      const llmTextRef = { current: '' };
      const llmThinkingRef = { current: '' };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        processChunk(chunk, llmTextRef, llmThinkingRef);
      }
      setLoading(false);
    } catch (err) {
      setChatMessages(msgs => [...msgs, { id: Date.now() + 2, sender: 'llm', text: 'Error: ' + (err.message || 'Unknown error') }]);
      setLoading(false);
    }
    return;
  }
  if (user) {
    const db = getFirestore();
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    let messagesLeft = 20;
    let resetAt = null;
    const now = Date.now();
    if (snap.exists()) {
      const d = snap.data();
      messagesLeft = typeof d.messagesLeft === 'number' ? d.messagesLeft : 20;
      resetAt = typeof d.resetAt === 'number' ? d.resetAt : null;
    }
    if (!resetAt || now > resetAt) {
      messagesLeft = 20;
      resetAt = now + 8 * 60 * 60 * 1000;
    }
    if (messagesLeft < 1 && user.status !== 'premium') {
      toast.error('You are out of messages. Wait for reset or upgrade.');
      setLoading(false);
      return;
    }
    if (!user.status === 'premium' && messagesLeft > 0) {
      await updateDoc(userRef, { messagesLeft: messagesLeft - 1, resetAt });
    } else if (user.status === 'premium') {
      await updateDoc(userRef, { resetAt });
    }
  }
  setFirstMessageSent(true);
  setMessage('');
  if (model && model.family) setLastUsedModelFamily(model.family);
  const userMsg = { role: 'user', content: data.prompt };
  if (Array.isArray(data.images) && data.images.length > 0) {
    userMsg.images = data.images;
  }
  // Always assign a unique id to userMsg
  userMsg.id = Date.now().toString() + Math.random().toString(36).slice(2);
  const db = getFirestore();
  const modelObj = model || selectedModel;
  let convId = conversationId;

  if (selectedBranchId && selectedBranchId !== 'root' && convId) {
    // Add message to branch
    const apiKeyLocal = apiKey || '';
    const res = await fetch(`${FUNCTIONS_URL}/addMessageToBranch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKeyLocal },
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
    // Now stream LLM response for this branch
    let branchMessages = dataBranch.branch.messages || [];
    branchMessages = [...branchMessages, userMsg];
    const modelName = modelObj?.openRouterName;
    const apiKey2 = apiKey || '';
    const res2 = await fetch(`${FUNCTIONS_URL}/llmStreamResumable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey2 },
      body: JSON.stringify({ model: modelName, messages: branchMessages, chat_id: convId, images: data.images, useWebSearch, branchId: selectedBranchId }),
    });
    if (res2.status === 429) {
      try {
        const data = await res2.json();
        if (data && data.error === 'rate_limit') {
          toast.error(data.message, { icon: <Sparkles size={18} /> });
          setLoading(false);
          return;
        }
      } catch {}
    }
    if (res2.status === 500) {
      toast.error('We ran out of free quota. :(');
      setLoading(false);
      return;
    }
    if (!res2.ok) {
      let errorMsg = `Stream error: ${res2.status} ${res2.statusText}`;
      try {
        const data = await res2.json();
        if (data && data.error) errorMsg += ` - ${data.error}`;
      } catch {}
      toast.error(errorMsg, { icon: <Sparkles size={18} /> });
      setLoading(false);
      return;
    }
    if (!res2.body) throw new Error('No response body');
    const reader = res2.body.getReader();
    const processBranchChunk = (chunk, llmTextRef, llmThinkingRef, assistantMessageId) => {
      chunk.split('\n').forEach(function processPart(part) {
        const trimmed = part.trim();
        if (!trimmed) return;
        if (trimmed.startsWith(':')) {
          return;
        }
        if (trimmed.startsWith('data:')) {
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') return;
          try {
            const json = JSON.parse(dataStr);
            let text = '';
            let reasoning = '';
            if (json.reasoning) reasoning = json.reasoning;
            if (json.content) text = json.content;
            if (json.choices && json.choices[0] && json.choices[0].delta) {
              if (json.choices[0].delta.reasoning) reasoning = json.choices[0].delta.reasoning;
              if (json.choices[0].delta.content) text = json.choices[0].delta.content;
            }
            if (reasoning) {
              llmThinkingRef.current += reasoning;
            }
            if (text) {
              llmTextRef.current += text;
            }
            if (reasoning || text) {
              setBranches(prev => {
                const updated = { ...prev };
                if (updated[selectedBranchId]) {
                  const msgs = updated[selectedBranchId].messages || [];
                  const assistantMessageIndex = msgs.findIndex(m => m.id === assistantMessageId);

                  if (assistantMessageIndex !== -1) {
                    // Update existing message
                    msgs[assistantMessageIndex].content = llmTextRef.current;
                    msgs[assistantMessageIndex].thinking = llmThinkingRef.current;
                  } else {
                    // Add new message
                    msgs.push({
                      id: assistantMessageId,
                      messageId: assistantMessageId,
                      role: 'assistant',
                      content: llmTextRef.current,
                      thinking: llmThinkingRef.current,
                      model: modelObj?.openRouterName
                    });
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
    const llmThinkingBranchRef = { current: '' };
    const assistantMessageId = 'llm_branch_' + Date.now();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      processBranchChunk(chunk, llmTextBranchRef, llmThinkingBranchRef, assistantMessageId);
    }
    setLoading(false);
    return;
  } else {
    if (!convId) {
      // Create new conversation in Firestore with the user message
      const conversationData = {
        userId: user?.uid || 'anon',
        createdAt: Timestamp.now(),
        lastUsed: Timestamp.now(),
        model: modelObj?.openRouterName,
        modelDisplayName: modelObj?.displayName,
        messages: [userMsg],
      };
      // Remove any undefined values from conversationData
      Object.keys(conversationData).forEach(key => {
        if (conversationData[key] === undefined) {
          delete conversationData[key];
        }
      });
      // Also clean undefined from userMsg inside messages
      if (conversationData.messages && Array.isArray(conversationData.messages)) {
        conversationData.messages = conversationData.messages.map(msg => {
          const cleanMsg = { ...msg };
          Object.keys(cleanMsg).forEach(k => {
            if (cleanMsg[k] === undefined) {
              delete cleanMsg[k];
            }
          });
          return cleanMsg;
        });
      }
      const convRef = await addDoc(collection(db, 'conversations'), conversationData);
      convId = convRef.id;
      setConversationId(convId);
      if (id !== convId) {
        navigate(`/chat/${convId}`, { replace: true });
      }
      // Fire-and-forget: request backend to generate a custom chat name
      try {
        fetch(`${FUNCTIONS_URL}/chatNameFromMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey || ''
          },
          body: JSON.stringify({ chatid: convId, message: data.prompt })
        }).catch(e => console.error('chatNameFromMessage error', e));
      } catch (e) {
        console.error('chatNameFromMessage error', e);
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
  // Only update local chatMessages once per user input
  const newMessages = [...chatMessages, { ...userMsg, sender: 'user', text: data.prompt, images: data.images && data.images.length > 0 ? data.images : undefined }];
  setChatMessages(newMessages);
  setLoading(true);
  const modelName = modelObj?.openRouterName;
  abortControllerRef.current?.abort && abortControllerRef.current.abort();
  const controller = new AbortController();
  abortControllerRef.current = controller;
  let convoMessages = [];
  // Always send the full conversation history for context
  if (convId) {
    const convSnap = await getDoc(doc(db, 'conversations', convId));
    if (convSnap.exists()) {
      convoMessages = convSnap.data().messages ? [...convSnap.data().messages] : [];
    }
  } else {
    convoMessages = [userMsg];
  }
  try {
    const res = await fetch(`${FUNCTIONS_URL}/llmStreamResumable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey || '' },
      body: JSON.stringify({
        model: modelName,
        messages: convoMessages,
        chat_id: convId,
        images: data.images,
        useWebSearch,
        ...(selectedBranchId && selectedBranchId !== 'root' ? { branchId: selectedBranchId } : {})
      }),
    });
    if (res.status === 429) {
      try {
        const data = await res.json();
        if (data && data.error === 'rate_limit') {
          toast.error(data.message, { icon: <Sparkles size={18} /> });
          setLoading(false);
          return;
        }
      } catch {}
    }
    if (res.status === 500) {
      toast.error('We ran out of free quota. :(');
      setLoading(false);
      return;
    }
    if (!res.ok) {
      let errorMsg = `Stream error: ${res.status} ${res.statusText}`;
      try {
        const data = await res.json();
        if (data && data.error) errorMsg += ` - ${data.error}`;
      } catch {}
      toast.error(errorMsg, { icon: <Sparkles size={18} /> });
      setLoading(false);
      return;
    }
    if (!res.body) throw new Error('No response body');
    const reader = res.body.getReader();
    const processChunk = (chunk, llmTextRef, llmThinkingRef) => {
      chunk.split('\n').forEach(function processPart(part) {
        const trimmed = part.trim();
        if (!trimmed) return;
        if (trimmed.startsWith(':')) {
          return;
        }
        if (trimmed.startsWith('data:')) {
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') return;
          try {
            const json = JSON.parse(dataStr);
            let text = '';
            let reasoning = '';
            if (json.reasoning) reasoning = json.reasoning;
            if (json.content) text = json.content;
            if (json.choices && json.choices[0] && json.choices[0].delta) {
              if (json.choices[0].delta.reasoning) reasoning = json.choices[0].delta.reasoning;
              if (json.choices[0].delta.content) text = json.choices[0].delta.content;
            }
            if (reasoning) {
              llmThinkingRef.current += reasoning;
            }
            if (text) {
              llmTextRef.current += text;
            }
            if (reasoning || text) {
              setChatMessages(msgs => {
                const last = msgs[msgs.length - 1];
                if (last && last.sender === 'llm') {
                  return [
                    ...msgs.slice(0, -1),
                    { ...last, text: llmTextRef.current, thinking: llmThinkingRef.current, model: modelObj?.openRouterName }
                  ];
                } else {
                  return [
                    ...msgs,
                    { id: Date.now() + 1, sender: 'llm', text: llmTextRef.current, thinking: llmThinkingRef.current, model: modelObj?.openRouterName }
                  ];
                }
              });
            }
          } catch {}
        }
      });
    };
    const llmTextRef = { current: '' };
    const llmThinkingRef = { current: '' };
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      processChunk(chunk, llmTextRef, llmThinkingRef);
    }
    setLoading(false);
  } catch (err) {
    setChatMessages(msgs => [...msgs, { id: Date.now() + 2, sender: 'llm', text: 'Error: ' + (err.message || 'Unknown error') }]);
    setLoading(false);
  }
};

export default handleSubmit; 