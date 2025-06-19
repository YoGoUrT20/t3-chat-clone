import { useRef, useState, useEffect } from 'react'
import { useIsMobile } from '../../hooks/use-mobile'

export default function SettingsTabs({ tabs, activeIndex, setActiveIndex }) {
  const isMobile = useIsMobile()
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [hoverStyle, setHoverStyle] = useState({})
  const [activeStyle, setActiveStyle] = useState({ left: '0px', width: '0px' })
  const tabRefs = useRef([])

  useEffect(() => {
    if (hoveredIndex !== null) {
      const hoveredElement = tabRefs.current[hoveredIndex]
      if (hoveredElement) {
        const { offsetLeft, offsetWidth } = hoveredElement
        setHoverStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        })
      }
    }
  }, [hoveredIndex])

  useEffect(() => {
    const activeElement = tabRefs.current[activeIndex]
    if (activeElement) {
      const { offsetLeft, offsetWidth } = activeElement
      setActiveStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
      })
    }
  }, [activeIndex])

  useEffect(() => {
    requestAnimationFrame(() => {
      const overviewElement = tabRefs.current[0]
      if (overviewElement) {
        const { offsetLeft, offsetWidth } = overviewElement
        setActiveStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        })
      }
    })
  }, [])

  return (
    <div className={`relative w-full ${isMobile ? 'max-w-full px-1 py-2' : 'max-w-[900px]'}`}>
      <div
        className={`${isMobile ? 'hidden' : 'absolute h-[30px] transition-all duration-300 ease-out bg-[#ffffff1a] rounded-[6px] flex items-center'}`}
        style={isMobile ? {} : { ...hoverStyle, opacity: hoveredIndex !== null ? 1 : 0 }}
      />
      <div
        className={`${isMobile ? 'hidden' : 'absolute bottom-[-6px] h-[2px] bg-white transition-all duration-300 ease-out'}`}
        style={isMobile ? {} : activeStyle}
      />
      <div className={`relative flex ${isMobile ? 'overflow-x-auto whitespace-nowrap w-full gap-1' : 'space-x-[6px] items-center'}`}>
        {tabs.map((tab, index) => (
          <div
            key={index}
            ref={el => (tabRefs.current[index] = el)}
            className={`${isMobile ? 'inline-block px-4 py-2 rounded-lg text-base font-semibold cursor-pointer transition-colors duration-300 min-w-[110px] text-center' : 'px-3 py-2 cursor-pointer transition-colors duration-300 h-[30px]'} ${index === activeIndex ? 'text-white bg-[#232228]' : 'text-[#ffffff99] bg-transparent'}`}
            onMouseEnter={() => !isMobile && setHoveredIndex(index)}
            onMouseLeave={() => !isMobile && setHoveredIndex(null)}
            onClick={() => setActiveIndex(index)}
            style={isMobile ? { marginRight: 8 } : {}}
          >
            <div className={`${isMobile ? 'flex items-center justify-center h-full w-full' : 'text-sm font-[var(--www-mattmannucci-me-geist-regular-font-family)] leading-5 whitespace-nowrap flex items-center justify-center h-full'}`}>
              {tab}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 