import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';
import { models } from '../models';
import { Button } from './ui/button';
import styles from './ModelSelection.module.css';
import ModelCard from './ModelCard';
import Tooltip from './Tooltip';

function ModelSelection({ items = models, className, selectedModel, onModelSelect }) {
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
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
  const [nameTooltip, setNameTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
  const iconRefs = useRef({});
  const nameRefs = useRef({});
  const [search, setSearch] = useState('');
  const searchInputRef = useRef();

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

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
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, text: '' });
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

  const filterModels = (items, search) => {
    if (!search.trim()) return items;
    const s = search.trim().toLowerCase();
    // Sort by how well displayNameV2, displayName, or family matches the search string
    return [...items].sort((a, b) => {
      const aName = a.displayNameV2.toLowerCase();
      const bName = b.displayNameV2.toLowerCase();
      const aDisplay = a.displayName.toLowerCase();
      const bDisplay = b.displayName.toLowerCase();
      const aFamily = a.family ? a.family.toLowerCase() : '';
      const bFamily = b.family ? b.family.toLowerCase() : '';
      // Helper to get best match score for a model
      const getScore = (name, display, family) => {
        if (name === s || display === s || family === s) return 0;
        if (name.startsWith(s) || display.startsWith(s) || family.startsWith(s)) return 1;
        if (name.includes(s) || display.includes(s) || family.includes(s)) return 2;
        // Lower indexOf is better
        const idxs = [name.indexOf(s), display.indexOf(s), family.indexOf(s)].filter(idx => idx !== -1);
        if (idxs.length > 0) return 3 + Math.min(...idxs);
        // Otherwise, sort by length difference
        return 100 + Math.abs(name.length - s.length);
      };
      const aScore = getScore(aName, aDisplay, aFamily);
      const bScore = getScore(bName, bDisplay, bFamily);
      if (aScore !== bScore) return aScore - bScore;
      // Fallback: shorter length difference is better
      return Math.abs(aName.length - s.length) - Math.abs(bName.length - s.length);
    });
  };


  const filteredItems = filterModels(sortedItems, search);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Pick the first unlocked model from filteredItems (sorted by best match)
      const unlocked = filteredItems.filter(i => !i.isBlocked);
      if (unlocked.length > 0 && onModelSelect) {
        onModelSelect(unlocked[0]);
      }
    }
  };

  return (
    <div className={cn('flex justify-center w-full', className, styles.liquidGlassBg)} style={{ position: 'relative' }}>
      <div className='flex flex-col items-center w-full'>
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[800px] max-w-[1400px] overflow-y-auto ${styles.ModelSelectionScrollbar} px-4 mt-6`}>
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
          <div className='col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 mb-2 flex justify-start'>
            <input
              ref={searchInputRef}
              type='text'
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder='Search models...'
              className='w-full max-w-md px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500 text-base mb-2 shadow-sm'
              aria-label='Search models'
              autoComplete='off'
            />
          </div>
          {filteredItems.map((item) => (
            <ModelCard
              key={item.name}
              item={item}
              selectedModel={selectedModel}
              onModelSelect={onModelSelect}
              iconRefs={iconRefs}
              nameRefs={nameRefs}
              handleNameMouseEnter={handleNameMouseEnter}
              handleNameMouseLeave={handleNameMouseLeave}
              handleMouseEnter={handleMouseEnter}
              handleMouseLeave={handleMouseLeave}
            />
          ))}
        </div>
        {tooltip.visible && tooltip.text && createPortal(
          <Tooltip x={tooltip.x} y={tooltip.y - 12} text={tooltip.text} style={{maxWidth: 250, whiteSpace: 'pre-line'}} />, document.body
        )}
        {nameTooltip.visible && nameTooltip.text && createPortal(
          <Tooltip x={nameTooltip.x} y={nameTooltip.y - 8} text={nameTooltip.text} style={{maxWidth: 300, whiteSpace: 'pre-line'}} />, document.body
        )}
      </div>
      {/* Gradient overlay at the bottom */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '140px',
          pointerEvents: 'none',
          zIndex: 30,
          background: 'linear-gradient(to top, rgba(24,24,27,0.55) 20%, rgba(24,24,27,0.25) 60%, rgba(24,24,27,0.0) 100%)',
        }}
      />
    </div>
  );
}

export default ModelSelection; 