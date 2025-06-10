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
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

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

  // Listen for t3-new-chat event and expose window.t3NewChat
  React.useEffect(() => {
    window.t3NewChat = () => { window.t3PendingReset = true; };
    const listener = () => { window.t3PendingReset = true; };
    window.addEventListener('t3-new-chat', listener);
    return () => {
      window.removeEventListener('t3-new-chat', listener);
      delete window.t3NewChat;
    };
  }, []);

  // Watch for location change to '/' and pending reset
  React.useEffect(() => {
    if (location.pathname === '/' && window.t3PendingReset) {
      setResetKey(prev => prev + 1);
      window.t3PendingReset = false;
    }
  }, [location]);

  return (
    <AuthProvider>
      <Toaster />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/security-policy" element={<SecurityPolicy />} />
        <Route path="/settings" element={<SettingsSubscriptionPage />} />
        <Route path="/chat/:id" element={
          <div className="main-bg text-white flex h-screen overflow-hidden">
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
          </div>
        } />
        <Route path="/" element={
          <div className="main-bg text-white flex h-screen overflow-hidden">
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
          </div>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <Router>
      <AppWithRouter />
    </Router>
  );
}
