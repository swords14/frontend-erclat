// Caminho do arquivo: frontend/src/pages/Orcamentos.jsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
    Plus, Search, FileText, CheckCircle, Clock, XCircle, X as IconX, Trash2, Edit, Info, ListOrdered, DollarSign, MapPin,
    ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Send, ThumbsUp, Frown, Loader2
} from 'lucide-react';
import {
    getAllBudgets, createBudget, getItemsForBudget, getAllClients,
    deleteBudget, getBudgetById, updateBudget, updateBudgetStatus
} from '../services/api';

// #region Componentes de UI (Helpers)
const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const StatusBadge = ({ status }) => {
    const statusInfo = {
        'Rascunho': { icon: Edit, color: 'gray', label: 'Rascunho' },
        'Orçamento Enviado': { icon: FileText, color: 'blue', label: 'Enviado' },
        'Aprovado': { icon: CheckCircle, color: 'green', label: 'Aprovado' },
        'Recusado': { icon: XCircle, color: 'red', label: 'Recusado' },
        'Follow-up': { icon: Clock, color: 'purple', label: 'Follow-up' },
        'Em Negociação': { icon: Clock, color: 'orange', label: 'Em Negociação' }
    }[status] || { icon: Clock, color: 'gray', label: status };
    
    const colors = {
        gray: 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        green: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        red: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'
    };
    return ( <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${colors[statusInfo.color]}`}> <statusInfo.icon size={14} /> {statusInfo.label} </span> );
};

const CardKPI = ({ titulo, valor, descricao }) => ( <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"> <p className="text-sm font-semibold text-gray-500">{titulo}</p> <p className="text-3xl font-bold mt-2">{valor}</p> <p className="text-xs text-gray-400 mt-1">{descricao}</p> </div> );

const EmptyState = ({ message, onActionClick }) => (
    <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <FileText size={48} className="mx-auto text-gray-400" />
        <h3 className="mt-4 text-xl font-semibold">Nenhum Orçamento Encontrado</h3>
        <p className="mt-2 text-gray-500">{message}</p>
        <button onClick={onActionClick} className="btn-primary mt-6 flex items-center gap-2 mx-auto">
            <Plus size={20} />Criar Primeiro Orçamento
        </button>
    </div>
);
const Pagination = ({ currentPage, totalPages, onPageChange }) => { if (totalPages <= 1) return null; return ( <div className="flex items-center justify-center gap-2 mt-4"><button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="p-2 pagination-btn"><ChevronsLeft size={16}/></button><button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 pagination-btn"><ChevronLeft size={16}/></button><span className="text-sm text-gray-600 dark:text-gray-300">Página {currentPage} de {totalPages}</span><button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 pagination-btn"><ChevronRight size={16}/></button><button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="p-2 pagination-btn"><ChevronsRight size={16}/></button></div> ); };
// #endregion

// #region Componente Principal (Página de Orçamentos)
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
          setOrcamentos(budgetsData);
          setClientes(clientsData);
          setItensDeEstoque(inventoryData);
      } catch (error) {
          toast.error(`Erro ao buscar dados: ${error.message}`);
      } finally {
          setIsLoading(false);
      }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const dadosProcessados = useMemo(() => {
    const emAberto = orcamentos.filter(o => ['Orçamento Enviado', 'Rascunho', 'Follow-up', 'Em Negociação'].includes(o.status));
    const valorEmAberto = emAberto.reduce((acc, o) => acc + o.valorTotal, 0);
    
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
            toast.success("Orçamento criado e enviado!", { id: toastId });
        }
        setModalAberto(false);
        setOrcamentoEmEdicao(null);
        fetchData();
    } catch (error) {
        toast.error(`Erro: ${error.message}`, { id: toastId });
    }
  };

  const handleExcluirOrcamento = async (budgetId) => {
    if (window.confirm("Tem certeza de que deseja excluir este orçamento?")) {
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
      const confirmText = `Tem certeza que deseja mudar o status para "${newStatus}"?`;
      if (!window.confirm(confirmText)) return;

      setIsUpdatingStatus(budgetId);
      try {
          await updateBudgetStatus(budgetId, newStatus);
          toast.success(`Status do orçamento atualizado para "${newStatus}"!`);
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

  if (isLoading) return <div className="p-6">A carregar orçamentos...</div>;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-3xl font-bold">Orçamentos e Propostas</h1><p className="mt-1 text-gray-500">Crie, envie e gerencie as suas propostas comerciais.</p></div>
        <motion.button onClick={() => handleAbrirModal(null)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary flex items-center gap-2"><Plus size={20} />Criar Novo Orçamento</motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <CardKPI titulo="Orçamentos em Aberto" valor={dadosProcessados.emAberto} descricao="Propostas aguardando resposta" />
        <CardKPI titulo="Valor em Negociação" valor={formatarMoeda(dadosProcessados.valorEmAberto)} descricao="Soma das propostas em aberto" />
        <CardKPI titulo="Taxa de Conversão" valor="N/A" descricao="Aceites vs Enviados (Em breve)" />
      </div>

      <div className="space-y-4">
        <div className="relative"><Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Buscar por cliente ou tipo de evento..." value={termoBusca} onChange={e => setTermoBusca(e.target.value)} className="input-form w-full pl-10" /></div>
        
        {dadosProcessados.totalCount > 0 ? (
            <div>
                <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left"><thead className="bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-600 dark:text-gray-300 uppercase"><tr><th className="p-4">Cliente / Evento</th><th className="p-4">Data do Evento</th><th className="p-4">Validade</th><th className="p-4">Status</th><th className="p-4 text-right">Valor</th><th className="p-4 text-center">Ações</th></tr></thead>
                        <tbody>{dadosProcessados.filtrados.map(o => (<tr key={o.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"><td className="p-4 font-medium">{o.client.nome}<br/><span className="text-sm text-gray-500">{o.eventName}</span></td><td className="p-4">{o.eventDate ? new Date(o.eventDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}</td><td className="p-4">{new Date(o.validade).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td><td className="p-4"><StatusBadge status={o.status} /></td><td className="p-4 text-right font-semibold">{formatarMoeda(o.valorTotal)}</td><td className="p-4 flex justify-center gap-2">
                            <motion.button onClick={() => handleAbrirModal(o)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 text-gray-500 hover:text-indigo-600" aria-label="Editar"><Edit size={18} /></motion.button>
                            <motion.button onClick={() => handleExcluirOrcamento(o.id)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 text-gray-500 hover:text-red-600" aria-label="Excluir"><Trash2 size={18} /></motion.button>
                            {o.status !== 'Aprovado' && o.status !== 'Recusado' && o.status !== 'Rascunho' && (
                                <>
                                    <motion.button onClick={() => handleUpdateStatus(o.id, 'Aprovado')} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} disabled={isUpdatingStatus === o.id} className="p-2 text-green-500 hover:text-green-600" title="Aprovar">
                                        {isUpdatingStatus === o.id ? <Loader2 size={18} className="animate-spin" /> : <ThumbsUp size={18} />}
                                    </motion.button>
                                    <motion.button onClick={() => handleUpdateStatus(o.id, 'Recusado')} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} disabled={isUpdatingStatus === o.id} className="p-2 text-red-500 hover:text-red-600" title="Recusar">
                                        <Frown size={18} />
                                    </motion.button>
                                </>
                            )}
                        </td></tr>))}</tbody>
                    </table>
                </div>
                <div className="block md:hidden space-y-4">
                    {dadosProcessados.filtrados.map(o => (
                        <div key={o.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 space-y-3 border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start">
                                <div className="font-bold">{o.client.nome} <br/> <span className="text-sm font-normal text-gray-500">{o.eventName}</span></div>
                                <StatusBadge status={o.status} />
                            </div>
                            <div className="flex justify-between text-sm border-t dark:border-gray-700 pt-2">
                                <span className="text-gray-500">Valor: <strong className="text-gray-800 dark:text-gray-100">{formatarMoeda(o.valorTotal)}</strong></span>
                                <span className="text-gray-500">Validade: <strong className="text-gray-800 dark:text-gray-100">{new Date(o.validade).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</strong></span>
                            </div>
                             <div className="flex justify-end gap-2 border-t dark:border-gray-700 pt-2">
                                <button onClick={() => handleAbrirModal(o)} className="btn-secondary text-xs py-1 px-3">Editar</button>
                                <button onClick={() => handleExcluirOrcamento(o.id)} className="btn-danger text-xs py-1 px-3">Excluir</button>
                            </div>
                        </div>
                    ))}
                </div>
                <Pagination currentPage={currentPage} totalPages={dadosProcessados.totalPages} onPageChange={setCurrentPage} />
            </div>
        ) : (
            <EmptyState message={termoBusca ? "Nenhum resultado para sua busca." : "Você ainda não tem orçamentos."} onActionClick={() => handleAbrirModal(null)} />
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
// #endregion

// #region Componente do Modal com Abas Internas
const ModalTabs = ({ tabs, activeTab, setActiveTab }) => (
    <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-6 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                        activeTab === tab.id
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-200'
                    } flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                    <tab.icon size={16} />
                    {tab.name}
                </button>
            ))}
        </nav>
    </div>
);

function ModalOrcamento({ aberto, aoFechar, aoSalvar, orcamentoParaEditar, clientes, itensDeEstoque }) {
  const gerarCodigoPadrao = () => `ORC-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
  
  const initialState = { clienteId: '', eventName: '', eventDate: '', convidados: 50, itens: [], desconto: 0, taxaServico: 10, observacoes: '', codigoOrcamento: gerarCodigoPadrao(), versao: '1.0', dataEnvio: '', localEventoNome: '', localEventoEndereco: '', localEventoCidade: '', localEventoEstado: '', localEventoCEP: '', horarioInicio: '', horarioFim: '', tipoCozinha: '', restricoesAlimentares: '', condicoesPagamento: '', observacoesFinanceiras: '' };
  const [formData, setFormData] = useState(initialState);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState('');
  const [activeTab, setActiveTab] = useState('info');

  const tabs = [
      { id: 'info', name: 'Informações', icon: Info },
      { id: 'location', name: 'Local/Horário', icon: MapPin },
      { id: 'items', name: 'Itens/Serviços', icon: ListOrdered },
      { id: 'financial', name: 'Financeiro', icon: DollarSign },
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
        } catch (error) { toast.error(`Erro ao carregar dados: ${error.message}`); aoFechar(); } 
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
    if (!formData.clienteId) { toast.error("Por favor, selecione um cliente na aba 'Informações'."); setActiveTab('info'); return; }
    const dadosParaSalvar = { ...formData, totalGeral: calculos.totalGeral, dataEnvio: formData.dataEnvio ? new Date(formData.dataEnvio) : null, dataEvento: formData.dataEvento ? new Date(formData.dataEvento) : null };
    aoSalvar(dadosParaSalvar);
  };

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.form onSubmit={handleSubmit} initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col h-[90vh]">
            <div className="p-6 flex justify-between items-center border-b dark:border-gray-700 flex-shrink-0">
                <h2 className="text-2xl font-bold">{orcamentoParaEditar ? 'Editar Orçamento' : 'Criar Novo Orçamento'}</h2>
                <button type="button" onClick={aoFechar} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><IconX size={22}/></button>
            </div>

            {isLoadingData ? (
                <div className="p-16 flex items-center justify-center">Carregando dados...</div>
            ) : (
                <>
                    <div className="flex-shrink-0">
                        <ModalTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto flex-grow">
                        {activeTab === 'info' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div className="md:col-span-2"><label className="label-form">Cliente</label><select name="clienteId" value={formData.clienteId} onChange={handleChange} className="input-form w-full"><option value="">Selecione um cliente</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
                                  <div><label className="label-form">Data do Evento</label><input type="date" name="eventDate" value={formData.eventDate} onChange={handleChange} className="input-form w-full" /></div>
                                  <div><label className="label-form">Nº de Convidados</label><input type="number" name="convidados" value={formData.convidados} onChange={handleChange} className="input-form w-full" /></div>
                                </div>
                                <div><label className="label-form">Nome/Tipo do Evento</label><input type="text" name="eventName" value={formData.eventName} onChange={handleChange} className="input-form w-full" placeholder="Ex: Casamento, Aniversário de 15 anos" /></div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                                    <div><label className="label-form">Código do Orçamento</label><input type="text" name="codigoOrcamento" value={formData.codigoOrcamento} onChange={handleChange} className="input-form w-full" placeholder="Ex: ORC001" /></div>
                                    <div><label className="label-form">Versão</label><input type="text" name="versao" value={formData.versao} onChange={handleChange} className="input-form w-full" /></div>
                                    <div><label className="label-form">Data de Envio</label><input type="date" name="dataEnvio" value={formData.dataEnvio} onChange={handleChange} className="input-form w-full" /></div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'location' && (
                            <div className="space-y-4">
                                <div><label className="label-form">Nome do Local</label><input type="text" name="localEventoNome" value={formData.localEventoNome} onChange={handleChange} className="input-form w-full" /></div>
                                <div><label className="label-form">Endereço do Local</label><input type="text" name="localEventoEndereco" value={formData.localEventoEndereco} onChange={handleChange} className="input-form w-full" placeholder="Rua, Número, Complemento" /></div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div><label className="label-form">Cidade</label><input type="text" name="localEventoCidade" value={formData.localEventoCidade} onChange={handleChange} className="input-form w-full" /></div>
                                  <div><label className="label-form">Estado</label><input type="text" name="localEventoEstado" value={formData.localEventoEstado} onChange={handleChange} className="input-form w-full" /></div>
                                  <div><label className="label-form">CEP</label><input type="text" name="localEventoCEP" value={formData.localEventoCEP} onChange={handleChange} className="input-form w-full" /></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div><label className="label-form">Horário de Início</label><input type="time" name="horarioInicio" value={formData.horarioInicio} onChange={handleChange} className="input-form w-full" /></div>
                                  <div><label className="label-form">Horário de Fim</label><input type="time" name="horarioFim" value={formData.horarioFim} onChange={handleChange} className="input-form w-full" /></div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'items' && (
                            <div className="space-y-4">
                                <div><label className="label-form">Tipo de Cozinha/Buffet</label><input type="text" name="tipoCozinha" value={formData.tipoCozinha} onChange={handleChange} className="input-form w-full" placeholder="Ex: Jantar Empratado, Coquetel, Churrasco" /></div>
                                <div className="flex gap-2 mb-4">
                                  <select onChange={(e) => setItemSelecionado(e.target.value)} value={itemSelecionado} className="input-form flex-grow"><option value="">Selecione um item...</option>{itensDeEstoque.map(s => <option key={s.id} value={s.id}>{s.nome} ({formatarMoeda(s.valor)})</option>)}</select>
                                  <button type="button" onClick={handleAddItem} className="btn-primary whitespace-nowrap">Adicionar Item</button>
                                </div>
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                  {formData.itens.length > 0 ? formData.itens.map(item => (
                                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                                      <div className="col-span-6 font-semibold">{item.descricao}</div>
                                      <div className="col-span-2"><input type="number" value={item.quantidade} onChange={(e) => handleItemQtyChange(item.id, e.target.value)} className="input-form w-full" disabled={item.unidade === 'pessoa'} /></div>
                                      <div className="col-span-3 text-right">{formatarMoeda(item.valorUnitario)} / {item.unidade}</div>
                                      <div className="col-span-1 text-right"><button type="button" onClick={() => handleRemoveItem(item.id)} className="p-1 text-red-500 hover:text-red-700"><Trash2 size={16}/></button></div>
                                    </div>
                                  )) : <p className="text-center text-gray-500 py-4">Nenhum item adicionado.</p>}
                                </div>
                            </div>
                        )}
                        {activeTab === 'financial' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                  <div><label className="label-form">Restrições Alimentares</label><textarea name="restricoesAlimentares" value={formData.restricoesAlimentares} onChange={handleChange} rows="2" className="input-form w-full" placeholder="Alergias, vegetarianos, etc."></textarea></div>
                                  <div><label className="label-form">Condições de Pagamento</label><textarea name="condicoesPagamento" value={formData.condicoesPagamento} onChange={handleChange} rows="3" className="input-form w-full" placeholder="Ex: 50% na assinatura..."></textarea></div>
                                  <div><label className="label-form">Observações Gerais</label><textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows="3" className="input-form w-full"></textarea></div>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-2 h-fit">
                                  <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-semibold">{formatarMoeda(calculos.subtotal)}</span></div>
                                  <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Desconto (%)</span><input type="number" value={formData.desconto} onChange={(e) => setFormData(p => ({...p, desconto: parseFloat(e.target.value) || 0}))} className="input-form w-20 text-right"/></div>
                                  <div className="flex justify-between text-sm"><span className="text-gray-500">Taxa de Serviço ({formData.taxaServico}%)</span><span className="font-semibold">{formatarMoeda(calculos.valorTaxa)}</span></div>
                                  <hr className="border-gray-300 dark:border-gray-600"/>
                                  <div className="flex justify-between text-xl font-bold"><span >Total Geral</span><span className="text-indigo-600 dark:text-indigo-400">{formatarMoeda(calculos.totalGeral)}</span></div>
                              </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex justify-end items-center mt-auto flex-shrink-0">
                        <button type="button" onClick={aoFechar} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary ml-4">Salvar Orçamento</button>
                    </div>
                </>
            )}
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
// #endregion