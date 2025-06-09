import React from 'react';

function TosNavbar() {
  return (
    <nav className="fixed top-0 left-0 w-full h-16 bg-[#21141E]/[0.98] flex items-center justify-between px-4 z-50">
      <a href="/" className="font-bold text-2xl tracking-wide">Quiver AI</a>
      <div className="flex gap-4 text-sm text-[#F9F8FB]">
        <a href="/terms-of-service" className="cursor-pointer">Terms of Service</a>
        <a href="/privacy-policy" className="cursor-pointer">Privacy Policy</a>
        <a href="/security-policy" className="cursor-pointer">Security Policy</a>
      </div>
    </nav>
  );
}

export default TosNavbar; 