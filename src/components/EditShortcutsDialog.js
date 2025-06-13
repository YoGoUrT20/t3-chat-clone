import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from './ui/button'
import { useState, useEffect, useRef } from 'react'
import { Save, Keyboard } from 'lucide-react'
import toast from 'react-hot-toast'

const PREDEFINED_ACTIONS = [
  { id: 'select-model', description: 'Select a model' },
  { id: 'temp-chat', description: 'Temp chat' },
]

export default function EditShortcutsDialog({ open, onOpenChange, shortcuts, onSave }) {
  const [localShortcuts, setLocalShortcuts] = useState([])
  const [recordingIdx, setRecordingIdx] = useState(null)
  const keysPressed = useRef([])

  useEffect(() => {
    // Map existing shortcuts to predefined actions
    setLocalShortcuts(
      PREDEFINED_ACTIONS.map((action) => {
        const found = shortcuts.find(s => s.description === action.description)
        return found ? { ...found } : { keys: [], description: action.description }
      })
    )
  }, [shortcuts, open])

  useEffect(() => {
    if (recordingIdx === null) return
    const handleKeyDown = (e) => {
      e.preventDefault()
      if (keysPressed.current.length < 2) {
        let key = e.key
        if (key === 'Control') key = 'ctrl'
        if (key === 'Meta') key = 'meta'
        if (key === 'Alt') key = 'alt'
        if (key === 'Shift') key = 'shift'
        if (!keysPressed.current.includes(key)) {
          keysPressed.current.push(key)
        }
      }
      if (keysPressed.current.length === 2) {
        setLocalShortcuts(prev => prev.map((sc, i) => i === recordingIdx ? { ...sc, keys: [...keysPressed.current] } : sc))
        setRecordingIdx(null)
        keysPressed.current = []
      }
    }
    const handleKeyUp = (e) => {
      // If user releases all keys, reset if not enough keys
      if (keysPressed.current.length < 2) {
        setRecordingIdx(null)
        keysPressed.current = []
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      keysPressed.current = []
    }
  }, [recordingIdx])

  const handleStartRecording = (idx) => {
    setRecordingIdx(idx)
    keysPressed.current = []
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
                  <div className='w-full flex flex-col gap-6 max-h-[50vh] overflow-y-auto'>
                    {localShortcuts.map((sc, idx) => (
                      <div key={idx} className='flex flex-col gap-2'>
                        <div className='flex items-center gap-3'>
                          <span className='text-base font-bold min-w-[120px]'>{sc.description}</span>
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
                                ? sc.keys.map((k, i) => <span key={i} className='font-mono px-2 py-1 rounded bg-[#ececec] dark:bg-[#232228] border border-[#d1b3c4] dark:border-[#a97ca5] text-[#0e0e10] dark:text-white mx-0.5'>{k.toUpperCase()}</span>)
                                : 'Set shortcut'}
                          </Button>
                        </div>
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