import React, { useState } from 'react';
import { LogEntry } from '../types';
import { Download, Search, AlertTriangle, Info, Terminal, Video, Clock, MapPin, X } from 'lucide-react';

interface LogsPanelProps {
  logs: LogEntry[];
  onClear: () => void;
}

export const LogsPanel: React.FC<LogsPanelProps> = ({ logs, onClear }) => {
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const downloadCSV = () => {
    const headers = ['Timestamp', 'Type', 'Camera', 'Message', 'Details'];
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...logs.map(log => 
          `${log.timestamp},${log.type},${log.cameraName || 'Unknown'},"${log.message}","${log.details || ''}"`
        )].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `safety_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-xl border border-slate-700 overflow-hidden relative">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
        <div>
          <h2 className="text-lg font-semibold text-white">Event Logs</h2>
          <p className="text-sm text-slate-400">Real-time audit trail with visual evidence</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onClear} className="px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors">
            Clear
          </button>
          <button onClick={downloadCSV} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-3 bg-slate-800 border-b border-slate-700 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by violation type or camera name..." 
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Info className="w-12 h-12 mb-3 opacity-20" />
            <p>No events recorded yet.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div 
              key={log.id} 
              onClick={() => setSelectedLog(log)}
              className={`group flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${
                log.type === 'VIOLATION' 
                  ? 'bg-slate-900/80 border-slate-700 hover:border-red-500/50' 
                  : 'bg-slate-900/50 border-slate-800 hover:border-blue-500/50'
              }`}
            >
              {/* Snapshot Thumbnail */}
              <div className="w-32 h-20 bg-black rounded overflow-hidden shrink-0 border border-slate-800 relative">
                 {log.snapshot ? (
                   <img src={log.snapshot} alt="Event Snapshot" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                     <Video className="w-6 h-6" />
                   </div>
                 )}
                 {log.type === 'VIOLATION' && (
                    <div className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      REC
                    </div>
                 )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                   <h3 className={`font-semibold truncate ${log.type === 'VIOLATION' ? 'text-red-400' : 'text-blue-400'}`}>
                     {log.message}
                   </h3>
                   <span className="text-xs text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {log.cameraName || 'Unknown Source'}
                  </div>
                </div>

                {log.details && (
                  <p className="mt-2 text-xs text-slate-500 font-mono truncate">{log.details}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Evidence Modal */}
      {selectedLog && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-full">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedLog.type === 'VIOLATION' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {selectedLog.type === 'VIOLATION' ? <AlertTriangle className="w-5 h-5"/> : <Info className="w-5 h-5"/>}
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{selectedLog.message}</h3>
                    <p className="text-xs text-slate-400">
                      ID: {selectedLog.id} • {new Date(selectedLog.timestamp).toLocaleString()}
                    </p>
                  </div>
               </div>
               <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white">
                 <X className="w-6 h-6" />
               </button>
            </div>
            
            <div className="flex-1 bg-black flex items-center justify-center p-2 overflow-hidden">
               {selectedLog.snapshot ? (
                  <img src={selectedLog.snapshot} alt="Full Evidence" className="max-w-full max-h-[60vh] object-contain rounded" />
               ) : (
                  <div className="text-slate-500 flex flex-col items-center">
                    <Video className="w-12 h-12 mb-4 opacity-50"/>
                    <p>No visual evidence captured for this event.</p>
                  </div>
               )}
            </div>

            <div className="p-4 bg-slate-900 grid grid-cols-2 gap-4 text-sm">
               <div>
                  <span className="text-slate-500 block mb-1">Camera Source</span>
                  <span className="text-white font-medium">{selectedLog.cameraName || 'Unknown'}</span>
               </div>
               <div>
                  <span className="text-slate-500 block mb-1">AI Detection Details</span>
                  <span className="text-white font-mono">{selectedLog.details || 'N/A'}</span>
               </div>
            </div>
            
            {/* Simulated Video Player Controls for "5s clip" */}
            {selectedLog.type === 'VIOLATION' && (
              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-4">
                 <span className="text-xs text-slate-500">Replay Clip</span>
                 <div className="h-1 bg-slate-800 w-full max-w-xs rounded overflow-hidden">
                    <div className="h-full bg-red-600 w-1/3"></div>
                 </div>
                 <button className="text-xs text-blue-400 hover:underline">Download MP4</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};