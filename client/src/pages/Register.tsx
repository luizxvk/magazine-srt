import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo-mgzn.png';
import logoSrt from '../assets/logo-mgt.png';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const registerSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const membershipType = location.state?.membershipType || 'MAGAZINE';
    const isMGT = membershipType === 'MGT';

    const onSubmit = async (data: RegisterForm) => {
        try {
            const response = await api.post('/auth/register', {
                ...data,
                membershipType
            });
            login(response.data.token, response.data.user);
            navigate('/feed');
        } catch (error: any) {
            console.error('Registration failed', error);
            setError('root', {
                message: error.response?.data?.error || 'Falha ao criar conta. Tente novamente.',
            });
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-4">
            <div className={`z-10 w-full max-w-md glass-panel rounded-2xl p-10 relative overflow-hidden group ${isMGT ? 'border-emerald-600/50 bg-black/80' : 'border-gold-500/30'}`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${isMGT ? 'from-red-900/20' : 'from-gold-500/5'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />

                <div className="text-center mb-10 relative z-10">
                    <img
                        src={isMGT ? logoSrt : logo}
                        alt={isMGT ? "SRT" : "MAGAZINE"}
                        className={`mx-auto mb-6 ${isMGT ? 'h-20 drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]' : 'h-24 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]'}`}
                    />
                    <h2 className={`text-3xl font-bold tracking-wide ${isMGT ? 'text-white drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]' : 'text-gradient-gold'}`}>
                        {isMGT ? 'CADASTRO SRT' : 'Solicitar Convite'}
                    </h2>
                    <p className="text-gray-400 text-sm mt-3 font-light tracking-widest uppercase">
                        {isMGT ? 'Machine Gold Team' : 'Junte-se à Elite.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
                    <div>
                        <label className={`block text-xs uppercase tracking-widest mb-2 font-bold ${isMGT ? 'text-emerald-400' : 'text-gold-300'}`}>Nome Completo</label>
                        <input
                            {...register('name')}
                            type="text"
                            className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none transition-all duration-300 placeholder-gray-600 
                                ${isMGT
                                    ? 'border-red-500/20 focus:border-red-500/50 focus:shadow-[0_0_15px_rgba(220,20,60,0.1)]'
                                    : 'border-gold-500/20 focus:border-gold-500/50 focus:shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                                }`}
                            placeholder="Seu Nome"
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className={`block text-xs uppercase tracking-widest mb-2 font-bold ${isMGT ? 'text-emerald-400' : 'text-gold-300'}`}>Email</label>
                        <input
                            {...register('email')}
                            type="email"
                            className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none transition-all duration-300 placeholder-gray-600 
                                ${isMGT
                                    ? 'border-red-500/20 focus:border-red-500/50 focus:shadow-[0_0_15px_rgba(220,20,60,0.1)]'
                                    : 'border-gold-500/20 focus:border-gold-500/50 focus:shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                                }`}
                            placeholder="voce@exemplo.com"
                        />
                        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className={`block text-xs uppercase tracking-widest mb-2 font-bold ${isMGT ? 'text-emerald-400' : 'text-gold-300'}`}>Senha</label>
                        <input
                            {...register('password')}
                            type="password"
                            className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:outline-none transition-all duration-300 placeholder-gray-600 
                                ${isMGT
                                    ? 'border-red-500/20 focus:border-red-500/50 focus:shadow-[0_0_15px_rgba(220,20,60,0.1)]'
                                    : 'border-gold-500/20 focus:border-gold-500/50 focus:shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                                }`}
                            placeholder="••••••••"
                        />
                        {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full mt-6 ${isMGT ? 'btn-srt' : 'btn-primary'}`}
                    >
                        {isSubmitting ? 'Criando Conta...' : 'Criar Conta'}
                    </button>
                    {errors.root && <p className="text-red-400 text-sm text-center mt-4">{errors.root.message}</p>}
                </form>

                <div className="mt-8 text-center relative z-10">
                    <p className="text-gray-500 text-xs tracking-wide">
                        Já possui convite?
                        <Link
                            to="/login"
                            state={{ membershipType }}
                            className={`font-bold ml-1 transition-colors ${isMGT ? 'text-emerald-400 hover:text-red-300' : 'text-gold-400 hover:text-gold-300'}`}
                        >
                            Acessar Clube
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
