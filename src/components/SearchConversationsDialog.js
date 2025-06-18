import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, MessagesSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useConversations } from '../hooks/use-conversations'
import { sortConversations } from '../lib/utils'

export default function SearchConversationsDialog({ open, onOpenChange }) {
  const navigate = useNavigate()
  const { conversations, loadingConvos } = useConversations()
  const [searchValue, setSearchValue] = useState('')
  const searchInputRef = useRef(null)
  const listRef = useRef(null)
  const [selectedIdx, setSelectedIdx] = useState(0)
  
  // Focus the search input when the dialog opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus()
      }, 100)
    }
  }, [open])
  
  // Reset search and selection when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchValue('')
      setSelectedIdx(0)
    }
  }, [open])

  // Filter and sort conversations based on search input
  const filteredConvos = searchValue.trim()
    ? sortConversations(
        conversations.filter(conv => {
          const search = searchValue.trim().toLowerCase()
          return (
            (conv.name || '').toLowerCase().includes(search) ||
            (conv.modelDisplayName || '').toLowerCase().includes(search) ||
            (conv.messages?.[0]?.content || '').toLowerCase().includes(search)
          )
        }),
        searchValue
      )
    : sortConversations(conversations.slice(0, 10), '') // Show only first 10 if no search

  // Group conversations by date
  function groupConversations(convos) {
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)
    const isSameDay = (d1, d2) => 
      d1.getFullYear() === d2.getFullYear() && 
      d1.getMonth() === d2.getMonth() && 
      d1.getDate() === d2.getDate()
    
    const groups = { Today: [], Yesterday: [], Earlier: [] }
    
    convos.forEach(conv => {
      let last = conv.lastUsed
      if (last && typeof last.toDate === 'function') last = last.toDate()
      else if (typeof last === 'string') last = new Date(last)
      else if (!(last instanceof Date)) last = new Date()
      
      if (isSameDay(last, today)) groups.Today.push(conv)
      else if (isSameDay(last, yesterday)) groups.Yesterday.push(conv)
      else groups.Earlier.push(conv)
    })
    
    return groups
  }
  
  const groupedConvos = groupConversations(filteredConvos)
  const hasResults = filteredConvos.length > 0
  
  // Flat list for vertical layout and selection (max 5)
  const flatConvos = filteredConvos.slice(0, 5)
  
  // Helper to truncate text
  function truncate(text, max = 40) {
    if (!text) return ''
    return text.length > max ? text.slice(0, max - 1) + '…' : text
  }
  
  function handleConversationClick(convId) {
    navigate(`/chat/${convId}`)
    onOpenChange(false)
  }
  
  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (!hasResults) return
      if (e.key === 'ArrowDown') {
        setSelectedIdx(idx => Math.min(flatConvos.length - 1, idx + 1))
        e.preventDefault()
      } else if (e.key === 'ArrowUp') {
        setSelectedIdx(idx => Math.max(0, idx - 1))
        e.preventDefault()
      } else if (e.key === 'Enter') {
        if (flatConvos[selectedIdx]) {
          handleConversationClick(flatConvos[selectedIdx].id)
        }
      } else if (e.key === 'Escape') {
        onOpenChange(false)
      }
    },
    [flatConvos, selectedIdx, hasResults, onOpenChange]
  )

  // Always preselect the best option (first in sorted list)
  useEffect(() => {
    setSelectedIdx(0)
  }, [searchValue, open, filteredConvos.length])

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current && flatConvos[selectedIdx]) {
      const el = listRef.current.querySelector(`[data-idx='${selectedIdx}']`)
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'nearest', inline: 'center' })
      }
    }
  }, [selectedIdx, flatConvos])
  
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay
              className='fixed inset-0 z-50 bg-black/30 backdrop-blur-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
              onClick={() => onOpenChange(false)}
              asChild
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ width: '100%', height: '100%' }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content forceMount asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className='fixed inset-0 z-50 flex items-start justify-center pointer-events-none'
                style={{ marginTop: '10vh' }}
                aria-labelledby='search-conversations-title'
              >
                <div className='relative flex flex-col items-center pointer-events-auto max-w-3xl w-full'>
                  <div className="absolute inset-0 z-0 rounded-[24px] pointer-events-none bg-gradient-to-br from-white/10 via-white/5 to-white/0 backdrop-blur-2xl backdrop-brightness-125" style={{ boxShadow: '0 0 16px 2px rgba(255,255,255,0.10), 0 4px 32px 0 rgba(0,0,0,0.18)' }} />
                  <div className='relative z-10 bg-white/5 backdrop-blur-lg rounded-[24px] overflow-visible transition-all shadow-xl flex flex-col items-center w-full p-4' style={{ boxShadow: '0 0 12px 2px rgba(255,255,255,0.10)' }}>
                    <h2 id='search-conversations-title' className='sr-only'>Search Conversations</h2>
                    <div className='w-full flex justify-center mb-4'>
                      <span className='text-lg font-semibold text-white'>Search Conversations</span>
                    </div>
                    <div className='w-full max-w-lg flex flex-col items-stretch'>
                      <div className='relative w-full mb-4'>
                        <Search size={16} className='text-gray-500 dark:text-gray-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none' />
                        <input
                          ref={searchInputRef}
                          type='text'
                          placeholder='Search your conversations...'
                          value={searchValue}
                          onChange={(e) => setSearchValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className='w-full pl-9 pr-9 py-2 rounded-lg bg-[#2A2431] text-white border border-[#332940] focus:border-transparent focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0'
                        />
                        {searchValue && (
                          <button
                            type='button'
                            onClick={() => setSearchValue('')}
                            aria-label='Clear search'
                            className='absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors'
                          >
                            <X size={16} className='text-gray-500 dark:text-gray-300' />
                          </button>
                        )}
                      </div>
                      <div
                        className='w-full max-w-lg overflow-y-auto flex flex-col items-stretch gap-2 py-2 min-h-[120px] max-h-[70vh]'
                        ref={listRef}
                        tabIndex={-1}
                      >
                        {loadingConvos ? (
                          <div className='text-center text-gray-500 dark:text-gray-400 py-8 w-full'>Loading...</div>
                        ) : hasResults ? (
                          flatConvos.map((conv, idx) => (
                            <button
                              key={conv.id}
                              data-idx={idx}
                              className={`flex items-center justify-start min-h-[64px] px-4 py-3 rounded-[18px] border border-white/30 bg-white/10 backdrop-blur transition-colors text-white hover:bg-white/20 focus:outline-none shadow-md ${selectedIdx === idx ? 'ring-2 ring-[#DC749E] border-[#DC749E] bg-white/20' : ''}`}
                              style={{ boxShadow: '0 2px 12px 0 rgba(255,255,255,0.08)' }}
                              onClick={() => handleConversationClick(conv.id)}
                              onMouseEnter={() => setSelectedIdx(idx)}
                              tabIndex={-1}
                            >
                              <MessagesSquare size={18} className='text-[#BFB3CB] flex-shrink-0 mr-3' />
                              <span className='truncate font-medium text-left w-full'>
                                {truncate(conv.name || conv.messages?.[0]?.content || 'Conversation', 60)}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className='text-center text-gray-500 dark:text-gray-400 py-8 w-full'>No results found.</div>
                        )}
                      </div>
                    </div>
                    <div className='mt-4 text-xs text-gray-500 dark:text-gray-400 text-center'>
                      Use ↑ ↓ arrows, Enter to select, Esc to close
                    </div>
                  </div>
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
} 