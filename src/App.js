import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import ChatPanel from './components/ChatPanel';
import MainContent from './components/MainContent';
import { AuthProvider } from './AuthContext';
import AuthPage from './components/AuthPage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  const [resetKey, setResetKey] = useState(0);

  const handleReset = () => {
    setResetKey(prev => prev + 1);
  };

  return (
    <AuthProvider>
      <Router>
        <Toaster />
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
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
              <ChatPanel onReset={handleReset} />
              <MainContent key={resetKey} />
            </div>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
