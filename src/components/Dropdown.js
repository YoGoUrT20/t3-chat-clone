import * as React from "react"
import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import { Button } from "./ui/button"
import { cn } from "../lib/utils"
import { ChevronDown, Languages, Key } from "lucide-react"
import { useClickAway } from "../hooks/use-click-away"
import { createPortal } from 'react-dom'

export default function Dropdown({ items, value, onChange, placeholder = 'Select', leftIcon, hideChevron = false, dropdownZIndex = 1000, onClose }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [hoveredIndex, setHoveredIndex] = React.useState(null)
  const dropdownRef = React.useRef(null)
  const menuRef = React.useRef(null) // Ref for the dropdown menu itself
  const [searchString, setSearchString] = React.useState('')
  const [filteredItems, setFilteredItems] = React.useState(items)
  const [menuPosition, setMenuPosition] = React.useState(null)
  const [selectedAnimation, setSelectedAnimation] = React.useState(null)

  // --- FIX: Pass an array of refs to useClickAway ---
  // Now it will only close if the click is outside BOTH the button and the menu.
  useClickAway([dropdownRef, menuRef], () => {
    setIsOpen(false);
    if (onClose) onClose();
  });

  const selectedItem = items.find(item => item.code === value) || null

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      if (onClose) onClose();
      setFilteredItems(items)
      setSearchString('')
      setHoveredIndex(null)
      return
    }
    if (e.key === 'Backspace' && isOpen) {
      setSearchString(prev => {
        const nextSearch = prev.slice(0, -1)
        const filteredResults = nextSearch.length === 0
          ? items
          : filterItems(items, nextSearch)
        setFilteredItems(filteredResults)
        setHoveredIndex(filteredResults.length > 0 ? 0 : null)
        return nextSearch
      })
      e.preventDefault()
      return
    }
    if (e.key.length === 1 && isOpen) {
      const nextSearch = searchString + e.key.toLowerCase()
      setSearchString(nextSearch)
      const filteredResults = filterItems(items, nextSearch)
      setFilteredItems(filteredResults)
      setHoveredIndex(filteredResults.length > 0 ? 0 : null)
    } else if (e.key === 'ArrowDown' && isOpen) {
      setHoveredIndex(prev => {
        const arr = filteredItems
        const next = prev === null ? 0 : Math.min(arr.length - 1, prev + 1)
        return next
      })
    } else if (e.key === 'ArrowUp' && isOpen) {
      setHoveredIndex(prev => {
        const arr = filteredItems
        const next = prev === null ? arr.length - 1 : Math.max(0, prev - 1)
        return next
      })
    } else if (e.key === 'Enter' && isOpen && hoveredIndex !== null) {
      onChange(filteredItems[hoveredIndex].code)
      setIsOpen(false)
      if (onClose) onClose();
      setFilteredItems(items)
      setSearchString('')
      setHoveredIndex(null)
    }
  }

  React.useEffect(() => {
    if (isOpen && menuRef.current) {
      menuRef.current.focus()
    }
    if (!isOpen) {
      setFilteredItems(items)
      setHoveredIndex(null)
      setSearchString('')
    }
  }, [isOpen, items])

  const openMenu = () => {
    setIsOpen(true)
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect()
      let left = rect.left;
      let width = rect.width;
      // Mobile fix: prevent overflow on the right
      if (typeof window !== 'undefined' && window.innerWidth < 600) {
        const menuWidth = Math.max(rect.width, 180);
        if (left + menuWidth > window.innerWidth) {
          left = window.innerWidth - menuWidth - 8; // 8px margin
          if (left < 8) left = 8;
        }
        width = menuWidth;
      }
      setMenuPosition({
        left,
        top: rect.bottom,
        width
      })
    }
  }

  // Recalculate menu position on scroll/resize when open
  React.useEffect(() => {
    if (!isOpen) return;
    let frameId = null;
    const updateMenuPosition = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        if (dropdownRef.current) {
          const rect = dropdownRef.current.getBoundingClientRect();
          setMenuPosition({
            left: rect.left,
            top: rect.bottom,
            width: rect.width
          });
        }
      });
    };
    window.addEventListener('scroll', updateMenuPosition, true);
    window.addEventListener('resize', updateMenuPosition);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', updateMenuPosition, true);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [isOpen]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="w-full px-0 relative" style={{ maxWidth: "16rem", height: "40px" }} ref={dropdownRef}>
        <Button
          variant="outline"
          onClick={() => {
            if (!isOpen) openMenu();
            else setIsOpen(false);
          }}
          className={cn(
            "w-full justify-between bg-neutral-900 text-neutral-400",
            "hover:bg-neutral-800 hover:text-neutral-200",
            "focus:ring-2 focus:ring-neutral-700 focus:ring-offset-2 focus:ring-offset-black",
            "transition-all duration-200 ease-in-out",
            "border border-transparent focus:border-neutral-700",
            "h-10",
            isOpen && "bg-neutral-800 text-neutral-200",
          )}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span className="flex items-center gap-2 w-full min-w-0">
            {leftIcon === undefined ? <Languages size={18} className="text-[#bdbdbd]" /> : leftIcon}
            <span
              className="block text-left w-full min-w-0"
              style={{
                display: 'inline-block',
                whiteSpace: 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxHeight: '2.6em',
                lineHeight: '1.3em',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                display: '-webkit-box',
              }}
            >
              {selectedItem ? selectedItem.name : placeholder}
            </span>
          </span>
          {!hideChevron && (
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              whileHover={{ rotate: isOpen ? 180 : 180 }}
              transition={{ duration: 0.2 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "20px",
                height: "20px",
              }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          )}
        </Button>

        {isOpen && menuPosition && createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 0, scaleY: 0 }}
              animate={{
                opacity: 1,
                y: 0,
                scaleY: 1,
                transition: {
                  type: 'spring',
                  stiffness: 400,
                  damping: 32,
                  mass: 1,
                },
              }}
              exit={{
                opacity: 0,
                y: 0,
                scaleY: 0,
                transition: {
                  type: 'spring',
                  stiffness: 400,
                  damping: 32,
                  mass: 1,
                },
              }}
              className="z-50"
              style={{
                position: 'fixed',
                left: menuPosition.left,
                top: menuPosition.top + 4,
                width: menuPosition.width,
                minWidth: 180,
                maxWidth: 320,
                transformOrigin: 'top',
                zIndex: dropdownZIndex,
              }}
              onKeyDown={handleKeyDown}
              tabIndex={-1} // Use -1 to make it focusable programmatically but not via Tab key
              ref={menuRef} // This ref is now used by useClickAway
            >
              <motion.div
                className={cn("w-full rounded-lg border border-neutral-800","bg-neutral-900 p-1 shadow-lg")}
                initial={{ borderRadius: 8 }}
                animate={{
                  borderRadius: 12,
                  transition: { duration: 0.2 },
                }}
                style={{ transformOrigin: "top" }}
              >
                {/* --- REFINEMENT: Moved onMouseLeave here for smoother hover --- */}
                <motion.div
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="py-2 relative" style={{
                    maxHeight: 7 * 44,
                    overflowY: items.length > 7 ? 'auto' : 'visible',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'transparent transparent',
                    msOverflowStyle: 'none',
                  }}
                >
                  {filteredItems.map((item, index) => (
                    <motion.button
                      key={item.code}
                      onMouseDown={e => {
                        e.preventDefault();
                        onChange(item.code);
                        setIsOpen(false);
                        setFilteredItems(items);
                        setSearchString('');
                        setHoveredIndex(null);
                        setSelectedAnimation(item.code);
                        setTimeout(() => setSelectedAnimation(null), 400);
                      }}
                      onClick={e => e.preventDefault()}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors',
                        hoveredIndex === index
                          ? 'bg-neutral-800 text-neutral-100'
                          : 'text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100'
                      )}
                      onMouseEnter={() => setHoveredIndex(index)}
                      style={{ fontWeight: value === item.code ? 600 : 400 }}
                      tabIndex={-1}
                      animate={selectedAnimation === item.code ? { scale: 1.08, backgroundColor: '#3b2e4a' } : { scale: 1, backgroundColor: 'unset' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20, duration: 0.35 }}
                    >
                      <span className='flex items-center gap-2'>
                        {item.apiKeyRequired ? (
                          <Key size={16} className='text-yellow-400 mr-1' />
                        ) : (
                          <span style={{ display: 'inline-block', width: 16, marginRight: 4 }} />
                        )}
                        {item.name}
                      </span>
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
      </div>
    </MotionConfig>
  )
}


function filterItems(items, search) {
  if (!search.trim()) return items;
  const s = search.trim().toLowerCase();
  return [...items].sort((a, b) => {
    const aName = (a.displayNameV2 || a.name).toLowerCase();
    const bName = (b.displayNameV2 || b.name).toLowerCase();
    const aDisplay = (a.displayName || a.name).toLowerCase();
    const bDisplay = (b.displayName || b.name).toLowerCase();
    const aFamily = a.family ? a.family.toLowerCase() : '';
    const bFamily = b.family ? b.family.toLowerCase() : '';
    const getScore = (name, display, family) => {
      if (name === s || display === s || family === s) return 0;
      if (name.startsWith(s) || display.startsWith(s) || family.startsWith(s)) return 1;
      if (name.includes(s) || display.includes(s) || family.includes(s)) return 2;
      const idxs = [name.indexOf(s), display.indexOf(s), family.indexOf(s)].filter(idx => idx !== -1);
      if (idxs.length > 0) return 3 + Math.min(...idxs);
      return 100 + Math.abs(name.length - s.length);
    };
    const aScore = getScore(aName, aDisplay, aFamily);
    const bScore = getScore(bName, bDisplay, bFamily);
    if (aScore !== bScore) return aScore - bScore;
    return Math.abs(aName.length - s.length) - Math.abs(bName.length - s.length);
  });
}