import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { getFunnelData, updateBudgetStatus, createContractFromBudget, getAllUsers } from '@/services/api';
import toast from 'react-hot-toast';
import { DollarSign, Calendar, CheckCircle, Loader2, Play, ServerCrash, BarChart3, User, Target } from 'lucide-react';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const inputPremiumClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-gray-700 font-medium";
const labelPremiumClass = "block text-sm font-bold text-gray-700 mb-1.5 ml-1";

const CardKPI = ({ titulo, valor, icone: Icon, bgIcone = "bg-amber-50", corIcone = "text-amber-500" }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex items-center gap-5 transition-all duration-300 hover:border-amber-300 hover:shadow-[0_4px_20px_rgba(245,158,11,0.05)]">
        <div className={`p-3.5 ${bgIcone} border border-gray-100 rounded-xl`}>
            <Icon className={corIcone} size={24} strokeWidth={1.5} />
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium tracking-wide">{titulo}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{valor}</p>
        </div>
    </div>
);

const BarraFiltros = ({ responsaveis, filtroResponsavel, setFiltroResponsavel, filtroPeriodo, setFiltroPeriodo }) => (
    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
            <label htmlFor="filtro-responsavel" className={labelPremiumClass}>Responsável da Negociação</label>
            <select id="filtro-responsavel" value={filtroResponsavel} onChange={(e) => setFiltroResponsavel(e.target.value)} className={inputPremiumClass}>
                <option value="todos">Todos os membros</option>
                {responsaveis.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
        </div>
        <div className="flex-1">
            <label htmlFor="filtro-periodo" className={labelPremiumClass}>Período do Evento</label>
            <select id="filtro-periodo" value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)} className={inputPremiumClass}>
                <option value="todos">Qualquer Data</option>
                <option value="hoje">Hoje</option>
                <option value="esta-semana">Esta Semana</option>
                <option value="este-mes">Este Mês</option>
            </select>
        </div>
    </div>
);

const ErrorState = ({ message, onRetry }) => (
    <div className="text-center py-16 px-6 bg-white rounded-[2rem] border border-red-100 shadow-sm flex flex-col items-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <ServerCrash size={40} className="text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Falha na Conexão</h3>
        <p className="mt-2 text-gray-500 font-medium max-w-sm">{message}</p>
        <button onClick={onRetry} className="mt-8 px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl transition-colors">
            Tentar Novamente
        </button>
    </div>
);

const colunasDoFunil = [
  { id: 'Orçamento Enviado', title: 'Orçamento Enviado', color: 'border-sky-400', bgPill: 'bg-sky-50', textPill: 'text-sky-600' },
  { id: 'Follow-up', title: 'Follow-up', color: 'border-orange-400', bgPill: 'bg-orange-50', textPill: 'text-orange-600' },
  { id: 'Em Negociação', title: 'Em Negociação', color: 'border-amber-400', bgPill: 'bg-amber-50', textPill: 'text-amber-600' },
  { id: 'Aprovado', title: 'Aprovado', color: 'border-emerald-400', bgPill: 'bg-emerald-50', textPill: 'text-emerald-600' },
  { id: 'Recusado', title: 'Recusado', color: 'border-rose-400', bgPill: 'bg-rose-50', textPill: 'text-rose-600' },
];

const FunilDeVendas = () => {
  const [todosOsCards, setTodosOsCards] = useState([]);
  const [listaResponsaveis, setListaResponsaveis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [filtroResponsavel, setFiltroResponsavel] = useState('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [funnelDataFromApi, usersData] = await Promise.all([
          getFunnelData({ responsavelId: filtroResponsavel, periodo: filtroPeriodo }),
          getAllUsers()
      ]);
      setListaResponsaveis(usersData || []);
      
      if (!funnelDataFromApi || typeof funnelDataFromApi !== 'object') {
        setTodosOsCards([]); 
        return;
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
    const taxaConversao = (aprovados.length + recusados.length) > 0 ? ((aprovados.length / (aprovados.length + recusados.length)) * 100).toFixed(1) + '%' : '0.0%';
    const valorAprovado = aprovados.reduce((sum, item) => sum + item.valorTotal, 0);
    const ticketMedio = aprovados.length > 0 ? formatCurrency(valorAprovado / aprovados.length) : formatCurrency(0);
    const valorTotalFunil = todosOsCards
        .filter(c => ['Orçamento Enviado', 'Follow-up', 'Em Negociação'].includes(c.status))
        .reduce((sum, item) => sum + item.valorTotal, 0);
    
    return { valorTotalFunil, taxaConversao, ticketMedio };
  }, [todosOsCards]);
  
  const colunasVisiveis = useMemo(() => {
    const colunasMontadas = colunasDoFunil.reduce((acc, col) => ({ ...acc, [col.id]: { ...col, items: [] } }), {});
    todosOsCards.forEach(card => { 
        if (colunasMontadas[card.status]) colunasMontadas[card.status].items.push(card); 
    });
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
      toast.success(`Orçamento movido para "${destination.droppableId}"`);
      fetchData(); 
    } catch (err) {
      toast.error(`Falha ao atualizar: ${err.message}`);
      setTodosOsCards(estadoOriginal);
    }
  };
  
  const handleGerarContrato = async (orcamentoId) => {
    if (isConverting) return;
    setIsConverting(true);
    try {
      const novoContrato = await createContractFromBudget(orcamentoId); 
      toast.success(`Contrato gerado com sucesso!`, { icon: '📝' });
      fetchData();
      navigate(`/contratos/${novoContrato.id}`); 
    } catch (err) {
      if (err.message.includes("Já existe um contrato")) {
        toast.error("Este orçamento já foi convertido em contrato.");
      } else {
        toast.error(`Erro ao gerar contrato: ${err.message}`);
      }
      fetchData();
    } finally {
      setIsConverting(false);
    }
  };

  const CardOrcamento = ({ item, index, colunaConfig }) => (
    <Draggable key={item.id} draggableId={String(item.id)} index={index}>
        {(provided, snapshot) => (
        <div 
            ref={provided.innerRef} 
            {...provided.draggableProps} 
            {...provided.dragHandleProps} 
            className={`bg-white rounded-2xl p-5 border cursor-grab active:cursor-grabbing transition-all duration-200
                ${snapshot.isDragging 
                    ? `shadow-2xl scale-[1.03] rotate-1 z-50 ${colunaConfig.color}` 
                    : 'shadow-sm border-gray-100 hover:border-amber-200 hover:shadow-md'
                }
            `}
        >
            <div className="flex justify-between items-start mb-3">
                <p className="font-bold text-gray-900 leading-tight">{item.client.nome}</p>
            </div>
            
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 truncate">{item.eventName}</p>
            
            <div className="bg-gray-50/80 rounded-xl p-3 space-y-2 border border-gray-100 mb-3">
                <div className="flex items-center gap-2.5 text-sm text-gray-700 font-bold">
                    <DollarSign size={16} className="text-amber-500" />
                    <span>{formatCurrency(item.valorTotal)}</span>
                </div>
                {item.eventDate && (
                    <div className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{new Date(item.eventDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mt-2 h-8">
                {item.responsavel ? (
                     <div className="text-xs font-medium text-gray-500 flex items-center gap-1.5 bg-white border border-gray-100 px-2 py-1 rounded-lg">
                        <User size={12} className="text-gray-400" /> 
                        <span className="truncate max-w-[100px]">{listaResponsaveis.find(u => u.id === item.responsavel)?.nome || 'Membro'}</span>
                    </div>
                ) : <div />}

                {item.status === 'Aprovado' && (
                    <button 
                        type="button" 
                        onClick={() => handleGerarContrato(item.id)} 
                        disabled={isConverting}
                        className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-colors disabled:opacity-50"
                    >
                        {isConverting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />} 
                        Contrato
                    </button>
                )}
            </div>
        </div>
        )}
    </Draggable>
  );

  if (isLoading) return (
      <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center">
          <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-500 font-medium">Sincronizando pipeline de vendas...</p>
      </div>
  );
  
  return (
    <div className="p-4 md:p-8 min-h-screen flex flex-col gap-8">
        <header>
            <h1 className="text-3xl font-light text-gray-800 tracking-wide flex items-center gap-3">
                Funil de <span className="font-bold text-amber-600">Vendas</span>
                <Target className="text-amber-400" size={24} />
            </h1>
            <p className="mt-1 text-gray-500 font-medium">Acompanhe e mova suas negociações até o fechamento.</p>
        </header>
      
        {error ? <ErrorState message={error.message} onRetry={fetchData} /> : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CardKPI titulo="Valor em Negociação" valor={formatCurrency(kpisGlobais.valorTotalFunil)} icone={DollarSign} corIcone="text-blue-500" bgIcone="bg-blue-50" />
                <CardKPI titulo="Taxa de Conversão" valor={kpisGlobais.taxaConversao} icone={BarChart3} corIcone="text-emerald-500" bgIcone="bg-emerald-50" />
                <CardKPI titulo="Ticket Médio (Aprovados)" valor={kpisGlobais.ticketMedio} icone={CheckCircle} corIcone="text-amber-500" bgIcone="bg-amber-50" />
            </div>

            <BarraFiltros responsaveis={listaResponsaveis} filtroResponsavel={filtroResponsavel} setFiltroResponsavel={setFiltroResponsavel} filtroPeriodo={filtroPeriodo} setFiltroPeriodo={setFiltroPeriodo} />

            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-6 mt-2 overflow-x-auto pb-6 custom-scrollbar min-h-[60vh] snap-x">
                  {Object.values(colunasVisiveis).map(coluna => (
                      <Droppable key={coluna.id} droppableId={coluna.id}>
                          {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef} 
                            {...provided.droppableProps} 
                            className={`min-w-[320px] w-[320px] rounded-3xl flex flex-col border transition-colors snap-center
                                ${snapshot.isDraggingOver ? 'bg-amber-50/50 border-amber-200' : 'bg-gray-50/50 border-gray-100'}
                            `}
                          >
                              <div className="p-5 pb-3">
                                  <div className="flex items-center justify-between mb-2">
                                      <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">{coluna.title}</h2>
                                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${coluna.bgPill} ${coluna.textPill}`}>
                                          {coluna.items.length}
                                      </span>
                                  </div>
                                  <p className="text-sm font-bold text-gray-400">
                                      {formatCurrency(coluna.items.reduce((s, i) => s + i.valorTotal, 0))}
                                  </p>
                              </div>

                              <div className="flex-grow p-4 pt-2 space-y-4 overflow-y-auto custom-scrollbar">
                                {coluna.items.length === 0 ? ( 
                                    <div className="flex items-center justify-center h-32 text-center text-gray-400 font-medium border-2 border-dashed border-gray-200 rounded-2xl">
                                        Solte um card aqui
                                    </div> 
                                ) : 
                                    coluna.items.map((item, index) => (
                                        <CardOrcamento key={item.id} item={item} index={index} colunaConfig={coluna} />
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
    </div>
  );
};

export default FunilDeVendas;