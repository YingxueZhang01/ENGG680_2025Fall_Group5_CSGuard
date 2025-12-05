import React from 'react';
import { LayoutDashboard, History, Settings, Video, CircuitBoard } from 'lucide-react';
import { AppSettings } from '../types';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  settings?: AppSettings;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, settings }) => {
  const menuItems = [
    { id: 'monitor', label: 'Live Monitor', icon: Video },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'logs', label: 'Violation Logs', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0">
      <div className="p-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Main Menu
        </div>
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="mt-auto p-4 border-t border-slate-700">
        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Model Status</p>
          {settings?.customModelName ? (
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
               <div className="overflow-hidden">
                 <span className="text-sm font-medium text-slate-200 block truncate" title={settings.customModelName}>
                   {settings.customModelName}
                 </span>
                 <span className="text-[10px] text-purple-400 flex items-center gap-1">
                   <CircuitBoard className="w-3 h-3" /> Custom Loaded
                 </span>
               </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-200">Gemini 2.5 Flash</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};