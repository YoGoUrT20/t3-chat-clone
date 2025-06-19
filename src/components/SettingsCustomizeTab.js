import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import 'highlight.js/styles/github-dark.css'
import { colorThemes as colorThemesConst, backgroundOptions as backgroundOptionsConst, glowOptions, modelFamilyGlowGradients, fontOptions, previewMessages, syntaxThemes, presets } from '../constants'
import { useIsMobile } from '../hooks/use-mobile'
import { models } from '../models'
import PreviewMessages from './PreviewMessages'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/tooltip'

export default function SettingsCustomizeTab({ selectedFont, setSelectedFont }) {
  const isMobile = useIsMobile()
  const [current, setCurrent] = useState(() => localStorage.getItem('chat_font') || 'Roboto')
  const [theme, setTheme] = useState(() => localStorage.getItem('chat_theme') || 'Glass')
  const [background, setBackground] = useState(() => localStorage.getItem('chat_bg') || 'model-glow')
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
    localStorage.setItem('chat_font', font)
    toast.success('Font updated!')
    window.dispatchEvent(new Event('customization-changed'))
  }

  const handleThemeChange = name => {
    setTheme(name)
    localStorage.setItem('chat_theme', name)
    toast.success('Theme updated!')
    window.dispatchEvent(new Event('customization-changed'))
  }

  const handleBackgroundChange = value => {
    setBackground(value)
    localStorage.setItem('chat_bg', value)
    toast.success('Background updated!')
    window.dispatchEvent(new Event('customization-changed'))
  }

  const handleSyntaxThemeChange = value => {
    setSyntaxTheme(value)
    localStorage.setItem('syntax_theme', value)
    toast.success('Syntax theme updated!')
    window.dispatchEvent(new Event('customization-changed'))
  }

  const handlePreset = preset => {
    setCurrent(preset.font)
    setSelectedFont(preset.font)
    setTheme(preset.theme)
    setBackground(preset.background)
    setSyntaxTheme(preset.syntaxTheme)
    setGlowType(preset.glow.type)
    setGlowIntensity(preset.glow.intensity)
    localStorage.setItem('chat_font', preset.font)
    localStorage.setItem('chat_theme', preset.theme)
    localStorage.setItem('chat_bg', preset.background)
    localStorage.setItem('syntax_theme', preset.syntaxTheme)
    localStorage.setItem('glow_type', preset.glow.type)
    localStorage.setItem('glow_intensity', preset.glow.intensity)
    toast.success('Preset applied!')
    window.dispatchEvent(new Event('customization-changed'))
  }

  const handleGlowType = value => {
    setGlowType(value)
    localStorage.setItem('glow_type', value)
    toast.success('Glow style updated!')
    window.dispatchEvent(new Event('customization-changed'))
  }

  const handleGlowIntensity = value => {
    setGlowIntensity(value)
    localStorage.setItem('glow_intensity', value)
    window.dispatchEvent(new Event('customization-changed'))
  }

  const colorThemes = colorThemesConst
  const backgroundOptions = backgroundOptionsConst

  const themeObj = colorThemes.find(t => t.name === theme) || colorThemes[0]
  const bgObj = backgroundOptions.find(b => b.value === background) || backgroundOptions[0]

  // Assign random real model names to assistant preview messages
  const assistantModels = models.slice(0, 4).map(m => m.name)
  const previewMessagesWithModels = previewMessages.map((msg, i) => {
    if (msg.role === 'assistant') {
      return { ...msg, model: assistantModels[i % assistantModels.length] }
    }
    return msg
  })

  return (
    <TooltipProvider>
      <div className={`w-full ${isMobile ? 'p-2 gap-4' : 'p-3 md:p-6 gap-6 md:gap-8'} flex flex-col`}>
        <div className={`flex flex-col ${isMobile ? 'gap-4' : 'md:flex-row gap-6 md:gap-8 w-full'}`}>
          <div className={`flex-1 flex flex-col ${isMobile ? 'gap-4' : 'gap-5 md:gap-6'}`}>
            <div>
              <div className={`mb-2 ${isMobile ? 'text-base' : 'text-base md:text-lg'} font-semibold text-white`}>Presets</div>
              <div className={`flex flex-row gap-2 ${isMobile ? 'mb-2 overflow-x-auto' : 'md:gap-4 flex-nowrap md:flex-wrap mb-3 md:mb-4 overflow-x-auto scrollbar-thin scrollbar-thumb-[#232228]'}`}>
                {presets.map(preset => (
                  <button
                    key={preset.name}
                    type='button'
                    onClick={() => handlePreset(preset)}
                    className={`min-w-[110px] px-3 py-2 ${isMobile ? '' : 'md:px-4 md:py-2'} rounded border transition-all text-sm ${isMobile ? '' : 'md:text-base'} border-[#232228] bg-transparent text-white hover:border-[#DC749E] hover:text-[#DC749E] flex-shrink-0`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className={`mb-2 ${isMobile ? 'text-base' : 'text-base md:text-lg'} font-semibold text-white`}>Select chat font</div>
              <div className={`flex flex-col ${isMobile ? 'gap-2' : 'gap-2 md:gap-3'}`}>
                {fontOptions.map(opt => (
                  <button
                    key={opt.name}
                    type='button'
                    onClick={() => handleFontChange(opt.name)}
                    className={`px-3 py-2 ${isMobile ? '' : 'md:px-4 md:py-2'} rounded border transition-all text-sm ${isMobile ? '' : 'md:text-base'} ${current === opt.name ? 'border-[#DC749E] bg-[#F9B4D0]/10 text-[#DC749E] font-bold' : 'border-[#232228] bg-transparent text-white'}`}
                    style={opt.style}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className={`mb-2 ${isMobile ? 'text-base' : 'text-base md:text-lg'} font-semibold text-white`}>Select message color theme</div>
              <div className={`flex flex-row gap-2 ${isMobile ? 'overflow-x-auto' : 'md:gap-4 flex-nowrap md:flex-wrap overflow-x-auto scrollbar-thin scrollbar-thumb-[#232228]'}`}>
                {colorThemes.map(opt => (
                  <button
                    key={opt.name}
                    type='button'
                    onClick={() => handleThemeChange(opt.name)}
                    className={`min-w-[110px] px-3 py-2 ${isMobile ? '' : 'md:px-4 md:py-2'} rounded border transition-all text-sm ${isMobile ? '' : 'md:text-base'} ${theme === opt.name ? 'border-[#DC749E] bg-[#F9B4D0]/10 text-[#DC749E] font-bold' : 'border-[#232228] bg-transparent text-white'}`}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className={`mb-2 ${isMobile ? 'text-base' : 'text-base md:text-lg'} font-semibold text-white`}>Select chat background</div>
              <div className={`flex flex-row gap-2 ${isMobile ? 'overflow-x-auto' : 'md:gap-4 flex-nowrap md:flex-wrap overflow-x-auto scrollbar-thin scrollbar-thumb-[#232228]'}`}>
                {backgroundOptions.map(opt => (
                  <button
                    key={opt.value}
                    type='button'
                    onClick={() => handleBackgroundChange(opt.value)}
                    className={`min-w-[110px] px-3 py-2 ${isMobile ? '' : 'md:px-4 md:py-2'} rounded border transition-all text-sm ${isMobile ? '' : 'md:text-base'} ${background === opt.value ? 'border-[#DC749E] bg-[#F9B4D0]/10 text-[#DC749E] font-bold' : 'border-[#232228] bg-transparent text-white'}`}
                    style={opt.style}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className={`mb-2 ${isMobile ? 'text-base' : 'text-base md:text-lg'} font-semibold text-white`}>Select syntax highlighting theme</div>
              <div className={`flex flex-row gap-2 ${isMobile ? 'overflow-x-auto' : 'md:gap-4 flex-nowrap md:flex-wrap overflow-x-auto scrollbar-thin scrollbar-thumb-[#232228]'}`}>
                {syntaxThemes.map(opt => (
                  <button
                    key={opt.value}
                    type='button'
                    onClick={() => handleSyntaxThemeChange(opt.value)}
                    className={`min-w-[110px] px-3 py-2 ${isMobile ? '' : 'md:px-4 md:py-2'} rounded border transition-all text-sm ${isMobile ? '' : 'md:text-base'} ${syntaxTheme === opt.value ? 'border-[#DC749E] bg-[#F9B4D0]/10 text-[#DC749E] font-bold' : 'border-[#232228] bg-transparent text-white'}`}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className={`mb-2 ${isMobile ? 'text-base' : 'text-base md:text-lg'} font-semibold text-white`}>Glow Options (only for GUM bg)</div>
              <div className={`flex flex-row gap-2 ${isMobile ? 'overflow-x-auto' : 'md:gap-4 flex-nowrap md:flex-wrap mb-2 overflow-x-auto scrollbar-thin scrollbar-thumb-[#232228]'}`}>
                {glowOptions.map(opt => (
                  <button
                    key={opt.value}
                    type='button'
                    onClick={() => handleGlowType(opt.value)}
                    className={`min-w-[110px] px-3 py-2 ${isMobile ? '' : 'md:px-4 md:py-2'} rounded border transition-all text-sm ${isMobile ? '' : 'md:text-base'} ${glowType === opt.value ? 'border-[#DC749E] bg-[#F9B4D0]/10 text-[#DC749E] font-bold' : 'border-[#232228] bg-transparent text-white'}`}
                    style={{ background: glowType === opt.value ? opt.gradient : undefined, opacity: background !== 'glow-under' ? 0.5 : 1, pointerEvents: background !== 'glow-under' ? 'none' : 'auto' }}
                    disabled={background !== 'glow-under'}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
              <div className={`flex flex-col ${isMobile ? 'gap-2' : 'xs:flex-row items-start xs:items-center gap-2 xs:gap-3'}`}>
                <span className={`${isMobile ? 'text-sm' : 'text-sm md:text-base'} text-white`}>Glow Intensity</span>
                {background !== 'glow-under' ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <input
                        type='range'
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={glowIntensity}
                        onChange={e => handleGlowIntensity(parseFloat(e.target.value))}
                        className='w-32 md:w-40 accent-[#DC749E]'
                      />
                    </TooltipTrigger>
                    <TooltipContent side='top'>Glow options are only available when &apos;Glow Under Messages&apos; background is selected.</TooltipContent>
                  </Tooltip>
                ) : (
                  <input
                    type='range'
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={glowIntensity}
                    onChange={e => handleGlowIntensity(parseFloat(e.target.value))}
                    className='w-32 md:w-40 accent-[#DC749E]'
                  />
                )}
                <span className='text-sm md:text-base text-[#DC749E] font-bold'>{glowIntensity.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className='flex-1 flex flex-col gap-3 md:gap-4 mt-4 md:mt-0'>
            <div className='mb-2 text-base md:text-lg font-semibold text-white'>Preview</div>
            <PreviewMessages
              previewMessagesWithModels={previewMessagesWithModels}
              bgObj={bgObj}
              themeObj={themeObj}
              background={background}
              glowType={glowType}
              glowIntensity={glowIntensity}
              modelFamilyGlowGradients={modelFamilyGlowGradients}
              glowOptions={glowOptions}
              current={current}
              models={models}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
