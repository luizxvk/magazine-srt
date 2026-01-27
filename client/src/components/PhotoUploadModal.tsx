import { useState } from 'react';
import { X, Upload, Loader2, Eye, EyeOff } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { compressImage, getBase64Size } from '../utils/imageCompression';

interface PhotoUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PhotoUploadModal({ isOpen, onClose, onSuccess }: PhotoUploadModalProps) {
    const { user, theme, showToast } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [carValue, setCarValue] = useState('');
    const [eventType, setEventType] = useState('');
    const [carBrand, setCarBrand] = useState('');
    const [isPublic, setIsPublic] = useState(true);

    const themeColors = isMGT
        ? {
            bg: theme === 'light' ? 'bg-white' : 'bg-gray-900',
            border: 'border-emerald-500/30',
            text: 'text-emerald-500',
            button: 'bg-emerald-600 hover:bg-emerald-500',
            inputBg: theme === 'light' ? 'bg-gray-50' : 'bg-black/40',
        }
        : {
            bg: theme === 'light' ? 'bg-white' : 'bg-gray-900',
            border: 'border-gold-500/30',
            text: 'text-gold-500',
            button: 'bg-gold-500 hover:bg-gold-400',
            inputBg: theme === 'light' ? 'bg-gray-50' : 'bg-black/40',
        };

    const categories = ['Sport', 'SUV', 'Sedan', 'Muscle', 'JDM', 'Euro', 'Classic'];
    const values = ['Budget', 'Mid', 'Premium', 'Supercar'];
    const events = ['Drift', 'Street', 'Meeting', 'Roleplay', 'Race'];

    const [base64Image, setBase64Image] = useState<string>('');
    const [isCompressing, setIsCompressing] = useState(false);
    
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { 'image/*': [] },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            const file = acceptedFiles[0];
            
            // Check file size (max 10MB before compression)
            if (file.size > 10 * 1024 * 1024) {
                showToast('Imagem muito grande. Tamanho máximo: 10MB');
                return;
            }
            
            try {
                setIsCompressing(true);
                
                // Compress image for faster upload
                const compressed = await compressImage(file, {
                    maxWidth: 1920,
                    maxHeight: 1920,
                    quality: 0.85,
                    outputFormat: 'image/jpeg'
                });
                
                const sizeKB = getBase64Size(compressed);
                console.log(`[Image] Compressed to ${sizeKB}KB`);
                
                setBase64Image(compressed);
                setImageUrl(compressed);
            } catch (error) {
                console.error('Failed to compress image', error);
                // Fallback to original
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    setBase64Image(result);
                    setImageUrl(result);
                };
                reader.readAsDataURL(file);
            } finally {
                setIsCompressing(false);
            }
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!base64Image && !imageUrl) return;

        try {
            setLoading(true);
            
            // Send as JSON with base64 image (same pattern as Stories)
            await api.post('/catalog', {
                imageUrl: base64Image || imageUrl,
                title,
                category,
                carValue,
                eventType,
                carBrand,
                isPublic
            });

            onSuccess();
            onClose();
            
            // Reset form
            setBase64Image('');
            setImageUrl('');
            setTitle('');
            setCategory('');
            setCarValue('');
            setEventType('');
            setCarBrand('');
            setIsPublic(true);
        } catch (error) {
            console.error('Failed to upload photo', error);
            showToast('Falha ao enviar foto. Verifique se a imagem é válida e tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className={`w-full max-w-2xl ${themeColors.bg} rounded-2xl border ${themeColors.border} shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className={`text-xl font-serif ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        Adicionar Foto ao Catálogo
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className={`w-6 h-6 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Image Dropzone */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Imagem do Veículo</label>
                            <div
                                {...getRootProps()}
                                className={`flex-1 relative rounded-xl overflow-hidden aspect-video ${themeColors.inputBg} border-2 border-dashed ${isDragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-600'} flex items-center justify-center group cursor-pointer transition-all hover:border-gray-400`}
                            >
                                <input {...getInputProps()} />
                                {isCompressing ? (
                                    <div className="text-center p-8">
                                        <Loader2 className="w-12 h-12 mx-auto mb-2 text-emerald-500 animate-spin" />
                                        <p className="text-sm text-gray-400 font-medium">Otimizando imagem...</p>
                                    </div>
                                ) : imageUrl ? (
                                    <div className="relative w-full h-full">
                                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <p className="text-white font-medium">Clique ou arraste para alterar</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-8">
                                        <Upload className={`w-12 h-12 mx-auto mb-2 ${isDragActive ? 'text-emerald-500' : 'text-gray-500'}`} />
                                        <p className="text-sm text-gray-400 font-medium">
                                            {isDragActive ? 'Solte a imagem aqui' : 'Arraste e solte uma imagem aqui'}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1">ou clique para selecionar</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Title & Brand */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Título (Opcional)</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className={`w-full p-3 rounded-lg ${themeColors.inputBg} border border-white/10 focus:border-white/30 outline-none ${theme === 'light' ? 'text-black' : 'text-white'} transition-all`}
                                    placeholder="Ex: Meu GTR no Pôr do Sol"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Marca do Carro</label>
                                <input
                                    type="text"
                                    value={carBrand}
                                    onChange={(e) => setCarBrand(e.target.value)}
                                    className={`w-full p-3 rounded-lg ${themeColors.inputBg} border border-white/10 focus:border-white/30 outline-none ${theme === 'light' ? 'text-black' : 'text-white'} transition-all`}
                                    placeholder="Ex: Nissan, BMW..."
                                />
                            </div>
                        </div>

                        {/* Selects */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Categoria</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className={`w-full p-3 rounded-lg ${themeColors.inputBg} border border-white/10 focus:border-white/30 outline-none ${theme === 'light' ? 'text-black' : 'text-white'} transition-all appearance-none cursor-pointer`}
                                >
                                    <option value="">Selecione...</option>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Valor</label>
                                <select
                                    value={carValue}
                                    onChange={(e) => setCarValue(e.target.value)}
                                    className={`w-full p-3 rounded-lg ${themeColors.inputBg} border border-white/10 focus:border-white/30 outline-none ${theme === 'light' ? 'text-black' : 'text-white'} transition-all appearance-none cursor-pointer`}
                                >
                                    <option value="">Selecione...</option>
                                    {values.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Evento</label>
                                <select
                                    value={eventType}
                                    onChange={(e) => setEventType(e.target.value)}
                                    className={`w-full p-3 rounded-lg ${themeColors.inputBg} border border-white/10 focus:border-white/30 outline-none ${theme === 'light' ? 'text-black' : 'text-white'} transition-all appearance-none cursor-pointer`}
                                >
                                    <option value="">Selecione...</option>
                                    {events.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Visibility Toggle */}
                        <div
                            className={`p-4 rounded-xl border ${isPublic ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'} cursor-pointer transition-all flex items-center justify-between`}
                            onClick={() => setIsPublic(!isPublic)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${isPublic ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                                    {isPublic ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                        {isPublic ? 'Visível para Todos' : 'Apenas Você'}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {isPublic ? 'Aparecerá na aba Explorar' : 'Disponível apenas no seu perfil'}
                                    </p>
                                </div>
                            </div>
                            <div className={`w-12 h-6 rounded-full relative transition-colors ${isPublic ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : ''}`} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-white shadow-lg flex items-center justify-center gap-2 ${themeColors.button} ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01] active:scale-[0.98]'} transition-all`}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                            {loading ? 'Enviando...' : 'Adicionar Foto'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
