import { useState, useRef, useEffect } from 'react';
import { X, ScrollText, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TermsOfServiceModalProps {
    isOpen: boolean;
    onAccept: () => void;
    onClose: () => void;
    isMGT: boolean;
}

export default function TermsOfServiceModal({ isOpen, onAccept, onClose, isMGT }: TermsOfServiceModalProps) {
    const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setHasScrolledToEnd(false);
            setAcceptedTerms(false);
        }
    }, [isOpen]);

    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (container) {
            const { scrollTop, scrollHeight, clientHeight } = container;
            // Consider scrolled to end if within 20px of bottom
            if (scrollHeight - scrollTop - clientHeight < 20) {
                setHasScrolledToEnd(true);
            }
        }
    };

    const handleAccept = () => {
        if (hasScrolledToEnd && acceptedTerms) {
            onAccept();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                >
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
                    
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className={`relative w-full max-w-2xl max-h-[90vh] bg-neutral-950/95 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden border ${isMGT ? 'border-emerald-500/30' : 'border-gold-500/30'}`}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between p-4 border-b ${isMGT ? 'border-emerald-500/20' : 'border-gold-500/20'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isMGT ? 'bg-emerald-500/20' : 'bg-gold-500/20'}`}>
                                    <ScrollText className={`w-5 h-5 ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Termos de Uso e Privacidade</h2>
                                    <p className="text-xs text-gray-400">Leia atentamente antes de criar sua conta</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div 
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                            className="p-6 overflow-y-auto max-h-[50vh] text-sm text-gray-300 space-y-4"
                        >
                            <h3 className={`text-lg font-bold ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`}>
                                TERMOS DE USO DA PLATAFORMA {isMGT ? 'MGT' : 'MAGAZINE'}
                            </h3>
                            
                            <p className="text-gray-400 text-xs">Última atualização: Janeiro de 2026</p>

                            <section className="space-y-2">
                                <h4 className="font-bold text-white">1. ACEITAÇÃO DOS TERMOS</h4>
                                <p>
                                    Ao criar uma conta e utilizar a plataforma {isMGT ? 'MGT' : 'Magazine'}, você declara ter lido, compreendido e aceito 
                                    integralmente estes Termos de Uso e a Política de Privacidade. O uso da plataforma está condicionado à aceitação 
                                    destes termos. Caso não concorde com qualquer disposição, não utilize nossos serviços.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-bold text-white">2. CADASTRO E CONTA DE USUÁRIO</h4>
                                <p>
                                    2.1. Para utilizar a plataforma, é necessário criar uma conta fornecendo informações verídicas e atualizadas, 
                                    incluindo nome completo, endereço de e-mail válido e senha segura.
                                </p>
                                <p>
                                    2.2. Você é responsável pela veracidade das informações fornecidas e pela confidencialidade de sua senha e 
                                    credenciais de acesso.
                                </p>
                                <p>
                                    2.3. A plataforma reserva-se o direito de suspender ou cancelar contas que violem estes termos ou que apresentem 
                                    informações falsas.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-bold text-white">3. PRIVACIDADE E PROTEÇÃO DE DADOS (LGPD)</h4>
                                <p>
                                    3.1. Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD), coletamos e tratamos 
                                    seus dados pessoais para as seguintes finalidades:
                                </p>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Criação e manutenção de sua conta de usuário;</li>
                                    <li>Personalização de sua experiência na plataforma;</li>
                                    <li>Comunicação sobre atualizações e novidades;</li>
                                    <li>Cumprimento de obrigações legais;</li>
                                    <li>Melhoria dos nossos serviços.</li>
                                </ul>
                                <p>
                                    3.2. Dados coletados: nome, e-mail, foto de perfil (opcional), preferências de customização, histórico de 
                                    atividades na plataforma e dados de navegação.
                                </p>
                                <p>
                                    3.3. Base legal: o tratamento de seus dados é fundamentado no seu consentimento e na execução do contrato 
                                    de uso da plataforma.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-bold text-white">4. DIREITOS DO TITULAR DOS DADOS</h4>
                                <p>
                                    Conforme a LGPD, você tem direito a:
                                </p>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Confirmar a existência de tratamento de seus dados;</li>
                                    <li>Acessar seus dados pessoais;</li>
                                    <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
                                    <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
                                    <li>Solicitar a portabilidade dos dados a outro fornecedor;</li>
                                    <li>Revogar o consentimento a qualquer momento;</li>
                                    <li>Excluir sua conta e dados associados.</li>
                                </ul>
                                <p>
                                    Para exercer estes direitos, entre em contato através das configurações da sua conta ou pelo e-mail de suporte.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-bold text-white">5. CONTEÚDO DO USUÁRIO</h4>
                                <p>
                                    5.1. Você é integralmente responsável pelo conteúdo que publica, incluindo textos, imagens, vídeos e comentários.
                                </p>
                                <p>
                                    5.2. É proibida a publicação de conteúdo que:
                                </p>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Viole direitos autorais ou propriedade intelectual de terceiros;</li>
                                    <li>Contenha discurso de ódio, discriminação ou incitação à violência;</li>
                                    <li>Seja ilegal, difamatório ou que viole a privacidade de terceiros;</li>
                                    <li>Contenha material pornográfico ou de exploração;</li>
                                    <li>Promova atividades ilegais ou fraudulentas;</li>
                                    <li>Contenha malware, vírus ou código malicioso.</li>
                                </ul>
                                <p>
                                    5.3. A plataforma pode remover conteúdo que viole estes termos sem aviso prévio.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-bold text-white">6. SISTEMA DE MOEDA VIRTUAL (ZIONS)</h4>
                                <p>
                                    6.1. Os Zions são uma moeda virtual de uso exclusivo dentro da plataforma, sem valor monetário real.
                                </p>
                                <p>
                                    6.2. Os Zions podem ser obtidos através de atividades na plataforma como login diário, interações e recompensas.
                                </p>
                                <p>
                                    6.3. Os Zions não podem ser convertidos em moeda real, transferidos para terceiros fora da plataforma ou 
                                    reembolsados.
                                </p>
                                <p>
                                    6.4. A plataforma reserva-se o direito de modificar o sistema de Zions a qualquer momento.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-bold text-white">7. MERCADO E TRANSAÇÕES</h4>
                                <p>
                                    7.1. O mercado permite a compra e venda de itens virtuais entre usuários utilizando Zions.
                                </p>
                                <p>
                                    7.2. Uma taxa de serviço de 5% é aplicada sobre o valor de cada venda realizada no mercado.
                                </p>
                                <p>
                                    7.3. Todas as transações são finais e não são passíveis de reembolso.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-bold text-white">8. PROPRIEDADE INTELECTUAL</h4>
                                <p>
                                    8.1. Todo o conteúdo da plataforma, incluindo design, logos, textos e código, é propriedade exclusiva da 
                                    {isMGT ? ' MGT' : ' Magazine'} ou de seus licenciadores.
                                </p>
                                <p>
                                    8.2. É proibida a reprodução, distribuição ou modificação do conteúdo da plataforma sem autorização prévia.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-bold text-white">9. LIMITAÇÃO DE RESPONSABILIDADE</h4>
                                <p>
                                    9.1. A plataforma é fornecida "como está", sem garantias de disponibilidade contínua ou ausência de erros.
                                </p>
                                <p>
                                    9.2. Não nos responsabilizamos por danos diretos ou indiretos decorrentes do uso da plataforma, incluindo 
                                    perda de dados ou interrupções de serviço.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-bold text-white">10. MODIFICAÇÕES DOS TERMOS</h4>
                                <p>
                                    Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão 
                                    comunicadas através da plataforma. O uso continuado após as modificações constitui aceitação dos novos termos.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-bold text-white">11. LEI APLICÁVEL E FORO</h4>
                                <p>
                                    Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca do 
                                    domicílio do usuário para dirimir quaisquer controvérsias, respeitando-se o Código de Defesa do Consumidor.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-bold text-white">12. CONTATO</h4>
                                <p>
                                    Para dúvidas sobre estes termos ou sobre o tratamento de seus dados pessoais, entre em contato através das 
                                    configurações da sua conta ou pelo canal de suporte da plataforma.
                                </p>
                            </section>

                            <div className={`mt-6 p-4 rounded-lg ${isMGT ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-gold-500/10 border border-gold-500/30'}`}>
                                <p className="text-center text-sm">
                                    Ao criar uma conta, você declara ser maior de 18 anos ou ter autorização de responsável legal, e concorda 
                                    integralmente com estes Termos de Uso e com a Política de Privacidade.
                                </p>
                            </div>
                        </div>

                        {/* Scroll indicator */}
                        {!hasScrolledToEnd && (
                            <div className="absolute bottom-32 left-0 right-0 flex justify-center pointer-events-none">
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full animate-bounce ${isMGT ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-400'}`}>
                                    <ChevronDown className="w-4 h-4" />
                                    <span className="text-xs">Role até o final para continuar</span>
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </div>
                        )}

                        {/* Footer with checkbox and button */}
                        <div className={`p-4 border-t ${isMGT ? 'border-emerald-500/20 bg-black/50' : 'border-gold-500/20 bg-black/50'}`}>
                            <label 
                                className={`flex items-start gap-3 mb-4 cursor-pointer ${!hasScrolledToEnd ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                <div className={`relative flex-shrink-0 w-5 h-5 rounded border-2 transition-colors ${
                                    acceptedTerms 
                                        ? (isMGT ? 'bg-emerald-500 border-emerald-500' : 'bg-gold-500 border-gold-500')
                                        : (isMGT ? 'border-emerald-500/50' : 'border-gold-500/50')
                                }`}>
                                    {acceptedTerms && <Check className="w-4 h-4 text-black absolute top-0 left-0" />}
                                    <input
                                        type="checkbox"
                                        checked={acceptedTerms}
                                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                                        disabled={!hasScrolledToEnd}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                                <span className="text-sm text-gray-300">
                                    Li e aceito os <span className={isMGT ? 'text-emerald-400' : 'text-gold-400'}>Termos de Uso</span> e a{' '}
                                    <span className={isMGT ? 'text-emerald-400' : 'text-gold-400'}>Política de Privacidade</span>, incluindo o 
                                    tratamento dos meus dados pessoais conforme a LGPD.
                                </span>
                            </label>

                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAccept}
                                    disabled={!hasScrolledToEnd || !acceptedTerms}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                        hasScrolledToEnd && acceptedTerms
                                            ? (isMGT 
                                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                                                : 'bg-gold-500 hover:bg-gold-400 text-black')
                                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    <Check className="w-4 h-4" />
                                    Aceitar e Continuar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
