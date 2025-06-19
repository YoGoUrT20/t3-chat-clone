import React from 'react';
import { Lightbulb, Key, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { capabilityColors, familyIcons } from '../constants';
import styles from './ModelSelection.module.css';

function ModelCard({
  item,
  selectedModel,
  onModelSelect,
  iconRefs,
  nameRefs,
  handleNameMouseEnter,
  handleNameMouseLeave,
  handleMouseEnter,
  handleMouseLeave,
}) {
  const { blockedByKey, blockedByLock, isBlocked } = item;
  const isSelected = selectedModel && selectedModel.name === item.name;
  return (
    <div
      className={cn(
        'flex flex-col',
        styles.liquidGlassCard,
        'rounded-lg',
        'border border-zinc-800',
        'hover:border-zinc-700',
        'transition-all duration-200',
        'shadow-sm',
        'p-2',
        'min-h-[90px]',
        isBlocked && 'relative',
        isSelected && styles.modelSelectedHighlight,
        !isBlocked && 'cursor-pointer',
      )}
      style={{ fontSize: 13 }}
      onClick={() => !isBlocked && onModelSelect && onModelSelect(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (!isBlocked && onModelSelect) {
            onModelSelect(item);
          }
        }
      }}
      tabIndex={!isBlocked ? 0 : -1}
    >
      {isBlocked && (
        <div className='absolute inset-0 z-20 flex items-center justify-center pointer-events-auto'>
          <div
            className='flex flex-col items-center justify-center w-full h-full cursor-pointer'
            onMouseEnter={() => {
              const ref = iconRefs.current[item.name + '-blocked'];
              if (ref) {
                const rect = ref.getBoundingClientRect();
                handleMouseEnter({
                  ...item,
                  description: blockedByKey
                    ? 'Add an API key to use this model.'
                    : blockedByLock
                      ? 'Buy a subscription to use this model.'
                      : '',
                  rect,
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
            className='text-xs font-medium text-zinc-100 truncate cursor-pointer'
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
                  capabilityColors[cap] || 'bg-zinc-800 text-zinc-100'
                )}
              >
                {cap}
              </span>
            ))
          ) : (
            <span className='text-[10px] text-zinc-400'>No capabilities</span>
          )}
        </div>
        <div className='mt-auto border-t border-zinc-800 pt-1 relative'>
          <button
            className={cn(
              'w-full flex items-center justify-center gap-1',
              'py-1 px-2',
              'text-[10px] font-medium',
              'text-zinc-400',
              'hover:text-zinc-100',
              'hover:bg-zinc-800/50',
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
}

export default ModelCard; 