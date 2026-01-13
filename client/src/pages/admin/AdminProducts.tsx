import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Edit2, Trash2, Key, Loader2, X, Search, Gamepad2, Gift, CreditCard, Sparkles, Eye, EyeOff, Upload, Tag, Image, HardDrive, Calendar, Monitor, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface Product {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
    screenshots?: string[];
    category: string;
    priceZions?: number;
    priceBRL?: number;
    stock: number;
    isUnlimited: boolean;
    isActive: boolean;
    developer?: string;
    releaseDate?: string;
    sizeGB?: number;
    platform?: string;
    tags?: { tag: string }[];
    availableKeys: number;
    totalKeys: number;
    totalOrders: number;
    createdAt: string;
}

interface AdminProductsProps {
    onClose?: () => void;
}

const categoryOptions = [
    { value: 'GAME_KEY', label: 'Key de Jogo', icon: <Gamepad2 className="w-4 h-4" /> },
    { value: 'GIFT_CARD', label: 'Gift Card', icon: <Gift className="w-4 h-4" /> },
    { value: 'SUBSCRIPTION', label: 'Assinatura', icon: <CreditCard className="w-4 h-4" /> },
    { value: 'DIGITAL_ITEM', label: 'Item Digital', icon: <Package className="w-4 h-4" /> },
    { value: 'SERVICE', label: 'Serviço', icon: <Sparkles className="w-4 h-4" /> }
];

export default function AdminProducts({ onClose }: AdminProductsProps) {
    const { theme } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showKeysModal, setShowKeysModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [newKeys, setNewKeys] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        imageFile: null as File | null,
        imagePreview: '',
        existingImageUrl: '',
        screenshots: [] as string[],
        newScreenshots: [] as File[],
        screenshotPreviews: [] as string[],
        category: 'GAME_KEY',
        priceZions: '',
        priceBRL: '',
        isUnlimited: false,
        isActive: true,
        developer: '',
        releaseDate: '',
        sizeGB: '',
        platform: '',
        tags: ''
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await api.get('/products/admin/all');
            setProducts(response.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Convert image to base64 if file selected
            let imageBase64: string | undefined;
            if (formData.imageFile) {
                imageBase64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(formData.imageFile!);
                });
            }

            // Convert screenshots to base64
            const screenshotBase64: string[] = [];
            for (const file of formData.newScreenshots) {
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
                screenshotBase64.push(base64);
            }

            // Parse tags
            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);

            const data = {
                name: formData.name,
                description: formData.description,
                imageBase64: imageBase64,
                screenshotBase64: screenshotBase64.length > 0 ? screenshotBase64 : undefined,
                existingScreenshots: formData.screenshots,
                category: formData.category,
                priceZions: formData.priceZions ? parseInt(formData.priceZions) : undefined,
                priceBRL: formData.priceBRL ? parseFloat(formData.priceBRL) : undefined,
                isUnlimited: formData.isUnlimited,
                isActive: formData.isActive,
                developer: formData.developer || undefined,
                releaseDate: formData.releaseDate || undefined,
                sizeGB: formData.sizeGB ? parseFloat(formData.sizeGB) : undefined,
                platform: formData.platform || undefined,
                tags: tagsArray.length > 0 ? tagsArray : undefined
            };

            if (editingProduct) {
                await api.put(`/products/admin/${editingProduct.id}`, data);
            } else {
                await api.post('/products/admin/create', data);
            }

            setShowModal(false);
            setEditingProduct(null);
            resetForm();
            fetchProducts();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao salvar produto');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (productId: string) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;

        try {
            await api.delete(`/products/admin/${productId}`);
            fetchProducts();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao excluir produto');
        }
    };

    const handleAddKeys = async () => {
        if (!selectedProductId || !newKeys.trim()) return;
        setSubmitting(true);

        try {
            const keys = newKeys.split('\n').map(k => k.trim()).filter(k => k.length > 0);
            await api.post(`/products/admin/${selectedProductId}/keys`, { keys });
            
            setShowKeysModal(false);
            setNewKeys('');
            setSelectedProductId(null);
            fetchProducts();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao adicionar keys');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (product: Product) => {
        try {
            await api.put(`/products/admin/${product.id}`, { isActive: !product.isActive });
            fetchProducts();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao atualizar produto');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            imageFile: null,
            imagePreview: '',
            existingImageUrl: '',
            screenshots: [],
            newScreenshots: [],
            screenshotPreviews: [],
            category: 'GAME_KEY',
            priceZions: '',
            priceBRL: '',
            isUnlimited: false,
            isActive: true,
            developer: '',
            releaseDate: '',
            sizeGB: '',
            platform: '',
            tags: ''
        });
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            imageFile: null,
            imagePreview: '',
            existingImageUrl: product.imageUrl || '',
            screenshots: product.screenshots || [],
            newScreenshots: [],
            screenshotPreviews: [],
            category: product.category,
            priceZions: product.priceZions?.toString() || '',
            priceBRL: product.priceBRL?.toString() || '',
            isUnlimited: product.isUnlimited,
            isActive: product.isActive,
            developer: product.developer || '',
            releaseDate: product.releaseDate || '',
            sizeGB: product.sizeGB?.toString() || '',
            platform: product.platform || '',
            tags: product.tags?.map(t => t.tag).join(', ') || ''
        });
        setShowModal(true);
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        Gerenciar Produtos
                    </h2>
                    <p className="text-gray-400 text-sm">
                        {products.length} produto(s) • {products.reduce((acc, p) => acc + p.availableKeys, 0)} keys disponíveis
                    </p>
                </div>
                
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar..."
                            className={`pl-9 pr-4 py-2 rounded-lg border border-white/10 ${theme === 'light' ? 'bg-white' : 'bg-white/5'} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        />
                    </div>
                    <button
                        onClick={() => { resetForm(); setEditingProduct(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Produto
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-white/20 text-gray-400 hover:text-white hover:border-white/40 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>

            {/* Products Table */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className={`border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Produto</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Categoria</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Preço</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Keys</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Vendas</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(product => (
                                <tr 
                                    key={product.id}
                                    className={`border-b ${theme === 'light' ? 'border-gray-100' : 'border-white/5'} hover:bg-white/5`}
                                >
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-white/10'} flex items-center justify-center overflow-hidden`}>
                                                {product.imageUrl ? (
                                                    <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-5 h-5 text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                                    {product.name}
                                                </p>
                                                <p className="text-xs text-gray-400 truncate max-w-[200px]">
                                                    {product.description}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="text-sm text-gray-400">
                                            {categoryOptions.find(c => c.value === product.category)?.label || product.category}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="space-y-1">
                                            {product.priceZions && (
                                                <p className="text-sm text-yellow-400">💎 {product.priceZions.toLocaleString()}</p>
                                            )}
                                            {product.priceBRL && (
                                                <p className="text-sm text-green-400">R$ {product.priceBRL.toFixed(2)}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        {product.isUnlimited ? (
                                            <span className="text-sm text-blue-400">∞ Ilimitado</span>
                                        ) : (
                                            <span className={`text-sm ${product.availableKeys === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {product.availableKeys} / {product.totalKeys}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="text-sm text-gray-400">{product.totalOrders}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <button
                                            onClick={() => handleToggleActive(product)}
                                            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                                product.isActive 
                                                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                                                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                            }`}
                                        >
                                            {product.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                            {product.isActive ? 'Ativo' : 'Inativo'}
                                        </button>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => { setSelectedProductId(product.id); setShowKeysModal(true); }}
                                                className="p-2 rounded-lg hover:bg-white/10 text-blue-400 transition-colors"
                                                title="Adicionar Keys"
                                            >
                                                <Key className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(product)}
                                                className="p-2 rounded-lg hover:bg-white/10 text-yellow-400 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="p-2 rounded-lg hover:bg-white/10 text-red-400 transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Nenhum produto encontrado</p>
                        </div>
                    )}
                </div>
            )}

            {/* Product Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className={`w-full max-w-lg rounded-2xl ${theme === 'light' ? 'bg-white' : 'bg-zinc-900'} border border-white/10 shadow-2xl`}
                        >
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <h3 className={`text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                    {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                                </h3>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Nome</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className={`w-full px-4 py-2 rounded-lg border border-white/10 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        required
                                        rows={3}
                                        className={`w-full px-4 py-2 rounded-lg border border-white/10 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none`}
                                    />
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Imagem do Produto (16:9 - 800x450)</label>
                                    <div className="space-y-3">
                                        {/* Preview */}
                                        {(formData.imagePreview || formData.existingImageUrl) && (
                                            <div className="relative aspect-video w-full max-w-[300px] rounded-lg overflow-hidden bg-white/5">
                                                <img 
                                                    src={formData.imagePreview || formData.existingImageUrl} 
                                                    alt="Preview" 
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, imageFile: null, imagePreview: '', existingImageUrl: '' })}
                                                    className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors"
                                                >
                                                    <X className="w-4 h-4 text-white" />
                                                </button>
                                            </div>
                                        )}
                                        
                                        {/* Upload Button */}
                                        <label className={`flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-white/20 hover:border-emerald-500/50 cursor-pointer transition-colors ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'}`}>
                                            <Upload className="w-5 h-5 text-emerald-500" />
                                            <span className="text-sm text-gray-400">
                                                {formData.imageFile ? formData.imageFile.name : 'Clique para selecionar imagem'}
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = () => {
                                                            setFormData({ 
                                                                ...formData, 
                                                                imageFile: file,
                                                                imagePreview: reader.result as string,
                                                                existingImageUrl: ''
                                                            });
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                        </label>
                                        <p className="text-xs text-gray-500">Recomendado: 800x450px (16:9). A imagem será redimensionada automaticamente.</p>
                                    </div>
                                </div>

                                {/* Screenshots */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">
                                        <span className="flex items-center gap-2">
                                            <Image className="w-4 h-4" /> Screenshots adicionais
                                        </span>
                                    </label>
                                    <div className="space-y-3">
                                        {/* Existing Screenshots */}
                                        {formData.screenshots.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {formData.screenshots.map((url, idx) => (
                                                    <div key={idx} className="relative w-20 h-12 rounded-lg overflow-hidden bg-white/5">
                                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({
                                                                ...formData,
                                                                screenshots: formData.screenshots.filter((_, i) => i !== idx)
                                                            })}
                                                            className="absolute top-0.5 right-0.5 p-0.5 bg-red-500/80 rounded-full"
                                                        >
                                                            <X className="w-3 h-3 text-white" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* New Screenshot Previews */}
                                        {formData.screenshotPreviews.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {formData.screenshotPreviews.map((preview, idx) => (
                                                    <div key={idx} className="relative w-20 h-12 rounded-lg overflow-hidden bg-white/5 border-2 border-emerald-500/50">
                                                        <img src={preview} alt="" className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({
                                                                    ...formData,
                                                                    newScreenshots: formData.newScreenshots.filter((_, i) => i !== idx),
                                                                    screenshotPreviews: formData.screenshotPreviews.filter((_, i) => i !== idx)
                                                                });
                                                            }}
                                                            className="absolute top-0.5 right-0.5 p-0.5 bg-red-500/80 rounded-full"
                                                        >
                                                            <X className="w-3 h-3 text-white" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Upload Button for Screenshots */}
                                        <label className={`flex items-center gap-3 px-4 py-2 rounded-lg border border-dashed border-white/20 hover:border-emerald-500/50 cursor-pointer transition-colors ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'}`}>
                                            <Upload className="w-4 h-4 text-emerald-500" />
                                            <span className="text-xs text-gray-400">Adicionar screenshots</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={(e) => {
                                                    const files = Array.from(e.target.files || []);
                                                    files.forEach(file => {
                                                        const reader = new FileReader();
                                                        reader.onload = () => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                newScreenshots: [...prev.newScreenshots, file],
                                                                screenshotPreviews: [...prev.screenshotPreviews, reader.result as string]
                                                            }));
                                                        };
                                                        reader.readAsDataURL(file);
                                                    });
                                                }}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Categoria</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className={`w-full px-4 py-2 rounded-lg border border-white/10 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                                    >
                                        {categoryOptions.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Prices */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Preço (Zions)</label>
                                        <input
                                            type="number"
                                            value={formData.priceZions}
                                            onChange={e => setFormData({ ...formData, priceZions: e.target.value })}
                                            placeholder="1000"
                                            min="0"
                                            className={`w-full px-4 py-2 rounded-lg border border-white/10 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Preço (R$)</label>
                                        <input
                                            type="number"
                                            value={formData.priceBRL}
                                            onChange={e => setFormData({ ...formData, priceBRL: e.target.value })}
                                            placeholder="10.00"
                                            min="0"
                                            step="0.01"
                                            className={`w-full px-4 py-2 rounded-lg border border-white/10 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                                        />
                                    </div>
                                </div>

                                {/* Toggles */}
                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isUnlimited}
                                            onChange={e => setFormData({ ...formData, isUnlimited: e.target.checked })}
                                            className="w-4 h-4 rounded border-white/20 text-emerald-500 focus:ring-emerald-500"
                                        />
                                        <span className="text-sm text-gray-400">Estoque Ilimitado</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="w-4 h-4 rounded border-white/20 text-emerald-500 focus:ring-emerald-500"
                                        />
                                        <span className="text-sm text-gray-400">Ativo</span>
                                    </label>
                                </div>

                                {/* Separator */}
                                <div className="border-t border-white/10 pt-4">
                                    <p className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                                        <Gamepad2 className="w-4 h-4" /> Informações do Jogo (opcional)
                                    </p>
                                </div>

                                {/* Developer & Platform */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                                            <User className="w-3 h-3" /> Desenvolvedor
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.developer}
                                            onChange={e => setFormData({ ...formData, developer: e.target.value })}
                                            placeholder="Activision"
                                            className={`w-full px-3 py-2 rounded-lg border border-white/10 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                                            <Monitor className="w-3 h-3" /> Plataforma
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.platform}
                                            onChange={e => setFormData({ ...formData, platform: e.target.value })}
                                            placeholder="PC, Xbox, PS5"
                                            className={`w-full px-3 py-2 rounded-lg border border-white/10 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                                        />
                                    </div>
                                </div>

                                {/* Size & Release Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                                            <HardDrive className="w-3 h-3" /> Tamanho (GB)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.sizeGB}
                                            onChange={e => setFormData({ ...formData, sizeGB: e.target.value })}
                                            placeholder="120"
                                            min="0"
                                            step="0.1"
                                            className={`w-full px-3 py-2 rounded-lg border border-white/10 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> Data de Lançamento
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.releaseDate}
                                            onChange={e => setFormData({ ...formData, releaseDate: e.target.value })}
                                            placeholder="25 Out, 2025"
                                            className={`w-full px-3 py-2 rounded-lg border border-white/10 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                                        />
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                                        <Tag className="w-3 h-3" /> Tags (separadas por vírgula)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                        placeholder="FPS, Multiplayer, Action, CallOfDuty"
                                        className={`w-full px-3 py-2 rounded-lg border border-white/10 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Ex: FPS, Multiplayer, Action</p>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-3 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            {editingProduct ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                            {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Keys Modal */}
            <AnimatePresence>
                {showKeysModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowKeysModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className={`w-full max-w-lg rounded-2xl ${theme === 'light' ? 'bg-white' : 'bg-zinc-900'} border border-white/10 shadow-2xl`}
                        >
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <h3 className={`text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                    Adicionar Keys
                                </h3>
                                <button onClick={() => setShowKeysModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="p-4 space-y-4">
                                <p className="text-sm text-gray-400">
                                    Cole as keys abaixo, uma por linha. Elas serão adicionadas ao estoque do produto.
                                </p>
                                
                                <textarea
                                    value={newKeys}
                                    onChange={e => setNewKeys(e.target.value)}
                                    placeholder="XXXXX-XXXXX-XXXXX&#10;YYYYY-YYYYY-YYYYY&#10;ZZZZZ-ZZZZZ-ZZZZZ"
                                    rows={8}
                                    className={`w-full px-4 py-3 rounded-lg border border-white/10 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none`}
                                />

                                <p className="text-xs text-gray-500">
                                    {newKeys.split('\n').filter(k => k.trim()).length} key(s) para adicionar
                                </p>

                                <button
                                    onClick={handleAddKeys}
                                    disabled={submitting || !newKeys.trim()}
                                    className="w-full py-3 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5" />
                                            Adicionar Keys
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
