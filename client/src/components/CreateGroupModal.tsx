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

  const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const themeSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const themeBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';
  
  // Use CSS variables for custom accent colors
  const accentBg = isMGT ? 'bg-tier-std-500' : 'bg-gold-500';
  const accentText = isMGT ? 'text-tier-std-500' : 'text-gold-500';
  const accentBorder = isMGT ? 'border-tier-std-500' : 'border-gold-500';

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
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed inset-0 z-[110] flex items-center justify-center p-4`}
          >
            <div 
              className="relative w-full max-w-lg overflow-hidden rounded-3xl"
              style={{
                background: theme === 'light' 
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)'
                  : 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(20,20,20,0.9) 100%)',
                boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5), inset 0 0 0 1px ${theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`
              }}
            >
              {/* Header */}
              <div className={`flex items-center justify-between p-6 border-b ${themeBorder}`}>
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2.5 rounded-xl"
                    style={{ background: isMGT ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)' }}
                  >
                    <Users className={`w-6 h-6 ${accentText}`} />
                  </div>
                  <h2 className={`text-xl font-bold ${themeText}`}>Criar Novo Grupo</h2>
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 ${themeSecondary} hover:${themeText} rounded-full transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
                    className={`w-full px-4 py-3.5 rounded-xl ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} ${themeText} border ${themeBorder} focus:ring-2 ${isMGT ? 'focus:ring-tier-std-500' : 'focus:ring-gold-500'} focus:border-transparent transition-all placeholder:text-gray-500`}
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
                    className={`w-full px-4 py-3.5 rounded-xl ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} ${themeText} border ${themeBorder} focus:ring-2 ${isMGT ? 'focus:ring-tier-std-500' : 'focus:ring-gold-500'} focus:border-transparent transition-all resize-none placeholder:text-gray-500`}
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
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPrivate(false)}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                        !isPrivate
                          ? `${accentBorder} ${isMGT ? 'bg-tier-std-500/10' : 'bg-gold-500/10'}`
                          : `${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-white/10 bg-white/5'}`
                      }`}
                      style={!isPrivate ? { boxShadow: `0 0 0 1px ${isMGT ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)'}` } : {}}
                    >
                      <Globe className={`w-6 h-6 ${!isPrivate ? accentText : themeSecondary} mx-auto mb-2`} />
                      <p className={`font-medium ${themeText} text-sm`}>Público</p>
                      <p className={`text-xs ${themeSecondary} mt-1`}>Qualquer um pode entrar</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPrivate(true)}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                        isPrivate
                          ? `${accentBorder} ${isMGT ? 'bg-tier-std-500/10' : 'bg-gold-500/10'}`
                          : `${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-white/10 bg-white/5'}`
                      }`}
                      style={isPrivate ? { boxShadow: `0 0 0 1px ${isMGT ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)'}` } : {}}
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
                    className={`w-full px-4 py-3.5 rounded-xl ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} ${themeText} border ${themeBorder} focus:ring-2 ${isMGT ? 'focus:ring-tier-std-500' : 'focus:ring-gold-500'} focus:border-transparent transition-all`}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`flex-1 px-6 py-3.5 rounded-2xl ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/15'} ${themeText} font-medium transition-colors`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className={`flex-1 px-6 py-3.5 rounded-2xl ${accentBg} text-white font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={{ boxShadow: loading || !name.trim() ? 'none' : `0 4px 14px ${isMGT ? 'rgba(239,68,68,0.4)' : 'rgba(234,179,8,0.4)'}` }}
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
