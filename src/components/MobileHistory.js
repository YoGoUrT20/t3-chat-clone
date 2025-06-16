import React from 'react';
import { useConversations } from '../hooks/use-conversations';
import { useIsMobile } from '../hooks/use-mobile';
import { Button } from './ui/button';
import { MessagesSquare, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function truncate(text, max = 40) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

export default function MobileHistory({ onSelectChat, topPadding = '1.5rem' }) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const {
    loadingConvos,
    searchValue,
    setSearchValue,
    groupedConvos,
    hasResults,
    user,
  } = useConversations();

  if (!isMobile) return null;
  if (!user) return null;

  return (
    <div className='w-full px-2' style={{ paddingTop: topPadding, paddingBottom: '1.5rem', background: '#18171a', minHeight: '100vh' }}>
      <button
        type='button'
        onClick={() => {
          navigate('/');
          if (onSelectChat) onSelectChat();
        }}
        className='flex items-center gap-2 px-4 py-3 font-semibold w-full mb-4 justify-center '
        style={{ minHeight: 48 }}
      >
        <PlusCircle className='h-5 w-5' />
        <span>New chat</span>
      </button>
      <div className='mb-4'>
        <input
          type='text'
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          placeholder='Search your conversations...'
          className='w-full px-4 py-2 rounded-lg border border-zinc-700 bg-[#232228] text-white focus:outline-none focus:ring-2 focus:ring-pink-400 text-base shadow-sm'
          autoComplete='off'
        />
      </div>
      {loadingConvos ? (
        <div className='text-center text-zinc-400 py-8'>Loading...</div>
      ) : hasResults ? (
        <div className='flex flex-col gap-4'>
          {['Today', 'Yesterday', 'Earlier'].map(label =>
            groupedConvos[label].length > 0 && (
              <div key={label}>
                <div className='text-xs font-semibold text-zinc-400 mb-2 px-1'>{label}</div>
                <div className='flex flex-col gap-2'>
                  {groupedConvos[label].map(conv => (
                    <Button
                      key={conv.id}
                      variant='ghost'
                      className='flex items-center px-3 py-3 rounded-lg text-base text-left gap-3 bg-[#232228] text-white hover:bg-[#28242A] transition-colors w-full justify-start'
                      style={{ minHeight: 56 }}
                      onClick={() => {
                        navigate(`/chat/${conv.id}`);
                        if (onSelectChat) onSelectChat();
                      }}
                    >
                      <MessagesSquare className='h-5 w-5 flex-shrink-0 text-pink-300' />
                      <span className='truncate' style={{ maxWidth: 160 }}>{truncate(conv.name || conv.messages?.[0]?.content || 'Conversation', 40)}</span>
                      <span className='text-xs text-zinc-400 ml-auto'>{truncate(conv.modelDisplayName || '', 20)}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <div className='text-center text-zinc-400 py-8'>No results found.</div>
      )}
    </div>
  );
} 