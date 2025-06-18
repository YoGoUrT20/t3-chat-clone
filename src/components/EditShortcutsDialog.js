import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from './ui/button'
import { useState, useEffect, useRef } from 'react'
import { Save, Keyboard } from 'lucide-react'
import toast from 'react-hot-toast'
import { isMac, getModifierKey } from '../lib/utils'

const PREDEFINED_ACTIONS = [
  { id: 'select-model', description: 'Select a model' },
  { id: 'temp-chat', description: 'Temp chat', keys: ['alt', 't'] },
  { id: 'new-chat', description: 'New Chat' },
  { id: 'search-tool', description: 'Enable search tool', keys: ['alt', 's'] },
  { id: 'search-conversations', description: 'Search conversations', keys: [getModifierKey(), 'f'] },
]

const BROWSER_RESERVED_SHORTCUTS = [
  [getModifierKey(), 'r'],
  [getModifierKey(), 'n'],
  [getModifierKey(), 'w'],
  [getModifierKey(), 'tab'],
  [getModifierKey(), 't'],
  // Ctrl+F is intentionally not listed here as we want to override it
]

export default function EditShortcutsDialog({ open, onOpenChange, shortcuts, onSave }) {
  const [localShortcuts, setLocalShortcuts] = useState([])
  const [recordingIdx, setRecordingIdx] = useState(null)
  const keysPressed = useRef([])
  const recordingTimeout = useRef(null)

  useEffect(() => {
    // Map existing shortcuts to predefined actions
    setLocalShortcuts(
      PREDEFINED_ACTIONS.map((action) => {
        const found = shortcuts.find(s => s.description === action.description)
        // Use default keys if provided in PREDEFINED_ACTIONS and not overridden by user
        return found ? { ...found } : { keys: action.keys || [], description: action.description }
      })
    )
  }, [shortcuts, open])

  useEffect(() => {
    const handleKeyDown = (e) => {
      e.preventDefault()
      if (recordingTimeout.current) {
        clearTimeout(recordingTimeout.current)
        recordingTimeout.current = setTimeout(resetRecording, 2000)
      }
      let key = e.key
      if (key === 'Control') key = 'ctrl'
      if (key === 'Meta') key = 'meta'
      if (key === 'Alt') key = 'alt'
      if (key === 'Shift') key = 'shift'
      if (!keysPressed.current.includes(key)) {
        keysPressed.current.push(key)
      }
      const modifiers = keysPressed.current.filter(k => ['ctrl', 'meta', 'alt', 'shift'].includes(k))
      const regularKeys = keysPressed.current.filter(k => !modifiers.includes(k))
      if (modifiers.length === 1 && regularKeys.length === 1) {
        const newShortcut = [modifiers[0], regularKeys[0]]
        if (isBrowserReservedShortcut(newShortcut)) {
          toast.error(`This shortcut may not work because the browser might overwrite it (e.g. ${getModifierKey().toUpperCase()}+R, ${getModifierKey().toUpperCase()}+N, etc.)`)
          setRecordingIdx(null)
          return
        }
        // Check for duplicate shortcut
        const isDuplicate = localShortcuts.some((sc, i) => {
          if (i === recordingIdx) return false
          if (!sc.keys || sc.keys.length !== 2) return false
          return (
            sc.keys[0].toLowerCase() === newShortcut[0].toLowerCase() &&
            sc.keys[1].toLowerCase() === newShortcut[1].toLowerCase()
          )
        })
        if (isDuplicate) {
          toast.error('This shortcut is already used for another action')
          setRecordingIdx(null)
          return
        }
        setLocalShortcuts(prev =>
          prev.map((sc, i) => (i === recordingIdx ? { ...sc, keys: newShortcut } : sc))
        )
        setRecordingIdx(null)
      } else if (modifiers.length > 1 || regularKeys.length > 1) {
        toast.error('Shortcut must be one modifier key + one other key.')
        setRecordingIdx(null)
      }
    }
    const handleKeyUp = (e) => {
      let key = e.key
      if (key === 'Control') key = 'ctrl'
      if (key === 'Meta') key = 'meta'
      if (key === 'Alt') key = 'alt'
      if (key === 'Shift') key = 'shift'
      keysPressed.current = keysPressed.current.filter(k => k !== key)
    }
    const resetRecording = () => {
      toast.error('Shortcut recording timed out.')
      setRecordingIdx(null)
    }
    const cleanup = () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      if (recordingTimeout.current) {
        clearTimeout(recordingTimeout.current)
      }
      keysPressed.current = []
    }
    if (recordingIdx === null) {
      cleanup()
      return
    }
    recordingTimeout.current = setTimeout(resetRecording, 2000) // 2 second timeout
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return cleanup
  }, [recordingIdx])

  const handleStartRecording = (idx) => {
    setRecordingIdx(idx)
    keysPressed.current = []
  }

  function isBrowserReservedShortcut(keys) {
    if (keys.length !== 2) return false
    const lower = keys.map(k => k.toLowerCase())
    return BROWSER_RESERVED_SHORTCUTS.some(
      reserved => reserved[0] === lower[0] && reserved[1] === lower[1]
    )
  }

  const handleSave = async () => {
    if (localShortcuts.some(sc => sc.keys.length !== 2)) {
      toast.error('Each shortcut must have two keys')
      return
    }
    await onSave(localShortcuts)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay
              className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
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
                className='fixed inset-0 z-50 flex items-center justify-center pointer-events-none'
              >
                <div className='rounded-2xl shadow-2xl p-8 max-w-lg w-full focus:outline-none border border-[#332940] backdrop-blur-xl bg-[#201B25]/60 text-[#BFB3CB] pointer-events-auto relative flex flex-col items-center'>
                  <div className='text-lg font-semibold mb-4 text-center text-base font-bold text-[#0e0e10] dark:text-white tracking-tight'>Edit Shortcuts</div>
                  <div className='flex flex-col gap-6 max-h-[50vh] overflow-y-auto'>
                    {localShortcuts.map((sc, idx) => (
                      <div key={idx} className='flex items-center justify-between w-full'>
                        <span className='text-base font-bold mr-4'>{sc.description}</span>
                        <Button
                          variant={recordingIdx === idx ? 'default' : 'outline'}
                          className='flex items-center gap-2'
                          type='button'
                          onClick={() => handleStartRecording(idx)}
                          disabled={recordingIdx !== null && recordingIdx !== idx}
                        >
                          <Keyboard size={16} />
                          {recordingIdx === idx
                            ? 'Press 2 keys...'
                            : sc.keys.length === 2
                              ? sc.keys.map((k, i) => <span key={i} className='font-mono px-2 py-1 rounded bg-[#ececec] dark:bg-[#232228] border border-[#d1b3c4] dark:border-[#a97ca5] text-[#0e0e10] dark:text-white mx-0.5'>{k.toLowerCase() === 'meta' || k.toLowerCase() === 'ctrl' ? (isMac() ? '⌘' : 'CTRL') : k.toUpperCase()}</span>)
                              : sc.keys.length === 1
                                ? <span className='font-mono px-2 py-1 rounded bg-[#ececec] dark:bg-[#232228] border border-[#d1b3c4] dark:border-[#a97ca5] text-[#0e0e10] dark:text-white mx-0.5'>{sc.keys[0].toUpperCase()}</span>
                                : 'Set shortcut'}
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className='flex gap-3 w-full justify-center mt-8'>
                    <Button
                      variant='outline'
                      className='w-1/2 transition-colors duration-150 hover:bg-[#ececec] dark:hover:bg-[#28262b] active:bg-[#e0e0e0] dark:active:bg-[#232228]'
                      onClick={() => onOpenChange(false)}
                      type='button'
                    >
                      Cancel
                    </Button>
                    <Button
                      variant='default'
                      className='w-1/2 flex items-center justify-center gap-2'
                      onClick={handleSave}
                      type='button'
                    >
                      <Save size={16} /> Save
                    </Button>
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