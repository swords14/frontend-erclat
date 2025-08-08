// Caminho do arquivo: frontend/src/components/Financeiro.jsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Plus, Minus, ArrowUpRight, ArrowDownLeft, Wallet, X as IconX, Clock, CheckCircle, Pencil, Trash2, Filter, XCircle, Loader2 } from 'lucide-react';
import { format, getMonth, getYear, subMonths, startOfMonth, endOfMonth, isWithinInterval, startOfYear, endOfYear, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
    getAllClients, getAllSuppliers, getTransactions, updateTransactionStatus,
    deleteTransaction, createTransaction, updateTransaction, getEvents, getTransactionCategories
} from '../services/api';

// --- Constantes e Funções Auxiliares ---
const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

// --- COMPONENTES AUXILIARES ---
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) { 
        return ( 
            <div className="bg-gray-800/80 backdrop-blur-sm text-white p-3 rounded-lg shadow-lg border border-gray-700"> 
                <p className="font-bold">{`Data: ${new Date(label).toLocaleDateString('pt-BR')}`}</p>
                {payload.filter(pld => pld.value != null).map((pld, index) => ( 
                    <p key={index} style={{ color: pld.stroke || pld.fill }}>{`${pld.name}: ${formatarMoeda(pld.value)}`}</p> 
                ))} 
            </div> 
        ); 
    } return null; 
};

const CardKPI = ({ icone: Icone, titulo, valor, cor }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg flex items-center gap-4">
        <div className={`p-3 rounded-full bg-opacity-20 ${cor.replace('text-', 'bg-')}`}><Icone size={24} className={cor} /></div>
        <div><p className="text-sm text-gray-500 dark:text-gray-400">{titulo}</p><p className={`text-2xl font-bold ${cor}`}>{formatarMoeda(valor)}</p></div>
    </motion.div>
);

const StatusPagamentoBadge = ({ status }) => {
    const statusInfo = { Efetivado: { icon: CheckCircle, color: 'green', label: 'Efetivado' }, Pendente: { icon: Clock, color: 'yellow', label: 'Pendente' }}[status] || { icon: Clock, color: 'gray', label: status };
    const colors = { green: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', gray: 'bg-gray-100 text-gray-800' };
    return (<span className={`status-badge ${colors[statusInfo.color]}`}><statusInfo.icon size={14}/>{statusInfo.label}</span>);
};

const initialKpiLayout = [
    { id: 'kpi-receitaRealizada', titulo: "Receita Realizada (Filtro)", icone: ArrowUpRight, cor: "text-green-500", valorKey: 'receitaRealizada' },
    { id: 'kpi-despesaRealizada', titulo: "Despesa Realizada (Filtro)", icone: ArrowDownLeft, cor: "text-red-500", valorKey: 'despesaRealizada' },
    { id: 'kpi-saldo', titulo: "Saldo (Filtro)", icone: Wallet, corKey: 'saldo', valorKey: 'saldo' },
    { id: 'kpi-pendente', titulo: "Pendente (Receber - Pagar)", icone: Clock, cor: "text-yellow-500", valorKey: 'pendenteLiquido' },
];

// --- COMPONENTE PRINCIPAL ---
export default function Financeiro() {
    const [transacoes, setTransacoes] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [fornecedores, setFornecedores] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [categorias, setCategorias] = useState({ receitas: [], despesas: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    const [tipoModal, setTipoModal] = useState('receita');
    const [transacaoEmEdicao, setTransacaoEmEdicao] = useState(null);
    const [filtros, setFiltros] = useState({ dataInicio: '', dataFim: '', categoria: 'todas', status: 'todos' });
    const [kpiCards, setKpiCards] = useState(initialKpiLayout);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [transacoesRes, clientesRes, fornecedoresRes, eventosRes, categoriasRes] = await Promise.all([
                getTransactions(filtros),
                getAllClients(),
                getAllSuppliers(),
                getEvents(),
                getTransactionCategories()
            ]);
            setTransacoes(transacoesRes);
            setClientes(clientesRes);
            setEventos(eventosRes);
            setFornecedores(fornecedoresRes);
            setCategorias(categoriasRes);
        } catch (error) {
            toast.error(error.message || 'Erro ao carregar dados.');
        } finally {
            setIsLoading(false);
        }
    }, [filtros]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // CORREÇÃO: A variável transacoesFiltradas precisa ser definida aqui
    const transacoesFiltradas = useMemo(() => {
        return transacoes.filter(t => {
            const dataParaComparacao = t.status === 'Efetivado' ? new Date(t.data) : (t.dataVencimento ? new Date(t.dataVencimento) : new Date(t.data));
            dataParaComparacao.setHours(0,0,0,0);
            const dataInicio = filtros.dataInicio ? new Date(filtros.dataInicio) : null;
            if (dataInicio) dataInicio.setHours(0,0,0,0);
            const dataFim = filtros.dataFim ? new Date(filtros.dataFim) : null;
            if (dataFim) dataFim.setHours(23,59,59,999);
            if (dataInicio && dataParaComparacao < dataInicio) return false;
            if (dataFim && dataParaComparacao > dataFim) return false;
            if (filtros.categoria !== 'todas' && t.categoria !== filtros.categoria) return false;
            if (filtros.status !== 'todos' && t.status !== filtros.status) return false;
            return true;
        });
    }, [transacoes, filtros]);

    const dadosFinanceiros = useMemo(() => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const transacoesEfetivadas = transacoesFiltradas.filter(t => t.status === 'Efetivado');
        const receitaRealizada = transacoesEfetivadas.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0);
        const despesaRealizada = transacoesEfetivadas.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0);
        const saldo = receitaRealizada - despesaRealizada;

        const transacoesPendentes = transacoesFiltradas.filter(t => t.status === 'Pendente');
        const aReceber = transacoesPendentes.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0);
        const aPagar = transacoesPendentes.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0);
        const pendenteLiquido = aReceber - aPagar;

        const despesasPorCategoria = transacoesEfetivadas.filter(t => t.tipo === 'despesa').reduce((acc, t) => { acc[t.categoria] = (acc[t.categoria] || 0) + t.valor; return acc; }, {});
        const dadosGraficoPizza = Object.entries(despesasPorCategoria).map(([name, value]) => ({ name, value }));

        const mesesPassados = [...Array(12).keys()].map(i => subMonths(hoje, i)).reverse();
        const graficoMensal = mesesPassados.map(mes => {
            const mesInicio = startOfMonth(mes);
            const mesFim = endOfMonth(mes);
            const transacoesDoMes = transacoesEfetivadas.filter(t => isWithinInterval(new Date(t.data), { start: mesInicio, end: mesFim }));
            const receita = transacoesDoMes.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0);
            const despesa = transacoesDoMes.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0);
            return {
                name: format(mes, 'MMM/yy', { locale: ptBR }),
                receita,
                despesa
            };
        });

        return { receitaRealizada, despesaRealizada, saldo, aReceber, aPagar, pendenteLiquido, dadosGraficoPizza, graficoMensal };
    }, [transacoesFiltradas]);

    const handleSalvarTransacao = async (novaTransacao) => {
        const isEditing = !!transacaoEmEdicao;
        const apiCall = isEditing ? () => updateTransaction(transacaoEmEdicao.id, novaTransacao) : () => createTransaction(novaTransacao);
        try {
            await apiCall();
            toast.success(`Transação ${isEditing ? 'atualizada' : 'criada'} com sucesso!`);
            fecharModal();
            fetchData();
        } catch (error) {
            toast.error(error.message);
        }
    };
    
    const handleUpdateTransactionStatus = async (transactionId, newStatus) => {
        if (!window.confirm(`Tem certeza que deseja mudar o status desta transação para "${newStatus}"?`)) return;
        try {
            await updateTransactionStatus(transactionId, newStatus);
            toast.success(`Status da transação atualizado para "${newStatus}"!`);
            fetchData();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleExcluirTransacao = async (id) => {
        if(window.confirm("Tem certeza que deseja excluir esta transação?")) {
            try {
                await deleteTransaction(id);
                toast.success('Transação excluída.');
                fetchData();
            } catch (error) {
                toast.error(error.message);
            }
        }
    }

    const abrirModal = (tipo, transacao = null) => { setTipoModal(tipo); setTransacaoEmEdicao(transacao); setModalAberto(true); };
    const fecharModal = () => { setModalAberto(false); setTransacaoEmEdicao(null); }
    const handleFiltroChange = (e) => { const { name, value } = e.target; setFiltros(prev => ({ ...prev, [name]: value })); }
    const limparFiltros = () => setFiltros({ dataInicio: '', dataFim: '', categoria: 'todas', status: 'todos' });
    
    const onDragEnd = (result) => {
        const { source, destination } = result;
        if (!destination) return;
        const newKpiCards = Array.from(kpiCards);
        const [reorderedItem] = newKpiCards.splice(source.index, 1);
        newKpiCards.splice(destination.index, 0, reorderedItem);
        setKpiCards(newKpiCards);
        // TODO: Implementar a chamada da API para salvar o novo layout
    };

    if (isLoading) { return <div className="text-center p-10"><Loader2 className="animate-spin inline-block mr-2" /> A carregar dados financeiros...</div>; }

    return (
        <div className="flex flex-col gap-8 p-4 md:p-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div><h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Painel Financeiro</h1><p className="mt-1 text-gray-500 dark:text-gray-400">A saúde financeira do seu negócio em um só lugar.</p></div>
                <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => abrirModal('receita')} className="btn-success flex items-center gap-2"><Plus size={20} /> Nova Receita</motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => abrirModal('despesa')} className="btn-danger flex items-center gap-2"><Minus size={20} /> Nova Despesa</motion.button>
                </div>
            </div>
            {/* O resto do JSX (filtros, dashboard, tabela) continua aqui... */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg">
                <div className="flex items-center gap-2 mb-4"><Filter size={20} className="text-indigo-500" /><h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">Filtros</h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <input type="date" name="dataInicio" value={filtros.dataInicio} onChange={handleFiltroChange} className="input-form"/>
                    <input type="date" name="dataFim" value={filtros.dataFim} onChange={handleFiltroChange} className="input-form"/>
                    <select name="status" value={filtros.status} onChange={handleFiltroChange} className="input-form"><option value="todos">Todos os Status</option><option value="Efetivado">Efetivado</option><option value="Pendente">Pendente</option></select>
                    <select name="categoria" value={filtros.categoria} onChange={handleFiltroChange} className="input-form"><option value="todas">Todas as Categorias</option>{[...categorias.receitas, ...categorias.despesas].map(c => <option key={c} value={c}>{c}</option>)}</select>
                    <button onClick={limparFiltros} className="btn-secondary flex items-center justify-center gap-2"><XCircle size={18} /> Limpar</button>
                </div>
            </div>
            
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="finance-kpis" direction="horizontal">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {kpiCards.map((card, index) => {
                                let valor = dadosFinanceiros[card.valorKey];
                                let cor = card.cor; 
                                if (card.id === 'kpi-saldo') cor = valor >= 0 ? "text-blue-500" : "text-red-500";
                                return (
                                    <Draggable key={card.id} draggableId={card.id} index={index}>
                                        {(provided) => (<div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="h-full"><CardKPI icone={card.icone} titulo={card.titulo} valor={valor} cor={cor} /></div>)}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-x-auto">
                <h3 className="text-lg font-bold p-4 text-gray-700 dark:text-gray-200">Transações (Filtradas)</h3>
                <table className="w-full text-left">
                    <thead className="table-header"><tr><th className="p-4">Descrição</th><th className="p-4 hidden md:table-cell">Data</th><th className="p-4 hidden sm:table-cell">Cliente/Fornecedor</th><th className="p-4">Status</th><th className="p-4 text-right">Valor</th><th className="p-4 text-center">Ações</th></tr></thead>
                    <tbody>
                        {transacoesFiltradas.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map(t => (
                            <tr key={t.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-4 font-medium text-gray-800 dark:text-gray-200">{t.descricao}<br/><span className={`text-xs font-bold ${t.tipo === 'receita' ? 'text-green-500' : 'text-red-500'}`}>{t.tipo.toUpperCase()}</span></td>
                                <td className="p-4 hidden md:table-cell text-gray-500 dark:text-gray-400">{new Date(t.data).toLocaleDateString('pt-BR')}{t.status === 'Pendente' && t.dataVencimento && <span className="block text-xs text-yellow-600 dark:text-yellow-400">Vence em: {new Date(t.dataVencimento).toLocaleDateString('pt-BR')}</span>}</td>
                                <td className="p-4 hidden sm:table-cell text-gray-500 dark:text-gray-400">{t.client?.nome || t.supplier?.nome || t.event?.title || 'N/A'}</td>
                                <td className="p-4"><StatusPagamentoBadge status={t.status}/></td>
                                <td className={`p-4 text-right font-semibold ${t.tipo === 'receita' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatarMoeda(t.valor)}</td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        {t.status === 'Pendente' && <button onClick={() => handleUpdateTransactionStatus(t.id, 'Efetivado')} className="p-2 text-green-500 hover:text-green-700" title="Marcar como Efetivado"><CheckCircle size={18} /></button>}
                                        <button onClick={() => abrirModal(t.tipo, t)} className="p-2 text-gray-500 hover:text-indigo-600" title="Editar"><Pencil size={18} /></button>
                                        <button onClick={() => handleExcluirTransacao(t.id)} className="p-2 text-gray-500 hover:text-red-600" title="Excluir"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ModalTransacao aberto={modalAberto} aoFechar={fecharModal} aoSalvar={handleSalvarTransacao} tipoInicial={tipoModal} transacaoInicial={transacaoEmEdicao} clientes={clientes} fornecedores={fornecedores} eventos={eventos} categorias={categorias} />
        </div>
    );
}

function ModalTransacao({ aberto, aoFechar, aoSalvar, tipoInicial, transacaoInicial, clientes, fornecedores, eventos, categorias }) {
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (aberto) {
            const today = new Date().toISOString().split('T')[0];
            const initialState = {
                descricao: '', valor: '', categoria: '', tipo: tipoInicial,
                status: 'Efetivado', metodoPagamento: 'PIX', dataVencimento: '',
                clientId: null, supplierId: null, eventId: null,
                data: today,
                observacoes: '',
                linkComprovante: '',
                numeroDocumento: ''
            };
            const editingState = transacaoInicial ? {
                ...transacaoInicial,
                valor: String(transacaoInicial.valor),
                data: transacaoInicial.data ? transacaoInicial.data.split('T')[0] : today,
                dataVencimento: transacaoInicial.dataVencimento ? transacaoInicial.dataVencimento.split('T')[0] : '',
                clientId: transacaoInicial.clientId || null,
                supplierId: transacaoInicial.supplierId || null,
                eventId: transacaoInicial.eventId || null,
                observacoes: transacaoInicial.observacoes || '',
                linkComprovante: transacaoInicial.linkComprovante || '',
                numeroDocumento: transacaoInicial.numeroDocumento || ''
            } : initialState;
            setFormData(editingState);
            setErrors({});
        }
    }, [aberto, tipoInicial, transacaoInicial]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.descricao) newErrors.descricao = 'Descrição é obrigatória.';
        if (!formData.valor || parseFloat(formData.valor) <= 0) newErrors.valor = 'Valor deve ser maior que zero.';
        if (!formData.categoria) newErrors.categoria = 'Categoria é obrigatória.';
        if (!formData.metodoPagamento) newErrors.metodoPagamento = 'Forma de Pagamento é obrigatória.';
        if (!formData.data) newErrors.data = 'Data é obrigatória.';
        if (formData.status === 'Pendente' && !formData.dataVencimento) {
            newErrors.dataVencimento = 'Data de Vencimento é obrigatória para status Pendente.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => { 
        e.preventDefault(); 
        if (!validateForm()) {
            toast.error('Por favor, corrija os erros no formulário.');
            return;
        }
        const dataToSave = { 
            ...formData, 
            valor: parseFloat(formData.valor), 
            clientId: formData.clientId ? parseInt(formData.clientId) : null, 
            supplierId: formData.supplierId ? parseInt(formData.supplierId) : null,
            eventId: formData.eventId || null
        }; 
        aoSalvar(dataToSave); 
    };
    
    const handleInputChange = (e) => { 
        const { name, value } = e.target; 
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };
    const handleTipoChange = (novoTipo) => {
        setFormData(prev => ({...prev, tipo: novoTipo, categoria: '', clientId: null, supplierId: null, eventId: null}));
    };
    
    const isReceita = formData.tipo === 'receita';
    const categoriasOpcoes = isReceita ? categorias.receitas : categorias.despesas;

    return (
        <AnimatePresence>
            {aberto && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col">
                        <div className="p-6 flex justify-between items-center flex-shrink-0"><h2 className="text-2xl font-bold">{transacaoInicial ? 'Editar' : 'Nova'} Transação</h2><button onClick={aoFechar} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><IconX size={22}/></button></div>
                        <form onSubmit={handleSubmit} className="flex-grow overflow-hidden flex flex-col">
                            <div className="px-8 pt-2 flex-shrink-0">
                                <div className="p-1 bg-gray-100 dark:bg-gray-700 rounded-lg flex">
                                    <button type="button" onClick={() => handleTipoChange('receita')} className={`flex-1 p-2 rounded-md font-semibold transition-colors ${isReceita ? 'bg-white dark:bg-gray-900 text-green-600' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>Receita</button>
                                    <button type="button" onClick={() => handleTipoChange('despesa')} className={`flex-1 p-2 rounded-md font-semibold transition-colors ${!isReceita ? 'bg-white dark:bg-gray-900 text-red-600' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>Despesa</button>
                                </div>
                            </div>
                            
                            <div className="p-8 space-y-6 overflow-y-auto flex-grow max-h-[65vh]">
                                <div className="space-y-4"><h3 className="text-xl font-semibold text-gray-800 dark:text-white">Detalhes Principais</h3>
                                    <div><label className="label-form">Descrição*</label><input type="text" name="descricao" value={formData.descricao || ''} onChange={handleInputChange} className={`input-form w-full ${errors.descricao ? 'input-error' : ''}`} required/></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        <div><label className="label-form">Valor (R$)*</label><input type="number" name="valor" step="0.01" value={formData.valor || ''} onChange={handleInputChange} className={`input-form w-full ${isReceita ? 'input-success' : 'input-danger'} ${errors.valor ? 'input-error' : ''}`} required/></div>
                                        <div><label className="label-form">Data de Competência*</label><input type="date" name="data" value={formData.data || ''} onChange={handleInputChange} className={`input-form w-full ${errors.data ? 'input-error' : ''}`} required/></div>
                                    </div>
                                    <div><label className="label-form">Categoria*</label><select name="categoria" value={formData.categoria || ''} onChange={handleInputChange} className={`input-form w-full ${errors.categoria ? 'input-error' : ''}`} required><option value="">Selecione...</option>{categoriasOpcoes.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                </div>

                                <div className="border-t dark:border-gray-700 pt-6 space-y-4"><h3 className="text-xl font-semibold text-gray-800 dark:text-white">Vínculos (Opcional)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        {isReceita ? (
                                            <div><label className="label-form">Cliente</label><select name="clientId" value={formData.clientId || ''} onChange={handleInputChange} className="input-form w-full"><option value="">Vincular a um cliente...</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
                                        ) : (
                                            <div><label className="label-form">Fornecedor</label><select name="supplierId" value={formData.supplierId || ''} onChange={handleInputChange} className="input-form w-full"><option value="">Vincular a um fornecedor...</option>{fornecedores.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}</select></div>
                                        )}
                                        <div><label className="label-form">Evento</label><select name="eventId" value={formData.eventId || ''} onChange={handleInputChange} className="input-form w-full"><option value="">Vincular a um evento...</option>{eventos.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}</select></div>
                                    </div>
                                </div>
                                
                                <div className="border-t dark:border-gray-700 pt-6 space-y-4"><h3 className="text-xl font-semibold text-gray-800 dark:text-white">Pagamento</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        <div><label className="label-form">Status*</label><select name="status" value={formData.status || ''} onChange={handleInputChange} className={`input-form w-full ${errors.status ? 'input-error' : ''}`}><option value="Efetivado">Efetivado</option><option value="Pendente">Pendente</option></select></div>
                                        {formData.status === 'Pendente' && <motion.div initial={{opacity:0}} animate={{opacity:1}}><label className="label-form">Data de Vencimento*</label><input type="date" name="dataVencimento" value={formData.dataVencimento || ''} onChange={handleInputChange} className={`input-form w-full ${errors.dataVencimento ? 'input-error' : ''}`} required/></motion.div>}
                                        <div><label className="label-form">Forma de Pagamento*</label><select name="metodoPagamento" value={formData.metodoPagamento || ''} onChange={handleInputChange} className={`input-form w-full ${errors.metodoPagamento ? 'input-error' : ''}`} required><option>PIX</option><option>Cartão de Crédito</option><option>Boleto</option><option>Transferência</option><option>Dinheiro</option></select></div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 flex justify-end gap-4 border-t dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                                <button type="button" onClick={aoFechar} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">{transacaoInicial ? 'Salvar Alterações' : 'Salvar Transação'}</button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};