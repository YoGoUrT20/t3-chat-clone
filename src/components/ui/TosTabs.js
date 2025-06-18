import { useRef, useState, useEffect } from 'react'

export default function SettingsTabs({ tabs, activeIndex, setActiveIndex }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [hoverStyle, setHoverStyle] = useState({})
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
    requestAnimationFrame(() => {
      const overviewElement = tabRefs.current[0]
      if (overviewElement) {
        const { offsetLeft, offsetWidth } = overviewElement
        setHoverStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        })
      }
    })
  }, [])

  return (
    <div className='relative w-full max-w-[900px]'>
      <div
        className='absolute h-[30px] transition-all duration-300 ease-out bg-[#0e0f1114] dark:bg-[#ffffff1a] rounded-[6px] flex items-center'
        style={{
          ...hoverStyle,
          opacity: hoveredIndex !== null ? 1 : 0,
        }}
      />
      <div className='relative flex space-x-[6px] items-center overflow-x-auto scrollbar-hide md:overflow-x-visible md:scrollbar-default'>
        {tabs.map((tab, index) => (
          <div
            key={index}
            ref={el => (tabRefs.current[index] = el)}
            className={`px-3 py-2 cursor-pointer transition-colors duration-300 h-[30px] ${
              index === activeIndex ? 'text-[#0e0e10] dark:text-white' : 'text-[#0e0f1199] dark:text-[#ffffff99]'
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => setActiveIndex(index)}
          >
            <div className='text-sm font-[var(--www-mattmannucci-me-geist-regular-font-family)] leading-5 whitespace-nowrap flex items-center justify-center h-full'>
              {tab}
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
} 