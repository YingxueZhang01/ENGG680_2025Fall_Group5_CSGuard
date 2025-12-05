import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, AlertTriangle, CheckCircle, Pause, Play, RefreshCw, LayoutGrid, Maximize2 } from 'lucide-react';
import { analyzeSafetyImage } from '../services/geminiService';
import { playAlertSound } from '../services/audioService';
import { AppSettings, Detection, LogEntry } from '../types';

interface LiveMonitorProps {
  settings: AppSettings;
  addLog: (log: LogEntry) => void;
}

export const LiveMonitor: React.FC<LiveMonitorProps> = ({ settings, addLog }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [lastViolationTime, setLastViolationTime] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // View State
  const [viewMode, setViewMode] = useState<'SINGLE' | 'GRID'>('SINGLE');
  const [selectedCameraId, setSelectedCameraId] = useState<string>(settings.cameras[0]?.id || '');

  // Reset selected camera if the current one is deleted
  useEffect(() => {
    if (!settings.cameras.find(c => c.id === selectedCameraId)) {
      if (settings.cameras.length > 0) setSelectedCameraId(settings.cameras[0].id);
    }
  }, [settings.cameras, selectedCameraId]);

  const activeCamera = settings.cameras.find(c => c.id === selectedCameraId) || settings.cameras[0];

  // Initialize Webcam / Source
  const startCamera = async () => {
    try {
      if (activeCamera.type === 'USB') {
        let stream: MediaStream;
        
        try {
            const targetDeviceId = (activeCamera.deviceId && activeCamera.deviceId !== 'default') 
              ? { exact: activeCamera.deviceId } 
              : undefined;

            const constraints: MediaStreamConstraints = {
              video: { 
                deviceId: targetDeviceId,
                width: { ideal: 1280 },
                height: { ideal: 720 },
              } 
            };
            
            stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (constraintErr) {
            console.warn("Specific camera constraints failed, attempting fallback to generic video.", constraintErr);
            // Fallback: Try to get any video stream ignoring resolution/device preferences
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsMonitoring(true);
          };
        }
      } else {
         console.warn("Network streams require backend transcoding. Feature is UI-ready.");
         setIsMonitoring(true);
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      addLog({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: 'SYSTEM',
        message: `Camera Access Error: ${err.name} - ${err.message}. Check browser permissions.`,
        cameraName: activeCamera.name
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsMonitoring(false);
    setDetections([]);
    
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Restart camera when source changes while monitoring
  useEffect(() => {
    if (isMonitoring) {
      stopCamera();
      setTimeout(startCamera, 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCameraId]);

  // Capture and Analyze Frame
  const processFrame = useCallback(async () => {
    // Early check: if video is gone or paused, don't even start
    if (!videoRef.current || !canvasRef.current || isProcessing) return;
    if (videoRef.current.paused || videoRef.current.ended) return;

    setIsProcessing(true);
    const video = videoRef.current;
    
    // Create offscreen canvas for capture
    const canvas = document.createElement('canvas'); 
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      
      const result = await analyzeSafetyImage(base64Image);
      
      // CRITICAL FIX: Check if camera is still active after the await.
      // If user stopped camera while AI was thinking, srcObject will be null.
      if (!videoRef.current || !videoRef.current.srcObject) {
         setIsProcessing(false);
         return; 
      }
      
      setDetections(result.detections);

      // Handle Violations
      if (result.violations.length > 0) {
        const now = Date.now();
        // Cooldown check
        if (now - lastViolationTime > 5000) {
          if (settings.enableAudioAlerts) {
            playAlertSound();
          }

          // Capture Snapshot with bounding boxes
          let snapshotUrl = undefined;
          if (settings.autoRecordEvidence) {
             // We need to draw the boxes on the temp canvas to save it as evidence
             result.detections.forEach(det => {
                if(det.confidence < settings.confidenceThreshold) return;
                const [ymin, xmin, ymax, xmax] = det.box_2d;
                const x = (xmin / 1000) * canvas.width;
                const y = (ymin / 1000) * canvas.height;
                const w = ((xmax - xmin) / 1000) * canvas.width;
                const h = ((ymax - ymin) / 1000) * canvas.height;
                ctx.strokeStyle = det.label.includes('No ') ? 'red' : 'blue';
                ctx.lineWidth = 4;
                ctx.strokeRect(x,y,w,h);
             });
             snapshotUrl = canvas.toDataURL('image/jpeg', 0.6);
          }
          
          addLog({
            id: now.toString(),
            timestamp: new Date().toISOString(),
            type: 'VIOLATION',
            message: `Detected: ${result.violations.join(', ')}`,
            details: `Detected ${result.detections.length} objects`,
            snapshot: snapshotUrl,
            cameraName: activeCamera.name
          });
          
          setLastViolationTime(now);
        }
      }
    }
    setIsProcessing(false);
  }, [isProcessing, settings, lastViolationTime, addLog, activeCamera]);

  // Overlay Drawing Loop
  useEffect(() => {
    const renderLoop = () => {
      if (!isMonitoring || viewMode === 'GRID') return;

      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && video.videoWidth > 0) {
        canvas.width = video.clientWidth;
        canvas.height = video.clientHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const videoRatio = video.videoWidth / video.videoHeight;
        const containerRatio = canvas.width / canvas.height;
        
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let startX = 0;
        let startY = 0;

        if (containerRatio > videoRatio) {
          drawWidth = canvas.height * videoRatio;
          startX = (canvas.width - drawWidth) / 2;
        } else {
          drawHeight = canvas.width / videoRatio;
          startY = (canvas.height - drawHeight) / 2;
        }

        // Track used label positions to stack them
        const occupiedLabelZones: {x: number, y: number, w: number}[] = [];

        detections.forEach(det => {
          if (det.confidence < settings.confidenceThreshold) return;

          const [ymin, xmin, ymax, xmax] = det.box_2d;
          
          const x = startX + (xmin / 1000) * drawWidth;
          const y = startY + (ymin / 1000) * drawHeight;
          const w = ((xmax - xmin) / 1000) * drawWidth;
          const h = ((ymax - ymin) / 1000) * drawHeight;

          let color = '#3b82f6';
          if (det.label.includes('No ')) color = '#ef4444';
          else if (det.label.includes('Hardhat')) color = '#eab308';
          else if (det.label.includes('Vest')) color = '#22c55e';

          // Draw Box
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, w, h);

          // Calculate Label Position with Stacking Logic
          const text = `${det.label} (${Math.round(det.confidence * 100)}%)`;
          ctx.font = 'bold 14px Inter';
          const textWidth = ctx.measureText(text).width + 10;
          const textHeight = 24;
          
          let labelY = y - 7;
          let labelBgY = y - 24;

          // Check for collision with existing labels
          let collisionCount = 0;
          occupiedLabelZones.forEach(zone => {
            // Simple collision check: if X is close and Y is close
            if (Math.abs(zone.x - x) < 50 && Math.abs(zone.y - labelBgY) < 26) {
               collisionCount++;
            }
          });

          // Offset upwards if collision
          if (collisionCount > 0) {
             labelBgY -= (26 * collisionCount);
             labelY -= (26 * collisionCount);
          }

          occupiedLabelZones.push({ x, y: labelBgY, w: textWidth });

          ctx.fillStyle = color;
          ctx.fillRect(x, labelBgY, textWidth, textHeight);

          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, x + 5, labelY);
        });
      }
      requestAnimationFrame(renderLoop);
    };

    const animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [detections, settings.confidenceThreshold, isMonitoring, viewMode]);

  // Interval Management
  useEffect(() => {
    if (isMonitoring && viewMode === 'SINGLE') {
      intervalRef.current = window.setInterval(processFrame, settings.detectionInterval);
    } else if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [isMonitoring, processFrame, settings.detectionInterval, viewMode]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header / Controls */}
      <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <div>
             <h2 className="text-xl font-semibold text-white">Live Monitor</h2>
             {viewMode === 'SINGLE' && <p className="text-xs text-slate-400">Source: {activeCamera.name}</p>}
          </div>
        </div>
        
        <div className="flex gap-3">
          {/* Source Selection (Only in Single View) */}
          {viewMode === 'SINGLE' && (
            <select 
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500"
            >
              {settings.cameras.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          {/* View Toggle */}
          <div className="bg-slate-900 rounded-lg p-1 border border-slate-600 flex">
            <button 
              onClick={() => setViewMode('SINGLE')}
              className={`p-2 rounded ${viewMode === 'SINGLE' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Single View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('GRID')}
              className={`p-2 rounded ${viewMode === 'GRID' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Grid View (4-way)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <div className="h-8 w-[1px] bg-slate-600 mx-1"></div>

          {!isMonitoring ? (
            <button 
              onClick={startCamera}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Play className="w-4 h-4" /> Start
            </button>
           ) : (
            <button 
              onClick={stopCamera}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Pause className="w-4 h-4" /> Stop
            </button>
           )}
        </div>
      </div>

      {/* Video Area */}
      {viewMode === 'SINGLE' ? (
        <div className="relative flex-1 bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-700 flex justify-center items-center">
          {!isMonitoring && (
            <div className="absolute inset-0 flex items-center justify-center flex-col text-slate-500 z-10">
              <Camera className="w-16 h-16 mb-4 opacity-50" />
              <p>Camera is offline. Click Start to begin.</p>
            </div>
          )}
          
          {isProcessing && isMonitoring && (
             <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur text-white text-xs px-3 py-1 rounded-full flex items-center gap-2">
               <RefreshCw className="w-3 h-3 animate-spin" /> Analyzing...
             </div>
          )}
  
          <video 
            ref={videoRef}
            className="w-full h-full object-contain" 
            playsInline
            muted
          />
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none object-contain"
          />
  
          {(Date.now() - lastViolationTime < 3000) && (
            <div className="absolute inset-0 border-8 border-red-500/50 animate-pulse pointer-events-none z-10 flex items-center justify-center">
               <div className="bg-red-600/90 text-white px-8 py-4 rounded-xl shadow-xl flex items-center gap-4 transform scale-125">
                 <AlertTriangle className="w-8 h-8" />
                 <span className="text-2xl font-bold">SAFETY VIOLATION</span>
               </div>
            </div>
          )}
        </div>
      ) : (
        /* Grid View Placeholder */
        <div className="grid grid-cols-2 gap-4 flex-1 h-full overflow-hidden">
           {settings.cameras.slice(0, 4).map((cam, idx) => (
             <div key={cam.id} className="bg-black rounded-xl border border-slate-700 relative overflow-hidden flex items-center justify-center">
                {/* We can't easily stream 4 webcams in one browser tab without advanced WebRTC. 
                    So we only show the active one alive, others as placeholders or dupes for demo */}
                {cam.id === selectedCameraId && isMonitoring ? (
                  /* Re-use the video ref for the active camera but simpler display */
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover opacity-80" 
                    playsInline 
                    muted 
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-600">
                    <Camera className="w-8 h-8 mb-2" />
                    <span className="text-xs">{cam.name} (Standby)</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-xs font-mono text-white">
                  {cam.name}
                </div>
             </div>
           ))}
           {/* Fill empty slots to keep grid nice */}
           {[...Array(Math.max(0, 4 - settings.cameras.length))].map((_, i) => (
              <div key={i} className="bg-slate-900/50 rounded-xl border border-slate-800 flex items-center justify-center">
                <span className="text-slate-700 text-sm">No Signal</span>
              </div>
           ))}
        </div>
      )}

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg"><Camera className="w-5 h-5 text-blue-400"/></div>
          <div>
            <p className="text-xs text-slate-400">Active Source</p>
            <p className="font-semibold truncate w-32">{activeCamera.name}</p>
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg"><CheckCircle className="w-5 h-5 text-green-400"/></div>
          <div>
            <p className="text-xs text-slate-400">System Status</p>
            <p className="font-semibold text-green-400">Operational</p>
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg"><AlertTriangle className="w-5 h-5 text-yellow-400"/></div>
          <div>
            <p className="text-xs text-slate-400">Recent Alerts</p>
            <p className="font-semibold text-white">{detections.filter(d => d.label.includes('No')).length} Detected</p>
          </div>
        </div>
      </div>
    </div>
  );
};