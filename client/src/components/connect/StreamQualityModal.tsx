import { motion, AnimatePresence } from 'framer-motion';
import { X, Monitor, Sparkles, Maximize2 } from 'lucide-react';

export type StreamQuality = 'hd' | 'fullhd' | 'native';

interface StreamQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (quality: StreamQuality) => void;
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

export default function StreamQualityModal({ isOpen, onClose, onSelect, theme }: StreamQualityModalProps) {
  const themeBg = theme === 'light' ? 'bg-white' : 'bg-zinc-900';
  const themeBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';
  const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const themeSecondary = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
  const themeHover = theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/5';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm ${themeBg} rounded-xl border ${themeBorder} shadow-2xl z-[60] overflow-hidden`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${themeBorder}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className={`font-semibold ${themeText}`}>Qualidade da Transmissão</h3>
                  <p className={`text-xs ${themeSecondary}`}>Escolha a resolução do stream</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg ${themeHover} ${themeSecondary} transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quality Options */}
            <div className="p-4 space-y-2">
              {qualityOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      onSelect(option.id);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border ${themeBorder} ${themeHover} transition-all group`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      option.id === 'fullhd' 
                        ? 'bg-purple-500/20 group-hover:bg-purple-500/30' 
                        : option.id === 'native'
                          ? 'bg-blue-500/20 group-hover:bg-blue-500/30'
                          : 'bg-green-500/20 group-hover:bg-green-500/30'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        option.id === 'fullhd' 
                          ? 'text-purple-400' 
                          : option.id === 'native'
                            ? 'text-blue-400'
                            : 'text-green-400'
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${themeText}`}>{option.label}</span>
                        {option.id === 'fullhd' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-medium">
                            RECOMENDADO
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${themeSecondary}`}>{option.description}</p>
                      <p className={`text-xs mt-0.5 ${themeSecondary} opacity-60`}>{option.resolution}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className={`p-4 border-t ${themeBorder} bg-black/5`}>
              <p className={`text-xs ${themeSecondary} text-center`}>
                Maior qualidade requer mais banda de internet
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
