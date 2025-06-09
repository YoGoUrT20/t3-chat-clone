import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Lightbulb, Key, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { models } from '../models';
import { capabilityColors, familyIcons } from '../constants';
import { Button } from './ui/button';

function ModelSelection({ items = models, className }) {
  // Custom family order
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
  const sortedItems = sortByCustomFamilyOrder(items)
    .map(item => {
      const hasApiKey = false;
      const hasSubscription = false;
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
  const [hovered, setHovered] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
  const [nameTooltip, setNameTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
  const iconRefs = useRef({});
  const nameRefs = useRef({});

  const handleMouseEnter = (item) => {
    const ref = iconRefs.current[item.name];
    if (ref) {
      const rect = ref.getBoundingClientRect();
      setTooltip({
        visible: true,
        x: rect.left + rect.width / 2,
        y: rect.top,
        text: item.description,
      });
    }
    setHovered(item.name);
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, text: '' });
    setHovered(null);
  };

  const handleNameMouseEnter = (item) => {
    const ref = nameRefs.current[item.name];
    if (ref) {
      const rect = ref.getBoundingClientRect();
      setNameTooltip({
        visible: true,
        x: rect.left + rect.width / 2,
        y: rect.top,
        text: item.displayName,
      });
    }
  };

  const handleNameMouseLeave = () => {
    setNameTooltip({ visible: false, x: 0, y: 0, text: '' });
  };

  return (
    <div className={cn('flex justify-center w-full', className)}>
      <style>{`
        .ModelSelection-scrollbar::-webkit-scrollbar-thumb {
          background: #483A44;
          border-radius: 0;
          border: none;
        }
        .ModelSelection-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          margin: 0;
          border: none;
        }
        .ModelSelection-scrollbar::-webkit-scrollbar {
          width: 8px;
          background: transparent;
          margin: 0;
        }
        .ModelSelection-scrollbar::-webkit-scrollbar-button {
          display: none;
          height: 0;
          width: 0;
        }
        /* For Firefox */
        .ModelSelection-scrollbar {
          scrollbar-color: #483A44 transparent;
        }
      `}</style>
      <div className='flex flex-col items-center w-full'>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[800px] max-w-[1400px] overflow-y-auto ModelSelection-scrollbar px-4 mt-6'>
          <div className='col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 mb-2'>
            <div className='backdrop-blur-xl bg-white/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between px-8 py-8 min-h-[120px] pointer-events-auto'>
              <div className='flex flex-col items-start w-full sm:w-auto mb-4 sm:mb-0'>
                <span className='text-2xl font-bold text-zinc-900 dark:text-zinc-100'>Subscription</span>
                <span className='text-lg text-zinc-700 dark:text-zinc-300 mt-1'>9$ to access all models</span>
              </div>
              <div className='flex flex-col items-end w-full sm:w-auto'>
                <Button className='text-base font-semibold px-8 py-3 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'>Subscribe</Button>
                <span className='text-sm text-zinc-600 dark:text-zinc-400 mt-2 self-end'>9$/month</span>
              </div>
            </div>
          </div>
          {sortedItems.map((item) => {
            const { blockedByKey, blockedByLock, isBlocked } = item;
            return (
              <div
                key={item.name}
                className={cn(
                  'flex flex-col',
                  'bg-white dark:bg-zinc-900/70',
                  'rounded-lg',
                  'border border-zinc-100 dark:border-zinc-800',
                  'hover:border-zinc-200 dark:hover:border-zinc-700',
                  'transition-all duration-200',
                  'shadow-sm backdrop-blur-xl',
                  'p-2',
                  'min-h-[90px]',
                  isBlocked && 'relative',
                )}
                style={{ fontSize: 13 }}
              >
                {isBlocked && (
                  <div className='absolute inset-0 z-20 flex items-center justify-center pointer-events-auto'>
                    <div
                      className='flex flex-col items-center justify-center w-full h-full cursor-pointer'
                      onMouseEnter={() => {
                        const ref = iconRefs.current[item.name + '-blocked'];
                        if (ref) {
                          const rect = ref.getBoundingClientRect();
                          setTooltip({
                            visible: true,
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                            text: blockedByKey
                              ? 'Add an API key to use this model.'
                              : blockedByLock
                                ? 'Buy a subscription to use this model.'
                                : '',
                          });
                        }
                      }}
                      onMouseLeave={handleMouseLeave}
                      ref={el => (iconRefs.current[item.name + '-blocked'] = el)}
                    >
                      {blockedByKey ? (
                        <Key className='w-10 h-10 text-zinc-500 drop-shadow' />
                      ) : blockedByLock ? (
                        <Lock className='w-10 h-10 text-zinc-500 drop-shadow' />
                      ) : null}
                    </div>
                  </div>
                )}
                <div className={isBlocked ? 'pointer-events-none' : ''}>
                  <div
                    className='flex items-center gap-2 mb-1'
                    style={{ minHeight: 28 }}
                  >
                    {item.family && familyIcons[item.family] && (
                      <img
                        src={familyIcons[item.family]}
                        alt={item.family}
                        className='w-6 h-6 rounded-sm flex-shrink-0'
                      />
                    )}
                    <h3
                      className='text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate cursor-pointer'
                      ref={el => (nameRefs.current[item.name] = el)}
                      onMouseEnter={() => handleNameMouseEnter(item)}
                      onMouseLeave={handleNameMouseLeave}
                      tabIndex={0}
                      aria-label={item.displayName}
                      style={{ maxWidth: 120 }}
                    >
                      {item.displayNameV2}
                    </h3>
                  </div>
                  <div
                    className='flex flex-wrap gap-1 mb-1 items-center justify-start'
                    style={{ minHeight: 36, display: 'flex' }}
                  >
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
                  <div className='mt-auto border-t border-zinc-100 dark:border-zinc-800 pt-1 relative'>
                    <button
                      className={cn(
                        'w-full flex items-center justify-center gap-1',
                        'py-1 px-2',
                        'text-[10px] font-medium',
                        'text-zinc-600 dark:text-zinc-400',
                        'hover:text-zinc-900 dark:hover:text-zinc-100',
                        'hover:bg-zinc-100 dark:hover:bg-zinc-800/50',
                        'transition-colors duration-200',
                        'relative',
                      )}
                      ref={el => (iconRefs.current[item.name] = el)}
                      onMouseEnter={() => item.description && handleMouseEnter(item)}
                      onMouseLeave={handleMouseLeave}
                      tabIndex={0}
                      aria-label={item.description ? 'Show description' : undefined}
                      style={{ outline: 'none' }}
                    >
                      <Lightbulb className='w-3 h-3' />
                    </button>
                  </div>
                </div>
                {isBlocked && (
                  <div className='absolute inset-0 z-10 bg-black/40 rounded-lg pointer-events-none'></div>
                )}
              </div>
            );
          })}
        </div>
        {tooltip.visible && tooltip.text && createPortal(
          <span
            className='z-50 fixed px-3 py-2 rounded bg-black text-zinc-100 text-xs shadow-lg pointer-events-none select-none'
            style={{
              left: tooltip.x,
              top: tooltip.y - 12,
              transform: 'translate(-50%, -100%)',
              maxWidth: 250,
              whiteSpace: 'pre-line',
            }}
          >
            {tooltip.text}
          </span>,
          document.body
        )}
        {nameTooltip.visible && nameTooltip.text && createPortal(
          <span
            className='z-50 fixed px-3 py-2 rounded bg-black text-zinc-100 text-xs shadow-lg pointer-events-none select-none'
            style={{
              left: nameTooltip.x,
              top: nameTooltip.y - 8,
              transform: 'translate(-50%, -100%)',
              maxWidth: 300,
              whiteSpace: 'pre-line',
            }}
          >
            {nameTooltip.text}
          </span>,
          document.body
        )}
      </div>
    </div>
  );
}

export default ModelSelection; 