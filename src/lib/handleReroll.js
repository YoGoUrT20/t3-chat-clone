export default async function handleReroll({
  llmMsg,
  newModel,
  chatMessages,
  setChatMessages,
  setLoading,
  apiKey,
  conversationId,
  toast,
  Sparkles,
  handleReroll,
  FUNCTIONS_URL,
  useWebSearch,
  selectedBranchId,
}) {
  setLoading(true);
  const modelName = newModel;
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
  // Get conversation history up to and including this user message (not the LLM message)
  let convoMessages = [];
  for (let i = 0; i <= llmMsgIdx - 1; i++) {
    if (chatMessages[i].sender === 'user') {
      convoMessages.push({ role: 'user', content: chatMessages[i].text });
    } else if (chatMessages[i].sender === 'llm') {
      convoMessages.push({ role: 'assistant', content: chatMessages[i].text });
    }
  }
  // Add the user message right before the LLM message
  convoMessages.push({ role: 'user', content: userMsg.text });

  // Set the rerolling LLM message to loading (empty text) in place
  setChatMessages(msgs => {
    const idx = msgs.findIndex(m => m.id === llmMsg.id);
    if (idx === -1) return msgs;
    const newMsgs = [...msgs];
    newMsgs[idx] = { ...newMsgs[idx], text: '', model: modelName };
    return newMsgs;
  });
  await new Promise(res => setTimeout(res, 120));
  try {
    const res = await fetch(`${FUNCTIONS_URL}/llmStreamResumable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey || '' },
      body: JSON.stringify({
        model: modelName,
        messages: convoMessages,
        chat_id: conversationId,
        useWebSearch,
        ...(selectedBranchId && selectedBranchId !== 'root' ? { branchId: selectedBranchId } : {}),
        isReroll: true,
        rerollMsgId: llmMsg.messageId || llmMsg.id,
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
      toast.error(
        <span>
          Error 500 from model endpoint.<br />
          <button
            className='underline text-pink-300 ml-1'
            onClick={() => handleReroll({
              llmMsg,
              newModel,
              chatMessages,
              setChatMessages,
              setLoading,
              apiKey,
              conversationId,
              toast,
              Sparkles,
              handleReroll,
              FUNCTIONS_URL,
              useWebSearch,
              selectedBranchId,
            })}
          >Reroll again</button>
        </span>
      );
      setLoading(false);
      return;
    }
    if (!res.body) throw new Error('No response body');
    const reader = res.body.getReader();
    // Helper to extract <thinking>...</thinking> from text
    function extractThinkingAndText(text) {
      let thinking = '';
      let mainContent = text;
      const thinkingMatch = mainContent.match(/<thinking>([\s\S]*?)<\/thinking>/);
      if (thinkingMatch) {
        thinking = thinkingMatch[1];
        mainContent = mainContent.replace(/<thinking>[\s\S]*?<\/thinking>/, '');
      }
      return { thinking, mainContent };
    }
    const processRerollChunk = (chunk, llmTextRef, llmThinkingRef) => {
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
            // If reasoning is not present, try to extract from <thinking>...</thinking> in text
            if (!reasoning && text && text.includes('<thinking>')) {
              const extracted = extractThinkingAndText(text);
              reasoning = extracted.thinking;
              text = extracted.mainContent;
            }
            if (reasoning) {
              llmThinkingRef.current += reasoning;
            }
            if (text) {
              llmTextRef.current += text;
            }
            if (reasoning || text) {
              setChatMessages(msgs => {
                const idx = msgs.findIndex(m => m.id === llmMsg.id);
                if (idx === -1) return msgs;
                const newMsgs = [...msgs];
                newMsgs[idx] = { ...newMsgs[idx], text: llmTextRef.current, thinking: llmThinkingRef.current, model: modelName };
                return newMsgs;
              });
            }
          } catch {}
        }
      });
    };
    const llmTextRerollRef = { current: '' };
    const llmThinkingRerollRef = { current: '' };
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      processRerollChunk(chunk, llmTextRerollRef, llmThinkingRerollRef);
    }
    setLoading(false);
  } catch (err) {
    toast.error(
      <span>
        Error: {err.message || 'Unknown error'}<br />
        <button
          className='underline text-pink-300 ml-1'
          onClick={() => handleReroll({
            llmMsg,
            newModel,
            chatMessages,
            setChatMessages,
            setLoading,
            apiKey,
            conversationId,
            toast,
            Sparkles,
            handleReroll,
            FUNCTIONS_URL,
            useWebSearch,
            selectedBranchId,
          })}
        >Reroll again</button>
      </span>
    );
    setChatMessages(msgs => [...msgs, { id: Date.now() + 2, sender: 'llm', text: 'Error: ' + (err.message || 'Unknown error') }]);
    setLoading(false);
  }
} 