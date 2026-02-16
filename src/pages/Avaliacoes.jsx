import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Link as LinkIcon, MessageCircle, Star, ThumbsUp, X as IconX, Loader2, MessageSquareHeart, Quote } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEventsForFeedback, createFeedbackRecord } from '@/services/api';

const inputPremiumClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-gray-700 font-medium";
const labelPremiumClass = "block text-sm font-bold text-gray-700 mb-1.5 ml-1";

// Componente para renderizar as estrelas (Premium)
const StarDisplay = ({ rating }) => (
    <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
            <Star 
                key={i} 
                size={18} 
                strokeWidth={i < rating ? 1 : 2}
                className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} 
            />
        ))}
    </div>
);

const FeedbackStatusBadge = ({ status }) => {
    const statusConfig = {
        'Recebido': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
        'Pendente': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        'Não Enviado': { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' }
    }[status] || { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm tracking-wide ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
            {status}
        </span>
    );
};

const KPICard = ({ title, value, icon: Icon, corIcone = "text-amber-500", bgIcone = "bg-amber-50" }) => (
    <motion.div 
        whileHover={{ y: -4 }} 
        className="bg-white p-6 rounded-2xl border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex items-center gap-5 transition-all duration-300 hover:border-amber-300 hover:shadow-[0_4px_20px_rgba(245,158,11,0.05)]"
    >
        <div className={`p-3.5 ${bgIcone} border border-gray-100 rounded-xl`}>
            <Icon className={corIcone} size={24} strokeWidth={1.5} />
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium tracking-wide">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        </div>
    </motion.div>
);

export default function Avaliacoes() {
    const [eventos, setEventos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [eventoSelecionadoId, setEventoSelecionadoId] = useState('');
    const [modalAberto, setModalAberto] = useState(false);
    const [feedbackVisivel, setFeedbackVisivel] = useState(null);

    const eventoSelecionado = useMemo(() => eventos.find(e => e.id === eventoSelecionadoId), [eventos, eventoSelecionadoId]);
    const feedbackLink = eventoSelecionado?.feedbackId ? `${window.location.origin}/feedback/${eventoSelecionado.feedbackId}` : '';

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getEventsForFeedback();
            setEventos(data);
        } catch (err) {
            toast.error('Erro ao buscar eventos para feedback.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const kpis = useMemo(() => {
        const recebidos = eventos.filter(e => e.feedbackStatus === 'Recebido');
        if (recebidos.length === 0) return { mediaGeral: "0.0", totalRespostas: 0, depoimentos: 0 };
        
        let somaNotas = 0;
        let totalNotas = 0;
        recebidos.forEach(evento => {
            if (evento.feedbackData?.notasJson) {
                const notas = JSON.parse(evento.feedbackData.notasJson);
                const notasArray = Object.values(notas).filter(v => typeof v === 'number');
                somaNotas += notasArray.reduce((acc, nota) => acc + nota, 0);
                totalNotas += notasArray.length;
            }
        });
        const mediaGeral = totalNotas > 0 ? (somaNotas / totalNotas).toFixed(1) : "0.0";
        const depoimentos = eventos.filter(e => e.depoimento).length;
        return { mediaGeral, totalRespostas: recebidos.length, depoimentos };
    }, [eventos]);

    const handleSendEmail = async (e) => {
        e.preventDefault();
        if (!eventoSelecionado) return;
        try {
            const feedbackRecord = await createFeedbackRecord(eventoSelecionado.id);
            setEventos(prev => prev.map(ev => ev.id === eventoSelecionado.id ? { ...ev, feedbackStatus: 'Pendente', feedbackId: feedbackRecord.id } : ev));
            
            // Abre o cliente de email
            const link = `${window.location.origin}/feedback/${feedbackRecord.id}`;
            window.location.href = `mailto:${eventoSelecionado.cliente.email}?subject=Sua opinião é muito importante para nós!&body=Olá ${eventoSelecionado.cliente.nome},%0D%0A%0D%0AGostaríamos de saber como foi sua experiência conosco! Clique no link abaixo para nos avaliar:%0D%0A${link}`;
            
            toast.success(`Pedido registrado e cliente de email aberto!`);
        } catch (err) {
            toast.error('Erro ao processar pedido de feedback.');
        }
    };
    
    const handleSendWhatsApp = async (e) => {
        e.preventDefault();
        if (!eventoSelecionado) return;
        try {
            const feedbackRecord = await createFeedbackRecord(eventoSelecionado.id);
            setEventos(prev => prev.map(ev => ev.id === eventoSelecionado.id ? { ...ev, feedbackStatus: 'Pendente', feedbackId: feedbackRecord.id } : ev));
            
            // Abre o WhatsApp
            const link = `${window.location.origin}/feedback/${feedbackRecord.id}`;
            window.open(`https://wa.me/?text=Olá ${eventoSelecionado.cliente.nome}, tudo bem? Gostaríamos de saber como foi a sua experiência com o nosso serviço! O seu feedback é super rápido e muito importante para nós: ${link}`, '_blank');
            
            toast.success(`Pedido registrado e WhatsApp aberto!`);
        } catch (err) {
            toast.error('Erro ao processar pedido de feedback.');
        }
    };

    const handleCopyLink = async () => {
        if (!eventoSelecionado) {
            toast.error("Selecione um evento primeiro.");
            return;
        }
        try {
            const feedbackRecord = await createFeedbackRecord(eventoSelecionado.id);
            const link = `${window.location.origin}/feedback/${feedbackRecord.id}`;
            await navigator.clipboard.writeText(link);
            setEventos(prev => prev.map(e => e.id === eventoSelecionado.id ? { ...e, feedbackStatus: 'Pendente', feedbackId: feedbackRecord.id } : e));
            toast.success("Link de avaliação copiado com sucesso!");
        } catch (err) {
            toast.error("Erro ao gerar link de feedback.");
        }
    };

    const handleViewFeedback = (evento) => {
        if (evento.feedbackStatus === 'Recebido') {
            const notas = evento.feedbackData?.notasJson ? JSON.parse(evento.feedbackData.notasJson) : {};
            setFeedbackVisivel({
                ...evento,
                ...notas,
                sugestao: evento.feedbackData?.sugestao
            });
            setModalAberto(true);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mb-4"></div>
                <p className="text-gray-500 font-bold tracking-wide">Buscando avaliações...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8 min-h-screen">
            <header>
                <h1 className="text-3xl font-light text-gray-800 tracking-wide flex items-center gap-3">
                    Central de <span className="font-bold text-amber-600">Avaliações</span>
                    <MessageSquareHeart className="text-amber-400" size={28} />
                </h1>
                <p className="mt-1 text-gray-500 font-medium">Colete depoimentos e mensure a satisfação dos seus clientes.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <KPICard title="Média Geral de Satisfação" value={`${kpis.mediaGeral} / 5.0`} icon={Star} corIcone="text-amber-500" bgIcone="bg-amber-50" />
                <KPICard title="Total de Respostas" value={kpis.totalRespostas} icon={MessageCircle} corIcone="text-blue-500" bgIcone="bg-blue-50" />
                <KPICard title="Depoimentos Coletados" value={kpis.depoimentos} icon={ThumbsUp} corIcone="text-emerald-500" bgIcone="bg-emerald-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Lado Esquerdo: Envio de Pesquisa */}
                <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">1. Selecionar Cliente / Evento</h2>
                    <p className="text-sm text-gray-500 font-medium mb-6">Escolha um evento já finalizado para enviar a solicitação.</p>
                    
                    <select value={eventoSelecionadoId} onChange={e => setEventoSelecionadoId(e.target.value)} className={inputPremiumClass}>
                        <option value="">Selecione um evento finalizado na base...</option>
                        {eventos.filter(e => e.feedbackStatus === 'Não Enviado' || e.feedbackStatus === 'Pendente').map(e => (
                            <option key={e.id} value={e.id}>{e.title} - {e.cliente?.nome} ({e.feedbackStatus})</option>
                        ))}
                    </select>

                    <AnimatePresence mode="wait">
                        {eventoSelecionado && (
                            <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} className="mt-8 pt-8 border-t border-gray-100 overflow-hidden">
                                <h2 className="text-xl font-bold text-gray-800 mb-2">2. Disparar Pesquisa de Satisfação</h2>
                                <p className="text-sm text-gray-500 font-medium mb-6">Envie o link exclusivo gerado para este cliente.</p>
                                
                                <div className="mb-6">
                                    <label className={labelPremiumClass}>Link Exclusivo de Avaliação</label>
                                    <div className="flex items-center">
                                        <input type="text" readOnly value={feedbackLink || 'Gerando link ao clicar...'} className={`${inputPremiumClass} bg-gray-100 text-gray-500 rounded-r-none border-r-0 truncate`} />
                                        <button onClick={handleCopyLink} className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-r-xl border border-gray-200 transition-colors flex items-center gap-2">
                                            <LinkIcon size={18} /> Copiar
                                        </button>
                                    </div>
                                </div>
                                
                                <label className={labelPremiumClass}>Compartilhar via:</label>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <button onClick={handleSendWhatsApp} className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                                        WhatsApp
                                    </button>
                                    <button onClick={handleSendEmail} className="px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2">
                                        <Send size={18} /> E-mail
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                {/* Lado Direito: Histórico */}
                <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Histórico de Feedbacks</h2>
                        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">{eventos.length} registros</span>
                    </div>
                    
                    <ul className="space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
                        {eventos.length === 0 && <p className="text-gray-400 font-medium text-center py-10">Nenhum evento finalizado disponível.</p>}
                        
                        {eventos.map(e => (
                            <li 
                                key={e.id} 
                                onClick={() => handleViewFeedback(e)} 
                                className={`flex justify-between items-center p-4 rounded-xl border transition-all duration-200
                                    ${e.feedbackStatus === 'Recebido' 
                                        ? 'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-md cursor-pointer group' 
                                        : 'bg-gray-50/50 border-transparent opacity-80'
                                    }`
                                }
                            >
                                <div>
                                    <p className={`font-bold ${e.feedbackStatus === 'Recebido' ? 'text-gray-900 group-hover:text-emerald-700 transition-colors' : 'text-gray-700'}`}>{e.title}</p>
                                    <p className="text-sm text-gray-500 font-medium mt-0.5">{e.cliente?.nome || 'Cliente Removido'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {e.depoimento && <ThumbsUp size={18} className="text-emerald-500" title="Utilizado como Depoimento"/>}
                                    <FeedbackStatusBadge status={e.feedbackStatus} />
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <ModalFeedback aberto={modalAberto} aoFechar={() => setModalAberto(false)} feedback={feedbackVisivel} />
        </div>
    );
}

function ModalFeedback({ aberto, aoFechar, feedback }) {
    if (!feedback) return null;
    return (
        <AnimatePresence>
            {aberto && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
                    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        
                        <div className="p-6 md:p-8 flex justify-between items-start border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                    <Star className="text-amber-500 fill-amber-500" size={24}/> Resultado da Avaliação
                                </h2>
                                <p className="text-sm font-medium text-gray-500 mt-1">{feedback.title} • Cliente: <span className="font-bold text-gray-700">{feedback.cliente?.nome}</span></p>
                            </div>
                            <button onClick={aoFechar} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"><IconX size={24}/></button>
                        </div>

                        <div className="p-8 space-y-6 overflow-y-auto flex-grow custom-scrollbar">
                            
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Avaliação Técnica (Critérios)</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex justify-between items-center p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                                    <span className="font-bold text-gray-700 text-sm">Comida & Bebida</span>
                                    <StarDisplay rating={feedback.qualidadeComida} />
                                </div>
                                <div className="flex justify-between items-center p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                                    <span className="font-bold text-gray-700 text-sm">Apresentação</span>
                                    <StarDisplay rating={feedback.apresentacaoPratos} />
                                </div>
                                <div className="flex justify-between items-center p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                                    <span className="font-bold text-gray-700 text-sm">Cordialidade</span>
                                    <StarDisplay rating={feedback.cordialidadeEquipe} />
                                </div>
                                <div className="flex justify-between items-center p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                                    <span className="font-bold text-gray-700 text-sm">Eficiência</span>
                                    <StarDisplay rating={feedback.eficienciaServico} />
                                </div>
                                <div className="flex justify-between items-center p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                                    <span className="font-bold text-gray-700 text-sm">Limpeza/Ordem</span>
                                    <StarDisplay rating={feedback.limpezaAmbiente} />
                                </div>
                                <div className="flex justify-between items-center p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                                    <span className="font-bold text-gray-700 text-sm">Decoração</span>
                                    <StarDisplay rating={feedback.decoracaoGeral} />
                                </div>
                            </div>

                            <div className="mt-8 flex justify-between items-center p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
                                <span className="font-bold text-indigo-900">Net Promoter Score (NPS)</span>
                                <span className="text-2xl font-black text-indigo-600">{feedback.nps || 'N/A'}</span>
                            </div>
                            
                            {feedback.sugestao && (
                                <div className="mt-8">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Mensagem do Cliente</h3>
                                    <div className="relative p-6 rounded-2xl bg-amber-50/50 border border-amber-100">
                                        <Quote className="absolute top-4 left-4 text-amber-200 rotate-180" size={32} />
                                        <p className="text-gray-700 font-medium text-lg italic leading-relaxed relative z-10 pl-10">
                                            "{feedback.sugestao}"
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 md:p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-4 flex-shrink-0 rounded-b-[2rem]">
                            <button onClick={aoFechar} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">Fechar Leitura</button>
                            <button className="px-6 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold rounded-xl flex items-center gap-2 transition-colors">
                                <ThumbsUp size={18} strokeWidth={2.5}/> Salvar como Depoimento
                            </button>
                        </div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}