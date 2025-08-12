// Caminho do arquivo: frontend/src/pages/Relatorios.jsx
// CORRIGIDO: Usa o serviço de API centralizado

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRangePicker } from 'react-date-range';
import toast from 'react-hot-toast';

// Estilos do react-date-range
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

// Ícones
import { ArrowLeft, Printer, DollarSign, TrendingUp, Calendar, Users, Truck, Scaling, X as IconX, BarChart3, Package, FileText } from 'lucide-react';
// Importe a nova função da sua API central
import { getReportData } from '@/services/api';

// --- HOOK PERSONALIZADO ---
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
            // CORRIGIDO: Usa a função centralizada getReportData
            const data = await getReportData(reportName, startDateISO, endDateISO);
            setReportData(data);
        } catch (error) {
            toast.error(error.message || `Erro ao buscar o relatório.`);
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

// --- COMPONENTES DE UI ---
const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#f59e0b'];
const KPICard = ({ title, value, icon: Icon, valueClassName = '' }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex items-center gap-4">
        <div className="p-3 bg-indigo-100 dark:bg-gray-700 rounded-lg"><Icon className="text-indigo-500 dark:text-indigo-400" size={24}/></div>
        <div><p className="text-sm text-gray-500 dark:text-gray-400">{title}</p><p className={`text-xl font-bold ${valueClassName}`}>{value}</p></div>
    </div>
);
const ReportCard = ({ title, description, icon: Icon, onClick }) => (
    <motion.div whileHover={{ y: -5 }} onClick={onClick} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md cursor-pointer h-full flex flex-col gap-4">
        <div className="flex items-start justify-between">
            <div className="p-3 bg-indigo-100 dark:bg-gray-700 rounded-lg"><Icon className="text-indigo-500 dark:text-indigo-400" size={24}/></div>
        </div>
        <div>
            <h3 className="text-lg font-bold mb-1">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
    </motion.div>
);
const LoadingSpinner = () => <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>;

// --- COMPONENTE PRINCIPAL ---
export default function Relatorios() {
    const { view, changeView, dateRange, changeDateRange, reportData, isLoading } = useRelatorios();
    const [datePickerAberto, setDatePickerAberto] = useState(false);
    const datePickerRef = useRef(null);

    const reportTitle = { 
        financeiro: 'Relatório Financeiro', vendas: 'Relatório de Vendas', operacoes: 'Relatório de Operações',
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
            <div className="flex flex-col gap-6">
                <div><h1 className="text-3xl font-bold">Hub de Relatórios</h1><p className="mt-1 text-gray-500">Análises e insights sobre o seu negócio.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ReportCard title="Financeiro" description="Receitas, despesas, lucro e fluxo de caixa." icon={DollarSign} onClick={() => changeView('financeiro')} />
                    <ReportCard title="Vendas" description="Funil, conversão e performance de orçamentos." icon={TrendingUp} onClick={() => changeView('vendas')} />
                    <ReportCard title="Operações" description="Volume de eventos, convidados e tipos." icon={Calendar} onClick={() => changeView('operacoes')} />
                    <ReportCard title="Análise de Clientes" description="Identifique seus clientes mais valiosos." icon={Users} onClick={() => changeView('analiseCliente')} />
                    <ReportCard title="Análise de Fornecedores" description="Controle os gastos com seus parceiros." icon={Truck} onClick={() => changeView('analiseFornecedor')} />
                    <ReportCard title="Lucratividade" description="Descubra a margem de lucro de cada evento." icon={Scaling} onClick={() => changeView('lucratividadeEvento')} />
                    <ReportCard title="Sazonalidade" description="Entenda os períodos de alta e baixa demanda." icon={BarChart3} onClick={() => changeView('sazonalidade')} />
                    <ReportCard title="Estoque" description="Giro de itens e valor total em estoque." icon={Package} onClick={() => changeView('estoque')} />
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <button onClick={() => changeView('hub')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-2"><ArrowLeft size={16}/> Voltar ao Hub</button>
                    <h1 className="text-3xl font-bold">{reportTitle}</h1>
                    <p className="text-sm text-gray-500">Período: {format(dateRange[0].startDate, 'dd/MM/yy', {locale: ptBR})} a {format(dateRange[0].endDate, 'dd/MM/yy', {locale: ptBR})}</p>
                </div>
                <div className="flex items-center gap-2 relative">
                    <button onClick={() => setDatePickerAberto(p => !p)} className="btn-secondary">Alterar Período</button>
                    <button onClick={() => window.print()} className="btn-primary flex items-center gap-2"><Printer size={16}/> Imprimir</button>
                    <AnimatePresence>
                        {datePickerAberto && (
                            <motion.div 
                                ref={datePickerRef}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 10 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full right-0 mt-2 z-20 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border dark:border-gray-700 overflow-hidden"
                            >
                                <DateRangePicker
                                    onChange={item => changeDateRange([item.selection])}
                                    showSelectionPreview={true}
                                    moveRangeOnFirstSelection={false}
                                    months={1}
                                    ranges={dateRange}
                                    direction="horizontal"
                                    locale={ptBR}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                {isLoading && <LoadingSpinner />}
                {!isLoading && !reportData && <div className="text-center p-10 text-gray-500">Nenhum dado encontrado para o período e relatório selecionado.</div>}
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
                            {/* Adicione outros componentes de relatório aqui */}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

// --- SUB-COMPONENTES DE RELATÓRIO ---
const FinanceiroReport = ({ data }) => {
    const { kpis = {}, despesasPorCategoria = [], transacoesRecentes = [] } = data || {};
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <KPICard title="Receita Bruta" value={formatarMoeda(kpis.receita)} icon={TrendingUp} valueClassName="text-green-500" />
                <KPICard title="Despesas Totais" value={formatarMoeda(kpis.despesa)} icon={TrendingUp} valueClassName="text-red-500" />
                <KPICard title="Lucro Líquido" value={formatarMoeda(kpis.lucro)} icon={DollarSign} valueClassName="text-blue-500" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div>
                    <h3 className="text-lg font-bold mb-4">Despesas por Categoria</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart><Pie data={despesasPorCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{despesasPorCategoria.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={formatarMoeda}/><Legend/></PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div>
                    <h3 className="text-lg font-bold mb-4">Transações Recentes</h3>
                    <div className="overflow-y-auto max-h-[280px] space-y-2">
                        {transacoesRecentes.map(t => (
                            <div key={t.id} className="flex justify-between items-center py-2 border-b dark:border-gray-700 last:border-none">
                                <div><p className="font-medium">{t.descricao}</p><p className="text-xs text-gray-500">{format(parseISO(t.data), 'dd/MM/yyyy')}</p></div>
                                <p className={`font-semibold ${t.tipo==='receita' ? 'text-green-500' : 'text-red-500'}`}>{formatarMoeda(t.valor)}</p>
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        </div>
    );
};

const VendasReport = ({ data }) => {
    const { kpis = {}, funilData = [] } = data || {};
    const totalOrcamentos = kpis.total || 0;
    const taxaConversao = kpis.conversao || 0;
    const valorAceito = kpis.valorAceito || 0;
    const ticketMedio = kpis.ticketMedio || 0;

    return (
         <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Orçamentos no Período" value={totalOrcamentos} icon={FileText} />
                <KPICard title="Taxa de Conversão" value={`${taxaConversao.toFixed(1)}%`} icon={Scaling} valueClassName="text-blue-500" />
                <KPICard title="Valor Total Aceito" value={formatarMoeda(valorAceito)} icon={TrendingUp} valueClassName="text-green-500" />
                <KPICard title="Ticket Médio" value={formatarMoeda(ticketMedio)} icon={DollarSign} valueClassName="text-indigo-500" />
            </div>
        </div>
    )
};

const AnaliseClienteReport = ({ data = [] }) => {
    return (
        <div>
            <h3 className="text-lg font-bold mb-4">Ranking de Clientes por Faturamento</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="table-header"><tr><th className="p-3">Pos.</th><th className="p-3">Cliente</th><th className="p-3 text-center">Nº de Eventos</th><th className="p-3 text-right">Total Gasto</th></tr></thead>
                    <tbody>{data.map((c, index) => (<tr key={c.id} className="border-b dark:border-gray-700"><td className="p-3 font-bold">#{index + 1}</td><td className="p-3 font-medium">{c.nome}</td><td className="p-3 text-center">{c.numEventos}</td><td className="p-3 text-right font-semibold text-green-500">{formatarMoeda(c.totalGasto)}</td></tr>))}</tbody>
                </table>
            </div>
        </div>
    );
};
