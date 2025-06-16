import React, { useState, useRef } from 'react';
import { RefreshCw, Share2, Copy, GitBranch } from 'lucide-react';
import Tooltip from './Tooltip';
import { DropdownControlled } from './Dropdown';
import { models } from '../models';
import { createPortal } from 'react-dom';

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
  const [rerollDropdownOpen, setRerollDropdownOpen] = useState(false);
  const rerollBtnRef = useRef(null);
  const branchBtnRef = useRef(null);
  const [branchDropdownPos, setBranchDropdownPos] = useState({ left: 0, top: 0, width: 180 });

  // Prepare items for Dropdown
  const currentModel = models.find(m => m.name === msg.model);
  const otherModels = models.filter(m => m.name !== msg.model);
  const dropdownItems = (currentModel ? [currentModel, ...otherModels] : models).map(m => ({ code: m.name, name: m.displayName || m.name, apiKeyRequired: m.apiKeyRequired }));

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (rerollDropdownOpen) {
        const dropdown = document.getElementById('reroll-model-dropdown');
        if (
          dropdown && !dropdown.contains(event.target) &&
          rerollBtnRef.current && !rerollBtnRef.current.contains(event.target)
        ) {
          setRerollDropdownOpen(false);
        }
      }
      if (branchDropdownOpen) {
        const dropdown = document.getElementById('branch-dropdown');
        if (
          dropdown && !dropdown.contains(event.target) &&
          branchBtnRef.current && !branchBtnRef.current.contains(event.target)
        ) {
          setBranchDropdownOpen(null);
        }
      }
    }
    if (rerollDropdownOpen || branchDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [rerollDropdownOpen, branchDropdownOpen, setBranchDropdownOpen]);

  const handleRerollBtnClick = () => {
    setRerollDropdownOpen(true);
  };

  const handleBranchBtnClick = () => {
    if (branchBtnRef.current) {
      const rect = branchBtnRef.current.getBoundingClientRect();
      setBranchDropdownPos({
        left: rect.left,
        top: rect.bottom + 4,
        width: Math.max(rect.width, 180),
      });
    }
    setBranchDropdownOpen(msg.id || msg.messageId);
  };

  return (
    <div>
      <div className='flex gap-2 mt-2 ml-10 relative'>
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
            <DropdownControlled
              items={dropdownItems}
              value={msg.model}
              onChange={model => {
                setRerollDropdownOpen(false);
                if (onReroll) onReroll(msg, model);
              }}
              placeholder='Select model to reroll'
              isOpen={rerollDropdownOpen}
              setIsOpen={setRerollDropdownOpen}
              anchorRef={rerollBtnRef}
              hideButton={true}
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
            id='branch-dropdown'
            style={{
              position: 'fixed',
              left: branchDropdownPos.left,
              top: branchDropdownPos.top,
              zIndex: 1000,
              minWidth: branchDropdownPos.width,
              maxWidth: 320,
              background: '#2A222E',
              border: '1px solid #332940',
              borderRadius: 12,
              boxShadow: '0 8px 40px 0 rgba(32,27,37,0.25), 0 1.5px 8px 0 rgba(255,255,255,0.08) inset',
              padding: 8,
            }}
          >
            <div className='mb-2 text-xs text-[#BFB3CB] font-semibold'>Switch branch</div>
            <select
              className='w-full bg-[#2A222E] text-[#BFB3CB] rounded px-2 py-1 border border-[#332940] focus:outline-none mb-2'
              value={selectedBranchId}
              onChange={e => { setSelectedBranchId(e.target.value); setBranchDropdownOpen(null); }}
              disabled={branchLoading}
            >
              {branchOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
            <button
              className='w-full mt-1 px-2 py-1 rounded bg-[#4D1F39] text-[#F4E9EE] hover:bg-[#6A2B4D] transition font-semibold text-xs'
              onClick={() => { handleCreateBranch(msg.id || msg.messageId, idx); setBranchDropdownOpen(null); }}
              disabled={branchLoading}
            >Create new branch from here</button>
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