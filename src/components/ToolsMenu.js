import React from 'react';
import { Button } from './ui/button';
import { Wrench, Globe, PlusCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../lib/utils';

function ToolsMenu({
  isLoading,
  isTemporaryChat,
  onStartTemporaryChat,
  isMobile,
  toolsDropdownRef,
  toolsButtonRef,
  showTools,
  setShowTools,
  showTooltip,
  hideTooltip
}) {
  return (
    <>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        ref={toolsButtonRef}
        onClick={() => setShowTools((prev) => !prev)}
        className='liquid-glass-circle-btn'
        disabled={isLoading}
        onMouseEnter={e => showTooltip(e, 'Tools')}
        onMouseLeave={hideTooltip}
      >
        <Wrench className='h-5 w-5' />
      </Button>
      <AnimatePresence>
        {showTools && (
          <motion.div
            ref={toolsDropdownRef}
            key='Tools-dropdown'
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'tween', duration: 0.25 }}
            className={cn(
              isMobile
                ? 'fixed left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-700 rounded-t-2xl shadow-lg text-white p-0'
                : 'absolute mx-auto my-auto bottom-full bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-20 min-w-[260px] text-white',
            )}
            style={isMobile ? { bottom: 80, maxHeight: '40vh', overflow: 'visible' } : {}}
          >
            <div className={isMobile ? 'max-h-[40vh] overflow-y-auto' : ''}>
              <div className='flex flex-col'>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-zinc-800 transition-colors text-base font-medium flex items-center gap-2 ${isTemporaryChat ? 'text-red-400' : ''}`}
                  onClick={() => {
                    setShowTools(false);
                    if (onStartTemporaryChat) onStartTemporaryChat();
                  }}
                >
                  <Wrench className='h-5 w-5' />
                  {isTemporaryChat ? 'End temporary chat' : 'Start temporary chat'}
                </button>
                <button
                  className='w-full text-left px-4 py-2 hover:bg-zinc-800 transition-colors text-base font-medium flex items-center gap-2 opacity-60 cursor-not-allowed'
                  disabled
                >
                  <Globe className='h-5 w-5' />
                  Web search (coming soon)
                </button>
                <button
                  className='w-full text-left px-4 py-2 hover:bg-zinc-800 transition-colors text-base font-medium flex items-center gap-2 opacity-60 cursor-not-allowed'
                  disabled
                >
                  <PlusCircle className='h-5 w-5' />
                  Add MCP (coming soon)
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ToolsMenu; 