// Caminho: frontend/src/pages/Avaliacoes.jsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Link, MessageCircle, Star, Check, ThumbsUp, X as IconX, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEventsForFeedback, createFeedbackRecord } from '../services/api';

// Componente para renderizar as estrelas
const StarDisplay = ({ rating }) => (
    <div className="flex gap-1">
        {[...Array(5)].map((_, i) => <Star key={i} size={16} className={i < rating ? 'text-yellow-400' : 'text-gray-300'} fill={i < rating ? 'currentColor' : 'none'} />)}
    </div>
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

    // Lógica para os KPIs
    const kpis = useMemo(() => {
        const recebidos = eventos.filter(e => e.feedbackStatus === 'Recebido');
        if (recebidos.length === 0) return { mediaGeral: 0, totalRespostas: 0, depoimentos: 0 };
        
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
        const mediaGeral = totalNotas > 0 ? (somaNotas / totalNotas).toFixed(1) : 0;
        const depoimentos = eventos.filter(e => e.depoimento).length;
        return { mediaGeral, totalRespostas: recebidos.length, depoimentos };
    }, [eventos]);

    const handleSend = async () => {
        if (!eventoSelecionado) return;
        try {
            const feedbackRecord = await createFeedbackRecord(eventoSelecionado.id);
            setEventos(prev => prev.map(e => e.id === eventoSelecionado.id ? { ...e, feedbackStatus: 'Pendente', feedbackId: feedbackRecord.id } : e));
            toast.success(`Pedido de feedback enviado para ${eventoSelecionado.cliente.nome}!`);
            setEventoSelecionadoId('');
        } catch (err) {
            toast.error('Erro ao enviar pedido de feedback.');
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
            toast.success("Link copiado para a área de transferência!");
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
        return <div className="p-8 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Carregando avaliações...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Feedback de Clientes</h1>
                <p className="mt-1 text-gray-500">Envie pesquisas e colete avaliações valiosas dos seus clientes.</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="kpi-card"><Star size={24} className="text-yellow-500"/><div><p className="kpi-title">Média Geral</p><p className="kpi-value">{kpis.mediaGeral} / 5.0</p></div></div>
                <div className="kpi-card"><MessageCircle size={24} className="text-blue-500"/><div><p className="kpi-title">Total de Respostas</p><p className="kpi-value">{kpis.totalRespostas}</p></div></div>
                <div className="kpi-card"><ThumbsUp size={24} className="text-green-500"/><div><p className="kpi-title">Depoimentos</p><p className="kpi-value">{kpis.depoimentos}</p></div></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                    <h2 className="text-xl font-bold mb-4">1. Selecione um Evento Finalizado</h2>
                    <select value={eventoSelecionadoId} onChange={e => setEventoSelecionadoId(e.target.value)} className="input-form w-full">
                        <option value="">Selecione um evento finalizado...</option>
                        {/* CORREÇÃO: Inclui eventos com status 'Pendente' para que o link possa ser reenviado */}
                        {eventos.filter(e => e.feedbackStatus === 'Não Enviado' || e.feedbackStatus === 'Pendente').map(e => (
                            <option key={e.id} value={e.id}>{e.title} - {e.cliente.nome} ({e.feedbackStatus})</option>
                        ))}
                    </select>

                    {eventoSelecionado && (
                        <motion.div initial={{opacity: 0, y:10}} animate={{opacity:1, y:0}} className="mt-6 space-y-4">
                            <h2 className="text-xl font-bold mb-4">2. Envie a Pesquisa</h2>
                            <div>
                                <label className="label-form">Link da Pesquisa</label>
                                <input type="text" readOnly value={feedbackLink} className="input-form w-full bg-gray-100 dark:bg-gray-700"/>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={handleCopyLink} className="btn-secondary flex-1 flex items-center justify-center gap-2"><Link size={16}/> Copiar Link</button>
                                <a href={`https://wa.me/?text=Olá ${eventoSelecionado.cliente.nome}, gostaríamos de saber sua opinião sobre nosso serviço! ${feedbackLink}`} target="_blank" rel="noopener noreferrer" className="btn-success flex-1 flex items-center justify-center gap-2">WhatsApp</a>
                                <a href={`mailto:${eventoSelecionado.cliente.email}?subject=Sua opinião é importante para nós&body=Olá ${eventoSelecionado.cliente.nome}, gostaríamos de saber sua opinião sobre nosso serviço! Clique no link para nos avaliar: ${feedbackLink}`} className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={handleSend}><Send size={16}/> Email</a>
                            </div>
                        </motion.div>
                    )}
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                    <h2 className="text-xl font-bold mb-4">Status dos Feedbacks</h2>
                    <ul className="space-y-3">
                        {eventos.map(e => (
                            <li key={e.id} onClick={() => handleViewFeedback(e)} className={`flex justify-between items-center p-2 rounded-lg ${e.feedbackStatus === 'Recebido' ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''}`}>
                                <div>
                                    <p className="font-semibold">{e.title}</p>
                                    <p className="text-sm text-gray-500">{e.cliente.nome}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {e.depoimento && <ThumbsUp size={16} className="text-green-500" title="Marcado como depoimento"/>}
                                    <span className={`status-badge ${ e.feedbackStatus === 'Recebido' ? 'bg-green-100 text-green-800' : e.feedbackStatus === 'Pendente' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{e.feedbackStatus}</span>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-bold">Feedback Recebido</h2>
                        <p className="text-sm text-gray-500">{feedback.title} - {feedback.cliente.nome}</p>
                    </div>
                    <button onClick={aoFechar} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><IconX size={22}/></button>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"><span className="font-semibold">Comida & Bebida</span><StarDisplay rating={feedback.qualidadeComida} /></div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"><span className="font-semibold">Apresentação dos Pratos</span><StarDisplay rating={feedback.apresentacaoPratos} /></div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"><span className="font-semibold">Cordialidade da Equipe</span><StarDisplay rating={feedback.cordialidadeEquipe} /></div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"><span className="font-semibold">Eficiência do Serviço</span><StarDisplay rating={feedback.eficienciaServico} /></div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"><span className="font-semibold">Limpeza e Organização</span><StarDisplay rating={feedback.limpezaAmbiente} /></div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"><span className="font-semibold">Decoração e Ambiente</span><StarDisplay rating={feedback.decoracaoGeral} /></div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"><span className="font-semibold">NPS</span><span>{feedback.nps}</span></div>
                    
                    <div>
                        <h3 className="font-semibold mb-1">Comentário do Cliente:</h3>
                        <p className="text-gray-600 dark:text-gray-300 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 italic">"{feedback.sugestao}"</p>
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4 border-t dark:border-gray-700">
                    <button className="btn-secondary">Ocultar</button>
                    <button className="btn-success flex items-center gap-2"><ThumbsUp size={16}/> Usar como Depoimento</button>
                </div>
            </motion.div>
            </motion.div>
        )}
        </AnimatePresence>
    );
}