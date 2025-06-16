import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import SidePanel from './components/SidePanel';
import MainContent from './components/MainContent';
import { AuthProvider } from './AuthContext';
import AuthPage from './components/AuthPage';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import SecurityPolicy from './components/SecurityPolicy';
import SettingsSubscriptionPage from './components/SettingsSubscriptionPage';
import SharedChatPage from './components/SharedChatPage';
import FAQSupport from './components/FAQSupport';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

function AppWithRouter() {
  const [resetKey, setResetKey] = useState(0);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 960);
  const location = useLocation();

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 960) setShowSidebar(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  return (
    <AuthProvider>
      <Toaster />
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
    <>
      <div style={{ height: '15px', width: '100%', background: 'transparent' }} />
      <Router>
        <AppWithRouter />
      </Router>
    </>
  );
}
