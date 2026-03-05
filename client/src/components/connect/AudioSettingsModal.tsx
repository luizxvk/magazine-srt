import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Mic, 
  Settings,
  RefreshCw,
  Headphones,
  Sparkles,
  Volume2,
  Radio
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useVoice } from '../../context/VoiceContext';
import type { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor?: string;
  remoteUsers?: IAgoraRTCRemoteUser[];
}

export function AudioSettingsModal({ isOpen, onClose, accentColor = '#9333ea', remoteUsers = [] }: AudioSettingsModalProps) {
  const { theme } = useAuth();
  const { updateAudioProcessing, isJoined } = useVoice();
  
  // Audio device state
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInput, setSelectedInput] = useState<string>(() => {
    return localStorage.getItem('rovex-audio-input') || '';
  });
  const [selectedOutput, setSelectedOutput] = useState<string>(() => {
    return localStorage.getItem('rovex-audio-output') || '';
  });
  
  // Volume state
  const [inputVolume, setInputVolume] = useState(100);
  const [outputVolume, setOutputVolume] = useState(100);
  
  // Audio Processing settings (ANS, AEC, AGC)
  const [noiseSuppression, setNoiseSuppression] = useState(() => {
    return localStorage.getItem('rovex-audio-ans') !== 'false';
  });
  const [echoCancellation, setEchoCancellation] = useState(() => {
    return localStorage.getItem('rovex-audio-aec') !== 'false';
  });
  const [autoGainControl, setAutoGainControl] = useState(() => {
    return localStorage.getItem('rovex-audio-agc') !== 'false';
  });
  
  // Mic test state
  const [isTesting, setIsTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [testStatus, setTestStatus] = useState<'idle' | 'listening' | 'playing'>('idle');
  
  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const themeBg = theme === 'light' ? 'bg-white' : 'bg-zinc-900';
  const themeBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';
  const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const themeSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const themeHover = theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/5';
  const themeInput = theme === 'light' ? 'bg-gray-100' : 'bg-zinc-800';

  // Apply output device to Agora remote tracks
  const applyOutputDevice = async (deviceId: string) => {
    if (!deviceId || remoteUsers.length === 0) return;
    
    try {
      // Apply to all remote audio tracks
      for (const user of remoteUsers) {
        if (user.audioTrack) {
          // setPlaybackDevice exists on RemoteAudioTrack
          await (user.audioTrack as any).setPlaybackDevice(deviceId);
          console.log('[AudioSettings] Applied output device to user', user.uid);
        }
      }
      // Save preference
      localStorage.setItem('rovex-audio-output', deviceId);
    } catch (err) {
      console.error('[AudioSettings] Error setting playback device:', err);
    }
  };

  // Handle output device change
  const handleOutputDeviceChange = (deviceId: string) => {
    setSelectedOutput(deviceId);
    applyOutputDevice(deviceId);
  };

  // Get available audio devices
  useEffect(() => {
    if (isOpen) {
      loadDevices();
    }
    return () => {
      stopMicTest();
    };
  }, [isOpen]);

  const loadDevices = async () => {
    try {
      // Request permissions first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const inputs = devices.filter(d => d.kind === 'audioinput');
      const outputs = devices.filter(d => d.kind === 'audiooutput');
      
      setInputDevices(inputs);
      setOutputDevices(outputs);
      
      // Set default selections
      if (inputs.length > 0 && !selectedInput) {
        setSelectedInput(inputs[0].deviceId);
      }
      if (outputs.length > 0 && !selectedOutput) {
        setSelectedOutput(outputs[0].deviceId);
      }
    } catch (err) {
      console.error('Error loading audio devices:', err);
    }
  };

  // Mic test functions
  const startMicTest = async () => {
    try {
      setIsTesting(true);
      setTestStatus('listening');
      recordedChunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedInput ? { exact: selectedInput } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      streamRef.current = stream;
      
      // Set up audio analysis
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Set up recording
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Play back the recording
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.volume = outputVolume / 100;
        
        setTestStatus('playing');
        
        audio.onended = () => {
          setTestStatus('idle');
          setIsTesting(false);
          URL.revokeObjectURL(url);
        };
        
        audio.play();
      };
      
      mediaRecorder.start();
      
      // Start level monitoring
      updateMicLevel();
      
      // Stop recording after 3 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          stopStream();
        }
      }, 3000);
      
    } catch (err) {
      console.error('Error starting mic test:', err);
      setIsTesting(false);
      setTestStatus('idle');
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const stopMicTest = () => {
    stopStream();
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsTesting(false);
    setTestStatus('idle');
    setMicLevel(0);
  };

  const updateMicLevel = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average level
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setMicLevel(Math.min(100, (average / 128) * 100));
    
    if (streamRef.current) {
      animationFrameRef.current = requestAnimationFrame(updateMicLevel);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-[60] p-4 pointer-events-none"
          >
            <div 
              className={`${themeBg} rounded-2xl overflow-hidden shadow-2xl border ${themeBorder} max-h-[85vh] overflow-y-auto w-[440px] max-w-full pointer-events-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div 
                className="p-4 border-b flex items-center justify-between"
                style={{ borderColor: theme === 'light' ? '#e5e7eb' : 'rgba(255,255,255,0.1)' }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <Settings className="w-5 h-5" style={{ color: accentColor }} />
                  </div>
                  <div>
                    <h2 className={`font-bold ${themeText}`}>Configurações de Áudio</h2>
                    <p className={`text-xs ${themeSecondary}`}>Configurar entrada e saída de som</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg ${themeHover} ${themeSecondary}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-6">
                {/* Input Device */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="w-4 h-4" style={{ color: accentColor }} />
                    <label className={`text-sm font-medium ${themeText}`}>
                      Dispositivo de Entrada
                    </label>
                  </div>
                  <select
                    value={selectedInput}
                    onChange={(e) => setSelectedInput(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl ${themeInput} ${themeText} border ${themeBorder} focus:outline-none focus:ring-2`}
                    style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                  >
                    {inputDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microfone ${inputDevices.indexOf(device) + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Input Volume */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-sm font-medium ${themeText}`}>
                      Volume de Entrada
                    </label>
                    <span className={`text-sm ${themeSecondary}`}>{inputVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={inputVolume}
                    onChange={(e) => setInputVolume(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${accentColor} ${inputVolume}%, #4b5563 ${inputVolume}%)`
                    }}
                  />
                </div>

                {/* Output Device */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Headphones className="w-4 h-4" style={{ color: accentColor }} />
                    <label className={`text-sm font-medium ${themeText}`}>
                      Dispositivo de Saída
                    </label>
                  </div>
                  <select
                    value={selectedOutput}
                    onChange={(e) => handleOutputDeviceChange(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl ${themeInput} ${themeText} border ${themeBorder} focus:outline-none focus:ring-2`}
                    style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                  >
                    {outputDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Alto-falante ${outputDevices.indexOf(device) + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Output Volume */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-sm font-medium ${themeText}`}>
                      Volume de Saída
                    </label>
                    <span className={`text-sm ${themeSecondary}`}>{outputVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={outputVolume}
                    onChange={(e) => setOutputVolume(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${accentColor} ${outputVolume}%, #4b5563 ${outputVolume}%)`
                    }}
                  />
                </div>

                {/* Audio Processing Section - Compact */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
                    <span className={`text-sm font-medium ${themeText}`}>Processamento de Áudio</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Noise Suppression */}
                    <button
                      onClick={async () => {
                        const newValue = !noiseSuppression;
                        setNoiseSuppression(newValue);
                        localStorage.setItem('rovex-audio-ans', String(newValue));
                        if (isJoined) await updateAudioProcessing();
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${noiseSuppression ? '' : 'opacity-50'}`}
                      style={{
                        backgroundColor: noiseSuppression ? `${accentColor}15` : theme === 'light' ? '#f3f4f6' : '#27272a',
                        borderColor: noiseSuppression ? `${accentColor}50` : theme === 'light' ? '#e5e7eb' : '#3f3f46',
                      }}
                    >
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: noiseSuppression ? `${accentColor}30` : 'transparent' }}
                      >
                        <Volume2 className="w-5 h-5" style={{ color: noiseSuppression ? accentColor : '#9ca3af' }} />
                      </div>
                      <div className="text-center">
                        <span className={`text-xs font-medium block ${themeText}`}>Ruído</span>
                        <span className={`text-[10px] ${noiseSuppression ? 'text-green-500' : themeSecondary}`}>
                          {noiseSuppression ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </button>

                    {/* Echo Cancellation */}
                    <button
                      onClick={async () => {
                        const newValue = !echoCancellation;
                        setEchoCancellation(newValue);
                        localStorage.setItem('rovex-audio-aec', String(newValue));
                        if (isJoined) await updateAudioProcessing();
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${echoCancellation ? '' : 'opacity-50'}`}
                      style={{
                        backgroundColor: echoCancellation ? `${accentColor}15` : theme === 'light' ? '#f3f4f6' : '#27272a',
                        borderColor: echoCancellation ? `${accentColor}50` : theme === 'light' ? '#e5e7eb' : '#3f3f46',
                      }}
                    >
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: echoCancellation ? `${accentColor}30` : 'transparent' }}
                      >
                        <Radio className="w-5 h-5" style={{ color: echoCancellation ? accentColor : '#9ca3af' }} />
                      </div>
                      <div className="text-center">
                        <span className={`text-xs font-medium block ${themeText}`}>Eco</span>
                        <span className={`text-[10px] ${echoCancellation ? 'text-green-500' : themeSecondary}`}>
                          {echoCancellation ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </button>

                    {/* Auto Gain Control */}
                    <button
                      onClick={async () => {
                        const newValue = !autoGainControl;
                        setAutoGainControl(newValue);
                        localStorage.setItem('rovex-audio-agc', String(newValue));
                        if (isJoined) await updateAudioProcessing();
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${autoGainControl ? '' : 'opacity-50'}`}
                      style={{
                        backgroundColor: autoGainControl ? `${accentColor}15` : theme === 'light' ? '#f3f4f6' : '#27272a',
                        borderColor: autoGainControl ? `${accentColor}50` : theme === 'light' ? '#e5e7eb' : '#3f3f46',
                      }}
                    >
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: autoGainControl ? `${accentColor}30` : 'transparent' }}
                      >
                        <Mic className="w-5 h-5" style={{ color: autoGainControl ? accentColor : '#9ca3af' }} />
                      </div>
                      <div className="text-center">
                        <span className={`text-xs font-medium block ${themeText}`}>Ganho</span>
                        <span className={`text-[10px] ${autoGainControl ? 'text-green-500' : themeSecondary}`}>
                          {autoGainControl ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Mic Test Section */}
                <div 
                  className="p-4 rounded-xl border"
                  style={{ 
                    backgroundColor: `${accentColor}05`,
                    borderColor: `${accentColor}30`,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Mic className="w-5 h-5" style={{ color: accentColor }} />
                      <span className={`font-medium ${themeText}`}>Teste de Microfone</span>
                    </div>
                    <button
                      onClick={isTesting ? stopMicTest : startMicTest}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                        isTesting 
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                          : 'text-white hover:opacity-90'
                      }`}
                      style={!isTesting ? { backgroundColor: accentColor } : undefined}
                    >
                      {isTesting ? (
                        <>
                          <X className="w-4 h-4" />
                          Parar
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          Testar
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Mic Level Indicator */}
                  <div className="mb-3">
                    <div className="h-3 rounded-full bg-black/20 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: accentColor }}
                        animate={{ width: `${micLevel}%` }}
                        transition={{ duration: 0.05 }}
                      />
                    </div>
                  </div>
                  
                  {/* Status */}
                  <p className={`text-sm ${themeSecondary}`}>
                    {testStatus === 'idle' && 'Clique em "Testar" para gravar 3 segundos e ouvir seu microfone.'}
                    {testStatus === 'listening' && '🎙️ Gravando... Fale algo!'}
                    {testStatus === 'playing' && '🔊 Reproduzindo sua gravação...'}
                  </p>
                </div>

                {/* Refresh devices */}
                <button
                  onClick={loadDevices}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl ${themeHover} ${themeSecondary} border ${themeBorder} transition-colors`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Atualizar Dispositivos
                </button>
              </div>

              {/* Footer */}
              <div className={`p-4 border-t ${themeBorder} flex justify-end`}>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl text-white font-medium transition-all hover:opacity-90"
                  style={{ backgroundColor: accentColor }}
                >
                  Fechar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default AudioSettingsModal;
