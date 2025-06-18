import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import SidePanel from './components/SidePanel';
import MainContent from './components/MainContent';
import { AuthProvider, useAuth } from './AuthContext';
import AuthPage from './components/AuthPage';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import SecurityPolicy from './components/SecurityPolicy';
import SettingsSubscriptionPage from './components/SettingsSubscriptionPage';
import SharedChatPage from './components/SharedChatPage';
import FAQSupport from './components/FAQSupport';
import SearchConversationsDialog from './components/SearchConversationsDialog';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react'
import { isMac, getModifierKey } from './lib/utils';

function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].toLowerCase() !== b[i].toLowerCase()) return false
  }
  return true
}

function getUserShortcuts() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  let shortcuts = user.shortcuts
  const modKey = getModifierKey();
  const defaultShortcuts = [
    { keys: [modKey, 'M'], description: 'Select a model' },
    { keys: ['alt', 'T'], description: 'Temp chat' },
    { keys: ['alt', 'N'], description: 'New Chat' },
    { keys: ['alt', 'S'], description: 'Web Search' },
    { keys: [modKey, 'F'], description: 'Search conversations' },
  ];
  if (!Array.isArray(shortcuts)) {
    shortcuts = defaultShortcuts;
  } else {
    // Ensure all default shortcuts are present (by description)
    for (const def of defaultShortcuts) {
      if (!shortcuts.some(s => s.description === def.description)) {
        shortcuts.push(def);
      }
    }
  }
  return shortcuts
}

function normalizeShortcutFromEvent(e) {
  let key = e.key
  if (key === 'Control') key = 'ctrl'
  if (key === 'Meta') key = 'meta'
  if (key === 'Alt') key = 'alt'
  if (key === 'Shift') key = 'shift'
  const isModifier = ['ctrl', 'alt', 'shift', 'meta'].includes(key)
  if (!isModifier) {
    let modifier = null
    if (isMac()) {
        if (e.metaKey) modifier = 'meta'
        else if (e.ctrlKey) modifier = 'ctrl'
        else if (e.altKey) modifier = 'alt'
        else if (e.shiftKey) modifier = 'shift'
    } else {
        if (e.ctrlKey) modifier = 'ctrl'
        else if (e.metaKey) modifier = 'meta'
        else if (e.altKey) modifier = 'alt'
        else if (e.shiftKey) modifier = 'shift'
    }

    if (modifier) {
      return [modifier, key]
    }
  }
  return null
}

function AppWithRouter() {
  const { user } = useAuth();
  const [resetKey, setResetKey] = useState(0);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 960);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const location = useLocation();

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 960) setShowSidebar(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    const handleGlobalShortcut = (e) => {
      // Don't trigger if a dialog is open (EditShortcutsDialog)
      if (document.querySelector('[data-radix-dialog-open]')) return
      // Disable shortcuts on /settings page
      if (location.pathname === '/settings') return
      const shortcut = normalizeShortcutFromEvent(e)
      if (!shortcut) return
      const userShortcuts = getUserShortcuts()
      for (const sc of userShortcuts) {
        if (arraysEqual(sc.keys, shortcut)) {
          e.preventDefault()
          if (sc.description === 'New Chat') {
            window.dispatchEvent(new Event('new-chat'))
            if (typeof window.navigateToRoot === 'function') {
              window.navigateToRoot()
            }
          } else if (sc.description === 'Temp chat') {
            window.dispatchEvent(new Event('temp-chat'))
          } else if (sc.description === 'Select a model') {
            window.dispatchEvent(new Event('select-model'))
          } else if (sc.description === 'Enable search tool' || sc.description === 'Web Search') {
            if (user && user.status === 'premium') {
              window.dispatchEvent(new Event('enable-search-tool'))
            } else {
              import('react-hot-toast').then(({ default: toast }) => {
                toast.error('Web search is available for premium users only')
              })
            }
          } else if (sc.description === 'Search conversations') {
            setSearchDialogOpen(true)
          }
          break
        }
      }
    }
    window.addEventListener('keydown', handleGlobalShortcut)
    return () => window.removeEventListener('keydown', handleGlobalShortcut)
  }, [location.pathname, user])

  React.useEffect(() => {
    window.navigateToRoot = () => {
      if (location.pathname !== '/') {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    };
    return () => { delete window.navigateToRoot; };
  }, [location]);

  // Listen for new-chat event and expose window.newChat
  React.useEffect(() => {
    window.newChat = () => { window.pendingReset = true; };
    const listener = () => { window.pendingReset = true; };
    window.addEventListener('new-chat', listener);
    return () => {
      window.removeEventListener('new-chat', listener);
      delete window.newChat;
    };
  }, []);

  // Watch for location change to '/' and pending reset
  React.useEffect(() => {
    if (location.pathname === '/' && window.pendingReset) {
      setResetKey(prev => prev + 1);
      window.pendingReset = false;
    }
  }, [location]);

  React.useEffect(() => {
    if (location.pathname !== '/settings') {
      localStorage.setItem('prev_path', location.pathname)
    }
  }, [location.pathname])

  // Apply customization settings globally
  React.useEffect(() => {
    function applyCustomization() {
      // Remove global font customization
      // Background
      const background = localStorage.getItem('chat_bg');
      if (background) {
        // Try to find a matching background option with a style
        try {
          const backgroundOptions = [
            { value: 'default', style: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)' },
            { value: 'model-glow', style: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)' },
            { value: 'glow-under', style: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)' },
          ];
          const bgObj = backgroundOptions.find(b => b.value === background);
          if (bgObj && bgObj.style) {
            document.body.style.background = bgObj.style;
          } else {
            document.body.style.background = '';
          }
        } catch {
          document.body.style.background = '';
        }
      } else {
        document.body.style.background = '';
      }
    }
    applyCustomization();
    // Listen for custom event to re-apply customization
    window.addEventListener('customization-changed', applyCustomization);
    // Also listen for storage changes (in case of multi-tab)
    window.addEventListener('storage', applyCustomization);
    return () => {
      window.removeEventListener('customization-changed', applyCustomization);
      window.removeEventListener('storage', applyCustomization);
    };
  }, []);

  return (
    <AuthProvider>
      <Toaster />
      <SearchConversationsDialog 
        open={searchDialogOpen} 
        onOpenChange={setSearchDialogOpen} 
      />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/security-policy" element={<SecurityPolicy />} />
        <Route path="/faq-support" element={<FAQSupport />} />
        <Route path="/settings" element={<SettingsSubscriptionPage />} />
        <Route path="/chat/:id" element={
          <motion.div
            className="main-bg text-white flex overflow-hidden"
            style={{ height: 'calc(100vh - 15px)' }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <style>{`
              .animate-scale-in {
                animation: scaleIn 0.3s ease-out;
              }
              @keyframes scaleIn {
                from { transform: scale(0.97); opacity: 0.3; }
                to { transform: scale(1); opacity: 1; }
              }
            `}</style>
            <SidePanel visible={showSidebar} setVisible={setShowSidebar} />
            <MainContent key={resetKey} showSidebar={showSidebar} setVisible={setShowSidebar} />
          </motion.div>
        } />
        <Route path="/" element={
          <motion.div
            className="main-bg text-white flex overflow-hidden"
            style={{ height: 'calc(100vh - 15px)' }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <style>{`
              .animate-scale-in {
                animation: scaleIn 0.3s ease-out;
              }
              @keyframes scaleIn {
                from { transform: scale(0.97); opacity: 0.3; }
                to { transform: scale(1); opacity: 1; }
              }
            `}</style>
            <SidePanel visible={showSidebar} setVisible={setShowSidebar} />
            <MainContent key={resetKey} showSidebar={showSidebar} setVisible={setShowSidebar} />
          </motion.div>
        } />
        <Route path="/shared/:id" element={
          <motion.div
            className="main-bg text-white flex overflow-hidden"
            style={{ height: 'calc(100vh - 15px)' }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <style>{`
              .animate-scale-in {
                animation: scaleIn 0.3s ease-out;
              }
              @keyframes scaleIn {
                from { transform: scale(0.97); opacity: 0.3; }
                to { transform: scale(1); opacity: 1; }
              }
            `}</style>
            <SidePanel visible={showSidebar} setVisible={setShowSidebar} />
            <SharedChatPage />
          </motion.div>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div style={{ height: '15px', width: '100%', background: 'transparent' }} />
      <Router>
        <AppWithRouter />
      </Router>
    </AuthProvider>
  );
}
