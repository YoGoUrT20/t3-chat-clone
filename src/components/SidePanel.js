import React, { useState, useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInput
} from './ui/sidebar';
import { Button } from './ui/button';
import {
  MessagesSquare,
  Settings,
  HelpCircle,
  Search,
  LogIn,
  BadgeCheck,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import Tooltip from './Tooltip';
import { motion, AnimatePresence } from 'framer-motion';

function SidePanel({ onReset, visible, setVisible }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [searchValue, setSearchValue] = useState('');
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '', model: '' });
  const [conversations, setConversations] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const searchInputRef = React.useRef(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoadingConvos(false);
      return;
    }
    const db = getFirestore();
    const q = query(
      collection(db, 'conversations'),
      where('userId', '==', user.uid),
      orderBy('lastUsed', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const convos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setConversations(convos);
      setLoadingConvos(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const handler = () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };
    window.addEventListener('enable-search-tool', handler);
    return () => window.removeEventListener('enable-search-tool', handler);
  }, []);

  if (windowWidth <= 960) return null;

  function NavItem({ to, icon: Icon, children }) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Button
            variant='ghost'
            className='flex items-center px-3 py-2 text-sm rounded-md transition-colors text-gray-300 hover:text-white hover:bg-[#1F1F23] w-full justify-start'
            onClick={() => navigate(to)}
          >
            <Icon className='h-4 w-4 mr-3 flex-shrink-0' />
            {children}
          </Button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // Helper to check if any of the text spans is truncated
  function isAnyTruncated(container) {
    if (!container) return false;
    const nameEl = container.querySelector('.chat-title-name');
    const modelEl = container.querySelector('.chat-title-model');
    return (nameEl && nameEl.scrollWidth > nameEl.clientWidth) || (modelEl && modelEl.scrollWidth > modelEl.clientWidth);
  }

  // Tooltip handlers for message items
  const showTooltip = (e, text, conv) => {
    if (isAnyTruncated(e.currentTarget)) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({
        visible: true,
        x: rect.left + rect.width / 2,
        y: rect.top,
        text: conv?.name || conv?.messages?.[0]?.content || 'Conversation',
        model: conv?.modelDisplayName || '',
      });
    }
  };
  const hideTooltip = () => {
    setTooltip({ visible: false, x: 0, y: 0, text: '', model: '' });
  };

  // Filtered conversations by search
  const filteredConvos = searchValue.trim()
    ? conversations.filter(conv => {
        const search = searchValue.trim().toLowerCase();
        return (
          (conv.name || '').toLowerCase().includes(search) ||
          (conv.modelDisplayName || '').toLowerCase().includes(search) ||
          (conv.messages?.[0]?.content || '').toLowerCase().includes(search)
        );
      })
    : conversations.slice(0, 100);
  const hasResults = filteredConvos.length > 0;

  // Group conversations by date
  function groupConversations(convos) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    const groups = { Today: [], Yesterday: [], Earlier: [] };
    convos.forEach(conv => {
      let last = conv.lastUsed;
      if (last && typeof last.toDate === 'function') last = last.toDate();
      else if (typeof last === 'string') last = new Date(last);
      else if (!(last instanceof Date)) last = new Date();
      if (isSameDay(last, today)) groups.Today.push(conv);
      else if (isSameDay(last, yesterday)) groups.Yesterday.push(conv);
      else groups.Earlier.push(conv);
    });
    return groups;
  }
  const grouped = groupConversations(filteredConvos);

  // Helper to truncate text to a single line with ellipsis
  function truncate(text, max = 40) {
    if (!text) return '';
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
  }

  return (
    <SidebarProvider defaultOpen={visible}>
      <Sidebar>
        <SidebarHeader>
          <Button onClick={() => { window.pendingReset = true; navigate('/', { replace: true }); }} className='w-full flex items-center justify-center gap-1 py-2 mt-6 -ml-6'>
            <img src='/quiver.svg' alt='Quiver Logo' width={28} height={28} />
            <span className='text-xl font-bold tracking-tight text-white'>Quiver</span>
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <style>{`
            /* Hide scrollbar for Chrome, Safari and Opera */
            [data-sidebar="content"]::-webkit-scrollbar {
              display: none;
            }
            /* Hide scrollbar for IE, Edge and Firefox */
            [data-sidebar="content"] {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          <div className='bg-transparent'>
            <div className='flex flex-col items-center px-2 py-2'>
              <div className='relative w-11/12 max-w-xs'>
                <Search size={16} className='text-gray-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none' />
                <SidebarInput
                  ref={searchInputRef}
                  placeholder='Search your conversations...'
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  className='pl-9 pr-9 text-white custom-no-outline w-full'
                  style={{ background: 'transparent', caretColor: '#fff', color: '#fff' }}
                />
                {searchValue && (
                  <button
                    type='button'
                    onClick={() => setSearchValue('')}
                    aria-label='Clear search'
                    className='absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#1F1F23] transition-colors'
                  >
                    <span className='text-gray-300'>&#215;</span>
                  </button>
                )}
              </div>
            </div>
            <div className='h-0.5 w-7/12 bg-[#28242A] my-1 mx-auto' />
          </div>
          <div className='space-y-6 mt-4'>
            {!user ? null : loadingConvos ? (
              <div className='text-center text-gray-400 py-8'>Loading...</div>
            ) : hasResults ? (
              <>
                {['Today', 'Yesterday', 'Earlier'].map(label =>
                  grouped[label].length > 0 && (
                    <SidebarGroup key={label}>
                      <SidebarGroupLabel>{label}</SidebarGroupLabel>
                      <SidebarMenu>
                        {grouped[label].map((conv) => (
                          <SidebarMenuItem key={conv.id}>
                            <SidebarMenuButton asChild>
                              <Button
                                variant='ghost'
                                className='flex items-center px-3 py-2 text-sm rounded-md transition-colors text-gray-300 hover:text-white hover:bg-[#1F1F23] w-full justify-start overflow-hidden text-ellipsis'
                                style={{ maxWidth: '100%' }}
                                onMouseEnter={e => showTooltip(e, conv.messages?.[0]?.content || 'Conversation', conv)}
                                onMouseLeave={hideTooltip}
                                onClick={() => navigate(`/chat/${conv.id}`)}
                              >
                                <MessagesSquare className='h-4 w-4 mr-3 flex-shrink-0' />
                                <span className='truncate text-left chat-title-name' style={{ width: 120, display: 'inline-block' }}>
                                <AnimatePresence mode='wait' initial={false}>
                                  <motion.span
                                    key={conv.name || conv.messages?.[0]?.content || 'Conversation'}
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{ duration: 0.22 }}
                                    style={{
                                      display: 'inline-block',
                                      width: '100%',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {truncate(conv.name || conv.messages?.[0]?.content || 'Conversation', 40)}
                                  </motion.span>
                                </AnimatePresence>
                                </span>
                                <span className='text-xs text-gray-500 truncate chat-title-model text-right' style={{ width: 80, display: 'inline-block', marginLeft: 8 }}>
                                  {truncate(conv.modelDisplayName || '', 20)}
                                </span>
                              </Button>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroup>
                  )
                )}
              </>
            ) : (
              <div className='text-center text-gray-400 py-8'>No results found.</div>
            )}
          </div>
        </SidebarContent>
        {tooltip.visible && tooltip.text && (
          <Tooltip x={tooltip.x + 16} y={tooltip.y + 20} text={tooltip.text} model={tooltip.model} />
        )}
        <SidebarFooter>
          <SidebarGroup>
            <SidebarMenu>
              {user && (
                <NavItem to='/settings' icon={Settings}>Settings</NavItem>
              )}
              <NavItem to='/faq-support' icon={HelpCircle}>Help</NavItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarFooter>
        <div className='mt-auto pb-4 px-2' style={{ marginBottom: '20px' }}>
          {user ? (
            <Button
              variant='ghost'
              className='flex items-center gap-3 py-3 w-full justify-start hover:bg-[#1F1F23] transition-colors'
              style={{paddingLeft: 0, paddingRight: 0, minHeight: 52}}
              onClick={() => navigate('/settings')}
            >
              <img
                alt={user.displayName}
                className='w-10 h-10 rounded-full border border-[#3B3337] ml-2'
                src={user.photoURL}
                onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/default-avatar.png'; }}
              />
              <div className='flex flex-col items-start ml-2 justify-center'>
                <span className='font-medium text-base text-white'>{user.displayName}</span>
                {user.status === 'premium' ? (
                  <span className='text-xs flex items-center gap-1 text-[#DC749E] font-bold'><BadgeCheck size={14} />Premium</span>
                ) : (
                  <span className='text-xs text-gray-400'>Free</span>
                )}
              </div>
            </Button>
          ) : loading ? null : (
            <Button
              variant='ghost'
              className='flex items-center gap-3 py-3 w-full justify-start hover:bg-[#1F1F23] transition-colors'
              style={{paddingLeft: 0, paddingRight: 0, minHeight: 52}}
              onClick={() => navigate('/auth')}
            >
              <span className='w-10 h-10 flex items-center justify-center rounded-full bg-[#19171D] ml-2'>
                <LogIn size={18} className='text-gray-300' />
              </span>
              <div className='flex flex-col items-start ml-2 justify-center'>
                <span className='font-medium text-base text-gray-300'>Login</span>
              </div>
            </Button>
          )}
        </div>
      </Sidebar>
      <style>{`
      .custom-no-outline,
      .custom-no-outline:focus,
      .custom-no-outline:focus-visible {
        outline: none !important;
        box-shadow: none !important;
        border-color: transparent !important;
      }
      `}</style>
    </SidebarProvider>
  );
}

export default SidePanel; 