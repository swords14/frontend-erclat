// Caminho do arquivo: frontend/src/pages/dashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';
import { Calendar, DollarSign, AlertTriangle, Users, Target, Activity, CheckCircle, Clock, ListTodo, MessageSquare, Briefcase, PiggyBank, FileText, GripHorizontal } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getDashboardData } from '@/services/api';

// --- ESTRUTURA INICIAL: ADAPTADA PARA PALETA LUXURY LIGHT ---
const initialCardLayout = [
    { id: 'kpi-eventosNoPeriodo', type: 'kpi', icone: Briefcase, titulo: "Eventos no Período", valorKey: "eventosNoPeriodo", linkTo: "/eventos", corIcone: "text-gray-700" },
    { id: 'kpi-receitaRealizada', type: 'kpi', icone: DollarSign, titulo: "Receita Realizada", valorKey: "receitaRealizada", format: 'currency', corIcone: "text-emerald-500" },
    { id: 'kpi-despesaRealizada', type: 'kpi', icone: PiggyBank, titulo: "Despesa Realizada", valorKey: "despesaRealizada", format: 'currency', corIcone: "text-rose-500" },
    { id: 'kpi-taxaConversao', type: 'kpi', icone: Target, titulo: "Taxa de Conversão", valorKey: "taxaConversao", suffix: '%', corIcone: "text-amber-500" },
    { id: 'acao-orcamentosPendentes', type: 'acao', icone: FileText, texto: "Orçamentos Pendentes", valorKey: "orcamentosPendentes", linkTo: "/orcamentos", corIcone: "text-amber-500" },
    { id: 'acao-tarefasAtrasadas', type: 'acao', icone: ListTodo, texto: "Tarefas Atrasadas", valorKey: "tarefasAtrasadas", linkTo: "/tarefas", corIcone: "text-rose-500" },
    { id: 'acao-pagamentosAtrasados', type: 'acao', icone: Clock, texto: "Pagamentos em Atraso", valorKey: "pagamentosAtrasados", linkTo: "/financeiro", corIcone: "text-rose-500" },
    { id: 'acao-feedbacksPendentes', type: 'acao', icone: MessageSquare, texto: "Feedbacks Pendentes", valorKey: "feedbacksPendentes", linkTo: "/avaliacoes", corIcone: "text-indigo-500" },
];

const useDashboardData = () => {
    const { currentUser } = useAuth();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [periodo, setPeriodo] = useState('mes');
    const [dashboardCards, setDashboardCards] = useState(initialCardLayout);

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
    };

    return { data, isLoading, periodo, setPeriodo, dashboardCards, saveLayout, currentUser };
};

// --- COMPONENTES DE UI ---
const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const KPICard = React.memo(({ card, valor, dragHandleProps }) => {
    const { icone: Icone, titulo, texto, corIcone, format: formatType, suffix = '' } = card;
    const valorFormatado = formatType === 'currency' ? formatarMoeda(valor) : `${valor || 0}${suffix}`;
    
    const isAlert = card.type === 'acao' && valor > 0;

    return (
        <motion.div 
            whileHover={{ y: -4 }} 
            className={`relative bg-white p-5 rounded-2xl flex flex-col gap-4 h-full border transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ${isAlert ? 'border-rose-200 bg-rose-50/30' : 'border-gray-200 hover:border-amber-300 hover:shadow-[0_4px_20px_rgba(245,158,11,0.05)]'}`}
        >
            <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl border ${isAlert ? 'bg-rose-100/50 border-rose-200' : 'bg-gray-50 border-gray-100'}`}>
                    <Icone size={22} className={isAlert ? 'text-rose-500' : corIcone} strokeWidth={1.5} />
                </div>
                
                <div 
                    {...dragHandleProps} 
                    className="text-gray-300 hover:text-amber-500 cursor-grab active:cursor-grabbing p-1 transition-colors"
                    title="Arrastar para reordenar"
                >
                    <GripHorizontal size={18} />
                </div>
            </div>

            <div>
                <p className="text-sm text-gray-500 font-medium tracking-wide">{titulo || texto}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{valorFormatado}</p>
            </div>
        </motion.div>
    );
});

const BotaoPeriodo = ({ texto, periodo, periodoAtivo, setPeriodo }) => (
    <button 
        onClick={() => setPeriodo(periodo)} 
        className={`px-4 py-2 text-xs uppercase tracking-wider font-bold rounded-lg transition-all duration-300 ${
            periodoAtivo === periodo 
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
        }`}
    >
        {texto}
    </button>
);

// --- PAINÉIS MEMOIZADOS ---
const PainelGraficos = React.memo(({ data }) => {
    const [abaAtiva, setAbaAtiva] = useState('financeiro');
    const COLORS = ['#f59e0b', '#d97706', '#b45309', '#fbbf24', '#78350f'];

    const TabButton = ({ abaId, children }) => (
        <button 
            onClick={() => setAbaAtiva(abaId)} 
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-all duration-200 focus:outline-none ${
                abaAtiva === abaId 
                    ? 'border-amber-500 text-amber-600' 
                    : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] h-full">
            <div className="flex border-b border-gray-100 mb-6 space-x-2">
                <TabButton abaId="financeiro">Visão Financeira</TabButton>
                <TabButton abaId="operacional">Status Operacional</TabButton>
            </div>
            
            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {abaAtiva === 'financeiro' ? (
                        <LineChart data={data.graficoFinanceiro} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `R$${value/1000}k`} tickLine={false} axisLine={false} dx={-10} />
                            <Tooltip 
                                cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '4 4' }}
                                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#f3f4f6', borderRadius: '12px', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                itemStyle={{ fontWeight: 600 }}
                                formatter={(value) => formatarMoeda(value)} 
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                            <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} name="Receita" />
                            <Line type="monotone" dataKey="despesa" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} name="Despesa" />
                        </LineChart>
                    ) : (
                        <PieChart>
                            <Pie data={data.graficoStatusEventos} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} stroke="none">
                                {data.graficoStatusEventos?.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#f3f4f6', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                itemStyle={{ color: '#d97706', fontWeight: 600 }}
                            />
                            <Legend iconType="circle" />
                        </PieChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
});

const ListaTarefas = React.memo(({ tarefas }) => (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CheckCircle className="text-amber-500" size={20} /> Tarefas Críticas
        </h3>
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {tarefas?.length > 0 ? (
                tarefas.map(task => (
                    <div key={task.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                        <div className={`mt-1.5 w-2.5 h-2.5 rounded-full ${
                            task.prioridade?.toLowerCase() === 'alta' ? 'bg-rose-500 shadow-sm shadow-rose-200' : 'bg-amber-400 shadow-sm shadow-amber-200'
                        }`} />
                        <div>
                            <p className="font-bold text-sm text-gray-800">{task.descricao}</p>
                            <p className="text-xs text-gray-500 mt-1 font-medium">
                                <span className="text-amber-600">{task.evento}</span> • Vence: {format(new Date(task.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                    <CheckCircle className="w-10 h-10 text-emerald-100 mb-3" />
                    <p className="text-sm font-medium">Tudo em dia! Nenhuma tarefa pendente.</p>
                </div>
            )}
        </div>
    </div>
));

const FeedAtividades = React.memo(({ atividades }) => {
    const icones = { 
        NOVO_CLIENTE: <Users className="text-sky-500" size={18} />, 
        EVENTO_CONFIRMADO: <Calendar className="text-emerald-500" size={18} />, 
        PAGAMENTO_RECEBIDO: <DollarSign className="text-amber-500" size={18} />, 
        FEEDBACK_RECEBIDO: <MessageSquare className="text-purple-500" size={18} />, 
        ATIVIDADE_GERAL: <Activity className="text-gray-400" size={18} /> 
    };

    return (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Activity className="text-amber-500" size={20} /> Timeline
            </h3>
            <div className="space-y-5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {atividades?.length > 0 ? (
                    atividades.map(item => (
                        <div key={item.id} className="flex items-start gap-4 relative">
                            <div className="absolute top-8 left-[19px] bottom-[-20px] w-[2px] bg-gray-100 last:hidden" />
                            
                            <div className="bg-white p-2.5 rounded-full border border-gray-100 shadow-sm relative z-10">
                                {icones[item.tipo] || <Activity size={18} className="text-gray-400" />}
                            </div>
                            <div className="pt-1">
                                <p className="text-sm font-bold text-gray-800">{item.texto}</p>
                                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                                    <span className="text-gray-900">{item.user}</span> • {formatDistanceToNow(new Date(item.data), { addSuffix: true, locale: ptBR })}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-400 font-medium">
                        <p className="text-sm">Nenhuma atividade recente.</p>
                    </div>
                )}
            </div>
        </div>
    );
});

const SkeletonDashboard = () => (
    <div className="flex flex-col gap-8 p-2 animate-pulse">
        <div className="flex justify-between items-center">
            <div><div className="h-8 bg-gray-200 rounded w-64 mb-2"/><div className="h-4 bg-gray-100 rounded w-80"/></div>
            <div className="h-10 bg-gray-200 rounded-xl w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[400px] bg-gray-100 rounded-[2rem]" />
            <div className="lg:col-span-1 space-y-6">
                <div className="h-64 bg-gray-100 rounded-[2rem]" />
                <div className="h-64 bg-gray-100 rounded-[2rem]" />
            </div>
        </div>
    </div>
);

// --- COMPONENTE PRINCIPAL ---
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

    if (isLoading && !data) return <SkeletonDashboard />;

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] p-10 bg-white rounded-[2rem] border border-gray-200 shadow-sm">
                <AlertTriangle className="w-16 h-16 text-rose-500 mb-4 opacity-80" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Conexão Interrompida</h3>
                <p className="text-gray-500 text-center max-w-md font-medium">Não foi possível estabelecer contato com os servidores da Éclat para carregar seu painel.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 min-h-screen pb-10">
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
                <div>
                    <h2 className="text-3xl font-light text-gray-800 tracking-wide">
                        Bem-vindo(a), <span className="font-bold text-amber-600">{currentUser?.nome || 'Admin'}</span>
                    </h2>
                    <p className="text-gray-500 mt-1 font-medium">Visão geral e desempenho do sistema.</p>
                </div>
                
                <div className="flex bg-white border border-gray-200 p-1.5 rounded-xl shadow-sm">
                    <BotaoPeriodo texto="Este Mês" periodo="mes" periodoAtivo={periodo} setPeriodo={setPeriodo} />
                    <BotaoPeriodo texto="3 Meses" periodo="trimestre" periodoAtivo={periodo} setPeriodo={setPeriodo} />
                    <BotaoPeriodo texto="Este Ano" periodo="ano" periodoAtivo={periodo} setPeriodo={setPeriodo} />
                </div>
            </motion.header>
            
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="dashboard-cards">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {dashboardCards.map((card, index) => (
                                <Draggable key={card.id} draggableId={card.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div 
                                            ref={provided.innerRef} 
                                            {...provided.draggableProps} 
                                            className={snapshot.isDragging ? "z-50 drop-shadow-2xl" : ""}
                                            style={{ ...provided.draggableProps.style }}
                                        >
                                            {card.linkTo ? (
                                                <Link to={card.linkTo} className="block h-full outline-none">
                                                    <KPICard card={card} valor={data.kpis?.[card.valorKey]} dragHandleProps={provided.dragHandleProps} />
                                                </Link>
                                            ) : (
                                                <div className="h-full">
                                                    <KPICard card={card} valor={data.kpis?.[card.valorKey]} dragHandleProps={provided.dragHandleProps} />
                                                </div>
                                            )}
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
                <div className="lg:col-span-2 flex flex-col h-full">
                    <PainelGraficos data={data} />
                </div>
                <div className="lg:col-span-1 flex flex-col h-full gap-6">
                    <ListaTarefas tarefas={data.proximasTarefas} />
                    <FeedAtividades atividades={data.atividadeRecente} />
                </div>
            </div>
        </div>
    );
}