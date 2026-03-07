import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Globe, Camera, ImagePlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import api from '../services/api';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (group: any) => void;
}

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }: CreateGroupModalProps) {
  const { user } = useAuth();
  const { communityName } = useCommunity();
  const isMGT = user?.membershipType === 'MGT';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxMembers, setMaxMembers] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Image state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  // Use CSS variables for custom accent colors
  const accentBg = isMGT ? 'bg-tier-std-500' : 'bg-gold-500';
  const accentText = isMGT ? 'text-tier-std-500' : 'text-gold-500';

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Nome do grupo é obrigatório');
      return;
    }

    setLoading(true);

    try {
      // Create group first
      const response = await api.post('/groups', {
        name: name.trim(),
        description: description.trim() || undefined,
        isPrivate,
        maxMembers,
      });

      const groupId = response.data.id;

      // Upload avatar if selected
      if (avatarFile) {
        const avatarFormData = new FormData();
        avatarFormData.append('avatar', avatarFile);
        await api.patch(`/connect/groups/${groupId}/avatar`, avatarFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // Upload banner if selected
      if (bannerFile) {
        const bannerFormData = new FormData();
        bannerFormData.append('banner', bannerFile);
        await api.patch(`/connect/groups/${groupId}/banner`, bannerFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // Fetch updated group
      const updatedGroup = await api.get(`/groups/${groupId}`);
      onGroupCreated(updatedGroup.data);
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
                background: 'linear-gradient(135deg, rgba(16,16,34,0.98) 0%, rgba(10,10,25,0.95) 100%)',
                boxShadow: `0 25px 50px -12px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.1)`
              }}
            >
              {/* Banner Upload Area */}
              <div className="relative">
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="hidden"
                />
                <div className="h-32 overflow-hidden rounded-t-3xl">
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div 
                      className="w-full h-full"
                      style={{ background: isMGT ? 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(139,0,0,0.1) 100%)' : 'linear-gradient(135deg, rgba(234,179,8,0.2) 0%, rgba(150,100,0,0.1) 100%)' }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="absolute inset-0 h-32 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                      <ImagePlus className="w-4 h-4 text-white" />
                      <span className="text-sm text-white font-medium">Banner</span>
                    </div>
                  </button>
                </div>
                
                {/* Avatar Upload - Below Banner */}
                <div className="absolute left-6 -bottom-10 z-10">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative w-20 h-20 rounded-2xl overflow-hidden border-4 border-[#101022] hover:border-white/20 transition-colors group shadow-xl"
                    style={{ background: isMGT ? 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)' : 'linear-gradient(135deg, #eab308 0%, #854d0e 100%)' }}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white/80" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Header */}
              <div className={`flex items-center justify-between px-6 pt-14 pb-4`}>
                <h2 className={`text-xl font-bold text-[#F1F5F9]`}>Criar Novo Grupo</h2>
                <button
                  onClick={onClose}
                  className={`p-2 text-[#64748B] hover:text-[#F1F5F9] rounded-full transition-colors absolute top-4 right-4 z-10 bg-black/40 backdrop-blur-sm`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-[#F1F5F9] mb-2">
                    Nome do Grupo *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                    placeholder="Ex: Carros Esportivos"
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 text-[#F1F5F9] border border-white/10 focus:ring-2 ${isMGT ? 'focus:ring-tier-std-500' : 'focus:ring-gold-500'} focus:border-transparent transition-all placeholder:text-[#64748B]`}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[#F1F5F9] mb-2">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={200}
                    rows={2}
                    placeholder="Descreva o propósito do grupo..."
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 text-[#F1F5F9] border border-white/10 focus:ring-2 ${isMGT ? 'focus:ring-tier-std-500' : 'focus:ring-gold-500'} focus:border-transparent transition-all resize-none placeholder:text-[#64748B]`}
                  />
                  <p className="text-xs text-[#64748B] mt-1">
                    {description.length}/200 caracteres
                  </p>
                </div>

                {/* Privacy */}
                <div>
                  <label className="block text-sm font-medium text-[#F1F5F9] mb-2">
                    Privacidade
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPrivate(false)}
                      className={`flex-1 p-3 rounded-xl border transition-all ${
                        !isPrivate
                          ? `border-${isMGT ? 'tier-std-500' : 'gold-500'} ${isMGT ? 'bg-tier-std-500/10' : 'bg-gold-500/10'}`
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <Globe className={`w-5 h-5 ${!isPrivate ? accentText : 'text-[#64748B]'} mx-auto mb-1`} />
                      <p className="font-medium text-[#F1F5F9] text-xs">Público</p>
                      <p className="text-[10px] text-[#64748B] mt-0.5">Aberto a todos</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPrivate(true)}
                      className={`flex-1 p-3 rounded-xl border transition-all ${
                        isPrivate
                          ? `border-${isMGT ? 'tier-std-500' : 'gold-500'} ${isMGT ? 'bg-tier-std-500/10' : 'bg-gold-500/10'}`
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <Lock className={`w-5 h-5 ${isPrivate ? accentText : 'text-[#64748B]'} mx-auto mb-1`} />
                      <p className="font-medium text-[#F1F5F9] text-xs">Privado</p>
                      <p className="text-[10px] text-[#64748B] mt-0.5">Exclusivo {communityName.toUpperCase()}</p>
                    </button>
                  </div>
                  <p className="text-xs text-[#64748B] mt-2">Grupos privados são apenas por convite</p>
                </div>

                {/* Max Members */}
                <div>
                  <label className="block text-sm font-medium text-[#F1F5F9] mb-2">
                    Limite de Membros
                  </label>
                  <input
                    type="number"
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(Number(e.target.value))}
                    min={2}
                    max={500}
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 text-[#F1F5F9] border border-white/10 focus:ring-2 ${isMGT ? 'focus:ring-tier-std-500' : 'focus:ring-gold-500'} focus:border-transparent transition-all`}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-[#F1F5F9] font-medium transition-colors"
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
