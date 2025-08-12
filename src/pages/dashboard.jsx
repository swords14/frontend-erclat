// Caminho do arquivo: frontend/src/pages/dashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';
import { Calendar, DollarSign, AlertTriangle, Users, Target, Activity, CheckCircle, Clock, ListTodo, MessageSquare, Briefcase, PiggyBank, FileText } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
// Importe a função da sua API central
import { getDashboardData } from '../services/api'; // Ajuste o caminho se necessário

// --- ESTRUTURA INICIAL E ORDENADA DOS CARDS ---
const initialCardLayout = [
    { id: 'kpi-eventosNoPeriodo', type: 'kpi', icone: Briefcase, titulo: "Eventos no Período", valorKey: "eventosNoPeriodo", linkTo: "/eventos" },
    { id: 'kpi-receitaRealizada', type: 'kpi', icone: DollarSign, titulo: "Receita Realizada", valorKey: "receitaRealizada", cor: "text-green-500", format: 'currency' },
    { id: 'kpi-despesaRealizada', type: 'kpi', icone: PiggyBank, titulo: "Despesa Realizada", valorKey: "despesaRealizada", cor: "text-red-500", format: 'currency' },
    { id: 'kpi-taxaConversao', type: 'kpi', icone: Target, titulo: "Taxa de Conversão", valorKey: "taxaConversao", cor: "text-amber-500", suffix: '%' },
    { id: 'acao-orcamentosPendentes', type: 'acao', icone: FileText, texto: "Orçamentos Pendentes", valorKey: "orcamentosPendentes", linkTo: "/orcamentos" },
    { id: 'acao-tarefasAtrasadas', type: 'acao', icone: ListTodo, texto: "Tarefas Atrasadas", valorKey: "tarefasAtrasadas", linkTo: "/tarefas" },
    { id: 'acao-pagamentosAtrasados', type: 'acao', icone: Clock, texto: "Pagamentos em Atraso", valorKey: "pagamentosAtrasados", linkTo: "/financeiro" },
    { id: 'acao-feedbacksPendentes', type: 'acao', icone: MessageSquare, texto: "Feedbacks Pendentes", valorKey: "feedbacksPendentes", linkTo: "/avaliacoes" },
];

// --- HOOK PERSONALIZADO PARA GERENCIAR DADOS DA DASHBOARD ---
const useDashboardData = () => {
    const { currentUser } = useAuth();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [periodo, setPeriodo] = useState('mes');
    const [dashboardCards, setDashboardCards] = useState(initialCardLayout);

    // CORRIGIDO: Usa a função centralizada getDashboardData
    const fetchData = useCallback(async (currentPeriod) => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const apiData = await getDashboardData(currentPeriod);
            setData(apiData);
        } catch (error) {
            toast.error(error.message || 'Falha ao buscar os dados da dashboard.');
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchData(periodo);
    }, [periodo, fetchData]);

    const saveLayout = async (newLayout) => {
        setDashboardCards(newLayout);
        // Implementar a chamada da API para salvar o layout no backend
    };

    return { data, isLoading, periodo, setPeriodo, dashboardCards, saveLayout, currentUser };
};


// --- COMPONENTES DE UI PADRONIZADOS ---
const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const KPICard = React.memo(({ card, valor }) => {
    const { icone: Icone, titulo, texto, linkTo, cor, format: formatType, suffix = '' } = card;
    const valorFormatado = formatType === 'currency' ? formatarMoeda(valor) : `${valor || 0}${suffix}`;
    const content = (
        <motion.div whileHover={{ scale: 1.03 }} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex items-center gap-4 h-full border border-gray-200 dark:border-gray-700">
            <div className={`p-3 rounded-lg ${card.type === 'acao' && valor > 0 ? 'bg-red-100 dark:bg-red-900/50' : 'bg-indigo-100 dark:bg-gray-700'}`}>
                <Icone size={24} className={card.type === 'acao' && valor > 0 ? 'text-red-500' : cor || 'text-indigo-500'} />
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{titulo || texto}</p>
                <p className={`text-2xl font-bold ${cor || 'text-gray-800 dark:text-white'}`}>{valorFormatado}</p>
            </div>
        </motion.div>
    );
    return linkTo ? <Link to={linkTo} className="h-full block">{content}</Link> : <div className="h-full">{content}</div>;
});

const BotaoPeriodo = ({ texto, periodo, periodoAtivo, setPeriodo }) => (
    <button onClick={() => setPeriodo(periodo)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${periodoAtivo === periodo ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'}`}>
        {texto}
    </button>
);

// --- COMPONENTES DO CONTEÚDO DA DASHBOARD (MEMOIZADOS) ---
const PainelGraficos = React.memo(({ data }) => {
    const [abaAtiva, setAbaAtiva] = useState('financeiro');
    const COLORS = ['#10b981', '#ef4444', '#6366f1', '#f59e0b', '#8b5cf6'];
    const TabButton = ({ abaId, children }) => (
        <button onClick={() => setAbaAtiva(abaId)} className={`px-1 py-3 text-sm font-medium border-b-2 transition-all duration-200 focus:outline-none ${abaAtiva === abaId ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
            {children}
        </button>
    );

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 space-x-6">
                <TabButton abaId="financeiro">Financeiro</TabButton>
                <TabButton abaId="operacional">Operacional</TabButton>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                {abaAtiva === 'financeiro' ? (
                    <LineChart data={data.graficoFinanceiro}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} tickFormatter={(value) => `R$${value/1000}k`} />
                        <Tooltip formatter={(value) => formatarMoeda(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} name="Receita" />
                        <Line type="monotone" dataKey="despesa" stroke="#ef4444" strokeWidth={2} name="Despesa" />
                    </LineChart>
                ) : (
                    <PieChart>
                        <Pie data={data.graficoStatusEventos} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} label>
                            {data.graficoStatusEventos?.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                )}
            </ResponsiveContainer>
        </div>
    );
});

const ListaTarefas = React.memo(({ tarefas }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Próximas Tarefas Críticas</h3>
        <div className="space-y-3 max-h-48 overflow-y-auto">
            {tarefas?.length > 0 ? (
                tarefas.map(task => (
                    <div key={task.id} className="flex items-start gap-3">
                        <div className={`mt-1.5 w-2 h-2 rounded-full ${
                            task.prioridade?.toLowerCase() === 'alta' ? 'bg-red-500' :
                            'bg-yellow-500'
                        }`}></div>
                        <div>
                            <p className="font-semibold text-sm text-gray-700 dark:text-gray-200">{task.descricao}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {task.evento} - Vence em: {format(new Date(task.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="mx-auto w-8 h-8 text-green-500 mb-2" />
                    <p>Nenhuma tarefa crítica pendente!</p>
                </div>
            )}
        </div>
    </div>
));

const FeedAtividades = React.memo(({ atividades }) => {
    const icones = { NOVO_CLIENTE: <Users className="text-sky-500" size={20} />, EVENTO_CONFIRMADO: <Calendar className="text-green-500" size={20} />, PAGAMENTO_RECEBIDO: <DollarSign className="text-indigo-500" size={20} />, FEEDBACK_RECEBIDO: <MessageSquare className="text-amber-500" size={20} />, ATIVIDADE_GERAL: <Activity size={20} /> };
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Atividade Recente</h3>
            <div className="space-y-4 max-h-56 overflow-y-auto">
                {atividades?.length > 0 ? (
                    atividades.map(item => (
                        <div key={item.id} className="flex items-start gap-4"><div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">{icones[item.tipo] || <Activity size={20} />}</div><div><p className="text-sm text-gray-700 dark:text-gray-200">{item.texto}</p><p className="text-xs text-gray-500 dark:text-gray-400">{item.user} • {formatDistanceToNow(new Date(item.data), { addSuffix: true, locale: ptBR })}</p></div></div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500"><Activity className="mx-auto w-8 h-8 mb-2" /><p>Nenhuma atividade recente.</p></div>
                )}
            </div>
        </div>
    );
});

const SkeletonDashboard = () => (
    <div className="flex flex-col gap-8 p-1 animate-pulse"><div className="flex justify-between items-center"><div><div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-64 mb-2"></div><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-80"></div></div><div className="h-10 bg-gray-300 dark:bg-gray-700 rounded-lg w-56"></div></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"><div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div><div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div><div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div><div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div><div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div><div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div><div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div><div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div><div className="lg:col-span-1 space-y-6"><div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div><div className="h-56 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div></div></div></div>
);

// --- COMPONENTE PRINCIPAL DA DASHBOARD ---
export default function Dashboard() {
    const { data, isLoading, periodo, setPeriodo, dashboardCards, saveLayout, currentUser } = useDashboardData();

    const onDragEnd = (result) => {
        const { source, destination } = result;
        if (!destination) return;
        const newCards = Array.from(dashboardCards);
        const [reorderedItem] = newCards.splice(source.index, 1);
        newCards.splice(destination.index, 0, reorderedItem);
        saveLayout(newCards);
    };

    if (isLoading && !data) {
        return <SkeletonDashboard />;
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">Ocorreu um erro</h3>
                <p className="text-gray-500 dark:text-gray-400">Não foi possível carregar os dados da dashboard.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Olá, {currentUser.nome}! 👋</h2>
                    <p className="text-gray-500 dark:text-gray-400">Bem-vindo(a) de volta ao seu painel.</p>
                </div>
                <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                    <BotaoPeriodo texto="Este Mês" periodo="mes" periodoAtivo={periodo} setPeriodo={setPeriodo} />
                    <BotaoPeriodo texto="3 Meses" periodo="trimestre" periodoAtivo={periodo} setPeriodo={setPeriodo} />
                    <BotaoPeriodo texto="Este Ano" periodo="ano" periodoAtivo={periodo} setPeriodo={setPeriodo} />
                </div>
            </header>
            
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="dashboard-cards">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {dashboardCards.map((card, index) => (
                                <Draggable key={card.id} draggableId={card.id} index={index}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                            <KPICard card={card} valor={data.kpis?.[card.valorKey]} />
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <PainelGraficos data={data} />
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <ListaTarefas tarefas={data.proximasTarefas} />
                    <FeedAtividades atividades={data.atividadeRecente} />
                </div>
            </div>
        </div>
    );
}
