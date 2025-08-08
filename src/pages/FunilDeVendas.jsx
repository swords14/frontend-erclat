// Caminho: frontend/src/pages/FunilDeVendas.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { getFunnelData, updateBudgetStatus, createContractFromBudget, getAllUsers } from '../services/api';
import toast from 'react-hot-toast';
import { DollarSign, Calendar, CheckCircle, Loader2, Play, Clock, AlertTriangle, BarChart3, ServerCrash, FileText, User } from 'lucide-react';

// --- Componentes de UI e Helpers ---
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

function ModalCriarContrato({ aberto, aoFechar, aoConfirmar, isLoading }) {
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md text-center">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Gerar Contrato</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Este orçamento foi aprovado. Deseja gerar o contrato para formalização e envio ao cliente?</p>
        <div className="mt-6 flex justify-center gap-4">
          <button onClick={aoFechar} disabled={isLoading} className="btn-secondary">Não, Apenas Aprovar</button>
          <button onClick={aoConfirmar} disabled={isLoading} className="btn-primary w-44 flex items-center justify-center">{isLoading ? <Loader2 className="animate-spin" /> : 'Sim, Gerar Contrato'}</button>
        </div>
      </div>
    </div>
  );
}

const CardKPI = ({ titulo, valor, icone }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-start gap-4">
        <div className="bg-indigo-100 dark:bg-indigo-500/20 p-3 rounded-lg">{icone}</div>
        <div>
            <p className="text-sm font-semibold text-gray-500">{titulo}</p>
            <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-gray-100">{valor}</p>
        </div>
    </div>
);

const BarraFiltros = ({ responsaveis, filtroResponsavel, setFiltroResponsavel, filtroPeriodo, setFiltroPeriodo }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
            <label htmlFor="filtro-responsavel" className="label-form text-xs">Responsável</label>
            <select id="filtro-responsavel" value={filtroResponsavel} onChange={(e) => setFiltroResponsavel(e.target.value)} className="input-form w-full">
                <option value="todos">Todos</option>
                {responsaveis.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
        </div>
        <div className="flex-1">
            <label htmlFor="filtro-periodo" className="label-form text-xs">Período do Evento</label>
            <select id="filtro-periodo" value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)} className="input-form w-full">
                <option value="todos">Qualquer Data</option>
                <option value="hoje">Hoje</option>
                <option value="esta-semana">Esta Semana</option>
                <option value="este-mes">Este Mês</option>
            </select>
        </div>
    </div>
);

const ErrorState = ({ message, onRetry }) => (
    <div className="text-center py-16 px-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-500/30">
        <ServerCrash size={48} className="mx-auto text-red-500" />
        <h3 className="mt-4 text-xl font-semibold text-red-700 dark:text-red-300">Ocorreu um Erro</h3>
        <p className="mt-2 text-red-600 dark:text-red-400">{message}</p>
        <button onClick={onRetry} className="btn-primary mt-6">Tentar Novamente</button>
    </div>
);

const colunasDoFunil = [
  { id: 'Orçamento Enviado', title: 'Orçamento Enviado', color: '#3b82f6' },
  { id: 'Follow-up', title: 'Follow-up', color: '#f97316' },
  { id: 'Em Negociação', title: 'Em Negociação', color: '#eab308' },
  { id: 'Aprovado', title: 'Aprovado', color: '#22c55e' },
  { id: 'Recusado', title: 'Recusado', color: '#ef4444' },
];

const FunilDeVendas = () => {
  const [todosOsCards, setTodosOsCards] = useState([]);
  const [listaResponsaveis, setListaResponsaveis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalConversaoAberto, setModalConversaoAberto] = useState(false);
  const [orcamentoParaConverter, setOrcamentoParaConverter] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [filtroResponsavel, setFiltroResponsavel] = useState('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // CORREÇÃO: Passa os filtros para a API
      const [funnelDataFromApi, usersData] = await Promise.all([
          getFunnelData({ responsavelId: filtroResponsavel, periodo: filtroPeriodo }),
          getAllUsers()
      ]);
      setListaResponsaveis(usersData || []);
      if (!funnelDataFromApi || typeof funnelDataFromApi !== 'object') {
        setTodosOsCards([]); return;
      }
      const flatListOfCards = Object.values(funnelDataFromApi).flatMap(col => col.items || []);
      setTodosOsCards(flatListOfCards);
    } catch (err) { 
        toast.error(`Erro ao buscar dados: ${err.message}`);
        setError(err);
    } finally { 
        setIsLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, [filtroResponsavel, filtroPeriodo]);

  const kpisGlobais = useMemo(() => {
    const aprovados = todosOsCards.filter(c => c.status === 'Aprovado');
    const recusados = todosOsCards.filter(c => c.status === 'Recusado');
    const taxaConversao = (aprovados.length + recusados.length) > 0 ? ((aprovados.length / (aprovados.length + recusados.length)) * 100).toFixed(1) + '%' : 'N/A';
    const valorAprovado = aprovados.reduce((sum, item) => sum + item.valorTotal, 0);
    const ticketMedio = aprovados.length > 0 ? formatCurrency(valorAprovado / aprovados.length) : formatCurrency(0);
    const valorTotalFunil = todosOsCards
        .filter(c => ['Orçamento Enviado', 'Follow-up', 'Em Negociação'].includes(c.status))
        .reduce((sum, item) => sum + item.valorTotal, 0);
    return { valorTotalFunil, taxaConversao, ticketMedio };
  }, [todosOsCards]);
  
  const colunasVisiveis = useMemo(() => {
    const colunasMontadas = colunasDoFunil.reduce((acc, col) => ({ ...acc, [col.id]: { ...col, items: [] } }), {});
    todosOsCards.forEach(card => { if (colunasMontadas[card.status]) colunasMontadas[card.status].items.push(card); });
    return colunasMontadas;
  }, [todosOsCards]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;

    const estadoOriginal = [...todosOsCards];
    const newState = todosOsCards.map(card => String(card.id) === draggableId ? { ...card, status: destination.droppableId } : card );
    setTodosOsCards(newState);

    try {
      await updateBudgetStatus(draggableId, destination.droppableId);
      toast.success(`Orçamento movido para "${destination.droppableId}"!`);
      // CORREÇÃO: A ação de gerar contrato agora é um botão no card e não um modal no drag-and-drop
      fetchData(); // Recarrega os dados após a alteração.
    } catch (err) {
      toast.error(`Falha ao atualizar: ${err.message}`);
      setTodosOsCards(estadoOriginal);
    }
  };
  
  const handleGerarContrato = async (orcamentoId) => {
    setIsConverting(true);
    try {
      const novoContrato = await createContractFromBudget(orcamentoId); 
      toast.success(`Contrato ${novoContrato.codigoContrato} gerado!`, { icon: '📝' });
      fetchData();
      navigate(`/contratos/${novoContrato.id}`); 
    } catch (err) {
      if (err.message.includes("Já existe um contrato")) {
        toast.error("Este orçamento já foi convertido.");
      } else {
        toast.error(`Erro ao gerar contrato: ${err.message}`);
      }
      fetchData();
    } finally {
      setIsConverting(false);
    }
  };

  const CardOrcamento = ({ item, index, colunaColor, onConvertClick }) => (
    <Draggable key={item.id} draggableId={String(item.id)} index={index}>
        {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={`bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 border-l-4 ${snapshot.isDragging ? 'shadow-2xl scale-105' : 'shadow-sm'}`} style={{ borderColor: colunaColor }}>
            <p className="font-bold text-gray-800 dark:text-white pr-2">{item.client.nome}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{item.eventName}</p>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-300 space-y-1">
                <div className="flex items-center gap-2"><DollarSign size={14} /><span>{formatCurrency(item.valorTotal)}</span></div>
                {item.eventDate && (<div className="flex items-center gap-2"><Calendar size={14} /><span>{new Date(item.eventDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span></div>)}
            </div>
            {item.status === 'Aprovado' && (
                <div className="mt-3 text-right">
                    <button type="button" onClick={() => onConvertClick(item.id)} className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 flex items-center justify-end gap-1 text-sm font-semibold">
                        <Play size={16} /> Gerar Contrato
                    </button>
                </div>
            )}
            {item.status !== 'Aprovado' && item.responsavel && (
                 <div className="mt-3 text-right text-xs text-gray-400 flex items-center gap-1 justify-end">
                    <User size={12} /> {listaResponsaveis.find(u => u.id === item.responsavel)?.nome || 'Não atribuído'}
                </div>
            )}
        </div>
        )}
    </Draggable>
  );

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline-block mr-2" />A carregar funil de vendas...</div>;
  
  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">Funil de Vendas</h1>
      <p className="text-gray-500 mb-6">Arraste os cards para atualizar o status das suas negociações.</p>
      
      {error ? <ErrorState message={error.message} onRetry={fetchData} /> : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <CardKPI titulo="Valor em Negociação" valor={formatCurrency(kpisGlobais.valorTotalFunil)} icone={<DollarSign className="text-indigo-500" />} />
                <CardKPI titulo="Taxa de Conversão" valor={kpisGlobais.taxaConversao} icone={<BarChart3 className="text-indigo-500" />} />
                <CardKPI titulo="Ticket Médio (Aprovados)" valor={kpisGlobais.ticketMedio} icone={<CheckCircle className="text-indigo-500" />} />
            </div>

            <BarraFiltros responsaveis={listaResponsaveis} filtroResponsavel={filtroResponsavel} setFiltroResponsavel={setFiltroResponsavel} filtroPeriodo={filtroPeriodo} setFiltroPeriodo={setFiltroPeriodo} />

            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mt-6">
                  {Object.values(colunasVisiveis).map(coluna => (
                      <Droppable key={coluna.id} droppableId={coluna.id}>
                          {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="bg-gray-100 dark:bg-gray-800 rounded-xl flex flex-col">
                              <div className="p-4 rounded-t-xl" style={{ borderTop: `4px solid ${coluna.color}` }}>
                                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-between">
                                      <span>{coluna.title}</span>
                                      <span className="text-sm font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">{coluna.items.length}</span>
                                  </h2>
                                  <p className="text-sm font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(coluna.items.reduce((s, i) => s + i.valorTotal, 0))}</p>
                              </div>
                              <div className={`flex-grow min-h-[400px] p-4 pt-0 space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''}`}>
                              {coluna.items.length === 0 ? ( <div className="flex items-center justify-center h-full text-center text-gray-400 dark:text-gray-500 p-4 border-2 border-dashed rounded-lg">Nenhum card aqui.</div> ) : 
                                coluna.items.map((item, index) => (
                                  <CardOrcamento key={item.id} item={item} index={index} colunaColor={coluna.color} onConvertClick={handleGerarContrato} />
                                ))
                              }
                              {provided.placeholder}
                              </div>
                          </div>
                          )}
                      </Droppable>
                  ))}
              </div>
            </DragDropContext>
      </>
      )}
      {/* O modal de conversão foi removido do onDragEnd para um botão no card */}
    </div>
  );
};

export default FunilDeVendas;