import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import SidePanel from './components/SidePanel';
import MainContent from './components/MainContent';
import { AuthProvider } from './AuthContext';
import AuthPage from './components/AuthPage';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import SecurityPolicy from './components/SecurityPolicy';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  const [resetKey, setResetKey] = useState(0);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 960);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 960) setShowSidebar(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleReset = () => {
    setResetKey(prev => prev + 1);
  };

  // Listen for t3-new-chat event and expose window.t3NewChat
  React.useEffect(() => {
    window.t3NewChat = handleReset;
    const listener = () => handleReset();
    window.addEventListener('t3-new-chat', listener);
    return () => {
      window.removeEventListener('t3-new-chat', listener);
      delete window.t3NewChat;
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Toaster />
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/security-policy" element={<SecurityPolicy />} />
          <Route path="/" element={
            <div className="main-bg text-white flex h-screen overflow-hidden">
              <style jsx>{`
                .animate-scale-in {
                  animation: scaleIn 0.3s ease-out;
                }
                @keyframes scaleIn {
                  from { transform: scale(0.97); opacity: 0.3; }
                  to { transform: scale(1); opacity: 1; }
                }
              `}</style>
              <SidePanel onReset={handleReset} visible={showSidebar} setVisible={setShowSidebar} />
              <MainContent key={resetKey} showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
            </div>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
