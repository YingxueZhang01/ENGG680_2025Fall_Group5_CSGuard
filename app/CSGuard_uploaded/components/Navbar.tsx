import React, { useState, useEffect } from 'react';
import { ShieldAlert, Bell, Maximize, Minimize, Key } from 'lucide-react';

interface NavbarProps {
  onOpenKeySettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenKeySettings }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    const doc = document.documentElement as any;
    if (!document.fullscreenElement) {
      if (doc.requestFullscreen) {
        doc.requestFullscreen();
      } else if (doc.mozRequestFullScreen) { /* Firefox */
        doc.mozRequestFullScreen();
      } else if (doc.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        doc.webkitRequestFullscreen();
      } else if (doc.msRequestFullscreen) { /* IE/Edge */
        doc.msRequestFullscreen();
      }
    } else {
      const docEl = document as any;
      if (docEl.exitFullscreen) {
        docEl.exitFullscreen();
      } else if (docEl.mozCancelFullScreen) {
        docEl.mozCancelFullScreen();
      } else if (docEl.webkitExitFullscreen) {
        docEl.webkitExitFullscreen();
      } else if (docEl.msExitFullscreen) {
        docEl.msExitFullscreen();
      }
    }
  };

  return (
    <nav className="h-16 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6 shrink-0 z-50">
      <div className="flex items-center gap-3">
        <div className="bg-yellow-500 p-2 rounded-lg">
          <ShieldAlert className="text-slate-900 w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">CSP-Desktop</h1>
          <p className="text-xs text-slate-400">Construction Safety Project V1.0</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
          System Online
        </span>
        
        {/* API Key Setting Button */}
        <button 
          onClick={onOpenKeySettings}
          className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-white"
          title="Configure API Key"
        >
          <Key className="w-5 h-5" />
        </button>

        <button 
          onClick={toggleFullscreen}
          className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-white"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>

        <button className="p-2 hover:bg-slate-800 rounded-full transition-colors relative">
          <Bell className="w-5 h-5 text-slate-300" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </nav>
  );
};