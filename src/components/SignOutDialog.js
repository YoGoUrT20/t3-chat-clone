import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { Button } from './ui/button'

export default function SignOutDialog({ open, onOpenChange, onConfirm, loading }) {
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
                <div className='rounded-2xl shadow-2xl p-8 max-w-xs w-full focus:outline-none border border-[#332940] backdrop-blur-xl bg-[#201B25]/60 text-[#BFB3CB] pointer-events-auto relative flex flex-col items-center'>
                  <Info size={32} className='mb-2 text-[#ff6b81]' />
                  <div className='text-lg font-semibold mb-2 text-center'>Confirm Sign Out</div>
                  <div className='text-sm mb-6 text-center'>Are you sure you want to sign out?</div>
                  <div className='flex gap-3 w-full justify-center'>
                    <Button
                      variant='outline'
                      className='w-1/2 transition-colors duration-150 hover:bg-[#ececec] dark:hover:bg-[#28262b] active:bg-[#e0e0e0] dark:active:bg-[#232228]'
                      onClick={() => onOpenChange(false)}
                      type='button'
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant='destructive'
                      className='w-1/2 transition-colors duration-150 hover:bg-[#ff6b81]/80 active:bg-[#d32f2f]/90'
                      onClick={onConfirm}
                      type='button'
                      disabled={loading}
                    >
                      Sign out
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