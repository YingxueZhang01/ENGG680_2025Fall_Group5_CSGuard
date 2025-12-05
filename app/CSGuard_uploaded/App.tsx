import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LiveMonitor } from './components/LiveMonitor';
import { LogsPanel } from './components/LogsPanel';
import { StatsDashboard } from './components/StatsDashboard';
import { SettingsPanel } from './components/SettingsPanel';
import { AppSettings, LogEntry } from './types';
import { Key } from 'lucide-react';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('monitor');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // === 1. API Key State Management ===
  const [showKeyInput, setShowKeyInput] = useState(false);
  
  // Check for Key, if missing prompt user
  useEffect(() => {
    const hasKey = localStorage.getItem("GEMINI_API_KEY") || localStorage.getItem("gemini_api_key") || process.env.API_KEY;
    if (!hasKey) {
      setShowKeyInput(true);
    }
  }, []);

  const [settings, setSettings] = useState<AppSettings>({
    detectionInterval: 2000,
    confidenceThreshold: 0.4,
    enableAudioAlerts: true,
    autoRecordEvidence: true,
    customModelName: null,
    cameras: [
      { id: 'cam-default', name: 'Main Gate Camera', type: 'USB', deviceId: 'default' }
    ]
  });

  const addLog = (log: LogEntry) => {
    // Limit log size to avoid memory issues with images
    setLogs(prev => [log, ...prev].slice(0, 50)); 
  };

  const clearLogs = () => setLogs([]);

  // === 2. Save Key Logic ===
  const handleSaveKey = () => {
    const input = document.getElementById('custom-api-key-input') as HTMLInputElement;
    if (input && input.value) {
      const val = input.value.trim();
      localStorage.setItem("GEMINI_API_KEY", val);
      alert("API Key saved successfully! The system will reload to apply changes.");
      window.location.reload(); // Must reload for geminiService to pick up the new key
    } else {
      alert("Please enter a valid API Key");
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'monitor':
        return <LiveMonitor settings={settings} addLog={addLog} />;
      case 'dashboard':
        return <StatsDashboard logs={logs} />;
      case 'logs':
        return <LogsPanel logs={logs} onClear={clearLogs} />;
      case 'settings':
        return <SettingsPanel settings={settings} onUpdate={setSettings} />;
      default:
        return <LiveMonitor settings={settings} addLog={addLog} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white overflow-hidden">
      {/* Pass open modal function to Navbar */}
      <Navbar onOpenKeySettings={() => setShowKeyInput(true)} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} settings={settings} />
        <main className="flex-1 p-6 overflow-y-auto relative scroll-smooth">
          {renderContent()}
        </main>
      </div>

      {/* === 3. API Key Settings Modal (Tailwind Styles) === */}
      {showKeyInput && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-800 p-8 rounded-xl border border-slate-600 shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Configure API Key</h3>
                <p className="text-xs text-slate-400">Connect to Google Gemini Vision Model</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-300 mb-2">Enter your Gemini API Key:</p>
            <input
              id="custom-api-key-input"
              type="password"
              defaultValue={localStorage.getItem("GEMINI_API_KEY") || ""}
              placeholder="Paste Key here (AIza...)"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white mb-6 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowKeyInput(false)}
                className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveKey}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/30 flex items-center gap-2"
              >
                Save & Restart
              </button>
            </div>
            
            {/* Link removed as requested */}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;