import React from 'react';
import { Key, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { models } from '../models';
import { capabilityColors, familyIcons } from '../constants';
import { Button } from './ui/button';
import { useAuth } from '../AuthContext';

function ModelSelectionMobile({ items = models, className, selectedModel, onModelSelect }) {
  const { user } = useAuth();
  const familyOrder = ['claude', 'gemini', 'chatgpt', 'deepseek', 'llama', 'grok', 'qwen'];
  const sortByCustomFamilyOrder = (models) => {
    return [...models].sort((a, b) => {
      const aIndex = familyOrder.indexOf(a.family);
      const bIndex = familyOrder.indexOf(b.family);
      if (aIndex === -1 && bIndex === -1) {
        return a.family.localeCompare(b.family);
      }
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.displayName.localeCompare(b.displayName);
    });
  };
  const useOwnKey = (user && user.useOwnKey) || localStorage.getItem('use_own_api_key') === 'true';
  const sortedItems = sortByCustomFamilyOrder(items)
    .map(item => {
      let hasApiKey = false;
      let hasSubscription = false;
      if (useOwnKey) {
        hasApiKey = true;
        hasSubscription = true;
      }
      const blockedByKey = item.apiKeyRequired && !hasApiKey;
      const blockedByLock = !item.freeAccess && !hasSubscription && !blockedByKey;
      const isBlocked = blockedByKey || blockedByLock;
      return { ...item, blockedByKey, blockedByLock, isBlocked };
    })
    .sort((a, b) => {
      if (!a.isBlocked && b.isBlocked) return -1;
      if (a.isBlocked && !b.isBlocked) return 1;
      return 0;
    });

  return (
    <div className={cn('w-full flex flex-col items-center', className)}>
      {useOwnKey && (
        <div className={`w-full max-w-md flex items-center gap-2 px-4 py-3 mb-4 rounded-xl border border-[#ececec] dark:border-[#232228] bg-white/70 dark:bg-zinc-900/60 shadow`}
             style={{ color: '#232228', fontWeight: 600, fontSize: '1rem' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 text-[#DC749E] dark:text-[#F9B4D0]"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
          <span className='flex-1 text-left text-[#232228] dark:text-[#ececec]'>Using your own OpenRouter API key. All models are available.</span>
        </div>
      )}
      <div className='w-full max-w-md px-2 py-4'>
        {(!user || user.status !== 'premium') && (
        <div className='bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-md flex flex-col items-center justify-between px-4 py-6 mb-4'>
          <span className='text-xl font-bold text-zinc-900 dark:text-zinc-100'>Subscription</span>
          <span className='text-base text-zinc-700 dark:text-zinc-300 mt-1'>9$ to access all models</span>
          <Button className='text-base font-semibold px-6 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 mt-3'>Subscribe</Button>
          <span className='text-xs text-zinc-600 dark:text-zinc-400 mt-2'>9$/month</span>
        </div>
        )}
        <div className='flex flex-col gap-2'>
          {sortedItems.map((item) => {
            const { blockedByKey, blockedByLock, isBlocked } = item;
            const isSelected = selectedModel && selectedModel.name === item.name;
            return (
              <div
                key={item.name}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 shadow-sm',
                  isBlocked && 'opacity-60 relative',
                  isSelected && 'border-green-500 ring-2 ring-green-500',
                  !isBlocked && 'cursor-pointer',
                )}
                style={{ minHeight: 64 }}
                onClick={() => !isBlocked && onModelSelect && onModelSelect(item)}
              >
                {item.family && familyIcons[item.family] && (
                  <img
                    src={familyIcons[item.family]}
                    alt={item.family}
                    className='w-8 h-8 rounded-sm flex-shrink-0'
                  />
                )}
                <div className='flex flex-col flex-1 min-w-0'>
                  <span className='text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate' style={{ maxWidth: 140 }}>{item.displayNameV2}</span>
                  <div className='flex flex-wrap gap-1 mt-1'>
                    {item.capabilities && item.capabilities.length > 0 ? (
                      item.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className={cn(
                            'px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                            capabilityColors[cap] || 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                          )}
                        >
                          {cap}
                        </span>
                      ))
                    ) : (
                      <span className='text-[10px] text-zinc-400'>No capabilities</span>
                    )}
                  </div>
                </div>
                {isBlocked && (
                  <div className='absolute right-3 top-1/2 -translate-y-1/2 z-10'>
                    {blockedByKey ? (
                      <Key className='w-6 h-6 text-zinc-500' />
                    ) : blockedByLock ? (
                      <Lock className='w-6 h-6 text-zinc-500' />
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ModelSelectionMobile; 