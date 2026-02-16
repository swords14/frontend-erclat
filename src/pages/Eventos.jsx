// Caminho do arquivo: frontend/src/pages/Eventos.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Search, Calendar, CheckCircle, XCircle, Tag, Clock, Pencil, Trash2, X as IconX, Check, Eye, Printer, DollarSign, FileText, Sparkles, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Importe TODAS as funções necessárias da sua API central
import { 
    getEvents, 
    getAllClients, 
    getAllUsers, 
    getInventoryItems, 
    getFutureReservations,
    createEvent,
    updateEvent,
    deleteEvent,
    finalizeEvent 
} from '@/services/api'; 

// --- HOOK PERSONALIZADO ---
const useEventos = () => {
    const [eventos, setEventos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [reservasEstoque, setReservasEstoque] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [eventosData, clientesData, usuariosData, inventoryData, reservasData] = await Promise.all([
                getEvents(),
                getAllClients(),
                getAllUsers(),
                getInventoryItems(),
                getFutureReservations()
            ]);
            
            setEventos(eventosData || []);
            setClientes(clientesData || []);
            setUsuarios(usuariosData || []);
            setInventoryItems(inventoryData || []);
            setReservasEstoque(reservasData || {});

        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar dados.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const saveEvent = async (eventData, eventoEditando) => {
        const isEditing = !!eventoEditando;
        try {
            if (isEditing) {
                await updateEvent(eventoEditando.id, eventData);
            } else {
                await createEvent(eventData);
            }
            toast.success(`Evento ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
            fetchData();
            return true;
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    const handleFinalizeEvent = async (eventId) => {
        if (!window.confirm('Tem certeza que deseja finalizar este evento?')) return;
        try {
            await finalizeEvent(eventId);
            toast.success('Evento finalizado com sucesso! Agora ele pode ser avaliado.');
            fetchData();
        } catch (error) {
            toast.error('Erro ao finalizar o evento.');
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Tem certeza que deseja excluir este evento?')) return;
        try {
            await deleteEvent(eventId);
            toast.success('Evento excluído com sucesso!');
            fetchData();
        } catch (error) {
            toast.error('Erro ao excluir evento.');
        }
    };

    return { eventos, clientes, usuarios, inventoryItems, reservasEstoque, isLoading, saveEvent, deleteEvent: handleDeleteEvent, handleFinalizeEvent };
};


// --- COMPONENTES DE UI PREMIUM ---
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

const EventStatusBadge = ({ status }) => {
    const statusMap = {
        PLANEJADO: { color: 'gray', text: 'Planejado', icon: Calendar, bg: 'bg-gray-100', textCol: 'text-gray-700', border: 'border-gray-200' },
        EM_ANDAMENTO: { color: 'amber', text: 'Em Andamento', icon: Clock, bg: 'bg-amber-100', textCol: 'text-amber-700', border: 'border-amber-200' },
        CONCLUIDO: { color: 'emerald', text: 'Concluído', icon: CheckCircle, bg: 'bg-emerald-100', textCol: 'text-emerald-700', border: 'border-emerald-200' },
        FINALIZADO: { color: 'emerald', text: 'Finalizado', icon: CheckCircle, bg: 'bg-emerald-100', textCol: 'text-emerald-700', border: 'border-emerald-200' },
        CANCELADO: { color: 'rose', text: 'Cancelado', icon: XCircle, bg: 'bg-rose-100', textCol: 'text-rose-700', border: 'border-rose-200' },
    };
    const currentStatus = statusMap[status] || { color: 'gray', text: 'Desconhecido', icon: Tag, bg: 'bg-gray-100', textCol: 'text-gray-700', border: 'border-gray-200' };
    
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border ${currentStatus.bg} ${currentStatus.textCol} ${currentStatus.border} shadow-sm`}>
            <currentStatus.icon size={12} strokeWidth={2.5} /> {currentStatus.text}
        </span>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function Eventos() {
    const navigate = useNavigate();
    const { eventos, clientes, usuarios, inventoryItems, reservasEstoque, isLoading, saveEvent, deleteEvent, handleFinalizeEvent } = useEventos();
    const [termoBusca, setTermoBusca] = useState('');
    const [modalAberto, setModalAberto] = useState(false);
    const [eventoEditando, setEventoEditando] = useState(null);
    
    const eventosFiltrados = useMemo(() => { 
        return eventos.filter(evento => 
            (evento.title || '').toLowerCase().includes(termoBusca.toLowerCase()) || 
            (evento.client?.nome || '').toLowerCase().includes(termoBusca.toLowerCase())
        ); 
    }, [eventos, termoBusca]);
    
    const kpiData = useMemo(() => ({ 
        total: eventos.length, 
        concluidos: eventos.filter(e => e.status === 'CONCLUIDO' || e.status === 'FINALIZADO').length, 
        valorTotal: eventos.reduce((acc, e) => acc + (Number(e.valorTotal) || 0), 0), 
    }), [eventos]);
    
    const abrirModal = (evento = null) => { setEventoEditando(evento); setModalAberto(true); };
    
    const handleSalvar = async (data) => { 
        if (Number(data.valorTotal) === 0) {
            toast.error("O valor total não pode ser zero.");
            return;
        }
        const success = await saveEvent(data, eventoEditando); 
        if (success) setModalAberto(false); 
    };

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8 min-h-screen">
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-light text-gray-800 tracking-wide flex items-center gap-3">
                        Gestão de <span className="font-bold text-amber-600">Eventos</span>
                        <Sparkles className="text-amber-400" size={24} />
                    </h1>
                    <p className="mt-1 text-gray-500 font-medium">Organize e acompanhe todas as suas celebrações.</p>
                </div>
                <button 
                    onClick={() => abrirModal()} 
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all duration-300"
                >
                    <Plus size={20} /> Novo Evento
                </button>
            </header>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <KPICard title="Total de Eventos" value={kpiData.total} icon={Calendar} corIcone="text-blue-500" bgIcone="bg-blue-50" />
                <KPICard title="Eventos Concluídos" value={kpiData.concluidos} icon={CheckCircle} corIcone="text-emerald-500" bgIcone="bg-emerald-50" />
                <KPICard title="Receita Projetada" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpiData.valorTotal)} icon={DollarSign} corIcone="text-amber-500" bgIcone="bg-amber-50" />
            </div>

            {/* Barra de Busca */}
            <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Buscar evento por título ou nome do cliente..." 
                    value={termoBusca} 
                    onChange={e => setTermoBusca(e.target.value)} 
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-gray-700 font-medium"
                />
            </div>
            
            {/* Tabela / Estado Vazio */}
            {isLoading ? (
                <div className="text-center p-12 bg-white rounded-[2rem] border border-gray-200 shadow-sm">
                    <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Sincronizando eventos...</p>
                </div> 
            ) : eventosFiltrados.length === 0 ? (
                <div className="text-center p-20 bg-white rounded-[2rem] border border-gray-200 shadow-sm flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                        <Calendar size={40} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Nenhum evento encontrado</h3>
                    <p className="text-gray-500 mt-2 font-medium max-w-sm">Tente ajustar os termos da sua busca ou clique em "Novo Evento" para começar.</p>
                </div>
            ) : (
                <TabelaEventos eventos={eventosFiltrados} onEdit={abrirModal} onDelete={deleteEvent} onFinalize={handleFinalizeEvent} />
            )}
            
            <ModalEvento 
                aberto={modalAberto} 
                aoFechar={() => setModalAberto(false)} 
                aoSalvar={handleSalvar} 
                evento={eventoEditando} 
                clientes={clientes} 
                usuarios={usuarios} 
                inventoryItems={inventoryItems} 
                reservasEstoque={reservasEstoque} 
                onFinalize={handleFinalizeEvent}
            />
        </div>
    );
}

// --- SUBCOMPONENTES ---
const TabelaEventos = ({ eventos, onEdit, onDelete, onFinalize }) => {
    const navigate = useNavigate();
    return (
        <div className="bg-white rounded-[2rem] border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-200">
                        <tr>
                            <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500">Detalhes do Evento</th>
                            <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 hidden sm:table-cell">Cliente</th>
                            <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 hidden md:table-cell">Data</th>
                            <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 hidden lg:table-cell text-right">Valor</th>
                            <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500">Status</th>
                            <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {eventos.map(evento => (
                            <tr key={evento.id} className="hover:bg-amber-50/30 transition-colors group">
                                <td className="p-5">
                                    <p className="font-bold text-gray-900">{evento.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">{evento.eventType || 'Evento padrão'}</p>
                                </td>
                                <td className="p-5 hidden sm:table-cell">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                            {evento.client?.nome ? evento.client.nome.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <span className="font-medium text-gray-700">{evento.client?.nome || 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="p-5 hidden md:table-cell font-medium text-gray-600">
                                    {new Date(evento.startDate).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="p-5 hidden lg:table-cell text-right font-bold text-gray-900">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(evento.valorTotal || 0)}
                                </td>
                                <td className="p-5"><EventStatusBadge status={evento.status} /></td>
                                <td className="p-5 text-center">
                                    <div className="flex justify-center items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onEdit(evento)} className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Editar Evento"><Pencil size={18} strokeWidth={2}/></button>
                                        <button onClick={() => onDelete(evento.id)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Deletar Evento"><Trash2 size={18} strokeWidth={2}/></button>
                                        
                                        {(evento.status === 'CONCLUIDO' || evento.status === 'FINALIZADO') ? (
                                            <>
                                                <button onClick={() => navigate(`/contratos/${evento.id}`)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Ver Detalhes"><Eye size={18} strokeWidth={2}/></button>
                                                <button onClick={() => window.print()} className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all" title="Imprimir Contrato"><Printer size={18} strokeWidth={2}/></button>
                                            </>
                                        ) : (
                                            <button onClick={() => onFinalize(evento.id)} className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Finalizar Evento"><Check size={18} strokeWidth={2}/></button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- CLASSES DE INPUT REUTILIZÁVEIS ---
const inputPremiumClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-gray-700 font-medium";
const labelPremiumClass = "block text-sm font-bold text-gray-700 mb-1.5 ml-1";

function ModalEvento({ aberto, aoFechar, aoSalvar, evento, clientes, usuarios, inventoryItems, reservasEstoque, onFinalize }) {
    const initialState = { title: '', startDate: '', endDate: '', convidados: 0, valorTotal: 0, status: 'PLANEJADO', observacoes: '', clientId: '', tasks: [], staff: [], eventItems: [], eventType: '', eventTheme: '', localNome: '', localEndereco: '', localCidade: '', localEstado: '', localCEP: '', setupDate: '', setupTimeStart: '', setupTimeEnd: '', teardownDate: '', teardownTimeStart: '', teardownTimeEnd: '', specificRequirements: '', eventContactName: '', eventContactPhone: '', eventContactEmail: '' };
    const [formData, setFormData] = useState(initialState);
    const [activeTab, setActiveTab] = useState('geral');
    const [newTask, setNewTask] = useState('');
    const [newStaff, setNewStaff] = useState('');
    const [modalEstoqueAberto, setModalEstoqueAberto] = useState(false);

    useEffect(() => {
        if (aberto) {
            if (evento) {
                setFormData({
                    ...initialState,
                    ...evento,
                    startDate: evento.startDate ? new Date(evento.startDate).toISOString().slice(0, 16) : '',
                    endDate: evento.endDate ? new Date(evento.endDate).toISOString().slice(0, 16) : '',
                    setupDate: evento.setupDate ? new Date(evento.setupDate).toISOString().split('T')[0] : '',
                    teardownDate: evento.teardownDate ? new Date(evento.teardownDate).toISOString().split('T')[0] : '',
                    staff: evento.staff?.map(s => s.userId) || [],
                    eventItems: evento.eventItems?.map(ei => ({
                        ...ei,
                        inventoryItem: inventoryItems.find(invItem => invItem.id === ei.inventoryItemId)
                    })) || [],
                });
            } else {
                setFormData({ ...initialState, startDate: new Date().toISOString().slice(0, 16) });
            }
            setActiveTab('geral');
        }
    }, [evento, aberto, inventoryItems]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleAddTask = () => { if (newTask.trim()) { setFormData(p => ({ ...p, tasks: [...p.tasks, { id: Date.now(), descricao: newTask, concluida: false }] })); setNewTask(''); } };
    const handleRemoveTask = (id) => setFormData(p => ({ ...p, tasks: p.tasks.filter(t => t.id !== id) }));
    const handleAddStaff = () => { if (newStaff && !formData.staff.includes(parseInt(newStaff))) { setFormData(p => ({ ...p, staff: [...p.staff, parseInt(newStaff)] })); setNewStaff(''); } };
    const handleRemoveStaff = (id) => setFormData(p => ({ ...p, staff: p.staff.filter(userId => userId !== id) }));
    
    const handleAddEventItem = (selectedItem) => {
        const existing = formData.eventItems.find(ei => ei.inventoryItemId === selectedItem.id);
        if (existing) { toast.error('Item já adicionado.'); }
        else { setFormData(prev => ({...prev, eventItems: [...prev.eventItems, { inventoryItemId: selectedItem.id, quantidadeReservada: 1, inventoryItem: selectedItem }] })); }
        setModalEstoqueAberto(false);
    };
    
    const handleUpdateEventItemQuantity = (id, newQuantity) => {
        const quantity = Math.max(0, parseInt(newQuantity, 10) || 0);
        setFormData(p => ({...p, eventItems: p.eventItems.map(item => item.inventoryItemId === id ? { ...item, quantidadeReservada: quantity } : item) }));
    };
    
    const handleRemoveEventItem = (id) => {
        setFormData(p => ({...p, eventItems: p.eventItems.filter(item => item.inventoryItemId !== id) }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.clientId) { toast.error("Título e Cliente são obrigatórios."); setActiveTab('geral'); return; }
        
        const dataToSend = { 
            ...formData, 
            startDate: new Date(formData.startDate), 
            endDate: formData.endDate ? new Date(formData.endDate) : null, 
            setupDate: formData.setupDate ? new Date(formData.setupDate) : null, 
            teardownDate: formData.teardownDate ? new Date(formData.teardownDate) : null, 
            convidados: Number(formData.convidados), 
            valorTotal: parseFloat(formData.valorTotal), 
            clientId: Number(formData.clientId), 
            staff: formData.staff.map(userId => ({ userId })), 
            eventItems: formData.eventItems.map(item => ({ inventoryItemId: item.inventoryItemId, quantidadeReservada: item.quantidadeReservada })) 
        };
        aoSalvar(dataToSend);
    };

    const TabButton = ({ tabId, icon: Icon, children }) => (
        <button 
            type="button" 
            onClick={() => setActiveTab(tabId)} 
            className={`flex items-center gap-2 px-4 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === tabId ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200'}`}
        >
            <Icon size={18} /> {children}
        </button>
    );

    return (
        <>
        <AnimatePresence>
            {aberto && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
                    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden">
                        
                        <div className="p-6 md:p-8 flex justify-between items-center bg-gray-50/50 border-b border-gray-100 flex-shrink-0">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                {evento ? <Pencil className="text-amber-500" /> : <Sparkles className="text-amber-500" />}
                                {evento ? "Editar Evento" : "Novo Evento"}
                            </h2>
                            <button onClick={aoFechar} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"><IconX size={24}/></button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-grow overflow-hidden flex flex-col">
                            <div className="border-b border-gray-200 flex-shrink-0 px-8 bg-white">
                                <nav className="flex space-x-2 overflow-x-auto custom-scrollbar">
                                    <TabButton tabId="geral" icon={FileText}>Visão Geral</TabButton>
                                    <TabButton tabId="local" icon={MapPin}>Logística</TabButton>
                                    <TabButton tabId="detalhes" icon={Tag}>Detalhes</TabButton>
                                    <TabButton tabId="equipe" icon={Users}>Equipe</TabButton>
                                    <TabButton tabId="estoque" icon={Calendar}>Estoque</TabButton>
                                </nav>
                            </div>

                            <div className="p-8 space-y-8 overflow-y-auto flex-grow bg-white custom-scrollbar">
                                {activeTab === 'geral' && ( 
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="md:col-span-2"><label className={labelPremiumClass}>Título do Evento*</label><input required name="title" value={formData.title} onChange={handleChange} className={inputPremiumClass} placeholder="Ex: Casamento João e Maria"/></div>
                                            <div><label className={labelPremiumClass}>Cliente Responsável*</label><select required name="clientId" value={formData.clientId} onChange={handleChange} className={inputPremiumClass}><option value="">Selecione o cliente...</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
                                            <div><label className={labelPremiumClass}>Status Atual</label><select name="status" value={formData.status} onChange={handleChange} className={inputPremiumClass}><option value="PLANEJADO">Planejado</option><option value="EM_ANDAMENTO">Em Andamento</option><option value="CONCLUIDO">Concluído</option><option value="FINALIZADO">Finalizado</option><option value="CANCELADO">Cancelado</option></select></div>
                                            <div><label className={labelPremiumClass}>Data de Início*</label><input required type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} className={inputPremiumClass}/></div>
                                            <div><label className={labelPremiumClass}>Data de Fim</label><input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} className={inputPremiumClass}/></div>
                                            <div><label className={labelPremiumClass}>Nº Convidados</label><input type="number" name="convidados" value={formData.convidados} onChange={handleChange} className={inputPremiumClass}/></div>
                                            <div><label className={labelPremiumClass}>Valor Total (R$)</label><input type="number" step="0.01" name="valorTotal" value={formData.valorTotal} onChange={handleChange} className={inputPremiumClass}/></div>
                                        </div>
                                    </motion.div> 
                                )}
                                
                                {activeTab === 'local' && ( 
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                                            <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><MapPin size={18} className="text-amber-500"/> Endereço do Evento</h4>
                                            <div><label className={labelPremiumClass}>Nome do Local (Espaço/Salão)</label><input name="localNome" value={formData.localNome} onChange={handleChange} className={inputPremiumClass}/></div>
                                            <div><label className={labelPremiumClass}>Endereço Completo</label><input name="localEndereco" value={formData.localEndereco} onChange={handleChange} className={inputPremiumClass}/></div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label className={labelPremiumClass}>Cidade</label><input name="localCidade" value={formData.localCidade} onChange={handleChange} className={inputPremiumClass}/></div><div><label className={labelPremiumClass}>Estado</label><input name="localEstado" value={formData.localEstado} onChange={handleChange} className={inputPremiumClass}/></div><div><label className={labelPremiumClass}>CEP</label><input name="localCEP" value={formData.localCEP} onChange={handleChange} className={inputPremiumClass}/></div></div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-4"><h4 className="font-bold text-blue-800 flex items-center gap-2 mb-2"><Clock size={18}/> Montagem (Setup)</h4><div><label className={labelPremiumClass}>Data</label><input type="date" name="setupDate" value={formData.setupDate} onChange={handleChange} className={inputPremiumClass}/></div><div className="grid grid-cols-2 gap-4"><div><label className={labelPremiumClass}>Início</label><input type="time" name="setupTimeStart" value={formData.setupTimeStart} onChange={handleChange} className={inputPremiumClass}/></div><div><label className={labelPremiumClass}>Fim</label><input type="time" name="setupTimeEnd" value={formData.setupTimeEnd} onChange={handleChange} className={inputPremiumClass}/></div></div></div>
                                            <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100 space-y-4"><h4 className="font-bold text-rose-800 flex items-center gap-2 mb-2"><Clock size={18}/> Desmontagem</h4><div><label className={labelPremiumClass}>Data</label><input type="date" name="teardownDate" value={formData.teardownDate} onChange={handleChange} className={inputPremiumClass}/></div><div className="grid grid-cols-2 gap-4"><div><label className={labelPremiumClass}>Início</label><input type="time" name="teardownTimeStart" value={formData.teardownTimeStart} onChange={handleChange} className={inputPremiumClass}/></div><div><label className={labelPremiumClass}>Fim</label><input type="time" name="teardownTimeEnd" value={formData.teardownTimeEnd} onChange={handleChange} className={inputPremiumClass}/></div></div></div>
                                        </div>
                                    </motion.div> 
                                )}
                                
                                {activeTab === 'detalhes' && ( 
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className={labelPremiumClass}>Tipo de Evento</label><input name="eventType" placeholder="Casamento, 15 Anos, Corporativo..." value={formData.eventType} onChange={handleChange} className={inputPremiumClass}/></div><div><label className={labelPremiumClass}>Tema do Evento</label><input name="eventTheme" placeholder="Rústico, Clássico, Neon..." value={formData.eventTheme} onChange={handleChange} className={inputPremiumClass}/></div><div className="md:col-span-2"><label className={labelPremiumClass}>Requisitos Específicos / Observações</label><textarea name="specificRequirements" value={formData.specificRequirements} onChange={handleChange} rows="4" className={`${inputPremiumClass} resize-none`}></textarea></div></div>
                                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4"><h4 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><Users size={18} className="text-amber-500"/> Contato Responsável no Local</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className={labelPremiumClass}>Nome</label><input name="eventContactName" value={formData.eventContactName} onChange={handleChange} className={inputPremiumClass}/></div><div><label className={labelPremiumClass}>Telefone</label><input type="tel" name="eventContactPhone" value={formData.eventContactPhone} onChange={handleChange} className={inputPremiumClass}/></div><div className="md:col-span-2"><label className={labelPremiumClass}>Email</label><input type="email" name="eventContactEmail" value={formData.eventContactEmail} onChange={handleChange} className={inputPremiumClass}/></div></div></div>
                                    </motion.div> 
                                )}
                                
                                {activeTab === 'equipe' && ( 
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"><h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><CheckCircle size={20} className="text-emerald-500"/> Lista de Tarefas</h3><div className="flex gap-2 mb-6"><input type="text" value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="Descreva a nova tarefa..." className={inputPremiumClass}/><button type="button" onClick={handleAddTask} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 rounded-xl transition-colors"><Plus size={20}/></button></div><ul className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">{formData.tasks.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Nenhuma tarefa adicionada.</p>}{formData.tasks.map(task=><li key={task.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-xl group"><span className="text-sm font-medium text-gray-700">{task.descricao}</span><button type="button" onClick={()=>handleRemoveTask(task.id)} className="text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button></li>)}</ul></div>
                                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"><h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Users size={20} className="text-blue-500"/> Equipe Alocada</h3><div className="flex gap-2 mb-6"><select value={newStaff} onChange={e=>setNewStaff(e.target.value)} className={inputPremiumClass}><option value="">Selecione o membro...</option>{usuarios.map(u=><option key={u.id} value={u.id}>{u.nome}</option>)}</select><button type="button" onClick={handleAddStaff} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 rounded-xl transition-colors"><Plus size={20}/></button></div><ul className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">{formData.staff.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Nenhum membro alocado.</p>}{formData.staff.map(userId => { const user=usuarios.find(u=>u.id===userId); return user ? (<li key={userId} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-xl group"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">{user.nome.charAt(0)}</div>{user.nome}</span><button type="button" onClick={()=>handleRemoveStaff(userId)} className="text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button></li>) : null })}</ul></div>
                                    </motion.div> 
                                )}
                                
                                {activeTab === 'estoque' && ( 
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Tag size={20} className="text-amber-500"/> Itens Reservados do Estoque</h3>
                                            <button type="button" onClick={() => setModalEstoqueAberto(true)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"><Plus size={16}/>Adicionar Item</button>
                                        </div>
                                        <div className="space-y-3 bg-white border border-gray-200 p-2 rounded-2xl min-h-[200px]">
                                            {formData.eventItems.length === 0 && <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10"><Calendar size={32} className="mb-2 opacity-50"/> <p>Nenhum item reservado para este evento.</p></div>}
                                            {formData.eventItems.map(ei => { const item = inventoryItems.find(i => i.id === ei.inventoryItemId); return item ? (
                                                <div key={item.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 p-3 rounded-xl hover:border-amber-200 transition-colors">
                                                    <span className="font-bold text-gray-700">{item.nome}</span>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Qtd:</label>
                                                            <input type="number" min="1" value={ei.quantidadeReservada} onChange={e => handleUpdateEventItemQuantity(item.id, e.target.value)} className="w-20 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-center font-bold focus:border-amber-500 outline-none" />
                                                        </div>
                                                        <button type="button" onClick={() => handleRemoveEventItem(item.id)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                                                    </div>
                                                </div>
                                            ) : null })}
                                        </div>
                                    </motion.div> 
                                )}
                            </div>

                            <div className="p-6 md:p-8 flex justify-end gap-4 border-t border-gray-200 bg-gray-50/50 flex-shrink-0 rounded-b-[2rem]">
                                <button type="button" onClick={aoFechar} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
                                {evento && evento.status !== 'FINALIZADO' && evento.status !== 'CANCELADO' && (
                                    <button type="button" onClick={() => onFinalize(evento.id)} className="px-6 py-2.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold rounded-xl flex items-center gap-2 transition-colors">
                                        <Check size={18} /> Finalizar Evento
                                    </button>
                                )}
                                <button type="submit" className="px-8 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all">Salvar Evento</button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
        <ModalSelecionarEstoque aberto={modalEstoqueAberto} aoFechar={() => setModalEstoqueAberto(false)} inventoryItems={inventoryItems} onSelectItem={handleAddEventItem} />
        </>
    );
}

// Modal de Estoque 
function ModalSelecionarEstoque({ aberto, aoFechar, inventoryItems, onSelectItem }) {
    const [termoBusca, setTermoBusca] = useState('');
    
    const itensFiltrados = useMemo(() => { 
        return inventoryItems.filter(item => 
            (item.nome || '').toLowerCase().includes(termoBusca.toLowerCase())
        ); 
    }, [inventoryItems, termoBusca]);

    return (
        <AnimatePresence>
            {aberto && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <motion.div initial={{scale:0.95, y: 10}} animate={{scale:1, y: 0}} exit={{scale:0.95, y: 10}} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Tag className="text-amber-500" size={20}/> Selecionar Item do Estoque</h2>
                            <button onClick={aoFechar} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"><IconX size={20}/></button>
                        </div>
                        <div className="p-6 pb-2 border-b border-gray-100">
                            <div className="relative">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="Buscar pelo nome do item..." value={termoBusca} onChange={e => setTermoBusca(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-medium"/>
                            </div>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-2 flex-grow custom-scrollbar">
                            {itensFiltrados.map(item => (
                                <div key={item.id} className="flex justify-between items-center p-4 rounded-xl hover:bg-amber-50/50 border border-transparent hover:border-amber-100 transition-all group">
                                    <span className="font-bold text-gray-700 group-hover:text-amber-700">{item.nome}</span>
                                    <button type="button" onClick={() => onSelectItem(item)} className="px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white font-bold text-sm rounded-lg transition-colors">Adicionar</button>
                                </div>
                            ))}
                            {itensFiltrados.length === 0 && (
                                <div className="text-center py-12 text-gray-400">
                                    <Tag size={32} className="mx-auto mb-3 opacity-30"/>
                                    <p className="font-medium">Nenhum item encontrado.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}