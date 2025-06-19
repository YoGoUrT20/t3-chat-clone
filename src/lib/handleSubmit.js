import { getFirestore, collection, addDoc, doc, updateDoc, getDoc, arrayUnion, Timestamp } from 'firebase/firestore';

const processStream = async (res, useDeepResearch, updateMessages, modelObj) => {
  if (!res.body) throw new Error('No response body');
  const reader = res.body.getReader();
  const llmTextRef = { current: '' };
  const llmThinkingRef = { current: '' };
  let finalReportReceived = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = new TextDecoder().decode(value);
    
    chunk.split('\n').forEach(function processPart(part) {
      const trimmed = part.trim();
      if (!trimmed || trimmed.startsWith(':')) return;

      if (trimmed.startsWith('data:')) {
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === '[DONE]') return;
        try {
          const json = JSON.parse(dataStr);
          let text = '';
          let reasoning = '';
          let hasContent = false;
          if (json.reasoning) { reasoning = json.reasoning; hasContent = true; }
          if (json.content) { text = json.content; hasContent = true; }
          if (json.choices && json.choices[0] && json.choices[0].delta) {
            if (json.choices[0].delta.reasoning) { reasoning = json.choices[0].delta.reasoning; hasContent = true; }
            if (json.choices[0].delta.content) { text = json.choices[0].delta.content; hasContent = true; }
          }

          if (useDeepResearch) {
            const currentChunkContent = reasoning + text;
            if (!finalReportReceived) {
                const finalReportIndex = currentChunkContent.indexOf('<final-report>');
                if (finalReportIndex !== -1) {
                    finalReportReceived = true;
                    const beforeFinalReport = currentChunkContent.substring(0, finalReportIndex);
                    const afterFinalReport = currentChunkContent.substring(finalReportIndex);
                    llmThinkingRef.current += beforeFinalReport;
                    llmTextRef.current += afterFinalReport.replace(/<final-report>/g, '');
                } else {
                    llmThinkingRef.current += currentChunkContent;
                }
            } else {
                llmTextRef.current += currentChunkContent.replace(/<final-report>/g, '');
            }
          } else {
              if (reasoning) llmThinkingRef.current += reasoning;
              if (text) llmTextRef.current += text;
          }
          
          if (hasContent) {
            updateMessages(llmTextRef.current, llmThinkingRef.current);
          }
        } catch {}
      }
    });
  }
};

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
  useDeepResearch,
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
        body: JSON.stringify({ model: modelName, messages: [userMsg], streamId, fromIndex, images: data.images, useWebSearch, useDeepResearch }),
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
      await processStream(res, useDeepResearch, (text, reasoning) => {
        setChatMessages(msgs => {
          const last = msgs[msgs.length - 1];
          if (last && last.sender === 'llm') {
            return [
              ...msgs.slice(0, -1),
              { ...last, text: text, thinking: reasoning, model: modelObj?.openRouterName }
            ];
          } else {
            return [
              ...msgs,
              { id: Date.now() + 1, sender: 'llm', text: text, thinking: reasoning, model: modelObj?.openRouterName }
            ];
          }
        });
      }, modelObj);
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
    try {
      const res2 = await fetch(`${FUNCTIONS_URL}/llmStreamResumable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey2 },
        body: JSON.stringify({ model: modelName, messages: branchMessages, chat_id: convId, images: data.images, useWebSearch, useDeepResearch, branchId: selectedBranchId }),
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
      await processStream(res2, useDeepResearch, (text, reasoning) => {
        setBranches(prev => {
          const newBranches = { ...prev };
          if (newBranches[selectedBranchId]) {
            let branchMessages = newBranches[selectedBranchId].messages || [];
            const lastMessage = branchMessages[branchMessages.length - 1];
            if (lastMessage && (lastMessage.role === 'assistant' || lastMessage.sender === 'llm')) {
              const updatedMessage = { ...lastMessage, content: text, text: text, thinking: reasoning };
              branchMessages = [...branchMessages.slice(0, -1), updatedMessage];
            } else {
              branchMessages = [...branchMessages, {
                role: 'assistant',
                content: text,
                text: text,
                thinking: reasoning,
                id: 'assistant_' + Date.now(),
                messageId: 'assistant_' + Date.now(),
                model: modelName
              }];
            }
            newBranches[selectedBranchId] = { ...newBranches[selectedBranchId], messages: branchMessages };
          }
          return newBranches;
        });
      }, modelObj);
    } catch (err) {
      toast.error('Error streaming response for branch');
    } finally {
      setLoading(false);
    }
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
        useDeepResearch,
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
    await processStream(res, useDeepResearch, (text, reasoning) => {
      setChatMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && (last.role === 'assistant' || last.sender === 'llm')) {
          const newLast = { ...last, content: text, thinking: reasoning };
          return [...prev.slice(0, -1), newLast];
        } else {
          return [...prev, {
            role: 'assistant',
            content: text,
            thinking: reasoning,
            id: 'assistant_' + Date.now(),
            messageId: 'assistant_' + Date.now()
          }];
        }
      });
    }, modelObj);
    setLoading(false);
  } catch (err) {
    console.error('Error in stream processing', err);
    setChatMessages(msgs => [...msgs, { id: Date.now() + 2, sender: 'llm', text: 'Error: ' + (err.message || 'Unknown error') }]);
    setLoading(false);
  }
};

export default handleSubmit; 