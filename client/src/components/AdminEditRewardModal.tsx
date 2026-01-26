import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { X, Save, Image as ImageIcon, Gift, Tag, Box, Edit2, Coins } from 'lucide-react';
import api from '../services/api';

interface Reward {
    id: string;
    title: string;
    type: 'PRODUCT' | 'COUPON' | 'DIGITAL';
    costZions: number;
    zionsReward?: number;
    stock: number;
    isUnlimited?: boolean;
    metadata?: {
        imageUrl?: string;
    };
}

interface AdminEditRewardModalProps {
    isOpen: boolean;
    onClose: () => void;
    reward: Reward | null;
    onUpdate: () => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function AdminEditRewardModal({ isOpen, onClose, reward, onUpdate, showToast }: AdminEditRewardModalProps) {
    const [title, setTitle] = useState('');
    const [type, setType] = useState<'PRODUCT' | 'COUPON' | 'DIGITAL'>('DIGITAL');
    const [costZions, setCostZions] = useState(0);
    const [zionsReward, setZionsReward] = useState(0);
    const [stock, setStock] = useState(0);
    const [isUnlimited, setIsUnlimited] = useState(true);
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (reward) {
            setTitle(reward.title);
            setType(reward.type);
            setCostZions(reward.costZions);
            setZionsReward(reward.zionsReward || 0);
            setStock(reward.stock);
            setIsUnlimited(reward.isUnlimited ?? true);
            setImageUrl(reward.metadata?.imageUrl || '');
        }
    }, [reward]);

    const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = async () => {
        if (!reward) return;
        if (!title) {
            showToast('Preencha o título', 'error');
            return;
        }

        setLoading(true);
        try {
            await api.put(`/gamification/rewards/${reward.id}`, {
                title,
                type,
                costZions,
                zionsReward,
                stock,
                isUnlimited,
                metadata: imageUrl ? { imageUrl } : undefined
            });

            showToast('Recompensa atualizada!', 'success');
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Failed to update reward', error);
            showToast('Erro ao atualizar recompensa', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !reward) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gold-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
                <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
                    <h2 className="text-xl font-serif text-white flex items-center gap-2">
                        <Edit2 className="w-5 h-5 text-gold-400" /> Editar Recompensa
                    </h2>
                    <button onClick={onClose} aria-label="Fechar modal" className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Form */}
                        <div className="flex-1 space-y-6">
                            <div>
                                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider font-bold">Título</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider font-bold">Tipo</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => setType('DIGITAL')}
                                        className={`p-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${type === 'DIGITAL' ? 'bg-gold-500/20 border-gold-500 text-gold-400' : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5'}`}
                                    >
                                        <Gift className="w-5 h-5" /> Digital
                                    </button>
                                    <button
                                        onClick={() => setType('PRODUCT')}
                                        className={`p-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${type === 'PRODUCT' ? 'bg-gold-500/20 border-gold-500 text-gold-400' : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5'}`}
                                    >
                                        <Box className="w-5 h-5" /> Produto
                                    </button>
                                    <button
                                        onClick={() => setType('COUPON')}
                                        className={`p-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${type === 'COUPON' ? 'bg-gold-500/20 border-gold-500 text-gold-400' : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5'}`}
                                    >
                                        <Tag className="w-5 h-5" /> Cupom
                                    </button>
                                </div>
                            </div>

                            {type === 'PRODUCT' && (
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <label className="block text-xs text-gray-400 mb-3 uppercase tracking-wider font-bold">Imagem</label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl cursor-pointer transition-all text-sm text-gray-300">
                                            <ImageIcon className="w-4 h-4" /> Alterar Imagem
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                                        </label>
                                        {imageUrl && (
                                            <button onClick={() => setImageUrl('')} aria-label="Remover imagem" className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider font-bold">Custo (Z)</label>
                                    <input
                                        type="number"
                                        value={costZions}
                                        onChange={e => setCostZions(parseInt(e.target.value) || 0)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 outline-none font-mono text-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider font-bold">Estoque</label>
                                    <input
                                        type="number"
                                        value={stock}
                                        onChange={e => setStock(parseInt(e.target.value) || 0)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 outline-none font-mono text-lg"
                                    />
                                </div>
                            </div>

                            {/* Zions Reward Field */}
                            <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                                <label className="block text-xs text-emerald-400 mb-2 uppercase tracking-wider font-bold flex items-center gap-2">
                                    <Coins className="w-4 h-4" />
                                    Zions de Recompensa
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={zionsReward}
                                    onChange={e => setZionsReward(parseInt(e.target.value) || 0)}
                                    className="w-full bg-black/40 border border-emerald-500/30 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none font-mono text-lg"
                                />
                                <p className="mt-2 text-xs text-gray-400">
                                    {zionsReward > 0 
                                        ? `O usuário receberá ${zionsReward} Zions ao resgatar.`
                                        : 'Deixe 0 se não quiser dar Zions como bônus.'
                                    }
                                </p>
                            </div>

                            {/* Redemption Type Toggle */}
                            <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
                                <label className="block text-xs text-blue-400 mb-3 uppercase tracking-wider font-bold">Tipo de Resgate</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsUnlimited(true)}
                                        className={`p-3 rounded-xl text-sm font-bold border transition-all ${
                                            isUnlimited
                                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                                : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5'
                                        }`}
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <span>🔄 Ilimitado</span>
                                            <span className="text-[10px] opacity-70">1h cooldown</span>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsUnlimited(false)}
                                        className={`p-3 rounded-xl text-sm font-bold border transition-all ${
                                            !isUnlimited
                                                ? 'bg-gold-500/20 border-gold-500 text-gold-400'
                                                : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5'
                                        }`}
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <span>🎁 Único</span>
                                            <span className="text-[10px] opacity-70">Uma vez só</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="w-full md:w-48 shrink-0 flex flex-col items-center">
                            <label className="block text-xs text-gray-400 mb-4 uppercase tracking-wider font-bold">Preview</label>
                            <div className="w-full bg-gradient-to-br from-gray-900 to-black border border-gold-500/30 rounded-xl overflow-hidden shadow-lg relative group">
                                <div className="h-32 bg-black/50 flex items-center justify-center relative overflow-hidden">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-gold-500/50">
                                            {type === 'PRODUCT' ? <Box className="w-12 h-12" /> :
                                                type === 'COUPON' ? <Tag className="w-12 h-12" /> :
                                                    <Gift className="w-12 h-12" />}
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3 bg-black/80 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-gold-400 border border-gold-500/20">
                                        {costZions} Z
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="text-base font-bold text-white leading-tight mb-1 truncate text-center">{title || 'Título'}</h3>
                                    <p className="text-xs text-gray-400 mb-4 text-center">
                                        {type === 'PRODUCT' ? 'Produto Físico' : type === 'COUPON' ? 'Cupom' : 'Digital'}
                                    </p>
                                    <div className="w-full py-2 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-bold uppercase tracking-wider text-center">
                                        Resgatar
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-white/10 flex justify-end gap-4 bg-gray-900 sticky bottom-0 z-10">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleUpdate}
                        disabled={loading}
                        className="px-8 py-3 rounded-xl bg-gold-500 text-black text-sm font-bold hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20 flex items-center gap-2"
                    >
                        {loading ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar Alterações</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
