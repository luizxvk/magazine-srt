import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Monitor, Sparkles, Maximize2, Zap, PlayCircle, Check, Volume2, VolumeX, AlertTriangle } from 'lucide-react';

export type StreamQuality = 'hd' | 'fullhd' | 'native';
export type StreamFrameRate = 30 | 60;

export interface StreamSettings {
  quality: StreamQuality;
  frameRate: StreamFrameRate;
  shareAudio: boolean;
}

interface StreamQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (settings: StreamSettings) => void;
  theme: 'light' | 'dark';
}

const qualityOptions: { id: StreamQuality; label: string; description: string; resolution: string; icon: typeof Monitor }[] = [
  {
    id: 'hd',
    label: 'HD',
    description: 'Qualidade balanceada',
    resolution: '1280 × 720 (720p)',
    icon: Monitor
  },
  {
    id: 'fullhd',
    label: 'Full HD',
    description: 'Alta qualidade',
    resolution: '1920 × 1080 (1080p)',
    icon: Sparkles
  },
  {
    id: 'native',
    label: 'Nativa',
    description: 'Resolução do seu monitor',
    resolution: 'Resolução original',
    icon: Maximize2
  }
];

const fpsOptions: { id: StreamFrameRate; label: string; description: string }[] = [
  {
    id: 30,
    label: '30 FPS',
    description: 'Fluidez padrão • Menor uso de banda'
  },
  {
    id: 60,
    label: '60 FPS',
    description: 'Máxima fluidez • Ideal para jogos'
  }
];

export default function StreamQualityModal({ isOpen, onClose, onSelect, theme }: StreamQualityModalProps) {
  const [selectedQuality, setSelectedQuality] = useState<StreamQuality>('fullhd');
  const [selectedFps, setSelectedFps] = useState<StreamFrameRate>(30);
  const [shareAudio, setShareAudio] = useState(false);

  const themeBg = theme === 'light' ? 'bg-white' : 'bg-zinc-900';
  const themeBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';
  const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const themeSecondary = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
  const themeHover = theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/5';

  const handleStartStream = () => {
    onSelect({
      quality: selectedQuality,
      frameRate: selectedFps,
      shareAudio
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center"
        >
          {/* Backdrop click handler */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full max-w-md mx-4 ${themeBg} rounded-2xl border ${themeBorder} shadow-2xl overflow-hidden`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-5 border-b ${themeBorder}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/30 to-emerald-500/20 flex items-center justify-center">
                  <Monitor className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${themeText}`}>Iniciar Transmissão</h3>
                  <p className={`text-sm ${themeSecondary}`}>Configure sua stream</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2.5 rounded-xl ${themeHover} ${themeSecondary} transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Quality Selection */}
              <div>
                <h4 className={`text-sm font-semibold ${themeText} mb-3 flex items-center gap-2`}>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Qualidade de Vídeo
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {qualityOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedQuality === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setSelectedQuality(option.id)}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                          isSelected 
                            ? 'border-green-500 bg-green-500/10' 
                            : `${themeBorder} ${themeHover}`
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-green-500/20'
                            : option.id === 'fullhd' 
                              ? 'bg-purple-500/20' 
                              : option.id === 'native'
                                ? 'bg-blue-500/20'
                                : 'bg-gray-500/20'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            isSelected
                              ? 'text-green-400'
                              : option.id === 'fullhd' 
                                ? 'text-purple-400' 
                                : option.id === 'native'
                                  ? 'text-blue-400'
                                  : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="text-center">
                          <span className={`text-sm font-semibold block ${isSelected ? 'text-green-400' : themeText}`}>
                            {option.label}
                          </span>
                          <span className={`text-[10px] ${themeSecondary}`}>
                            {option.id === 'native' ? 'Original' : option.resolution.split(' ')[0]}
                          </span>
                        </div>
                        {option.id === 'fullhd' && !isSelected && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 font-medium whitespace-nowrap">
                            RECOMENDADO
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* FPS Selection */}
              <div>
                <h4 className={`text-sm font-semibold ${themeText} mb-3 flex items-center gap-2`}>
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Taxa de Quadros
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {fpsOptions.map((option) => {
                    const isSelected = selectedFps === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setSelectedFps(option.id)}
                        className={`relative flex items-center gap-3 p-4 rounded-xl border transition-all ${
                          isSelected 
                            ? 'border-green-500 bg-green-500/10' 
                            : `${themeBorder} ${themeHover}`
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-green-500/20'
                            : option.id === 60
                              ? 'bg-yellow-500/20'
                              : 'bg-gray-500/20'
                        }`}>
                          <span className={`text-sm font-bold ${
                            isSelected
                              ? 'text-green-400'
                              : option.id === 60
                                ? 'text-yellow-400'
                                : 'text-gray-400'
                          }`}>
                            {option.id}
                          </span>
                        </div>
                        <div className="text-left flex-1">
                          <span className={`text-sm font-semibold block ${isSelected ? 'text-green-400' : themeText}`}>
                            {option.label}
                          </span>
                          <span className={`text-[11px] ${themeSecondary}`}>
                            {option.description}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Audio Sharing Toggle */}
              <div>
                <h4 className={`text-sm font-semibold ${themeText} mb-3 flex items-center gap-2`}>
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  Áudio do Sistema
                </h4>
                <button
                  onClick={() => setShareAudio(!shareAudio)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    shareAudio 
                      ? 'border-cyan-500 bg-cyan-500/10' 
                      : `${themeBorder} ${themeHover}`
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    shareAudio ? 'bg-cyan-500/20' : 'bg-gray-500/20'
                  }`}>
                    {shareAudio ? (
                      <Volume2 className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <span className={`text-sm font-semibold block ${shareAudio ? 'text-cyan-400' : themeText}`}>
                      {shareAudio ? 'Compartilhar áudio' : 'Sem áudio do sistema'}
                    </span>
                    <span className={`text-[11px] ${themeSecondary}`}>
                      {shareAudio ? 'O som da sua tela será transmitido' : 'Apenas vídeo será compartilhado'}
                    </span>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors relative ${
                    shareAudio ? 'bg-cyan-500' : 'bg-gray-600'
                  }`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      shareAudio ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </div>
                </button>
                
                {shareAudio && (
                  <div className={`mt-2 p-2.5 rounded-lg flex items-start gap-2 ${theme === 'light' ? 'bg-amber-50 border border-amber-200' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className={`text-[11px] ${theme === 'light' ? 'text-amber-700' : 'text-amber-300'}`}>
                      O volume da chamada será reduzido automaticamente para evitar eco. Use fones de ouvido para melhor experiência.
                    </p>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className={`p-3 rounded-xl ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'}`}>
                <p className={`text-xs ${themeSecondary} text-center`}>
                  Após clicar em <strong>Iniciar</strong>, o navegador vai pedir para você escolher qual janela ou tela compartilhar.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className={`p-5 border-t ${themeBorder} flex items-center justify-between gap-3`}>
              <button
                onClick={onClose}
                className={`flex-1 py-3 px-4 rounded-xl ${themeHover} ${themeSecondary} font-medium transition-colors`}
              >
                Cancelar
              </button>
              <button
                onClick={handleStartStream}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/25"
              >
                <PlayCircle className="w-5 h-5" />
                Iniciar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
