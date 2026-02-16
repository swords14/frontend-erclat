import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRangePicker } from 'react-date-range';
import toast from 'react-hot-toast';

import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

import { ArrowLeft, Printer, DollarSign, TrendingUp, Calendar, Users, Truck, Scaling, BarChart3, Package, FileText, ChevronDown } from 'lucide-react';
import { getReportData } from '@/services/api';

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const PREMIUM_COLORS = ['#f59e0b', '#10b981', '#0ea5e9', '#f43f5e', '#8b5cf6', '#64748b'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) { 
        return ( 
            <div className="bg-white/95 backdrop-blur-md text-gray-800 p-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100"> 
                {label && <p className="font-bold text-gray-900 mb-2">{label}</p>}
                {payload.map((pld, index) => ( 
                    <p key={index} style={{ color: pld.fill || pld.stroke }} className="font-semibold text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pld.fill || pld.stroke }}></span>
                        {`${pld.name}: ${formatarMoeda(pld.value)}`}
                    </p> 
                ))} 
            </div> 
        ); 
    } return null; 
};

const useRelatorios = () => {
    const [view, setView] = useState('hub');
    const [dateRange, setDateRange] = useState([{ startDate: startOfMonth(new Date()), endDate: endOfMonth(new Date()), key: 'selection' }]);
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchReportData = useCallback(async (reportName, range) => {
        if (reportName === 'hub') return;
        
        setIsLoading(true);
        setReportData(null);

        const { startDate, endDate } = range[0];
        const startDateISO = format(startDate, 'yyyy-MM-dd');
        const endDateISO = format(endDate, 'yyyy-MM-dd');

        try {
            const data = await getReportData(reportName, startDateISO, endDateISO);
            setReportData(data);
        } catch (error) {
            toast.error(error.message || `Erro ao processar relatório.`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const changeView = (newView) => {
        setView(newView);
        if (newView !== 'hub') {
            fetchReportData(newView, dateRange);
        }
    };
    
    const changeDateRange = (newRange) => {
        setDateRange(newRange);
        if (view !== 'hub') {
            fetchReportData(view, newRange);
        }
    }

    return { view, changeView, dateRange, changeDateRange, reportData, isLoading };
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

const ReportCard = ({ title, description, icon: Icon, onClick }) => (
    <motion.div 
        whileHover={{ y: -6 }} 
        onClick={onClick} 
        className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm cursor-pointer h-full flex flex-col gap-5 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/10 transition-all group"
    >
        <div className="flex items-start justify-between">
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl group-hover:bg-amber-50 group-hover:border-amber-100 transition-colors duration-300">
                <Icon className="text-gray-400 group-hover:text-amber-500 transition-colors duration-300" size={32} strokeWidth={1.5}/>
            </div>
        </div>
        <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors duration-300">{title}</h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">{description}</p>
        </div>
    </motion.div>
);

const LoadingSpinner = () => (
    <div className="flex flex-col justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold tracking-wide">Processando métricas...</p>
    </div>
);

export default function Relatorios() {
    const { view, changeView, dateRange, changeDateRange, reportData, isLoading } = useRelatorios();
    const [datePickerAberto, setDatePickerAberto] = useState(false);
    const datePickerRef = useRef(null);

    const reportTitle = { 
        financeiro: 'Relatório Financeiro', vendas: 'Métricas de Vendas', operacoes: 'Relatório de Operações',
        analiseCliente: 'Análise de Clientes', analiseFornecedor: 'Análise de Fornecedores',
        lucratividadeEvento: 'Lucratividade por Evento', sazonalidade: 'Análise de Sazonalidade',
        estoque: 'Relatório de Estoque'
    }[view];

    useEffect(() => {
        function handleClickOutside(event) {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setDatePickerAberto(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [datePickerRef]);

    if (view === 'hub') {
        return (
            <div className="flex flex-col gap-8 p-4 md:p-8 min-h-screen">
                <header>
                    <h1 className="text-3xl font-light text-gray-800 tracking-wide flex items-center gap-3">
                        Central de <span className="font-bold text-amber-600">Inteligência</span>
                        <BarChart3 className="text-amber-400" size={28} />
                    </h1>
                    <p className="mt-1 text-gray-500 font-medium">Extraia insights e analise o desempenho do seu negócio.</p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ReportCard title="Financeiro" description="Receitas, despesas, lucro líquido e fluxo de caixa detalhado." icon={DollarSign} onClick={() => changeView('financeiro')} />
                    <ReportCard title="Vendas" description="Funil de negociação, conversão e performance de propostas." icon={TrendingUp} onClick={() => changeView('vendas')} />
                    <ReportCard title="Operações" description="Volume de eventos, controle de convidados e tipos de celebrações." icon={Calendar} onClick={() => changeView('operacoes')} />
                    <ReportCard title="Análise de Clientes" description="Identifique seus clientes VIPs e frequência de contratação." icon={Users} onClick={() => changeView('analiseCliente')} />
                    <ReportCard title="Fornecedores" description="Controle os maiores centros de custo com parceiros externos." icon={Truck} onClick={() => changeView('analiseFornecedor')} />
                    <ReportCard title="Lucratividade" description="Descubra a margem de lucro real e o custo de cada evento." icon={Scaling} onClick={() => changeView('lucratividadeEvento')} />
                    <ReportCard title="Sazonalidade" description="Entenda os meses de alta e baixa demanda para prever caixa." icon={BarChart3} onClick={() => changeView('sazonalidade')} />
                    <ReportCard title="Estoque" description="Giro de itens do acervo, imobilizado e valor total armazenado." icon={Package} onClick={() => changeView('estoque')} />
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col gap-8 p-4 md:p-8 min-h-screen">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <button onClick={() => changeView('hub')} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-amber-600 mb-3 transition-colors uppercase tracking-wider">
                        <ArrowLeft size={16}/> Voltar para o Hub
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">{reportTitle}</h1>
                </div>
                <div className="flex items-center gap-3 relative">
                    <button 
                        onClick={() => setDatePickerAberto(p => !p)} 
                        className="px-5 py-2.5 bg-white border border-gray-200 hover:border-amber-300 text-gray-700 font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all"
                    >
                        <Calendar size={18} className="text-amber-500" />
                        {format(dateRange[0].startDate, 'dd/MM/yy')} a {format(dateRange[0].endDate, 'dd/MM/yy')}
                        <ChevronDown size={16} className="text-gray-400 ml-2" />
                    </button>
                    <button onClick={() => window.print()} className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-all">
                        <Printer size={18}/> Imprimir PDF
                    </button>
                    
                    <AnimatePresence>
                        {datePickerAberto && (
                            <motion.div 
                                ref={datePickerRef}
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 10, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className="absolute top-full right-0 mt-2 z-50 bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden"
                            >
                                <DateRangePicker
                                    onChange={item => changeDateRange([item.selection])}
                                    showSelectionPreview={true}
                                    moveRangeOnFirstSelection={false}
                                    months={1}
                                    ranges={dateRange}
                                    direction="horizontal"
                                    locale={ptBR}
                                    rangeColors={['#f59e0b']}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>
            
            <div className="bg-transparent rounded-2xl">
                {isLoading && <LoadingSpinner />}
                {!isLoading && !reportData && (
                    <div className="text-center py-20 px-6 bg-white rounded-[2rem] border border-gray-200 shadow-sm flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                            <FileText size={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Sem dados no período</h3>
                        <p className="mt-2 text-gray-500 font-medium max-w-sm">Altere o intervalo de datas para buscar novas métricas.</p>
                    </div>
                )}
                {!isLoading && reportData && (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={view}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {view === 'financeiro' && <FinanceiroReport data={reportData} />}
                            {view === 'vendas' && <VendasReport data={reportData} />}
                            {view === 'analiseCliente' && <AnaliseClienteReport data={reportData} />}
                            {/* Adicione os outros componentes conforme desenvolver o backend */}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

const FinanceiroReport = ({ data }) => {
    const { kpis = {}, despesasPorCategoria = [], transacoesRecentes = [] } = data || {};
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <KPICard title="Receita Bruta Realizada" value={formatarMoeda(kpis.receita)} icon={TrendingUp} corIcone="text-emerald-500" bgIcone="bg-emerald-50" />
                <KPICard title="Despesas Pagas" value={formatarMoeda(kpis.despesa)} icon={TrendingUp} corIcone="text-rose-500" bgIcone="bg-rose-50" />
                <KPICard title="Lucro Líquido do Período" value={formatarMoeda(kpis.lucro)} icon={DollarSign} corIcone="text-amber-500" bgIcone="bg-amber-50" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Saídas por Categoria</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={despesasPorCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} stroke="none">
                                    {despesasPorCategoria.map((entry, index) => <Cell key={`cell-${index}`} fill={PREMIUM_COLORS[index % PREMIUM_COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '14px', fontWeight: 500, color: '#4b5563' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
                 <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Últimas Movimentações do Período</h3>
                    <div className="overflow-y-auto flex-grow custom-scrollbar pr-2 space-y-3">
                        {transacoesRecentes.length === 0 && <p className="text-gray-400 font-medium text-center py-10">Nenhuma transação encontrada.</p>}
                        {transacoesRecentes.map(t => (
                            <div key={t.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-amber-200 transition-colors">
                                <div>
                                    <p className="font-bold text-gray-800">{t.descricao}</p>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">{format(new Date(t.data), 'dd/MM/yyyy')}</p>
                                </div>
                                <p className={`font-black tracking-tight ${t.tipo==='receita' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {t.tipo === 'despesa' ? '-' : '+'} {formatarMoeda(t.valor)}
                                </p>
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        </div>
    );
};

const VendasReport = ({ data }) => {
    const { kpis = {} } = data || {};
    const totalOrcamentos = kpis.total || 0;
    const taxaConversao = kpis.conversao || 0;
    const valorAceito = kpis.valorAceito || 0;
    const ticketMedio = kpis.ticketMedio || 0;

    return (
         <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Propostas Emitidas" value={totalOrcamentos} icon={FileText} corIcone="text-blue-500" bgIcone="bg-blue-50" />
                <KPICard title="Taxa de Conversão Real" value={`${taxaConversao.toFixed(1)}%`} icon={Scaling} corIcone="text-emerald-500" bgIcone="bg-emerald-50" />
                <KPICard title="Volume de Fechamento" value={formatarMoeda(valorAceito)} icon={TrendingUp} corIcone="text-amber-500" bgIcone="bg-amber-50" />
                <KPICard title="Ticket Médio" value={formatarMoeda(ticketMedio)} icon={DollarSign} corIcone="text-indigo-500" bgIcone="bg-indigo-50" />
            </div>
        </div>
    )
};

const AnaliseClienteReport = ({ data = [] }) => {
    return (
        <div className="bg-white rounded-[2rem] border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-800">Ranking de Clientes (LTV)</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">Os clientes que mais geraram faturamento no período selecionado.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/80 border-b border-gray-200">
                        <tr>
                            <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 w-20 text-center">Ranking</th>
                            <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500">Identificação do Cliente</th>
                            <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 text-center">Nº de Eventos Fechados</th>
                            <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 text-right">LTV (Total Gasto)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.length === 0 && <tr><td colSpan="4" className="p-16 text-center text-gray-400 font-medium">Nenhum dado gerado para este período.</td></tr>}
                        {data.map((c, index) => (
                            <motion.tr key={c.id} className="hover:bg-amber-50/30 transition-colors group">
                                <td className="p-5 text-center">
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm ${index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-gray-200 text-gray-600' : index === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-400'}`}>
                                        {index + 1}º
                                    </span>
                                </td>
                                <td className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-sm text-gray-600 border border-gray-200">
                                            {c.nome ? c.nome.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <span className="font-bold text-gray-900">{c.nome}</span>
                                    </div>
                                </td>
                                <td className="p-5 text-center font-bold text-gray-700">{c.numEventos}</td>
                                <td className="p-5 text-right font-black text-emerald-600 tracking-tight">{formatarMoeda(c.totalGasto)}</td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};