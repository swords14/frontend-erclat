import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
    Plus, Search, FileText, CheckCircle, Clock, XCircle, X as IconX, Trash2, Pencil, Info, ListOrdered, DollarSign, MapPin,
    ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ThumbsUp, Frown, Loader2, Sparkles, Send, Tag
} from 'lucide-react';
import {
    getAllBudgets, createBudget, getItemsForBudget, getAllClients,
    deleteBudget, getBudgetById, updateBudget, updateBudgetStatus
} from '@/services/api';

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const inputPremiumClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-gray-700 font-medium";
const labelPremiumClass = "block text-sm font-bold text-gray-700 mb-1.5 ml-1";

const StatusBadge = ({ status }) => {
    const statusInfo = {
        'Rascunho': { icon: Pencil, color: 'gray', label: 'Rascunho', bg: 'bg-gray-100', textCol: 'text-gray-700', border: 'border-gray-200' },
        'Orçamento Enviado': { icon: Send, color: 'sky', label: 'Enviado', bg: 'bg-sky-50', textCol: 'text-sky-700', border: 'border-sky-200' },
        'Aprovado': { icon: CheckCircle, color: 'emerald', label: 'Aprovado', bg: 'bg-emerald-50', textCol: 'text-emerald-700', border: 'border-emerald-200' },
        'Recusado': { icon: XCircle, color: 'rose', label: 'Recusado', bg: 'bg-rose-50', textCol: 'text-rose-700', border: 'border-rose-200' },
        'Follow-up': { icon: Clock, color: 'orange', label: 'Follow-up', bg: 'bg-orange-50', textCol: 'text-orange-700', border: 'border-orange-200' },
        'Em Negociação': { icon: Tag, color: 'amber', label: 'Negociando', bg: 'bg-amber-50', textCol: 'text-amber-700', border: 'border-amber-200' }
    }[status] || { icon: Clock, color: 'gray', label: status, bg: 'bg-gray-100', textCol: 'text-gray-700', border: 'border-gray-200' };
    
    return ( 
        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border shadow-sm tracking-wide ${statusInfo.bg} ${statusInfo.textCol} ${statusInfo.border}`}> 
            <statusInfo.icon size={12} strokeWidth={2.5} /> {statusInfo.label} 
        </span> 
    );
};

const CardKPI = ({ titulo, valor, descricao, icone: Icon, corIcone = "text-amber-500", bgIcone = "bg-amber-50" }) => ( 
    <motion.div 
        whileHover={{ y: -4 }} 
        className="bg-white p-6 rounded-2xl border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex items-center gap-5 transition-all duration-300 hover:border-amber-300 hover:shadow-[0_4px_20px_rgba(245,158,11,0.05)]"
    >
        <div className={`p-3.5 ${bgIcone} border border-gray-100 rounded-xl`}>
            <Icon className={corIcone} size={24} strokeWidth={1.5} />
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium tracking-wide">{titulo}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{valor}</p>
            <p className="text-xs text-gray-400 font-medium mt-1">{descricao}</p>
        </div>
    </motion.div> 
);

const EmptyState = ({ message, onActionClick }) => (
    <div className="text-center py-20 px-6 bg-white rounded-[2rem] shadow-sm border border-gray-200 flex flex-col items-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
            <FileText size={40} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Nenhum orçamento encontrado</h3>
        <p className="mt-2 text-gray-500 font-medium max-w-sm">{message}</p>
        <button onClick={onActionClick} className="mt-8 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all">
            <Plus size={20} /> Criar Primeira Proposta
        </button>
    </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => { 
    if (totalPages <= 1) return null; 
    return ( 
        <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg disabled:opacity-50 transition-colors"><ChevronsLeft size={20}/></button>
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg disabled:opacity-50 transition-colors"><ChevronLeft size={20}/></button>
            <span className="text-sm font-bold text-gray-600 px-4">Página {currentPage} de {totalPages}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg disabled:opacity-50 transition-colors"><ChevronRight size={20}/></button>
            <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg disabled:opacity-50 transition-colors"><ChevronsRight size={20}/></button>
        </div> 
    ); 
};

const ITEMS_PER_PAGE = 8;

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [itensDeEstoque, setItensDeEstoque] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [orcamentoEmEdicao, setOrcamentoEmEdicao] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(null);

  const fetchData = useCallback(async () => {
      setIsLoading(true);
      try {
          const [budgetsData, clientsData, inventoryData] = await Promise.all([
              getAllBudgets(), getAllClients(), getItemsForBudget()
          ]);
          setOrcamentos(budgetsData || []);
          setClientes(clientsData || []);
          setItensDeEstoque(inventoryData || []);
      } catch (error) {
          console.error(error);
          toast.error(`Erro ao buscar dados: ${error.message}`);
      } finally {
          setIsLoading(false);
      }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const dadosProcessados = useMemo(() => {
    const emAberto = orcamentos.filter(o => ['Orçamento Enviado', 'Rascunho', 'Follow-up', 'Em Negociação'].includes(o.status));
    const valorEmAberto = emAberto.reduce((acc, o) => acc + (Number(o.valorTotal) || 0), 0);
    
    const filtered = orcamentos.filter(o =>
        (o.client?.nome?.toLowerCase() || '').includes(termoBusca.toLowerCase()) ||
        (o.eventName?.toLowerCase() || '').includes(termoBusca.toLowerCase())
    );
    
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return { emAberto: emAberto.length, valorEmAberto, filtrados: paginatedData, totalCount: filtered.length, totalPages };
  }, [orcamentos, termoBusca, currentPage]);

  const handleSalvarOrcamento = async (dadosDoForm) => {
    const toastId = toast.loading(orcamentoEmEdicao ? "Atualizando orçamento..." : "Criando orçamento...");
    try {
        if (orcamentoEmEdicao) {
            await updateBudget(orcamentoEmEdicao.id, dadosDoForm);
            toast.success("Orçamento atualizado!", { id: toastId });
        } else {
            await createBudget(dadosDoForm);
            toast.success("Orçamento criado com sucesso!", { id: toastId });
        }
        setModalAberto(false);
        setOrcamentoEmEdicao(null);
        fetchData();
    } catch (error) {
        console.error(error);
        toast.error(`Erro: ${error.message}`, { id: toastId });
    }
  };

  const handleExcluirOrcamento = async (budgetId) => {
    if (window.confirm("Tem certeza de que deseja excluir este orçamento de forma permanente?")) {
        try {
            await deleteBudget(budgetId);
            toast.success("Orçamento excluído.");
            fetchData();
        } catch (error) {
            toast.error(`Erro ao excluir: ${error.message}`);
        }
    }
  };
  
  const handleUpdateStatus = async (budgetId, newStatus) => {
      if (!window.confirm(`Mudar o status para "${newStatus}"?`)) return;

      setIsUpdatingStatus(budgetId);
      try {
          await updateBudgetStatus(budgetId, newStatus);
          toast.success(`Status atualizado para "${newStatus}"!`);
          fetchData();
      } catch (error) {
          toast.error(`Erro ao atualizar status: ${error.message}`);
      } finally {
          setIsUpdatingStatus(null);
      }
  };

  const handleAbrirModal = (orcamento = null) => {
      setOrcamentoEmEdicao(orcamento);
      setModalAberto(true);
  };

  const handleFecharModal = () => {
      setModalAberto(false);
      setOrcamentoEmEdicao(null);
  }

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-light text-gray-800 tracking-wide flex items-center gap-3">
                <span className="font-bold text-amber-600">Propostas</span> e Orçamentos
                <Sparkles className="text-amber-400" size={24} />
            </h1>
            <p className="mt-1 text-gray-500 font-medium">Crie, envie e gerencie suas propostas comerciais.</p>
        </div>
        <button 
            onClick={() => handleAbrirModal(null)} 
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all duration-300"
        >
            <Plus size={20} /> Nova Proposta
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <CardKPI titulo="Orçamentos em Aberto" valor={dadosProcessados.emAberto} descricao="Propostas aguardando resposta" icone={FileText} corIcone="text-blue-500" bgIcone="bg-blue-50" />
        <CardKPI titulo="Valor em Negociação" valor={formatarMoeda(dadosProcessados.valorEmAberto)} descricao="Soma das propostas em aberto" icone={DollarSign} corIcone="text-emerald-500" bgIcone="bg-emerald-50" />
        <CardKPI titulo="Conversão Global" valor="N/A" descricao="Aceites vs Enviados (Em breve)" icone={CheckCircle} corIcone="text-amber-500" bgIcone="bg-amber-50" />
      </div>

      <div className="space-y-4">
        <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
                type="text" 
                placeholder="Buscar por cliente ou tipo de evento..." 
                value={termoBusca} 
                onChange={e => setTermoBusca(e.target.value)} 
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-gray-700 font-medium"
            />
        </div>
        
        {isLoading ? (
            <div className="text-center p-12 bg-white rounded-[2rem] border border-gray-200 shadow-sm">
                <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500 font-medium">Carregando propostas comerciais...</p>
            </div> 
        ) : dadosProcessados.totalCount > 0 ? (
            <div>
                <div className="hidden md:block bg-white rounded-[2rem] border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-200">
                            <tr>
                                <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500">Cliente / Evento</th>
                                <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500">Data do Evento</th>
                                <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500">Validade</th>
                                <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500">Status</th>
                                <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 text-right">Valor Final</th>
                                <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {dadosProcessados.filtrados.map(o => (
                                <tr key={o.id} className="hover:bg-amber-50/30 transition-colors group">
                                    <td className="p-5">
                                        <p className="font-bold text-gray-900">{o.client?.nome || 'Cliente Removido'}</p>
                                        <p className="text-xs text-gray-500 font-medium mt-0.5">{o.eventName || 'Sem Título'}</p>
                                    </td>
                                    <td className="p-5 font-medium text-gray-600">{o.eventDate ? new Date(o.eventDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '—'}</td>
                                    <td className="p-5 font-medium text-gray-600">{o.validade ? new Date(o.validade).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '—'}</td>
                                    <td className="p-5"><StatusBadge status={o.status} /></td>
                                    <td className="p-5 text-right font-bold text-gray-900">{formatarMoeda(o.valorTotal)}</td>
                                    <td className="p-5 text-center">
                                        <div className="flex justify-center items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleAbrirModal(o)} className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" aria-label="Editar"><Pencil size={18} strokeWidth={2} /></button>
                                            <button onClick={() => handleExcluirOrcamento(o.id)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" aria-label="Excluir"><Trash2 size={18} strokeWidth={2} /></button>
                                            
                                            {o.status !== 'Aprovado' && o.status !== 'Recusado' && (
                                                <>
                                                    <button onClick={() => handleUpdateStatus(o.id, 'Aprovado')} disabled={isUpdatingStatus === o.id} className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Aprovar Proposta">
                                                        {isUpdatingStatus === o.id ? <Loader2 size={18} className="animate-spin" /> : <ThumbsUp size={18} strokeWidth={2} />}
                                                    </button>
                                                    <button onClick={() => handleUpdateStatus(o.id, 'Recusado')} disabled={isUpdatingStatus === o.id} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Recusar Proposta">
                                                        <Frown size={18} strokeWidth={2} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Visualização Mobile Omitida para brevidade de layout limpo, mantendo a responsividade do Table onde possível ou você pode reativar seu Card de Mobile com as classes novas */}
                
                <Pagination currentPage={currentPage} totalPages={dadosProcessados.totalPages} onPageChange={setCurrentPage} />
            </div>
        ) : (
            <EmptyState message={termoBusca ? "Nenhuma proposta atende aos critérios da sua busca." : "Sua lista está limpa. Inicie uma nova negociação criando a primeira proposta."} onActionClick={() => handleAbrirModal(null)} />
        )}
      </div>

      <ModalOrcamento
        aberto={modalAberto}
        orcamentoParaEditar={orcamentoEmEdicao}
        aoFechar={handleFecharModal}
        aoSalvar={handleSalvarOrcamento}
        clientes={clientes}
        itensDeEstoque={itensDeEstoque}
      />
    </div>
  );
}


const ModalTabs = ({ tabs, activeTab, setActiveTab }) => (
    <div className="border-b border-gray-200 bg-white">
        <nav className="flex space-x-2 overflow-x-auto px-8 custom-scrollbar">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-4 text-sm font-bold border-b-2 transition-all duration-200 outline-none whitespace-nowrap
                        ${activeTab === tab.id
                            ? 'border-amber-500 text-amber-600'
                            : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200'
                        }
                    `}
                >
                    <tab.icon size={18} /> {tab.name}
                </button>
            ))}
        </nav>
    </div>
);

function ModalOrcamento({ aberto, aoFechar, aoSalvar, orcamentoParaEditar, clientes, itensDeEstoque }) {
  const gerarCodigoPadrao = () => `PRO-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
  
  const initialState = { 
    clienteId: '', 
    eventName: '', 
    eventDate: '', 
    validade: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0], 
    convidados: 50, 
    itens: [], 
    desconto: 0, 
    taxaServico: 10, 
    observacoes: '', 
    codigoOrcamento: gerarCodigoPadrao(), 
    versao: '1.0', 
    dataEnvio: '', 
    localEventoNome: '', 
    localEventoEndereco: '', 
    localEventoCidade: '', 
    localEventoEstado: '', 
    localEventoCEP: '', 
    horarioInicio: '', 
    horarioFim: '', 
    tipoCozinha: '', 
    restricoesAlimentares: '', 
    condicoesPagamento: '', 
    observacoesFinanceiras: '' 
  };
  
  const [formData, setFormData] = useState(initialState);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState('');
  const [activeTab, setActiveTab] = useState('info');

  const tabs = [
      { id: 'info', name: 'Geral', icon: FileText },
      { id: 'location', name: 'Logística', icon: MapPin },
      { id: 'items', name: 'Serviços do Evento', icon: ListOrdered },
      { id: 'financial', name: 'Valores e Condições', icon: DollarSign },
  ];
  
  useEffect(() => {
    const loadModalData = async () => {
        setIsLoadingData(true);
        try {
            if (orcamentoParaEditar) {
                const budgetCompleto = await getBudgetById(orcamentoParaEditar.id);
                setFormData({
                    id: budgetCompleto.id,
                    clienteId: budgetCompleto.clientId,
                    eventName: budgetCompleto.eventName || '',
                    eventDate: budgetCompleto.eventDate ? new Date(budgetCompleto.eventDate).toISOString().split('T')[0] : '',
                    validade: budgetCompleto.validade ? new Date(budgetCompleto.validade).toISOString().split('T')[0] : initialState.validade,
                    convidados: budgetCompleto.convidados || 50,
                    itens: budgetCompleto.items || [], 
                    desconto: budgetCompleto.desconto || 0,
                    taxaServico: budgetCompleto.taxaServico || 10,
                    observacoes: budgetCompleto.observacoes || '',
                    codigoOrcamento: budgetCompleto.codigoOrcamento || '',
                    versao: budgetCompleto.versao || '1.0',
                    dataEnvio: budgetCompleto.dataEnvio ? new Date(budgetCompleto.dataEnvio).toISOString().split('T')[0] : '',
                    localEventoNome: budgetCompleto.localEventoNome || '',
                    localEventoEndereco: budgetCompleto.localEventoEndereco || '',
                    localEventoCidade: budgetCompleto.localEventoCidade || '',
                    localEventoEstado: budgetCompleto.localEventoEstado || '',
                    localEventoCEP: budgetCompleto.localEventoCEP || '',
                    horarioInicio: budgetCompleto.horarioInicio || '',
                    horarioFim: budgetCompleto.horarioFim || '',
                    tipoCozinha: budgetCompleto.tipoCozinha || '',
                    restricoesAlimentares: budgetCompleto.restricoesAlimentares || '',
                    condicoesPagamento: budgetCompleto.condicoesPagamento || '',
                    observacoesFinanceiras: budgetCompleto.observacoesFinanceiras || ''
                });
            } else {
                setFormData({...initialState, codigoOrcamento: gerarCodigoPadrao()});
            }
        } catch (error) { toast.error(`Erro ao carregar detalhes: ${error.message}`); aoFechar(); } 
        finally { setIsLoadingData(false); }
    };
    if (aberto) { loadModalData(); } else { setActiveTab('info'); }
  }, [aberto, orcamentoParaEditar, aoFechar]);

  const calculos = useMemo(() => {
    const subtotal = formData.itens.reduce((acc, item) => acc + (item.quantidade * item.valorUnitario), 0);
    const valorDesconto = (subtotal * formData.desconto) / 100;
    const valorTaxa = ((subtotal - valorDesconto) * formData.taxaServico) / 100;
    const totalGeral = subtotal - valorDesconto + valorTaxa;
    return { subtotal, valorDesconto, valorTaxa, totalGeral };
  }, [formData.itens, formData.desconto, formData.taxaServico]);
  
  const handleChange = (e) => { 
    const { name, value } = e.target; 
    setFormData(prev => ({ ...prev, [name]: value })); 
  };

  const handleAddItem = () => {
    if (!itemSelecionado) return;
    const itemDoEstoque = itensDeEstoque.find(s => s.id === Number(itemSelecionado));
    if (itemDoEstoque && !formData.itens.find(item => item.id === itemDoEstoque.id)) {
      const novoItem = {
        id: itemDoEstoque.id, 
        descricao: itemDoEstoque.nome,
        quantidade: itemDoEstoque.unidade === 'pessoa' ? Number(formData.convidados) : 1,
        valorUnitario: itemDoEstoque.valor,
        unidade: itemDoEstoque.unidade
      };
      setFormData(prev => ({ ...prev, itens: [...prev.itens, novoItem] }));
    }
  };
  
  const handleRemoveItem = (itemId) => {
    setFormData(prev => ({ ...prev, itens: prev.itens.filter(item => item.id !== itemId) }));
  };
  
  const handleItemQtyChange = (itemId, novaQuantidade) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.map(item => item.id === itemId ? { ...item, quantidade: parseInt(novaQuantidade, 10) || 0 } : item)
    }));
  };

  useEffect(() => { 
    if (formData.convidados > 0) {
        setFormData(prev => ({ ...prev, itens: prev.itens.map(item => item.unidade === 'pessoa' ? {...item, quantidade: Number(prev.convidados)} : item)}));
    }
  }, [formData.convidados]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.clienteId) { 
        toast.error("Por favor, selecione um cliente na aba 'Geral'."); 
        setActiveTab('info'); 
        return; 
    }

    const dadosParaSalvar = { 
        ...formData, 
        clienteId: Number(formData.clienteId), // <-- CORREÇÃO AQUI (Forçando para Número para o Prisma)
        items: formData.itens.map(item => ({
            descricao: item.descricao,
            quantidade: Number(item.quantidade),
            valorUnitario: Number(item.valorUnitario),
            unidade: item.unidade
        })),
        eventDate: formData.eventDate ? new Date(formData.eventDate) : null,
        dataEnvio: formData.dataEnvio ? new Date(formData.dataEnvio) : null,
        validade: formData.validade ? new Date(formData.validade) : new Date(),
        totalGeral: Number(calculos.totalGeral)
    };
    
    delete dadosParaSalvar.itens;

    aoSalvar(dadosParaSalvar);
  };

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.form onSubmit={handleSubmit} initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl flex flex-col h-[90vh] overflow-hidden">
            <div className="p-6 md:p-8 flex justify-between items-center border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    {orcamentoParaEditar ? <Pencil className="text-amber-500" /> : <FileText className="text-amber-500" />}
                    {orcamentoParaEditar ? 'Editar Proposta' : 'Montar Nova Proposta'}
                </h2>
                <button type="button" onClick={aoFechar} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"><IconX size={24}/></button>
            </div>

            {isLoadingData ? (
                <div className="p-16 flex flex-col items-center justify-center h-full">
                    <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mb-4"></div>
                    <p className="text-gray-500 font-medium">Buscando detalhes...</p>
                </div>
            ) : (
                <>
                    <div className="flex-shrink-0">
                        <ModalTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
                    </div>

                    <div className="p-8 space-y-6 overflow-y-auto flex-grow bg-white custom-scrollbar">
                        {activeTab === 'info' && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                  <div className="md:col-span-2"><label className={labelPremiumClass}>Cliente Responsável*</label><select name="clienteId" value={formData.clienteId} onChange={handleChange} className={inputPremiumClass}><option value="">Selecione um cliente da base...</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
                                  <div><label className={labelPremiumClass}>Data do Evento</label><input type="date" name="eventDate" value={formData.eventDate} onChange={handleChange} className={inputPremiumClass} /></div>
                                  <div><label className={labelPremiumClass}>Convidados Previstos</label><input type="number" name="convidados" value={formData.convidados} onChange={handleChange} className={inputPremiumClass} /></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div><label className={labelPremiumClass}>Título da Proposta (Evento)</label><input type="text" name="eventName" value={formData.eventName} onChange={handleChange} className={inputPremiumClass} placeholder="Ex: Casamento no Campo" /></div>
                                    <div><label className={labelPremiumClass}>Validade da Proposta</label><input type="date" name="validade" value={formData.validade} onChange={handleChange} className={inputPremiumClass} /></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                                    <div><label className={labelPremiumClass}>Código / Ref.</label><input type="text" name="codigoOrcamento" value={formData.codigoOrcamento} onChange={handleChange} className={inputPremiumClass} placeholder="Ex: PRO-2026-123" /></div>
                                    <div><label className={labelPremiumClass}>Versão</label><input type="text" name="versao" value={formData.versao} onChange={handleChange} className={inputPremiumClass} /></div>
                                    <div><label className={labelPremiumClass}>Data Estimada de Envio</label><input type="date" name="dataEnvio" value={formData.dataEnvio} onChange={handleChange} className={inputPremiumClass} /></div>
                                </div>
                            </motion.div>
                        )}
                        {activeTab === 'location' && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div><label className={labelPremiumClass}>Nome do Espaço / Local</label><input type="text" name="localEventoNome" value={formData.localEventoNome} onChange={handleChange} className={inputPremiumClass} /></div>
                                <div><label className={labelPremiumClass}>Endereço do Local</label><input type="text" name="localEventoEndereco" value={formData.localEventoEndereco} onChange={handleChange} className={inputPremiumClass} placeholder="Rua, Número, Complemento" /></div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div><label className={labelPremiumClass}>Cidade</label><input type="text" name="localEventoCidade" value={formData.localEventoCidade} onChange={handleChange} className={inputPremiumClass} /></div>
                                  <div><label className={labelPremiumClass}>Estado</label><input type="text" name="localEventoEstado" value={formData.localEventoEstado} onChange={handleChange} className={inputPremiumClass} /></div>
                                  <div><label className={labelPremiumClass}>CEP</label><input type="text" name="localEventoCEP" value={formData.localEventoCEP} onChange={handleChange} className={inputPremiumClass} /></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                                  <div><label className={labelPremiumClass}>Horário de Início (Festa)</label><input type="time" name="horarioInicio" value={formData.horarioInicio} onChange={handleChange} className={inputPremiumClass} /></div>
                                  <div><label className={labelPremiumClass}>Horário de Encerramento</label><input type="time" name="horarioFim" value={formData.horarioFim} onChange={handleChange} className={inputPremiumClass} /></div>
                                </div>
                            </motion.div>
                        )}
                        {activeTab === 'items' && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div><label className={labelPremiumClass}>Especificação do Serviço/Buffet</label><input type="text" name="tipoCozinha" value={formData.tipoCozinha} onChange={handleChange} className={inputPremiumClass} placeholder="Ex: Jantar Empratado 3 Tempos, Open Bar Premium" /></div>
                                
                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mt-6">
                                    <label className={labelPremiumClass}>Adicionar Itens do Acervo/Estoque</label>
                                    <div className="flex gap-4 mb-6">
                                        <select onChange={(e) => setItemSelecionado(e.target.value)} value={itemSelecionado} className={inputPremiumClass}>
                                            <option value="">Selecione o serviço ou item...</option>
                                            {itensDeEstoque.map(s => <option key={s.id} value={s.id}>{s.nome} ({formatarMoeda(s.valor)})</option>)}
                                        </select>
                                        <button type="button" onClick={handleAddItem} className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold whitespace-nowrap transition-colors">Adicionar</button>
                                    </div>
                                    
                                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                        {formData.itens.length > 0 ? formData.itens.map(item => (
                                            <div key={item.id} className="flex flex-col sm:flex-row items-center justify-between bg-white border border-gray-200 p-4 rounded-xl hover:border-amber-200 transition-colors shadow-sm gap-4">
                                                <div className="font-bold text-gray-800 w-full sm:w-auto flex-grow">{item.descricao}</div>
                                                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-gray-400 uppercase">Qtd:</span>
                                                        <input type="number" min="1" value={item.quantidade} onChange={(e) => handleItemQtyChange(item.id, e.target.value)} className="w-20 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center font-bold focus:border-amber-500 outline-none" disabled={item.unidade === 'pessoa'} />
                                                    </div>
                                                    <div className="text-sm font-bold text-gray-600 min-w-[100px] text-right">
                                                        {formatarMoeda(item.valorUnitario)} <span className="text-xs font-medium text-gray-400">/{item.unidade}</span>
                                                    </div>
                                                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                                <p className="font-medium">Sua proposta ainda não possui itens precificados.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {activeTab === 'financial' && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-6">
                                  <div><label className={labelPremiumClass}>Restrições Alimentares / Avisos</label><textarea name="restricoesAlimentares" value={formData.restricoesAlimentares} onChange={handleChange} rows="2" className={`${inputPremiumClass} resize-none`} placeholder="Alergias severas, preferência vegana, etc."></textarea></div>
                                  <div><label className={labelPremiumClass}>Condições de Pagamento</label><textarea name="condicoesPagamento" value={formData.condicoesPagamento} onChange={handleChange} rows="3" className={`${inputPremiumClass} resize-none`} placeholder="Ex: 30% sinal via PIX, saldo 7 dias antes."></textarea></div>
                                  <div><label className={labelPremiumClass}>Notas de Rodapé (Aparece no PDF)</label><textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows="3" className={`${inputPremiumClass} resize-none`} placeholder="Informações de validade, quebras, hora extra..."></textarea></div>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 p-8 rounded-3xl space-y-4 h-fit shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
                                  <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><DollarSign className="text-amber-500" /> Resumo de Valores</h3>
                                  
                                  <div className="flex justify-between items-center text-gray-600 font-medium pb-3 border-b border-gray-200/60">
                                      <span>Subtotal (Itens)</span>
                                      <span className="font-bold text-gray-800">{formatarMoeda(calculos.subtotal)}</span>
                                  </div>
                                  
                                  <div className="flex justify-between items-center text-gray-600 font-medium pb-3 border-b border-gray-200/60">
                                      <span className="flex items-center gap-2">Desconto Aplicado <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-md font-bold">%</span></span>
                                      <input type="number" value={formData.desconto} onChange={(e) => setFormData(p => ({...p, desconto: parseFloat(e.target.value) || 0}))} className="w-24 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-right font-bold focus:border-amber-500 outline-none"/>
                                  </div>
                                  
                                  <div className="flex justify-between items-center text-gray-600 font-medium pb-4 border-b border-gray-200">
                                      <span>Taxa de Serviço ({formData.taxaServico}%)</span>
                                      <span className="font-bold text-gray-800">{formatarMoeda(calculos.valorTaxa)}</span>
                                  </div>
                                  
                                  <div className="flex justify-between items-end pt-2">
                                      <span className="text-lg font-bold text-gray-800">Total da Proposta</span>
                                      <span className="text-3xl font-black text-amber-500">{formatarMoeda(calculos.totalGeral)}</span>
                                  </div>
                              </div>
                            </motion.div>
                        )}
                    </div>
                    
                    <div className="p-6 md:p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end items-center mt-auto flex-shrink-0 rounded-b-[2rem] gap-4">
                        <button type="button" onClick={aoFechar} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
                        <button type="submit" className="px-8 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all">
                            {orcamentoParaEditar ? 'Atualizar Proposta' : 'Salvar Proposta'}
                        </button>
                    </div>
                </>
            )}
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}