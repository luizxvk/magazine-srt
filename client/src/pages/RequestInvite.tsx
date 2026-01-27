import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LuxuriousBackground from '../components/LuxuriousBackground';
import logo from '../assets/logo-mgzn.png';
import { ArrowRight, Instagram, Mail, User } from 'lucide-react';

export default function RequestInvite() {
    const navigate = useNavigate();
    const { showToast } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        instagram: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/invites', formData);
            setSuccess(true);
        } catch (error: any) {
            console.error('Failed to request invite', error);
            showToast(error.response?.data?.error || 'Erro ao solicitar convite. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black font-sans selection:bg-gold-500/30">
            <LuxuriousBackground />

            <div className="relative z-10 w-full max-w-md px-4">
                <div className="text-center mb-8 animate-fade-in">
                    <img
                        src={logo}
                        alt="Magazine SRT"
                        className="h-24 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]"
                    />
                    <h1 className="text-3xl font-serif text-white mb-2">Solicitar Acesso</h1>
                    <p className="text-gold-400/80 text-sm uppercase tracking-widest">Junte-se ao Clube Exclusivo</p>
                </div>

                {success ? (
                    <div className="glass-panel p-8 rounded-2xl border border-gold-500/20 text-center animate-scale-in">
                        <div className="w-16 h-16 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold-500/20">
                            <Mail className="w-8 h-8 text-gold-400" />
                        </div>
                        <h2 className="text-2xl font-serif text-white mb-4">Solicitação Enviada</h2>
                        <p className="text-gray-300 mb-8 leading-relaxed">
                            Sua solicitação foi recebida com sucesso. Nossa equipe analisará seu perfil e você receberá um e-mail assim que seu acesso for aprovado.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-gold-500 text-black font-bold py-3.5 rounded-xl hover:bg-gold-400 transition-all duration-300 transform hover:scale-[1.02] shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                        >
                            Voltar ao Início
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-2xl border border-white/10 space-y-5 animate-slide-up">
                        <div className="space-y-1">
                            <label className="text-xs text-gold-400 uppercase tracking-wider ml-1">Nome Completo</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-gold-400 transition-colors" />
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 outline-none transition-all"
                                    placeholder="Seu nome"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-gold-400 uppercase tracking-wider ml-1">E-mail</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-gold-400 transition-colors" />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 outline-none transition-all"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-gold-400 uppercase tracking-wider ml-1">Instagram (Opcional)</label>
                            <div className="relative group">
                                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-gold-400 transition-colors" />
                                <input
                                    type="text"
                                    value={formData.instagram}
                                    onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 outline-none transition-all"
                                    placeholder="@seu.perfil"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gold-500 text-black font-bold py-3.5 rounded-xl hover:bg-gold-400 transition-all duration-300 transform hover:scale-[1.02] shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Enviando...' : (
                                <>
                                    Solicitar Convite <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="text-gray-500 hover:text-white text-sm transition-colors"
                            >
                                Já tem uma conta? Fazer Login
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
