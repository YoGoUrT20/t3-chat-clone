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
    <div className='relative w-full max-w-[900px] h-[40px] flex items-center justify-start'>
      <div
        className='absolute inset-y-0 transition-all duration-300 ease-out bg-[#ffffff1a] rounded-[6px]'
        style={{
          ...hoverStyle,
          opacity: hoveredIndex !== null ? 1 : 0,
        }}
      />
      <div className='relative flex items-center w-full overflow-x-auto scrollbar-hide md:overflow-x-visible md:scrollbar-default'>
        {tabs.map((tab, index) => (
          <div
            key={index}
            ref={el => (tabRefs.current[index] = el)}
            className={`h-[40px] px-4 flex items-center justify-center cursor-pointer transition-colors duration-300 ${
              index === activeIndex ? 'text-white' : 'text-[#ffffff99]'
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => setActiveIndex(index)}
          >
            <div className='text-sm font-[var(--www-mattmannucci-me-geist-regular-font-family)] leading-5 whitespace-nowrap'>
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