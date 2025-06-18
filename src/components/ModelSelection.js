import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { models } from '../models';
import { Button } from './ui/button';
import styles from './ModelSelection.module.css';
import ModelCard from './ModelCard';
import Tooltip from './Tooltip';
import { useAuth } from '../AuthContext';

function ModelSelection({ items = models, className, selectedModel, onModelSelect, defaultModel }) {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  // Only allow useOwnKey if user is signed in
  const useOwnKey = !!user && ((user && user.useOwnKey) || localStorage.getItem('use_own_api_key') === 'true');
  const sortedItems = sortByCustomFamilyOrder(items)
    .map(item => {
      let hasApiKey = false;
      let hasSubscription = false;
      if (useOwnKey) {
        hasApiKey = true;
        hasSubscription = true;
      } else if (user && user.status === 'premium') {
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
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
  const [nameTooltip, setNameTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
  const iconRefs = useRef({});
  const nameRefs = useRef({});
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const searchInputRef = useRef();

  // Collect all unique tags from models
  const allTags = Array.from(new Set(models.flatMap(m => m.tags || []))).sort();

  // Tag selection handler
  const handleTagClick = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

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

  // Filtering logic
  const filterModels = (items, search, selectedTags) => {
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      // Sort by how well displayNameV2, displayName, or family matches the search string
      return [...items].sort((a, b) => {
        const aName = a.displayNameV2.toLowerCase();
        const bName = b.displayNameV2.toLowerCase();
        const aDisplay = a.displayName.toLowerCase();
        const bDisplay = b.displayName.toLowerCase();
        const aFamily = a.family ? a.family.toLowerCase() : '';
        const bFamily = b.family ? b.family.toLowerCase() : '';
        const getScore = (name, display, family) => {
          if (name === s || display === s || family === s) return 0;
          if (name.startsWith(s) || display.startsWith(s) || family.startsWith(s)) return 1;
          if (name.includes(s) || display.includes(s) || family.includes(s)) return 2;
          const idxs = [name.indexOf(s), display.indexOf(s), family.indexOf(s)].filter(idx => idx !== -1);
          if (idxs.length > 0) return 3 + Math.min(...idxs);
          return 100 + Math.abs(name.length - s.length);
        };
        const aScore = getScore(aName, aDisplay, aFamily);
        const bScore = getScore(bName, bDisplay, bFamily);
        if (aScore !== bScore) return aScore - bScore;
        return Math.abs(aName.length - s.length) - Math.abs(bName.length - s.length);
      });
    }
    if (selectedTags.length === 0) return items;
    // Sort all models by number of matching tags (descending), but do not filter any out
    return [...items].map(item => ({
      ...item,
      tagScore: item.tags ? selectedTags.filter(tag => item.tags.includes(tag)).length : 0
    })).sort((a, b) => b.tagScore - a.tagScore);
  };

  // Determine which model is selected
  let effectiveSelectedModel = selectedModel
  if (!effectiveSelectedModel) {
    if (defaultModel) {
      effectiveSelectedModel = models.find(m => m.name === defaultModel)
    }
    if (!effectiveSelectedModel) {
      effectiveSelectedModel = models.find(m => m.name === 'gemini-2.0-flash-lite')
    }
  }

  const filteredItems = filterModels(sortedItems, search, selectedTags);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Pick the first unlocked model from filteredItems (sorted by best match)
      const unlocked = filteredItems.filter(i => !i.isBlocked);
      if (unlocked.length > 0 && onModelSelect) {
        onModelSelect(unlocked[0]);
      }
    }
  };

  return (
    <div className={cn('flex justify-center w-full bg-transparent', className)} style={{ position: 'relative' }}>
      <div className='flex flex-col items-center w-full'>
        {useOwnKey && (
          <div className={`w-full max-w-2xl flex items-center gap-2 px-5 py-3 mb-4 rounded-xl border border-[#ececec] dark:border-[#232228] bg-white/70 dark:bg-zinc-900/60 shadow`}
               style={{ color: '#232228', fontWeight: 600, fontSize: '1rem' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 text-[#DC749E] dark:text-[#F9B4D0]"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
            <span className='flex-1 text-left text-[#232228] dark:text-[#ececec]'>Using your own OpenRouter API key. All models are available.</span>
          </div>
        )}
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[70vh] max-w-[1400px] overflow-y-auto ${styles.ModelSelectionScrollbar} px-4 mt-6`}>
        {(!user || user.status !== 'premium') && (
        <div className='col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 mb-2'>
              <div className='backdrop-blur-xl bg-white/60 dark:bg-zinc-900/60 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between px-8 py-8 min-h-[120px] pointer-events-auto'>
                <div className='flex flex-col items-start w-full sm:w-auto mb-4 sm:mb-0'>
                  <span className='text-2xl font-bold text-zinc-900 dark:text-zinc-100'>Subscription</span>
                  <span className='text-lg text-zinc-700 dark:text-zinc-300 mt-1'>9$ to access all models</span>
                </div>
                <div className='flex flex-col items-end w-full sm:w-auto'>
                  <Button
                    className='text-base font-semibold px-8 py-3 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'
                    onClick={() => navigate('/settings', { state: { selectedTab: 'Subscription' } })}
                  >
                    Subscribe
                  </Button>
                  <span className='text-sm text-zinc-600 dark:text-zinc-400 mt-2 self-end'>9$/month</span>
                </div>
              </div>
            </div>
        )}
        <div className={`col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 mb-2 flex justify-start ${user && user.status === 'premium' ? 'mt-10' : 'mt-6'}`}>
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
        {/* Tag selection UI */}
        <div className={`col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 mb-2 flex flex-wrap gap-2 items-center`}>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={cn(
                'px-3 py-1 rounded-full border text-xs font-semibold transition',
                selectedTags.includes(tag)
                  ? 'bg-primary text-primary-foreground border-primary shadow'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 hover:bg-primary/10 dark:hover:bg-primary/20'
              )}
              style={{ outline: 'none' }}
              tabIndex={0}
              aria-pressed={selectedTags.includes(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
            {filteredItems.map((item) => (
              <ModelCard
                key={item.name}
                item={item}
                selectedModel={effectiveSelectedModel}
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