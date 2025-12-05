import React, { useRef, useState, useEffect } from 'react';
import { AppSettings, Camera } from '../types';
import { Volume2, VolumeX, Eye, Clock, Save, Upload, FileCode, Video, Plus, Trash2, Webcam, Network } from 'lucide-react';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdate: (newSettings: AppSettings) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [newCameraName, setNewCameraName] = useState('');
  const [newCameraType, setNewCameraType] = useState<'USB' | 'NETWORK'>('USB');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [networkUrl, setNetworkUrl] = useState('');

  useEffect(() => {
    // Enumerate devices for camera setup
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setAvailableDevices(videoDevices);
      if (videoDevices.length > 0) setSelectedDeviceId(videoDevices[0].deviceId);
    });
  }, []);

  const handleChange = (key: keyof AppSettings, value: any) => {
    onUpdate({ ...settings, [key]: value });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleChange('customModelName', file.name);
    }
  };

  const clearModel = () => {
    handleChange('customModelName', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addCamera = () => {
    if (!newCameraName) return;
    
    const newCam: Camera = {
      id: Date.now().toString(),
      name: newCameraName,
      type: newCameraType,
      deviceId: newCameraType === 'USB' ? selectedDeviceId : undefined,
      url: newCameraType === 'NETWORK' ? networkUrl : undefined
    };

    onUpdate({
      ...settings,
      cameras: [...settings.cameras, newCam]
    });

    setNewCameraName('');
    setNetworkUrl('');
  };

  const removeCamera = (id: string) => {
    onUpdate({
      ...settings,
      cameras: settings.cameras.filter(c => c.id !== id)
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">System Configuration</h2>
          <p className="text-slate-400">Adjust parameters for the safety detection engine.</p>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Camera Management */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Source Management</h3>
            
            {/* Camera List */}
            <div className="grid gap-3">
              {settings.cameras.map((cam) => (
                <div key={cam.id} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg text-blue-400">
                      {cam.type === 'USB' ? <Webcam className="w-5 h-5"/> : <Network className="w-5 h-5"/>}
                    </div>
                    <div>
                      <p className="font-medium text-white">{cam.name}</p>
                      <p className="text-xs text-slate-500">
                        {cam.type === 'USB' ? `Device ID: ${cam.deviceId?.slice(0, 15)}...` : cam.url}
                      </p>
                    </div>
                  </div>
                  {settings.cameras.length > 1 && (
                    <button onClick={() => removeCamera(cam.id)} className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Camera */}
            <div className="p-4 bg-slate-800 border border-slate-600 border-dashed rounded-lg space-y-4">
              <div className="text-sm font-medium text-slate-300 mb-2">Add New Source</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Camera Name (e.g. Tower Crane 1)" 
                  value={newCameraName}
                  onChange={(e) => setNewCameraName(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                />
                <select 
                  value={newCameraType} 
                  onChange={(e) => setNewCameraType(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                >
                  <option value="USB">USB / Integrated Camera</option>
                  <option value="NETWORK">Network Stream (RTSP/HTTP)</option>
                </select>
                
                {newCameraType === 'USB' ? (
                  <select 
                    value={selectedDeviceId} 
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="md:col-span-2 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                  >
                    {availableDevices.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0,5)}...`}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    placeholder="Stream URL (e.g. http://192.168.1.100:8080/video)" 
                    value={networkUrl}
                    onChange={(e) => setNetworkUrl(e.target.value)}
                    className="md:col-span-2 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                  />
                )}
              </div>
              <button 
                onClick={addCamera}
                disabled={!newCameraName}
                className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Camera
              </button>
            </div>
          </div>

          <hr className="border-slate-700" />

          {/* Custom Model Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Custom Inference Model</h3>
            <div className="p-6 bg-slate-900/50 rounded-lg border border-slate-700 space-y-4">
               <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-white flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-purple-400" />
                      Model Weights (.pt)
                    </h4>
                    <p className="text-sm text-slate-400 mt-1">Import your custom trained YOLO/PyTorch model (best.pt).</p>
                  </div>
                  {settings.customModelName && (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-500/30">
                      Active
                    </span>
                  )}
               </div>

               <div className="flex items-center gap-4">
                 <input 
                   type="file" 
                   accept=".pt,.pth,.onnx" 
                   ref={fileInputRef}
                   onChange={handleFileUpload}
                   className="hidden"
                 />
                 
                 {settings.customModelName ? (
                   <div className="flex-1 flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-600">
                      <span className="text-sm text-white font-mono">{settings.customModelName}</span>
                      <button 
                        onClick={clearModel}
                        className="text-xs text-red-400 hover:text-red-300 hover:underline"
                      >
                        Remove
                      </button>
                   </div>
                 ) : (
                   <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 border-2 border-dashed border-slate-600 rounded-lg p-6 hover:border-blue-500 hover:bg-slate-800 transition-all group flex flex-col items-center justify-center gap-2"
                   >
                     <Upload className="w-8 h-8 text-slate-500 group-hover:text-blue-400" />
                     <span className="text-sm text-slate-400 group-hover:text-white">Click to import best.pt</span>
                   </button>
                 )}
               </div>
            </div>
          </div>

          <hr className="border-slate-700" />

          {/* Audio Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Alert System</h3>
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-800 rounded-lg">
                  {settings.enableAudioAlerts ? <Volume2 className="text-white"/> : <VolumeX className="text-slate-500"/>}
                </div>
                <div>
                  <div className="font-medium text-white">Audio Alarms</div>
                  <div className="text-sm text-slate-400">Play siren sound when violations are detected</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.enableAudioAlerts}
                  onChange={(e) => handleChange('enableAudioAlerts', e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* AI Parameters */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">AI Detection Parameters</h3>
            
            <div className="p-6 bg-slate-900/50 rounded-lg border border-slate-700 space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-white">
                    <Eye className="w-4 h-4" /> Confidence Threshold
                  </label>
                  <span className="text-sm font-bold text-blue-400">{(settings.confidenceThreshold * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="0.9" 
                  step="0.05"
                  value={settings.confidenceThreshold}
                  onChange={(e) => handleChange('confidenceThreshold', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <p className="mt-1 text-xs text-slate-500">Higher values reduce false positives but might miss some detections.</p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-white">
                    <Clock className="w-4 h-4" /> Analysis Interval (ms)
                  </label>
                  <span className="text-sm font-bold text-blue-400">{settings.detectionInterval}ms</span>
                </div>
                <select 
                  value={settings.detectionInterval}
                  onChange={(e) => handleChange('detectionInterval', parseInt(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value={1000}>1000ms (Fastest)</option>
                  <option value={2000}>2000ms (Balanced)</option>
                  <option value={5000}>5000ms (Low CPU)</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">How often frames are sent to Gemini for analysis.</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
             <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20">
               <Save className="w-4 h-4" /> Save Configuration
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};