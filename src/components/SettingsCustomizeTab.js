import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { User, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import { colorThemes as colorThemesConst, backgroundOptions as backgroundOptionsConst, glowOptions, modelFamilyGlowGradients, fontOptions, previewMessages, syntaxThemes, presets } from '../constants'
import { useIsMobile } from '../hooks/use-mobile'

export default function SettingsCustomizeTab({ selectedFont, setSelectedFont }) {
  const isMobile = useIsMobile()
  const [current, setCurrent] = useState(selectedFont)
  const [theme, setTheme] = useState(() => localStorage.getItem('chat_theme') || 'Classic')
  const [background, setBackground] = useState(() => localStorage.getItem('chat_bg') || 'default')
  const [syntaxTheme, setSyntaxTheme] = useState(() => localStorage.getItem('syntax_theme') || 'github-dark')
  const [glowType, setGlowType] = useState(() => localStorage.getItem('glow_type') || 'glow-blue-purple')
  const [glowIntensity, setGlowIntensity] = useState(() => {
    const val = localStorage.getItem('glow_intensity')
    return val !== null ? parseFloat(val) : 0.7
  })


  useEffect(() => {
    document.querySelectorAll('link[data-syntax-theme]').forEach(link => link.remove())
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.type = 'text/css'
    link.href = `/node_modules/highlight.js/styles/${syntaxTheme}.css`
    link.setAttribute('data-syntax-theme', 'true')
    document.head.appendChild(link)
    return () => {
      link.remove()
    }
  }, [syntaxTheme])

  const handleFontChange = font => {
    setCurrent(font)
    setSelectedFont(font)
    toast.success('Font updated!')
  }

  const handleThemeChange = name => {
    setTheme(name)
    localStorage.setItem('chat_theme', name)
    toast.success('Theme updated!')
  }

  const handleBackgroundChange = value => {
    setBackground(value)
    localStorage.setItem('chat_bg', value)
    toast.success('Background updated!')
  }

  const handleSyntaxThemeChange = value => {
    setSyntaxTheme(value)
    localStorage.setItem('syntax_theme', value)
    toast.success('Syntax theme updated!')
  }

  const handlePreset = preset => {
    setCurrent(preset.font)
    setSelectedFont(preset.font)
    setTheme(preset.theme)
    setBackground(preset.background)
    setSyntaxTheme(preset.syntaxTheme)
    setGlowType(preset.glow.type)
    setGlowIntensity(preset.glow.intensity)
    localStorage.setItem('chat_theme', preset.theme)
    localStorage.setItem('chat_bg', preset.background)
    localStorage.setItem('syntax_theme', preset.syntaxTheme)
    localStorage.setItem('glow_type', preset.glow.type)
    localStorage.setItem('glow_intensity', preset.glow.intensity)
    toast.success('Preset applied!')
  }

  const handleGlowType = value => {
    setGlowType(value)
    localStorage.setItem('glow_type', value)
    toast.success('Glow style updated!')
  }

  const handleGlowIntensity = value => {
    setGlowIntensity(value)
    localStorage.setItem('glow_intensity', value)
  }

  const colorThemes = colorThemesConst
  const backgroundOptions = backgroundOptionsConst

  const themeObj = colorThemes.find(t => t.name === theme) || colorThemes[0]
  const bgObj = backgroundOptions.find(b => b.value === background) || backgroundOptions[0]

  return (
    <div className={`w-full ${isMobile ? 'p-2 gap-4' : 'p-3 md:p-6 gap-6 md:gap-8'} flex flex-col`}>
      <div className={`flex flex-col ${isMobile ? 'gap-4' : 'md:flex-row gap-6 md:gap-8 w-full'}`}>
        <div className={`flex-1 flex flex-col ${isMobile ? 'gap-4' : 'gap-5 md:gap-6'}`}>
          <div>
            <div className={`mb-2 ${isMobile ? 'text-base' : 'text-base md:text-lg'} font-semibold text-[#0e0e10] dark:text-white`}>Presets</div>
            <div className={`flex flex-row gap-2 ${isMobile ? 'mb-2 overflow-x-auto' : 'md:gap-4 flex-nowrap md:flex-wrap mb-3 md:mb-4 overflow-x-auto scrollbar-thin scrollbar-thumb-[#ececec] dark:scrollbar-thumb-[#232228]'}`}>
              {presets.map(preset => (
                <button
                  key={preset.name}
                  type='button'
                  onClick={() => handlePreset(preset)}
                  className={`min-w-[110px] px-3 py-2 ${isMobile ? '' : 'md:px-4 md:py-2'} rounded border transition-all text-sm ${isMobile ? '' : 'md:text-base'} border-[#ececec] dark:border-[#232228] bg-transparent text-[#0e0e10] dark:text-white hover:border-[#DC749E] hover:text-[#DC749E] flex-shrink-0`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className={`mb-2 ${isMobile ? 'text-base' : 'text-base md:text-lg'} font-semibold text-[#0e0e10] dark:text-white`}>Select chat font</div>
            <div className={`flex flex-col ${isMobile ? 'gap-2' : 'gap-2 md:gap-3'}`}>
              {fontOptions.map(opt => (
                <button
                  key={opt.name}
                  type='button'
                  onClick={() => handleFontChange(opt.name)}
                  className={`px-3 py-2 ${isMobile ? '' : 'md:px-4 md:py-2'} rounded border transition-all text-sm ${isMobile ? '' : 'md:text-base'} ${current === opt.name ? 'border-[#DC749E] bg-[#F9B4D0]/10 text-[#DC749E] font-bold' : 'border-[#ececec] dark:border-[#232228] bg-transparent text-[#0e0e10] dark:text-white'}`}
                  style={opt.style}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className={`mb-2 ${isMobile ? 'text-base' : 'text-base md:text-lg'} font-semibold text-[#0e0e10] dark:text-white`}>Select message color theme</div>
            <div className={`flex flex-row gap-2 ${isMobile ? 'overflow-x-auto' : 'md:gap-4 flex-nowrap md:flex-wrap overflow-x-auto scrollbar-thin scrollbar-thumb-[#ececec] dark:scrollbar-thumb-[#232228]'}`}>
              {colorThemes.map(opt => (
                <button
                  key={opt.name}
                  type='button'
                  onClick={() => handleThemeChange(opt.name)}
                  className={`min-w-[110px] px-3 py-2 ${isMobile ? '' : 'md:px-4 md:py-2'} rounded border transition-all text-sm ${isMobile ? '' : 'md:text-base'} ${theme === opt.name ? 'border-[#DC749E] bg-[#F9B4D0]/10 text-[#DC749E] font-bold' : 'border-[#ececec] dark:border-[#232228] bg-transparent text-[#0e0e10] dark:text-white'}`}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className={`mb-2 ${isMobile ? 'text-base' : 'text-base md:text-lg'} font-semibold text-[#0e0e10] dark:text-white`}>Select chat background</div>
            <div className={`flex flex-row gap-2 ${isMobile ? 'overflow-x-auto' : 'md:gap-4 flex-nowrap md:flex-wrap overflow-x-auto scrollbar-thin scrollbar-thumb-[#ececec] dark:scrollbar-thumb-[#232228]'}`}>
              {backgroundOptions.map(opt => (
                <button
                  key={opt.value}
                  type='button'
                  onClick={() => handleBackgroundChange(opt.value)}
                  className={`min-w-[110px] px-3 py-2 ${isMobile ? '' : 'md:px-4 md:py-2'} rounded border transition-all text-sm ${isMobile ? '' : 'md:text-base'} ${background === opt.value ? 'border-[#DC749E] bg-[#F9B4D0]/10 text-[#DC749E] font-bold' : 'border-[#ececec] dark:border-[#232228] bg-transparent text-[#0e0e10] dark:text-white'}`}
                  style={opt.style}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className={`mb-2 ${isMobile ? 'text-base' : 'text-base md:text-lg'} font-semibold text-[#0e0e10] dark:text-white`}>Select syntax highlighting theme</div>
            <div className={`flex flex-row gap-2 ${isMobile ? 'overflow-x-auto' : 'md:gap-4 flex-nowrap md:flex-wrap overflow-x-auto scrollbar-thin scrollbar-thumb-[#ececec] dark:scrollbar-thumb-[#232228]'}`}>
              {syntaxThemes.map(opt => (
                <button
                  key={opt.value}
                  type='button'
                  onClick={() => handleSyntaxThemeChange(opt.value)}
                  className={`min-w-[110px] px-3 py-2 ${isMobile ? '' : 'md:px-4 md:py-2'} rounded border transition-all text-sm ${isMobile ? '' : 'md:text-base'} ${syntaxTheme === opt.value ? 'border-[#DC749E] bg-[#F9B4D0]/10 text-[#DC749E] font-bold' : 'border-[#ececec] dark:border-[#232228] bg-transparent text-[#0e0e10] dark:text-white'}`}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className={`mb-2 ${isMobile ? 'text-base' : 'text-base md:text-lg'} font-semibold text-[#0e0e10] dark:text-white`}>Glow Options</div>
            <div className={`flex flex-row gap-2 ${isMobile ? 'overflow-x-auto' : 'md:gap-4 flex-nowrap md:flex-wrap mb-2 overflow-x-auto scrollbar-thin scrollbar-thumb-[#ececec] dark:scrollbar-thumb-[#232228]'}`}>
              {glowOptions.map(opt => (
                <button
                  key={opt.value}
                  type='button'
                  onClick={() => handleGlowType(opt.value)}
                  className={`min-w-[110px] px-3 py-2 ${isMobile ? '' : 'md:px-4 md:py-2'} rounded border transition-all text-sm ${isMobile ? '' : 'md:text-base'} ${glowType === opt.value ? 'border-[#DC749E] bg-[#F9B4D0]/10 text-[#DC749E] font-bold' : 'border-[#ececec] dark:border-[#232228] bg-transparent text-[#0e0e10] dark:text-white'}`}
                  style={{ background: glowType === opt.value ? opt.gradient : undefined }}
                >
                  {opt.name}
                </button>
              ))}
            </div>
            <div className={`flex flex-col ${isMobile ? 'gap-2' : 'xs:flex-row items-start xs:items-center gap-2 xs:gap-3'}`}>
              <span className={`${isMobile ? 'text-sm' : 'text-sm md:text-base'} text-[#0e0e10] dark:text-white`}>Glow Intensity</span>
              <input
                type='range'
                min={0.1}
                max={1}
                step={0.05}
                value={glowIntensity}
                onChange={e => handleGlowIntensity(parseFloat(e.target.value))}
                className='w-32 md:w-40 accent-[#DC749E]'
              />
              <span className='text-sm md:text-base text-[#DC749E] font-bold'>{glowIntensity.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className='flex-1 flex flex-col gap-3 md:gap-4 mt-4 md:mt-0'>
          <div className='mb-2 text-base md:text-lg font-semibold text-[#0e0e10] dark:text-white'>Preview</div>
          <div className='flex flex-col gap-2 md:gap-3 max-w-full md:max-w-md' style={bgObj.style}>
            {previewMessages.map((msg, i) => {
              const isUser = msg.role === 'user'
              const msgBg = isUser ? themeObj.user.bg : themeObj.assistant.bg
              let msgText = isUser ? themeObj.user.text : themeObj.assistant.text
              const themeType = isUser ? themeObj.themeType : themeObj.themeType
              if (themeType === 'dark') msgText = '#E0E8FF'
              if (themeType === 'light') msgText = '#2A222E'
              const showCode = i === 1
              let glowGradient = ''
              if (background === 'model-glow' && !isUser) {
                const families = ['gemini', 'deepseek', 'chatgpt', 'claude', 'llama', 'grok', 'qwen']
                const family = families[i % families.length]
                glowGradient = modelFamilyGlowGradients[family]
              } else if (background === 'glow-under' && !isUser) {
                const found = glowOptions.find(opt => opt.value === glowType)
                glowGradient = found ? found.gradient : glowOptions[0].gradient
              }
              const randomOffset = ((Math.sin(i * 9301 + 49297) * 233280) % 1) * 20 - 10
              return (
                <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`} style={{ position: (background === 'glow-under' || (background === 'model-glow' && !isUser)) ? 'relative' : undefined }}>
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
                      <div className='flex items-end mr-1 md:mr-2'>
                        <span className='bg-[#2A222E] p-1.5 md:p-2 rounded-full'><Bot size={18} className='text-[#BFB3CB]' /></span>
                      </div>
                    )}
                    <div className={`max-w-[90%] md:max-w-[70%] px-3 py-2 md:px-4 md:py-2 rounded-xl text-sm md:text-base ${isUser ? 'rounded-br-none self-end' : 'rounded-bl-none self-start'}`}
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
                          code({node, inline, className, children, ...props}) {
                            if (inline) {
                              return <code className='bg-[#2A222E] px-1 py-0.5 rounded text-[#E0E8FF] font-mono text-xs md:text-sm'>{children}</code>
                            }
                            return <pre className='chat-markdown-pre bg-[#2A222E] p-2 md:p-3 rounded-lg overflow-x-auto my-2'><code className={'text-[#E0E8FF] font-mono text-xs md:text-sm ' + (className || '')}>{children}</code></pre>
                          },
                          ul({children, ...props}) {
                            return <ul className='list-disc pl-5 md:pl-6 my-2'>{children}</ul>
                          },
                          ol({children, ...props}) {
                            return <ol className='list-decimal pl-5 md:pl-6 my-2'>{children}</ol>
                          },
                          li({children, ...props}) {
                            return <li className='mb-1'>{children}</li>
                          },
                          strong({children, ...props}) {
                            return <strong className='font-bold text-[#F9B4D0]'>{children}</strong>
                          },
                        }}
                      >{showCode ? msg.text + '\n\n```js\nconst x = 42;\nconsole.log(x);\n```' : msg.text}</ReactMarkdown>
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
        </div>
      </div>
    </div>
  )
}
