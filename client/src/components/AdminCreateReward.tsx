import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Plus, Image as ImageIcon, X, Gift, Tag, Box } from 'lucide-react';
import api from '../services/api';

interface AdminCreateRewardProps {
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    onRewardCreated?: () => void;
}

export default function AdminCreateReward({ showToast, onRewardCreated }: AdminCreateRewardProps) {
    const [title, setTitle] = useState('');
    const [type, setType] = useState<'PRODUCT' | 'COUPON' | 'DIGITAL'>('DIGITAL');
    const [costZions, setCostZions] = useState(100);
    const [stock, setStock] = useState(10);
    const [imageUrl, setImageUrl] = useState('');
    const [backgroundColor, setBackgroundColor] = useState('');
    const [loading, setLoading] = useState(false);

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

    const handleCreateReward = async () => {
        if (!title) {
            showToast('Preencha o título da recompensa', 'error');
            return;
        }
        if (costZions <= 0) {
            showToast('O custo deve ser maior que zero', 'error');
            return;
        }
        if (stock < 0) {
            showToast('O estoque não pode ser negativo', 'error');
            return;
        }

        setLoading(true);
        try {
            const rewardData = {
                title,
                type,
                costZions,
                stock,
                metadata: imageUrl ? { imageUrl } : undefined,
                backgroundColor: backgroundColor || undefined
            };

            await api.post('/gamification/rewards', rewardData);

            // Reset form
            setTitle('');
            setType('DIGITAL');
            setCostZions(100);
            setStock(10);
            setImageUrl('');
            setBackgroundColor('');

            showToast('Recompensa criada com sucesso!', 'success');
            if (onRewardCreated) onRewardCreated();
        } catch (error) {
            console.error('Failed to create reward', error);
            showToast('Erro ao criar recompensa', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-6 rounded-xl h-fit">
            <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-gold-400" /> Nova Recompensa
            </h2>

            <div className="flex flex-col gap-8">
                {/* Form */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider font-bold">Título</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 outline-none transition-all focus:bg-black/60"
                            placeholder="Ex: Cupom 10% OFF"
                            aria-label="Título da recompensa"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider font-bold">Tipo de Recompensa</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setType('DIGITAL')}
                                className={`p-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${type === 'DIGITAL' ? 'bg-gold-500/20 border-gold-500 text-gold-400' : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5 hover:border-white/30'}`}
                            >
                                <Gift className="w-5 h-5" />
                                <span className="truncate w-full text-center">Digital</span>
                            </button>
                            <button
                                onClick={() => setType('PRODUCT')}
                                className={`p-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${type === 'PRODUCT' ? 'bg-gold-500/20 border-gold-500 text-gold-400' : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5 hover:border-white/30'}`}
                            >
                                <Box className="w-5 h-5" />
                                <span className="truncate w-full text-center">Produto</span>
                            </button>
                            <button
                                onClick={() => setType('COUPON')}
                                className={`p-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${type === 'COUPON' ? 'bg-gold-500/20 border-gold-500 text-gold-400' : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5 hover:border-white/30'}`}
                            >
                                <Tag className="w-5 h-5" />
                                <span className="truncate w-full text-center">Cupom</span>
                            </button>
                        </div>
                    </div>

                    {/* Image Upload for Products */}
                    {type === 'PRODUCT' && (
                        <div className="animate-fade-in p-4 bg-white/5 rounded-xl border border-white/10">
                            <label className="block text-xs text-gray-400 mb-3 uppercase tracking-wider font-bold">Imagem do Produto</label>
                            <div className="flex items-center gap-4">
                                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/30 rounded-xl cursor-pointer transition-all text-sm text-gray-300 font-medium">
                                    <ImageIcon className="w-4 h-4" />
                                    Escolher Arquivo
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                    />
                                </label>
                                {imageUrl && (
                                    <button
                                        onClick={() => setImageUrl('')}
                                        aria-label="Remover imagem"
                                        className="px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold flex items-center gap-2 transition-colors border border-red-500/20"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider font-bold">Custo (Zions)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    value={costZions}
                                    onChange={e => setCostZions(parseInt(e.target.value))}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 outline-none transition-all font-mono text-lg"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-500/50 text-xs font-bold">Z</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider font-bold">Estoque</label>
                            <input
                                type="number"
                                min="0"
                                value={stock}
                                onChange={e => setStock(parseInt(e.target.value))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 outline-none transition-all font-mono text-lg"
                            />
                        </div>
                    </div>

                    {/* Background Color Picker */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider font-bold">Cor de Fundo (Opcional)</label>
                        <div className="flex flex-wrap gap-3">
                            {['#1a1a1a', '#1e1b4b', '#312e81', '#4c1d95', '#831843', '#9f1239', '#881337', '#7f1d1d', '#7c2d12', '#78350f', '#713f12', '#365314', '#14532d', '#064e3b', '#134e4a', '#0c4a6e', '#0f172a'].map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setBackgroundColor(color)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${backgroundColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                    style={{ backgroundColor: color }}
                                    aria-label={`Select color ${color}`}
                                />
                            ))}
                            <button
                                onClick={() => setBackgroundColor('')}
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-black/40 transition-all ${!backgroundColor ? 'border-white scale-110 shadow-lg' : 'border-white/10 hover:border-white/30'}`}
                                aria-label="Default color"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Live Preview (Moved inside form flow for better mobile/narrow layout) */}
                    <div className="pt-4 border-t border-white/10">
                        <label className="block text-xs text-gray-400 mb-4 text-center uppercase tracking-wider font-bold">Pré-visualização do Card</label>
                        <div
                            className="w-full max-w-[240px] mx-auto rounded-xl overflow-hidden shadow-lg relative group border border-white/10"
                            style={{
                                background: backgroundColor || 'linear-gradient(to bottom right, #111827, #000000)'
                            }}
                        >
                            {/* Image/Icon */}
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
                                {/* Cost Badge */}
                                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-gold-400 border border-gold-500/20 shadow-lg">
                                    {costZions} Z
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="text-base font-bold text-white leading-tight mb-1 truncate text-center">
                                    {title || 'Título da Recompensa'}
                                </h3>
                                <p className="text-xs text-gray-400 mb-4 text-center">
                                    {type === 'PRODUCT' ? 'Produto Físico' : type === 'COUPON' ? 'Cupom de Desconto' : 'Recompensa Digital'}
                                </p>

                                <div className="w-full py-2 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-bold uppercase tracking-wider text-center hover:bg-gold-500/20 transition-colors cursor-pointer">
                                    Resgatar
                                </div>

                                <div className="mt-3 flex justify-center items-center text-[10px] text-gray-500">
                                    <span>{stock} unidades disponíveis</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleCreateReward}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-gold-400 to-gold-600 text-black font-bold py-4 rounded-xl hover:from-gold-300 hover:to-gold-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-gold-500/20"
                    >
                        {loading ? 'Processando...' : 'Criar Recompensa'}
                    </button>
                </div>
            </div>
        </div>
    );
}
