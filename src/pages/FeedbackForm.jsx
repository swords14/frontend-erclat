// Caminho: frontend/src/pages/FeedbackForm.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, ThumbsUp, Frown, Meh, Smile, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getFeedbackById, submitFeedback } from '@/services/api';
import toast from 'react-hot-toast';

// Componente para as estrelas
const StarRating = ({ rating, setRating }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
            <Star key={star} onClick={() => setRating(star)} className={`cursor-pointer transition-all duration-150 ease-in-out hover:scale-125 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`} fill={rating >= star ? 'currentColor' : 'none'} size={32} />
        ))}
    </div>
);

// Componente para a escala NPS (Net Promoter Score)
const NpsRating = ({ rating, setRating }) => (
    <div className="flex flex-wrap justify-center items-center gap-2 pt-2">
        {[...Array(11)].map((_, i) => (
            <button type="button" key={i} onClick={() => setRating(i)} className={`h-10 w-10 rounded-full font-bold transition-all duration-150 ease-in-out flex items-center justify-center
                ${rating === i ? 'bg-indigo-600 text-white scale-110' : 'bg-gray-200 dark:bg-gray-700 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'}`}>
                {i}
            </button>
        ))}
        <div className="w-full flex justify-between text-xs text-gray-500 mt-1 px-1">
            <span>Pouco provável</span>
            <span>Muito provável</span>
        </div>
    </div>
);

export default function FeedbackForm() {
    const { feedbackId } = useParams();
    const [evento, setEvento] = useState(null);
    const [avaliacoes, setAvaliacoes] = useState({ qualidadeComida: 0, apresentacaoPratos: 0, cordialidadeEquipe: 0, eficienciaServico: 0, limpezaAmbiente: 0, decoracaoGeral: 0 });
    const [nps, setNps] = useState(null);
    const [sugestao, setSugestao] = useState('');
    const [autorizacao, setAutorizacao] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFeedbackData = async () => {
            setIsLoading(true);
            try {
                // AQUI USAMOS A NOVA FUNÇÃO getFeedbackById que não precisa de autenticação
                const data = await getFeedbackById(feedbackId);
                setEvento(data.event);
            } catch (err) {
                setError(err.message);
                toast.error('Erro ao carregar dados do formulário.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchFeedbackData();
    }, [feedbackId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const notas = { ...avaliacoes, nps };
            // AQUI USAMOS A NOVA FUNÇÃO submitFeedback que não precisa de autenticação
            await submitFeedback(feedbackId, { notas, sugestao, autorizacao });
            setEnviado(true);
        } catch (err) {
            toast.error('Erro ao enviar seu feedback.');
        }
    };
    
    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin mr-2" /> Carregando formulário...</div>;
    }
    
    if (error) {
        return <div className="min-h-screen flex items-center justify-center text-red-500 text-lg">Erro: {error}</div>;
    }

    if (enviado) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-center p-4">
                <motion.div initial={{opacity:0, scale:0.8}} animate={{opacity:1, scale:1}} className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl">
                    <ThumbsUp className="mx-auto text-green-500 mb-4" size={48}/>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Obrigado, {evento?.client?.nome || ''}!</h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">Seu feedback foi recebido com sucesso e é muito importante para nós.</p>
                </motion.div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-3xl">
                <h1 className="text-3xl font-bold text-center mb-2 text-gray-800 dark:text-white">Sua Opinião Sobre o Evento</h1>
                <p className="text-center text-gray-500 dark:text-gray-400 mb-8 font-semibold text-indigo-500">{evento?.title || '...'}</p>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Seção de Avaliações Detalhadas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"><label className="font-semibold block mb-2">Qualidade da Comida</label><StarRating rating={avaliacoes.qualidadeComida} setRating={val => setAvaliacoes({...avaliacoes, qualidadeComida: val})} /></div>
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"><label className="font-semibold block mb-2">Apresentação dos Pratos</label><StarRating rating={avaliacoes.apresentacaoPratos} setRating={val => setAvaliacoes({...avaliacoes, apresentacaoPratos: val})} /></div>
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"><label className="font-semibold block mb-2">Cordialidade da Equipe</label><StarRating rating={avaliacoes.cordialidadeEquipe} setRating={val => setAvaliacoes({...avaliacoes, cordialidadeEquipe: val})} /></div>
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"><label className="font-semibold block mb-2">Eficiência do Serviço</label><StarRating rating={avaliacoes.eficienciaServico} setRating={val => setAvaliacoes({...avaliacoes, eficienciaServico: val})} /></div>
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"><label className="font-semibold block mb-2">Limpeza e Organização</label><StarRating rating={avaliacoes.limpezaAmbiente} setRating={val => setAvaliacoes({...avaliacoes, limpezaAmbiente: val})} /></div>
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"><label className="font-semibold block mb-2">Decoração e Ambiente</label><StarRating rating={avaliacoes.decoracaoGeral} setRating={val => setAvaliacoes({...avaliacoes, decoracaoGeral: val})} /></div>
                    </div>

                    {/* Seção NPS */}
                    <div className="text-center border-t dark:border-gray-700 pt-6">
                        <label className="font-semibold text-lg">Em uma escala de 0 a 10, o quanto você nos recomendaria a um amigo ou familiar?</label>
                        <NpsRating rating={nps} setRating={setNps} />
                    </div>
                    
                    <div><label className="label-form">Deixe um comentário ou sugestão (opcional)</label><textarea value={sugestao} onChange={e => setSugestao(e.target.value)} rows="4" className="input-form w-full"></textarea></div>
                    
                    <div className="flex items-center gap-3"><input type="checkbox" id="auth" checked={autorizacao} onChange={e => setAutorizacao(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label htmlFor="auth" className="text-sm text-gray-600 dark:text-gray-300">Autorizo o uso do meu feedback (de forma anônima) como depoimento.</label></div>

                    <button type="submit" className="btn-primary w-full !py-3 !text-base">Enviar Avaliação</button>
                </form>
            </motion.div>
        </div>
    );
}