import React from 'react';
import { Button } from './ui/button';
import { Wrench, Globe, PlusCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Switch } from './ui/switch';
import toast from 'react-hot-toast';

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
  hideTooltip,
  onSelectModel,
  useWebSearch,
  setUseWebSearch,
  useDeepResearch,
  setUseDeepResearch,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

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
              'text-white',
              isMobile
                ? 'fixed left-0 right-0 z-50 bg-[#18181B] border-t border-[#3F3F46] rounded-t-2xl shadow-lg p-0'
                : 'absolute mx-auto my-auto bottom-full bg-[#18181B] border border-[#3F3F46] rounded-lg shadow-lg z-20 min-w-[260px]',
            )}
            style={isMobile ? { bottom: 80, maxHeight: '40vh', overflow: 'visible' } : {}}
          >
            <div className={isMobile ? 'max-h-[40vh] overflow-y-auto' : ''}>
              <div className='flex flex-col'>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-[#27272A] transition-colors text-base font-medium flex items-center gap-2 ${isTemporaryChat ? 'text-red-400' : ''} ${!user ? 'opacity-60 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (!user) return;
                    setShowTools(false);
                    if (onStartTemporaryChat) onStartTemporaryChat();
                    navigate('/');
                  }}
                  disabled={!user}
                >
                  <Wrench className='h-5 w-5' />
                  {isTemporaryChat ? 'End temporary chat' : 'Start temporary chat'}
                </button>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-[#27272A] transition-colors text-base font-medium flex items-center justify-between gap-2 ${user && user.status === 'premium' && user.premiumTokens >= 2 ? '' : 'opacity-60 cursor-not-allowed'}`}
                  onMouseEnter={e => {
                    if (user && user.status === 'premium' && user.premiumTokens >= 2) {
                      showTooltip(e, '+ 2 premium tokens');
                    } else {
                      let reason = '';
                      if (!user) reason = 'Sign in to use Web Search';
                      else if (user.status !== 'premium') reason = 'Web Search requires premium';
                      else if (user.premiumTokens < 2) reason = 'Web Search requires at least 2 tokens';
                      showTooltip(e, reason);
                    }
                  }}
                  onMouseLeave={hideTooltip}
                  onClick={() => {
                    if (user && user.status === 'premium' && user.premiumTokens >= 2) {
                      setUseWebSearch(prev => {
                        if (!prev && useDeepResearch) setUseDeepResearch(false);
                        return !prev;
                      });
                    }
                  }}
                  disabled={!user || user.status !== 'premium' || user.premiumTokens < 2}
                >
                  <span className='flex items-center gap-2 pointer-events-none'>
                    <Globe className='h-5 w-5' />
                    Web search
                  </span>
                  <span className="pointer-events-none">
                    <Switch
                      checked={useWebSearch}
                      onCheckedChange={checked => {
                        if (!user || user.status !== 'premium' || user.premiumTokens < 2) return;
                        if (checked && useDeepResearch) setUseDeepResearch(false);
                        setUseWebSearch(checked);
                      }}
                      disabled={!user || user.status !== 'premium' || user.premiumTokens < 2}
                      onClick={e => e.stopPropagation()}
                      onMouseDown={e => e.preventDefault()}
                    />
                  </span>
                </button>
                <span
                  onMouseEnter={e => {
                    if (user && user.status === 'premium' && user.premiumTokens >= 10) {
                      showTooltip(e, '+ 9 premium tokens');
                      return;
                    }
                    let reason = '';
                    if (!user) reason = 'Sign in to use Deep Research';
                    else if (user.status !== 'premium') reason = 'Deep Research requires premium';
                    else if (user.premiumTokens < 10) reason = 'Deep Research requires at least 10 tokens';
                    showTooltip(e, reason);
                  }}
                  onMouseLeave={hideTooltip}
                  style={{ display: 'block' }}
                >
                  <button
                    className={`w-full text-left px-4 py-2 hover:bg-[#27272A] transition-colors text-base font-medium flex items-center justify-between gap-2 ${user && user.status === 'premium' && user.premiumTokens >= 10 ? '' : 'opacity-60 cursor-not-allowed'}`}
                    onClick={() => {
                      if (!user || user.status !== 'premium' || user.premiumTokens < 10) {
                        if (window && window.toast) window.toast.error('Deep Research requires premium and at least 10 tokens');
                        else if (typeof toast !== 'undefined') toast.error('Deep Research requires premium and at least 10 tokens');
                        return;
                      }
                      setUseDeepResearch(prev => {
                        if (!prev && useWebSearch) setUseWebSearch(false);
                        return !prev;
                      });
                    }}
                    disabled={!user || user.status !== 'premium' || user.premiumTokens < 10}
                  >
                    <span className='flex items-center gap-2 pointer-events-none'>
                      <Globe className='h-5 w-5' />
                      Deep Research [ALPHA]
                    </span>
                    <span className="pointer-events-none">
                      <Switch
                        checked={useDeepResearch}
                        onCheckedChange={checked => {
                          if (!user || user.status !== 'premium' || user.premiumTokens < 10) return;
                          if (checked && useWebSearch) setUseWebSearch(false);
                          setUseDeepResearch(checked);
                        }}
                        disabled={!user || user.status !== 'premium' || user.premiumTokens < 10}
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.preventDefault()}
                      />
                    </span>
                  </button>
                </span>
                <button
                  className='w-full text-left px-4 py-2 hover:bg-[#27272A] transition-colors text-base font-medium flex items-center gap-2 opacity-60 cursor-not-allowed'
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