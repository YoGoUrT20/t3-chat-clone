import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Share2, Copy, GitBranch } from 'lucide-react';
import Tooltip from './Tooltip';
import { models } from '../models';
import { createPortal } from 'react-dom';
import RerollDropdown from './RerollDropdown';
import styles from './ModelSelection.module.css';
import LiquidGlassButton from './LiquidGlassButton';
import Dropdown from './Dropdown';
import { Button } from './ui/button';
import { useClickAway } from '../hooks/use-click-away';
import { useAuth } from '../AuthContext';

function ActionButtons({
  msg,
  idx,
  lastLlmMsgId,
  isTemporaryChat,
  branchDropdownOpen,
  setBranchDropdownOpen,
  branchDropdownRef,
  branchOptions,
  selectedBranchId,
  setSelectedBranchId,
  branchLoading,
  handleCreateBranch,
  handleShare,
  handleCopy,
  tooltip,
  showTooltip,
  hideTooltip,
  onReroll
}) {
  const { user } = useAuth();
  const useOwnKey = localStorage.getItem('use_own_api_key') === 'true';
  const [rerollDropdownOpen, setRerollDropdownOpen] = useState(false);
  const rerollBtnRef = useRef(null);
  const branchBtnRef = useRef(null);
  const branchDropdownDivRef = useRef(null);
  const [branchDropdownPos, setBranchDropdownPos] = useState({ left: 0, top: 0, width: 180, opacity: 0, transformOrigin: 'top' });

  // Prepare items for Dropdown
  const filteredModels = models.filter(model => {
    if (useOwnKey) {
      return true;
    }
    const status = user?.status || 'free';
    if (status === 'premium') {
      return !model.apiKeyRequired;
    }
    return model.freeAccess;
  });

  const currentModel = filteredModels.find(m => m.name === msg.model);
  const otherModels = filteredModels.filter(m => m.name !== msg.model);
  const dropdownItems = (currentModel ? [currentModel, ...otherModels] : filteredModels).map(m => ({ code: m.name, name: m.displayName || m.name, apiKeyRequired: m.apiKeyRequired }));

  React.useEffect(() => {
    if (rerollDropdownOpen || branchDropdownOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [rerollDropdownOpen, branchDropdownOpen]);

  useEffect(() => {
    if (branchDropdownOpen && branchDropdownDivRef.current && branchBtnRef.current) {
      const dropdownEl = branchDropdownDivRef.current;
      const btnRect = branchBtnRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownEl.offsetHeight;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const minMargin = 8;
      
      let top, transformOrigin;
      const spaceBelow = viewportHeight - btnRect.bottom;
      const spaceAbove = btnRect.top;

      if (spaceBelow < dropdownHeight + minMargin && spaceAbove > dropdownHeight) {
        // Open above
        top = btnRect.top - dropdownHeight - 4;
        transformOrigin = 'bottom';
      } else {
        // Open below
        top = btnRect.bottom + 4;
        transformOrigin = 'top';
      }
      
      let left = btnRect.left;
      let width = Math.max(btnRect.width, 180);

      if (left + width > viewportWidth - minMargin) {
        left = viewportWidth - width - minMargin;
      }
      if (left < minMargin) {
        left = minMargin;
      }

      setBranchDropdownPos({
        left,
        top,
        width,
        transformOrigin,
        opacity: 1,
      });
    }
  }, [branchDropdownOpen]);

  // Recalculate dropdown position after render in case dropdown height changes
  useEffect(() => {
    if (branchDropdownOpen && branchDropdownDivRef.current && branchBtnRef.current) {
      const dropdownEl = branchDropdownDivRef.current;
      const btnRect = branchBtnRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownEl.offsetHeight;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const minMargin = 8;

      let top, transformOrigin;
      const spaceBelow = viewportHeight - btnRect.bottom;
      const spaceAbove = btnRect.top;

      if (spaceBelow < dropdownHeight + minMargin && spaceAbove > dropdownHeight) {
        // Open above
        top = btnRect.top - dropdownHeight - 4;
        transformOrigin = 'bottom';
      } else {
        // Open below
        top = btnRect.bottom + 4;
        transformOrigin = 'top';
      }

      let left = btnRect.left;
      let width = Math.max(btnRect.width, 180);

      if (left + width > viewportWidth - minMargin) {
        left = viewportWidth - width - minMargin;
      }
      if (left < minMargin) {
        left = minMargin;
      }

      setBranchDropdownPos(pos => {
        // Only update if changed
        if (
          pos.left !== left ||
          pos.top !== top ||
          pos.width !== width ||
          pos.transformOrigin !== transformOrigin
        ) {
          return {
            ...pos,
            left,
            top,
            width,
            transformOrigin,
            opacity: 1,
          };
        }
        return pos;
      });
    }
  }, [branchDropdownOpen, branchOptions.length]);

  // Close branch dropdown on click-away
  useClickAway(
    [branchDropdownDivRef, branchBtnRef],
    () => {
      if (branchDropdownOpen && !isTemporaryChat) setBranchDropdownOpen(null);
    }
  );

  const handleRerollBtnClick = () => {
    setRerollDropdownOpen(true);
  };

  const handleBranchBtnClick = () => {
    const branchId = msg.id || msg.messageId;
    if (branchDropdownOpen === branchId) {
      setBranchDropdownOpen(null);
      return;
    }
    if (branchBtnRef.current) {
      const rect = branchBtnRef.current.getBoundingClientRect();
      setBranchDropdownPos({
        left: rect.left,
        top: rect.bottom + 4,
        width: Math.max(rect.width, 180),
        opacity: 0,
      });
    }
    setBranchDropdownOpen(branchId);
  };

  return (
    <div>
      <div className='flex gap-1 mt-2 ml-10 relative'>
        <button
          ref={rerollBtnRef}
          className='p-2 rounded-lg hover:bg-[#332940] transition'
          onClick={handleRerollBtnClick}
          onMouseEnter={e => showTooltip(e, 'Reroll answer')}
          onMouseLeave={hideTooltip}
          type='button'
        >
          <RefreshCw size={16} className='text-[#BFB3CB]' />
        </button>
        {rerollDropdownOpen && createPortal(
          <div
            id='reroll-model-dropdown'
            style={{ pointerEvents: 'auto' }}
          >
            <RerollDropdown
              items={dropdownItems}
              value={msg.model}
              onChange={modelCode => {
                setRerollDropdownOpen(false);
                const modelObj = models.find(m => m.name === modelCode);
                const modelToSend = modelObj?.openRouterName || modelCode;
                if (onReroll) onReroll(msg, modelToSend);
              }}
              anchorRef={rerollBtnRef}
              isOpen={rerollDropdownOpen}
              setIsOpen={setRerollDropdownOpen}
            />
          </div>,
          document.body
        )}
        <button
          className='p-2 rounded-lg hover:bg-[#332940] transition'
          onClick={isTemporaryChat ? (e) => { e.preventDefault(); } : handleShare}
          onMouseEnter={e => showTooltip(e, isTemporaryChat ? 'Sharing is disabled for temporary chats' : 'Share')}
          onMouseLeave={hideTooltip}
        >
          <Share2 size={16} className='text-[#BFB3CB]' />
        </button>
        <button className='p-2 rounded-lg hover:bg-[#332940] transition' onClick={() => handleCopy(msg.content || msg.text)}
          onMouseEnter={e => showTooltip(e, 'Copy message')}
          onMouseLeave={hideTooltip}
        > <Copy size={16} className='text-[#BFB3CB]' /> </button>
        <button
          ref={branchBtnRef}
          className='p-2 rounded-lg hover:bg-[#332940] transition'
          onClick={isTemporaryChat ? (e) => { e.preventDefault(); } : handleBranchBtnClick}
          onMouseEnter={e => showTooltip(e, isTemporaryChat ? 'Branching is disabled for temporary chats' : 'New branch or select branch')}
          onMouseLeave={hideTooltip}
          type='button'
        >
          <GitBranch size={16} className='text-[#BFB3CB]' />
        </button>
        {!isTemporaryChat && branchDropdownOpen === (msg.id || msg.messageId) && createPortal(
          <div
            ref={branchDropdownDivRef}
            id='branch-dropdown'
            className={styles.liquidGlassBg}
            style={{
              position: 'fixed',
              left: branchDropdownPos.left,
              top: branchDropdownPos.top,
              zIndex: 1000,
              minWidth: branchDropdownPos.width,
              maxWidth: 320,
              borderRadius: 12,
              padding: 8,
              transformOrigin: branchDropdownPos.transformOrigin || 'top',
              opacity: branchDropdownPos.opacity,
              transition: 'opacity 0.1s ease-in-out',
            }}
          >
            <div className='mb-2 text-xs text-[#BFB3CB] font-semibold'>Switch branch</div>
            <Dropdown
              items={branchOptions.map(opt => ({ code: opt.id, name: opt.label }))}
              value={selectedBranchId}
              onChange={val => { setSelectedBranchId(val); setBranchDropdownOpen(null); }}
              placeholder='Select branch'
              hideChevron={false}
              dropdownZIndex={1100}
              onClose={() => setBranchDropdownOpen(null)}
            />
            <Button
              className={`w-full mt-1 font-semibold text-xs h-10 ${styles.liquidGlassCard}`}
              style={{ color: '#F4E9EE', background: 'transparent' }}
              onClick={() => { handleCreateBranch(msg.id || msg.messageId, idx); setBranchDropdownOpen(null); }}
              disabled={branchLoading}
              variant='outline'
            >Create new branch from here</Button>
          </div>,
          document.body
        )}
        {tooltip.visible && tooltip.text && (
          <Tooltip x={tooltip.x} y={tooltip.y} text={tooltip.text} />
        )}
      </div>
    </div>
  );
}

export default ActionButtons; 