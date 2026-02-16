import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Plus, Minus, ArrowUpRight, ArrowDownLeft, Wallet, X as IconX, Clock, CheckCircle, Pencil, Trash2, Filter, XCircle, Loader2, DollarSign } from 'lucide-react';
import { format, getMonth, getYear, subMonths, startOfMonth, endOfMonth, isWithinInterval, startOfYear, endOfYear, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
    getAllClients, getAllSuppliers, getTransactions, updateTransactionStatus,
    deleteTransaction, createTransaction, updateTransaction, getEvents, getTransactionCategories
} from '@/services/api';

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const inputPremiumClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-gray-700 font-medium";
const labelPremiumClass = "block text-sm font-bold text-gray-700 mb-1.5 ml-1";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) { 
        return ( 
            <div className="bg-white/95 backdrop-blur-md text-gray-800 p-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100"> 
                <p className="font-bold text-gray-900 mb-2">{`Data: ${new Date(label).toLocaleDateString('pt-BR')}`}</p>
                {payload.filter(pld => pld.value != null).map((pld, index) => ( 
                    <p key={index} style={{ color: pld.stroke || pld.fill }} className="font-semibold">{`${pld.name}: ${formatarMoeda(pld.value)}`}</p> 
                ))} 
            </div> 
        ); 
    } return null; 
};

const CardKPI = ({ icone: Icone, titulo, valor, cor }) => {
    const bgConfig = {
        'text-emerald-500': 'bg-emerald-50 border-emerald-100',
        'text-rose-500': 'bg-rose-50 border-rose-100',
        'text-blue-500': 'bg-blue-50 border-blue-100',
        'text-amber-500': 'bg-amber-50 border-amber-100',
    }[cor] || 'bg-gray-50 border-gray-100';

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }} 
            whileHover={{ y: -4 }}
            className={`p-6 rounded-[2rem] border ${bgConfig} shadow-sm transition-all duration-300 flex items-center gap-5`}
        >
            <div className={`p-4 rounded-2xl bg-white shadow-sm border border-gray-100`}>
                <Icone size={28} className={cor} strokeWidth={2} />
            </div>
            <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{titulo}</p>
                <p className={`text-3xl font-black mt-1 tracking-tight ${cor}`}>{formatarMoeda(valor)}</p>
            </div>
        </motion.div>
    );
};

const StatusPagamentoBadge = ({ status }) => {
    const statusInfo = { 
        Efetivado: { icon: CheckCircle, color: 'emerald', label: 'Efetivado', bg: 'bg-emerald-50', textCol: 'text-emerald-700', border: 'border-emerald-200' }, 
        Pendente: { icon: Clock, color: 'amber', label: 'Pendente', bg: 'bg-amber-50', textCol: 'text-amber-700', border: 'border-amber-200' }
    }[status] || { icon: Clock, color: 'gray', label: status, bg: 'bg-gray-100', textCol: 'text-gray-700', border: 'border-gray-200' };
    
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm tracking-wide ${statusInfo.bg} ${statusInfo.textCol} ${statusInfo.border}`}>
            <statusInfo.icon size={12} strokeWidth={2.5}/>{statusInfo.label}
        </span>
    );
};

const initialKpiLayout = [
    { id: 'kpi-receitaRealizada', titulo: "Receitas", icone: ArrowUpRight, cor: "text-emerald-500", valorKey: 'receitaRealizada' },
    { id: 'kpi-despesaRealizada', titulo: "Despesas", icone: ArrowDownLeft, cor: "text-rose-500", valorKey: 'despesaRealizada' },
    { id: 'kpi-saldo', titulo: "Caixa (Saldo)", icone: Wallet, corKey: 'saldo', valorKey: 'saldo' },
    { id: 'kpi-pendente', titulo: "A Receber", icone: Clock, cor: "text-amber-500", valorKey: 'pendenteLiquido' },
];

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
    
    const hoje = new Date();
    const [filtros, setFiltros] = useState({ 
        dataInicio: startOfMonth(hoje).toISOString().split('T')[0], 
        dataFim: endOfMonth(hoje).toISOString().split('T')[0], 
        categoria: 'todas', 
        status: 'todos' 
    });
    
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
            toast.error(error.message || 'Erro ao carregar dados financeiros.');
        } finally {
            setIsLoading(false);
        }
    }, [filtros]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
            toast.success(`Transação ${isEditing ? 'atualizada' : 'registrada'} com sucesso!`);
            fecharModal();
            fetchData();
        } catch (error) {
            toast.error(error.message);
        }
    };
    
    const handleUpdateTransactionStatus = async (transactionId, newStatus) => {
        if (!window.confirm(`Mudar o status para "${newStatus}"?`)) return;
        try {
            await updateTransactionStatus(transactionId, newStatus);
            toast.success(`Pagamento ${newStatus}!`);
            fetchData();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleExcluirTransacao = async (id) => {
        if(window.confirm("Atenção: A exclusão é permanente. Deseja continuar?")) {
            try {
                await deleteTransaction(id);
                toast.success('Transação removida do caixa.');
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
    };

    if (isLoading) { return <div className="flex flex-col items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-amber-500 w-12 h-12 mb-4" /> <p className="text-gray-500 font-bold tracking-wide">Sincronizando caixa...</p></div>; }

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8 min-h-screen">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-light text-gray-800 tracking-wide flex items-center gap-3">
                        <span className="font-bold text-amber-600">Gestão</span> Financeira
                        <DollarSign className="text-amber-400" size={28} />
                    </h1>
                    <p className="mt-1 text-gray-500 font-medium">Controle o fluxo de caixa, receitas e despesas.</p>
                </div>
                <div className="flex gap-3">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => abrirModal('receita')} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all">
                        <Plus size={20} strokeWidth={2.5}/> Nova Receita
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => abrirModal('despesa')} className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold shadow-md shadow-rose-500/20 flex items-center gap-2 transition-all">
                        <Minus size={20} strokeWidth={2.5}/> Nova Despesa
                    </motion.button>
                </div>
            </header>
            
            <div className="bg-white p-5 rounded-[2rem] border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2 mb-4 px-2">
                    <Filter size={20} className="text-amber-500" />
                    <h3 className="text-lg font-bold text-gray-800">Filtros de Período</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 px-2">Data Inicial</label>
                        <input type="date" name="dataInicio" value={filtros.dataInicio} onChange={handleFiltroChange} className={inputPremiumClass}/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 px-2">Data Final</label>
                        <input type="date" name="dataFim" value={filtros.dataFim} onChange={handleFiltroChange} className={inputPremiumClass}/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 px-2">Status</label>
                        <select name="status" value={filtros.status} onChange={handleFiltroChange} className={inputPremiumClass}>
                            <option value="todos">Todos os Status</option>
                            <option value="Efetivado">Efetivado (Pago)</option>
                            <option value="Pendente">Pendente (A Pagar/Receber)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 px-2">Categoria</label>
                        <select name="categoria" value={filtros.categoria} onChange={handleFiltroChange} className={inputPremiumClass}>
                            <option value="todas">Todas as Categorias</option>
                            <optgroup label="Receitas">
                                {categorias.receitas.map(c => <option key={c} value={c}>{c}</option>)}
                            </optgroup>
                            <optgroup label="Despesas">
                                {categorias.despesas.map(c => <option key={c} value={c}>{c}</option>)}
                            </optgroup>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button onClick={limparFiltros} className="w-full h-[46px] px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                            <XCircle size={18} /> Limpar
                        </button>
                    </div>
                </div>
            </div>
            
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="finance-kpis" direction="horizontal">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {kpiCards.map((card, index) => {
                                let valor = dadosFinanceiros[card.valorKey];
                                let cor = card.cor; 
                                if (card.id === 'kpi-saldo') cor = valor >= 0 ? "text-blue-500" : "text-rose-500";
                                return (
                                    <Draggable key={card.id} draggableId={card.id} index={index}>
                                        {(provided) => (
                                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="h-full cursor-grab active:cursor-grabbing outline-none">
                                                <CardKPI icone={card.icone} titulo={card.titulo} valor={valor} cor={cor} />
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
            
            <div className="bg-white rounded-[2rem] border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                    <h3 className="text-xl font-bold text-gray-800">Fluxo de Lançamentos</h3>
                    <p className="text-sm text-gray-500 mt-1">Histórico de movimentações de acordo com o filtro aplicado.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/80 border-b border-gray-200">
                            <tr>
                                <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500">Descrição / Tipo</th>
                                <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 hidden md:table-cell">Data de Competência</th>
                                <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 hidden sm:table-cell">Vínculo (Cliente/Fornecedor)</th>
                                <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500">Status</th>
                                <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 text-right">Valor Registrado</th>
                                <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 text-center">Gestão</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transacoesFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-16 text-center text-gray-400 font-medium">Nenhuma transação encontrada para este período ou filtro.</td>
                                </tr>
                            ) : (
                                transacoesFiltradas.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map(t => (
                                    <tr key={t.id} className="hover:bg-amber-50/30 transition-colors group">
                                        <td className="p-5">
                                            <p className="font-bold text-gray-900 mb-0.5">{t.descricao}</p>
                                            <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md ${t.tipo === 'receita' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {t.tipo}
                                            </span>
                                        </td>
                                        <td className="p-5 hidden md:table-cell">
                                            <p className="font-medium text-gray-700">{new Date(t.data).toLocaleDateString('pt-BR')}</p>
                                            {t.status === 'Pendente' && t.dataVencimento && (
                                                <p className="text-xs font-bold text-amber-600 mt-1 flex items-center gap-1"><Clock size={12}/> Vence em: {new Date(t.dataVencimento).toLocaleDateString('pt-BR')}</p>
                                            )}
                                        </td>
                                        <td className="p-5 hidden sm:table-cell">
                                            <p className="font-medium text-gray-600">{t.client?.nome || t.supplier?.nome || t.event?.title || 'Lançamento Avulso'}</p>
                                        </td>
                                        <td className="p-5"><StatusPagamentoBadge status={t.status}/></td>
                                        <td className={`p-5 text-right font-black tracking-tight ${t.tipo === 'receita' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {t.tipo === 'despesa' ? '-' : ''} {formatarMoeda(t.valor)}
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className="flex justify-center items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                {t.status === 'Pendente' && (
                                                    <button onClick={() => handleUpdateTransactionStatus(t.id, 'Efetivado')} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Marcar como Pago/Recebido">
                                                        <CheckCircle size={18} strokeWidth={2}/>
                                                    </button>
                                                )}
                                                <button onClick={() => abrirModal(t.tipo, t)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Editar Lançamento">
                                                    <Pencil size={18} strokeWidth={2}/>
                                                </button>
                                                <button onClick={() => handleExcluirTransacao(t.id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Excluir">
                                                    <Trash2 size={18} strokeWidth={2}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ModalTransacao 
                aberto={modalAberto} 
                aoFechar={fecharModal} 
                aoSalvar={handleSalvarTransacao} 
                tipoInicial={tipoModal} 
                transacaoInicial={transacaoEmEdicao} 
                clientes={clientes} 
                fornecedores={fornecedores} 
                eventos={eventos} 
                categorias={categorias} 
            />
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
            newErrors.dataVencimento = 'Obrigatório para status Pendente.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => { 
        e.preventDefault(); 
        if (!validateForm()) {
            toast.error('Preencha os campos obrigatórios.');
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden">
                        <div className="p-6 md:p-8 flex justify-between items-center border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                <Wallet className={isReceita ? "text-emerald-500" : "text-rose-500"} size={28} />
                                {transacaoInicial ? 'Editar Lançamento' : 'Novo Lançamento'}
                            </h2>
                            <button onClick={aoFechar} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"><IconX size={24}/></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                            <div className="px-8 pt-6 pb-2">
                                <div className="flex bg-gray-100 p-1.5 rounded-xl">
                                    <button type="button" onClick={() => handleTipoChange('receita')} className={`flex-1 py-2.5 rounded-lg font-bold transition-all ${isReceita ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}>Entrada (Receita)</button>
                                    <button type="button" onClick={() => handleTipoChange('despesa')} className={`flex-1 py-2.5 rounded-lg font-bold transition-all ${!isReceita ? 'bg-white shadow-sm text-rose-600' : 'text-gray-500 hover:text-gray-700'}`}>Saída (Despesa)</button>
                                </div>
                            </div>
                            
                            <div className="p-8 space-y-8 overflow-y-auto flex-grow max-h-[60vh] custom-scrollbar">
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">Detalhes do Valor</h3>
                                    <div>
                                        <label className={labelPremiumClass}>Descrição do Lançamento*</label>
                                        <input type="text" name="descricao" value={formData.descricao || ''} onChange={handleInputChange} className={`${inputPremiumClass} ${errors.descricao ? 'border-rose-400 bg-rose-50' : ''}`} placeholder="Ex: Pagamento de Fornecedor, Sinal do Cliente..."/>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className={labelPremiumClass}>Valor (R$)*</label>
                                            <div className="relative">
                                                <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-black ${isReceita ? 'text-emerald-500' : 'text-rose-500'}`}>R$</span>
                                                <input type="number" name="valor" step="0.01" value={formData.valor || ''} onChange={handleInputChange} className={`${inputPremiumClass} pl-12 font-black text-lg ${errors.valor ? 'border-rose-400 bg-rose-50' : ''}`} placeholder="0.00"/>
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelPremiumClass}>Data de Competência*</label>
                                            <input type="date" name="data" value={formData.data || ''} onChange={handleInputChange} className={`${inputPremiumClass} ${errors.data ? 'border-rose-400 bg-rose-50' : ''}`}/>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelPremiumClass}>Categoria Financeira*</label>
                                        <select name="categoria" value={formData.categoria || ''} onChange={handleInputChange} className={`${inputPremiumClass} ${errors.categoria ? 'border-rose-400 bg-rose-50' : ''}`}>
                                            <option value="">Selecione uma categoria estrutural...</option>
                                            {categoriasOpcoes.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-6 border-t border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">Status e Vínculos</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className={labelPremiumClass}>Status do Lançamento*</label>
                                            <select name="status" value={formData.status || ''} onChange={handleInputChange} className={inputPremiumClass}>
                                                <option value="Efetivado">Efetivado (Valor em Caixa)</option>
                                                <option value="Pendente">Pendente (À Pagar / À Receber)</option>
                                            </select>
                                        </div>
                                        {formData.status === 'Pendente' && (
                                            <motion.div initial={{opacity:0, x: -10}} animate={{opacity:1, x: 0}}>
                                                <label className={labelPremiumClass}>Data de Vencimento*</label>
                                                <input type="date" name="dataVencimento" value={formData.dataVencimento || ''} onChange={handleInputChange} className={`${inputPremiumClass} ${errors.dataVencimento ? 'border-rose-400 bg-rose-50' : ''}`}/>
                                            </motion.div>
                                        )}
                                        <div>
                                            <label className={labelPremiumClass}>Forma de Pagamento</label>
                                            <select name="metodoPagamento" value={formData.metodoPagamento || ''} onChange={handleInputChange} className={inputPremiumClass}>
                                                <option>PIX</option><option>Cartão de Crédito</option><option>Cartão de Débito</option><option>Boleto Bancário</option><option>Transferência (TED/DOC)</option><option>Dinheiro em Espécie</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelPremiumClass}>Vincular Evento (Opcional)</label>
                                            <select name="eventId" value={formData.eventId || ''} onChange={handleInputChange} className={inputPremiumClass}>
                                                <option value="">Sem vínculo direto...</option>
                                                {eventos.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className={labelPremiumClass}>{isReceita ? 'Cliente Vinculado (Opcional)' : 'Fornecedor Vinculado (Opcional)'}</label>
                                            {isReceita ? (
                                                <select name="clientId" value={formData.clientId || ''} onChange={handleInputChange} className={inputPremiumClass}><option value="">Selecionar cliente da base...</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select>
                                            ) : (
                                                <select name="supplierId" value={formData.supplierId || ''} onChange={handleInputChange} className={inputPremiumClass}><option value="">Selecionar fornecedor da base...</option>{fornecedores.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}</select>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 md:p-8 flex justify-end gap-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0 rounded-b-[2rem]">
                                <button type="button" onClick={aoFechar} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
                                <button type="submit" className={`px-8 py-2.5 text-white rounded-xl font-bold shadow-md transition-all ${isReceita ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'}`}>
                                    {transacaoInicial ? 'Atualizar Registro' : 'Confirmar Lançamento'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}