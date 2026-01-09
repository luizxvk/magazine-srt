import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Lock, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (group: any) => void;
}

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }: CreateGroupModalProps) {
  const { user, theme } = useAuth();
  const isMGT = user?.membershipType === 'MGT';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxMembers, setMaxMembers] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const themeBg = theme === 'light' ? 'bg-white' : 'bg-gray-900';
  const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const themeSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const themeBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';
  const themeInput = theme === 'light' ? 'bg-gray-100' : 'bg-white/5';
  
  // Use CSS variables for custom accent colors
  const accentBg = isMGT ? 'bg-emerald-500' : 'bg-gold-500';
  const accentText = isMGT ? 'text-emerald-500' : 'text-gold-500';
  const accentBorder = isMGT ? 'border-emerald-500' : 'border-gold-500';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Nome do grupo é obrigatório');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/groups', {
        name: name.trim(),
        description: description.trim() || undefined,
        isPrivate,
        maxMembers,
      });

      onGroupCreated(response.data);
    } catch (error: any) {
      console.error('Error creating group:', error);
      setError(error.response?.data?.error || 'Erro ao criar grupo');
    } finally {
      setLoading(false);
    }
  };

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
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed inset-0 z-[110] flex items-center justify-center p-4`}
          >
            <div className={`${themeBg} rounded-2xl shadow-2xl max-w-lg w-full border ${themeBorder}`}>
              {/* Header */}
              <div className={`flex items-center justify-between p-6 border-b ${themeBorder}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${isMGT ? 'bg-emerald-500/20' : 'bg-gold-500/20'} rounded-lg`}>
                    <Users className={`w-6 h-6 ${accentText}`} />
                  </div>
                  <h2 className={`text-xl font-serif ${themeText}`}>Criar Novo Grupo</h2>
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 ${themeText} hover:bg-white/10 rounded-full transition-colors`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className={`block text-sm font-medium ${themeText} mb-2`}>
                    Nome do Grupo *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                    placeholder="Ex: Carros Esportivos"
                    className={`w-full px-4 py-3 rounded-lg ${themeInput} ${themeText} border ${themeBorder} focus:ring-2 ${isMGT ? 'focus:ring-emerald-500' : 'focus:ring-gold-500'} focus:border-transparent transition-all`}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className={`block text-sm font-medium ${themeText} mb-2`}>
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={200}
                    rows={3}
                    placeholder="Descreva o propósito do grupo..."
                    className={`w-full px-4 py-3 rounded-lg ${themeInput} ${themeText} border ${themeBorder} focus:ring-2 ${isMGT ? 'focus:ring-emerald-500' : 'focus:ring-gold-500'} focus:border-transparent transition-all resize-none`}
                  />
                  <p className={`text-xs ${themeSecondary} mt-1`}>
                    {description.length}/200 caracteres
                  </p>
                </div>

                {/* Privacy */}
                <div>
                  <label className={`block text-sm font-medium ${themeText} mb-3`}>
                    Privacidade
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsPrivate(false)}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        !isPrivate
                          ? `${accentBorder} ${isMGT ? 'bg-emerald-500/10' : 'bg-gold-500/10'}`
                          : `${themeBorder} ${themeInput}`
                      }`}
                    >
                      <Globe className={`w-6 h-6 ${!isPrivate ? accentText : themeSecondary} mx-auto mb-2`} />
                      <p className={`font-medium ${themeText} text-sm`}>Público</p>
                      <p className={`text-xs ${themeSecondary} mt-1`}>Qualquer um pode entrar</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPrivate(true)}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        isPrivate
                          ? `${accentBorder} ${isMGT ? 'bg-emerald-500/10' : 'bg-gold-500/10'}`
                          : `${themeBorder} ${themeInput}`
                      }`}
                    >
                      <Lock className={`w-6 h-6 ${isPrivate ? accentText : themeSecondary} mx-auto mb-2`} />
                      <p className={`font-medium ${themeText} text-sm`}>Privado</p>
                      <p className={`text-xs ${themeSecondary} mt-1`}>Apenas por convite</p>
                    </button>
                  </div>
                </div>

                {/* Max Members */}
                <div>
                  <label className={`block text-sm font-medium ${themeText} mb-2`}>
                    Limite de Membros
                  </label>
                  <input
                    type="number"
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(Number(e.target.value))}
                    min={2}
                    max={500}
                    className={`w-full px-4 py-3 rounded-lg ${themeInput} ${themeText} border ${themeBorder} focus:ring-2 ${isMGT ? 'focus:ring-emerald-500' : 'focus:ring-gold-500'} focus:border-transparent transition-all`}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`flex-1 px-6 py-3 rounded-full ${themeInput} ${themeText} font-medium hover:bg-white/10 transition-colors`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className={`flex-1 px-6 py-3 rounded-full ${accentBg} text-white font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? 'Criando...' : 'Criar Grupo'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
