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
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

function SidePanel({ onReset, visible, setVisible }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [searchValue, setSearchValue] = useState('');
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (windowWidth <= 960) return null;

  function NavItem({ to, icon: Icon, children }) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Button
            variant='ghost'
            className='flex items-center px-3 py-2 text-sm rounded-md transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1F1F23] w-full justify-start'
            onClick={() => navigate(to)}
          >
            <Icon className='h-4 w-4 mr-3 flex-shrink-0' />
            {children}
          </Button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // Tooltip handlers for message items
  const showTooltip = (e, text) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top,
      text,
    });
  };
  const hideTooltip = () => {
    setTooltip({ visible: false, x: 0, y: 0, text: '' });
  };

  // Message data
  const groupedMessages = [
    {
      label: 'Today',
      messages: [
        'How do I integrate the new payment API with my existing workflow?',
        'Show me a summary of the last quarter\'s analytics results.',
      ],
    },
    {
      label: 'Yesterday',
      messages: [
        'Can you help me debug this error: Unexpected token in JSON at position 10?',
        'What are the best practices for securing user authentication?',
      ],
    },
    {
      label: 'Earlier',
      messages: [
        'Explain the difference between useEffect and useLayoutEffect in React.',
        'How do I deploy a Next.js app to Vercel with environment variables?',
      ],
    },
  ];

  // Filtered messages by search
  const filteredGroups = searchValue.trim()
    ? groupedMessages
        .map(group => ({
            ...group,
            messages: group.messages.filter(msg =>
              msg.toLowerCase().includes(searchValue.trim().toLowerCase())
            ),
        }))
        .filter(group => group.messages.length > 0)
    : groupedMessages;
  const hasResults = filteredGroups.length > 0;

  return (
    <SidebarProvider defaultOpen={visible}>
      <Sidebar>
        <SidebarHeader>
          <Button onClick={onReset} className='w-full flex items-center justify-center gap-2 py-3'>
            <img src='/quiver.svg' alt='Quiver Logo' width={28} height={28} className='mr-2' style={{ display: 'inline-block' }} />
            <span className='text-xl font-bold tracking-tight text-gray-900 dark:text-white' style={{ position: 'relative', top: '5px' }}>Quiver</span>
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <div className='relative flex items-center px-2 py-2'>
            <Search size={16} className='text-gray-500 dark:text-gray-300 absolute left-3 pointer-events-none' />
            <SidebarInput
              placeholder='Search your threads...'
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              className='pl-9 pr-9 flex-1 text-white custom-no-outline'
              style={{ background: 'transparent', caretColor: '#fff', color: '#fff' }}
            />
            {searchValue && (
              <button
                type='button'
                onClick={() => setSearchValue('')}
                aria-label='Clear search'
                className='absolute right-3 p-1 rounded hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors'
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              >
                <span className='text-gray-500 dark:text-gray-300'>&#215;</span>
              </button>
            )}
          </div>
          <div className='h-0.5 w-7/12 bg-gray-200 dark:bg-[#28242A] my-1 mx-auto' />
          <div className='space-y-6 mt-4'>
            {hasResults ? (
              filteredGroups.map(group => (
                <SidebarGroup key={group.label}>
                  <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                  <SidebarMenu>
                    {group.messages.map((msg, idx) => (
                      <SidebarMenuItem key={msg}>
                        <SidebarMenuButton asChild>
                          <Button
                            variant='ghost'
                            className='flex items-center px-3 py-2 text-sm rounded-md transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1F1F23] w-full justify-start overflow-hidden text-ellipsis'
                            style={{ maxWidth: '100%' }}
                            onMouseEnter={e => showTooltip(e, msg)}
                            onMouseLeave={hideTooltip}
                          >
                            <MessagesSquare className='h-4 w-4 mr-3 flex-shrink-0' />
                            <span className='truncate max-w-[160px] text-left'>
                              {msg}
                            </span>
                          </Button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroup>
              ))
            ) : (
              <div className='text-center text-gray-500 dark:text-gray-400 py-8'>No results found.</div>
            )}
          </div>
        </SidebarContent>
        {tooltip.visible && tooltip.text && (
          <div
            style={{
              position: 'fixed',
              left: tooltip.x + 16,
              top: tooltip.y + 20,
              transform: 'translateY(-50%)',
              zIndex: 50,
              pointerEvents: 'none',
            }}
            className='px-2 py-1 rounded bg-zinc-900 text-white text-xs shadow-lg border border-zinc-700 select-none'
          >
            {tooltip.text}
          </div>
        )}
        <SidebarFooter>
          <SidebarGroup>
            <SidebarMenu>
              {user && (
                <NavItem to='/settings/customization' icon={Settings}>Settings</NavItem>
              )}
              <NavItem to='/privacy-policy#contact' icon={HelpCircle}>Help</NavItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarFooter>
        <div className='mt-auto pb-4 px-2'>
          {user ? (
            <Button
              variant='ghost'
              className='flex items-center gap-3 p-2 justify-start pl-2 hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors'
              onClick={() => navigate('/settings/subscription')}
            >
              <img
                alt={user.displayName}
                className='w-8 h-8 rounded-full border border-gray-300 dark:border-[#3B3337]'
                src={user.photoURL}
              />
              <div className='flex flex-col items-start'>
                <span className='font-medium text-sm text-gray-900 dark:text-white'>{user.displayName}</span>
                <span className='text-xs text-gray-500 dark:text-gray-400'>Free</span>
              </div>
            </Button>
          ) : loading ? null : (
            <Button
              variant='ghost'
              className='flex items-center gap-3 p-2 justify-start pl-2 hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors'
              onClick={() => navigate('/auth')}
            >
              <span className='w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#19171D]'>
                <LogIn size={16} className='text-gray-500 dark:text-gray-300' />
              </span>
              <div className='flex flex-col items-start'>
                <span className='font-medium text-sm text-gray-900 dark:text-gray-300'>Login</span>
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