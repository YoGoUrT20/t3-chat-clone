import { Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

export default function PreviewMessages({
  previewMessagesWithModels,
  bgObj,
  themeObj,
  background,
  glowType,
  glowIntensity,
  modelFamilyGlowGradients,
  glowOptions,
  current,
  models
}) {
  return (
    <div className='flex flex-col gap-2 md:gap-3 max-w-full md:max-w-md' style={bgObj.style}>
      {previewMessagesWithModels.map((msg, i) => {
        const isUser = msg.role === 'user'
        const msgBg = isUser ? themeObj.user.bg : themeObj.assistant.bg
        let msgText = isUser ? themeObj.user.text : themeObj.assistant.text
        const themeType = 'dark'
        msgText = '#E0E8FF'
        const showCode = i === 1
        let glowGradient = ''
        let modelKey = msg.model || msg.modelName || msg.model_name || msg.openRouterName || ''
        let modelObj = models.find(m => m.name === modelKey || m.openRouterName === modelKey)
        if (!modelObj && modelKey) {
          modelObj = models.find(m => m.openRouterName && (m.openRouterName.toLowerCase() === modelKey.toLowerCase() || modelKey.toLowerCase().includes(m.openRouterName.toLowerCase())))
        }
        // Determine model family for glow
        let modelFamily = ''
        if (modelObj && modelObj.family) {
          modelFamily = modelObj.family.toLowerCase()
        } else if (modelObj && modelObj.openRouterName) {
          // fallback: try to infer family from openRouterName
          const lower = modelObj.openRouterName.toLowerCase()
          if (lower.includes('gemini')) modelFamily = 'gemini'
          else if (lower.includes('deepseek')) modelFamily = 'deepseek'
          else if (lower.includes('gpt') || lower.includes('openai')) modelFamily = 'chatgpt'
          else if (lower.includes('claude')) modelFamily = 'claude'
          else if (lower.includes('llama')) modelFamily = 'llama'
          else if (lower.includes('grok')) modelFamily = 'grok'
          else if (lower.includes('qwen')) modelFamily = 'qwen'
        }
        if (background === 'model-glow' && !isUser) {
          if (modelFamily && modelFamilyGlowGradients[modelFamily]) {
            glowGradient = modelFamilyGlowGradients[modelFamily]
          } else {
            // fallback to a default family color if not found
            glowGradient = modelFamilyGlowGradients['chatgpt']
          }
        } else if (background === 'glow-under' && !isUser) {
          const found = glowOptions.find(opt => opt.value === glowType)
          glowGradient = found ? found.gradient : glowOptions[0].gradient
        }
        const randomOffset = ((Math.sin(i * 9301 + 49297) * 233280) % 1) * 40 - 20
        const modelDisplayName = modelObj ? modelObj.displayName : modelKey
        return (
          <div key={i} className={`flex flex-col w-full ${isUser ? 'items-end' : 'items-start'}`}>
            <div
              className={`flex w-full ${isUser ? 'justify-end items-end' : 'justify-start items-start'}`}
              style={{ position: (background === 'glow-under' || (background === 'model-glow' && !isUser)) ? 'relative' : undefined }}
            >
              {(background === 'glow-under' || (background === 'model-glow' && !isUser)) && (
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
                    filter: 'blur(100px)',
                    willChange: 'filter',
                    opacity: glowIntensity * 0.7,
                    background: glowGradient,
                    borderRadius: '50%',
                    transition: 'width 0.2s, height 0.2s, filter 0.2s, opacity 0.2s',
                  }}
                />
              )}
              {!isUser && (
                <div className='flex items-end mr-1 md:mr-2 mt-24'>
                  <span className='bg-[#2A222E] p-1.5 md:p-2 rounded-full'><Bot size={18} className='text-[#BFB3CB]' /></span>
                </div>
              )}
              <div className={`max-w-[90%] md:max-w-[70%] px-3 py-2 md:px-4 md:py-2 rounded-xl text-sm md:text-base ${isUser ? 'rounded-br-none self-end text-right' : 'rounded-bl-none self-start'}`}
                style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  fontFamily: current,
                  background: msgBg,
                  color: msgText,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <ReactMarkdown
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    code({inline, className, children}) {
                      if (inline) {
                        return <code className='bg-[#2A222E] px-1 py-0.5 rounded text-[#E0E8FF] font-mono text-xs md:text-sm'>{children}</code>
                      }
                      return <pre className='chat-markdown-pre bg-[#2A222E] p-2 md:p-3 rounded-lg overflow-x-auto my-2' style={{ maxWidth: 500, overflowX: 'auto' }}><code className={'text-[#E0E8FF] font-mono text-xs md:text-sm ' + (className || '')}>{children}</code></pre>
                    },
                    ul({children}) {
                      return <ul className='list-disc pl-5 md:pl-6 my-2'>{children}</ul>
                    },
                    ol({children}) {
                      return <ol className='list-decimal pl-5 md:pl-6 my-2'>{children}</ol>
                    },
                    li({children}) {
                      return <li className='mb-1'>{children}</li>
                    },
                    strong({children}) {
                      return <strong className='font-bold text-[#F9B4D0]'>{children}</strong>
                    },
                  }}
                >{showCode ? msg.text + '\n\n```js\nconst x = 42;\nconsole.log(x);\n```' : msg.text}</ReactMarkdown>
                {!isUser && modelKey && (
                  <div style={{ fontSize: '0.75rem', color: msgText, marginTop: 4, opacity: 0.7 }}>
                    Model: {modelDisplayName}
                  </div>
                )}
              </div>
              {isUser && (
                <div className='flex items-end ml-1 md:ml-2'>
                  <span className='bg-[#4D1F39] p-1.5 md:p-2 rounded-full'><User size={18} className='text-[#F4E9EE]' /></span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
} 