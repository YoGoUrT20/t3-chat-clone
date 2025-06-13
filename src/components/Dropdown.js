import * as React from "react"
import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import { Button } from "./ui/button"
import { cn } from "../lib/utils"
import { ChevronDown, Languages, Key } from "lucide-react"
import { useClickAway } from "../hooks/use-click-away"
import { createPortal } from 'react-dom'

export default function Dropdown({ items, value, onChange, placeholder = 'Select', leftIcon }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [hoveredIndex, setHoveredIndex] = React.useState(null)
  const dropdownRef = React.useRef(null)
  const menuRef = React.useRef(null) // Ref for the dropdown menu itself
  const [searchString, setSearchString] = React.useState('')
  const [filteredItems, setFilteredItems] = React.useState(items)
  const [menuPosition, setMenuPosition] = React.useState(null)

  // --- FIX: Pass an array of refs to useClickAway ---
  // Now it will only close if the click is outside BOTH the button and the menu.
  useClickAway([dropdownRef, menuRef], () => setIsOpen(false))

  const selectedItem = items.find(item => item.code === value) || null

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false)
      setFilteredItems(items)
      setSearchString('')
      setHoveredIndex(null)
      return
    }
    if (e.key === 'Backspace' && isOpen) {
      setSearchString(prev => {
        const nextSearch = prev.slice(0, -1)
        const filtered = nextSearch.length === 0
          ? items
          : items.filter(item => item.name.toLowerCase().startsWith(nextSearch))
        setFilteredItems(filtered)
        setHoveredIndex(filtered.length > 0 ? 0 : null)
        return nextSearch
      })
      e.preventDefault()
      return
    }
    if (e.key.length === 1 && isOpen) {
      const nextSearch = searchString + e.key.toLowerCase()
      setSearchString(nextSearch)
      const filtered = items.filter(item => item.name.toLowerCase().startsWith(nextSearch))
      setFilteredItems(filtered)
      setHoveredIndex(filtered.length > 0 ? 0 : null)
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
      setMenuPosition({
        left: rect.left,
        top: rect.bottom,
        width: rect.width
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
          <span className="flex items-center gap-2">
            {leftIcon ? leftIcon : <Languages size={18} className="text-[#bdbdbd]" />}
            {selectedItem ? selectedItem.name : placeholder}
          </span>
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
                      onClick={() => {
                        onChange(item.code)
                        setIsOpen(false)
                        setFilteredItems(items)
                        setSearchString('')
                        setHoveredIndex(null)
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors",
                        hoveredIndex === index
                          ? "bg-neutral-800 text-neutral-100"
                          : "text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100"
                      )}
                      onMouseEnter={() => setHoveredIndex(index)}
                      style={{ fontWeight: value === item.code ? 600 : 400 }}
                      tabIndex={-1}
                    >
                      <span className="flex items-center gap-2">
                        {item.apiKeyRequired ? (
                          <Key size={16} className="text-yellow-400 mr-1" />
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