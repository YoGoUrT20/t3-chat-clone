import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { Key } from 'lucide-react';
import { cn } from '../lib/utils';

// Add filterItems function (same as Dropdown.js)
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

function RerollDropdown({ items, value, onChange, anchorRef, isOpen, setIsOpen }) {
  const menuRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [searchString, setSearchString] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  const DROPDOWN_HEIGHT = 7 * 44; // px

  useEffect(() => {
    if (isOpen && anchorRef && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      let top, transformOrigin;
      if (spaceBelow < DROPDOWN_HEIGHT && spaceAbove > spaceBelow) {
        // Show above
        top = Math.max(rect.top - DROPDOWN_HEIGHT - 4, 8); // 4px gap, 8px min margin
        transformOrigin = 'bottom';
      } else {
        // Show below
        top = rect.bottom + 4;
        transformOrigin = 'top';
      }
      setMenuPosition({
        left: rect.left,
        top,
        width: Math.max(rect.width, 240),
        transformOrigin,
      });
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target) && anchorRef.current && !anchorRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen, anchorRef]);

  useEffect(() => {
    if (isOpen) {
      setFilteredItems(items);
      setHoveredIndex(null);
      setSearchString('');
    }
  }, [isOpen, items]);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      menuRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard search logic
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setFilteredItems(items);
      setSearchString('');
      setHoveredIndex(null);
      return;
    }
    if (e.key === 'Backspace' && isOpen) {
      setSearchString(prev => {
        const nextSearch = prev.slice(0, -1);
        const filteredResults = nextSearch.length === 0
          ? items
          : filterItems(items, nextSearch);
        setFilteredItems(filteredResults);
        setHoveredIndex(filteredResults.length > 0 ? 0 : null);
        return nextSearch;
      });
      e.preventDefault();
      return;
    }
    if (e.key.length === 1 && isOpen) {
      const nextSearch = searchString + e.key.toLowerCase();
      setSearchString(nextSearch);
      const filteredResults = filterItems(items, nextSearch);
      setFilteredItems(filteredResults);
      setHoveredIndex(filteredResults.length > 0 ? 0 : null);
    } else if (e.key === 'ArrowDown' && isOpen) {
      setHoveredIndex(prev => {
        const arr = filteredItems;
        const next = prev === null ? 0 : Math.min(arr.length - 1, prev + 1);
        return next;
      });
    } else if (e.key === 'ArrowUp' && isOpen) {
      setHoveredIndex(prev => {
        const arr = filteredItems;
        const next = prev === null ? arr.length - 1 : Math.max(0, prev - 1);
        return next;
      });
    } else if (e.key === 'Enter' && isOpen && hoveredIndex !== null) {
      onChange(filteredItems[hoveredIndex].code);
      setIsOpen(false);
      setFilteredItems(items);
      setSearchString('');
      setHoveredIndex(null);
    }
  };

  if (!isOpen || !menuPosition) return null;

  return (
    <MotionConfig reducedMotion='user'>
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
          className='z-50'
          style={{
            position: 'fixed',
            left: menuPosition.left,
            top: menuPosition.top,
            width: menuPosition.width,
            minWidth: 180,
            maxWidth: 320,
            transformOrigin: menuPosition.transformOrigin,
          }}
          ref={menuRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <motion.div
            className={cn('w-full rounded-lg border border-neutral-800', 'bg-neutral-900 p-1 shadow-lg')}
            initial={{ borderRadius: 8 }}
            animate={{
              borderRadius: 12,
              transition: { duration: 0.2 },
            }}
            style={{ transformOrigin: 'top' }}
          >
            <motion.div
              onMouseLeave={() => setHoveredIndex(null)}
              className='py-2 relative'
              style={{
                maxHeight: 7 * 44,
                overflowY: filteredItems.length > 7 ? 'auto' : 'visible',
                scrollbarWidth: 'thin',
                scrollbarColor: 'transparent transparent',
                msOverflowStyle: 'none',
              }}
            >
              {filteredItems.map((item, index) => (
                <motion.button
                  key={item.code}
                  onClick={() => {
                    onChange(item.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors',
                    hoveredIndex === index
                      ? 'bg-neutral-800 text-neutral-100'
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100'
                  )}
                  onMouseEnter={() => setHoveredIndex(index)}
                  style={{ fontWeight: value === item.code ? 600 : 400 }}
                  tabIndex={-1}
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
      </AnimatePresence>
    </MotionConfig>
  );
}

export default RerollDropdown; 