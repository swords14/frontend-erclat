// Caminho do arquivo: frontend/src/pages/Eventos.jsx
// VERSÃO CORRIGIDA: Usa o serviço de API centralizado

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Search, Calendar, CheckCircle, XCircle, Tag, Clock, Pencil, Trash2, X as IconX, Check, Eye, Printer, DollarSign } from 'lucide-react';
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
} from '@/services/api'; // Ajuste o caminho se necessário

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
            // Usa Promise.all com as funções da API central
            const [eventosData, clientesData, usuariosData, inventoryData, reservasData] = await Promise.all([
                getEvents(),
                getAllClients(),
                getAllUsers(),
                getInventoryItems(),
                getFutureReservations()
            ]);
            
            setEventos(eventosData);
            setClientes(clientesData);
            setUsuarios(usuariosData);
            setInventoryItems(inventoryData);
            setReservasEstoque(reservasData);

        } catch (error) {
            toast.error(error.message || 'Erro ao carregar dados.');
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

    return { eventos, clientes, usuarios, inventoryItems, reservasEstoque, isLoading, saveEvent, deleteEvent, handleFinalizeEvent };
};


// --- COMPONENTES DE UI ---
const KPICard = ({ title, value, icon: Icon }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md flex items-center gap-4">
        <div className="p-3 bg-indigo-100 dark:bg-gray-700 rounded-lg"><Icon className="text-indigo-500 dark:text-indigo-400" size={24}/></div>
        <div><p className="text-sm text-gray-500 dark:text-gray-400">{title}</p><p className="text-xl font-bold">{value}</p></div>
    </div>
);

const EventStatusBadge = ({ status }) => {
    const statusMap = {
        PLANEJADO: { color: 'blue', text: 'Planejado', icon: Calendar },
        EM_ANDAMENTO: { color: 'yellow', text: 'Em Andamento', icon: Clock },
        CONCLUIDO: { color: 'green', text: 'Concluído', icon: CheckCircle },
        FINALIZADO: { color: 'green', text: 'Finalizado', icon: CheckCircle },
        CANCELADO: { color: 'red', text: 'Cancelado', icon: XCircle },
    };
    const currentStatus = statusMap[status] || { color: 'gray', text: 'Desconhecido', icon: Tag };
    const colorClass = `bg-${currentStatus.color}-100 text-${currentStatus.color}-800 dark:bg-${currentStatus.color}-900/50 dark:text-${currentStatus.color}-300`;
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${colorClass}`}>
            <currentStatus.icon size={12} /> {currentStatus.text}
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
    const eventosFiltrados = useMemo(() => { return eventos.filter(evento => (evento.title || '').toLowerCase().includes(termoBusca.toLowerCase()) || (evento.client?.nome || '').toLowerCase().includes(termoBusca.toLowerCase())); }, [eventos, termoBusca]);
    const kpiData = useMemo(() => ({ total: eventos.length, concluidos: eventos.filter(e => e.status === 'CONCLUIDO').length, valorTotal: eventos.reduce((acc, e) => acc + (e.valorTotal || 0), 0), }), [eventos]);
    
    const abrirModal = (evento = null) => { setEventoEditando(evento); setModalAberto(true); };
    
    const handleSalvar = async (data) => { 
        if (data.valorTotal === 0) {
            toast.error("O valor total não pode ser zero.");
            return;
        }
        const success = await saveEvent(data, eventoEditando); 
        if (success) setModalAberto(false); 
    };

    const handleDelete = async (eventId) => {
        await deleteEvent(eventId);
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div><h1 className="text-3xl font-bold">Gestão de Eventos</h1><p className="mt-1 text-gray-500">Organize e acompanhe todos os seus eventos.</p></div>
                <button onClick={() => abrirModal()} className="btn-primary flex items-center gap-2"><Plus size={20} /> Novo Evento</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <KPICard title="Total de Eventos" value={kpiData.total} icon={Calendar} />
                <KPICard title="Eventos Concluídos" value={kpiData.concluidos} icon={CheckCircle} />
                <KPICard title="Valor Total de Eventos" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpiData.valorTotal)} icon={DollarSign} />
            </div>
            <div className="relative"><Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Buscar evento por título ou cliente..." value={termoBusca} onChange={e => setTermoBusca(e.target.value)} className="w-full pl-10 pr-4 py-2 input-form"/></div>
            {isLoading ? <div className="text-center p-10">A carregar eventos...</div> :
             eventosFiltrados.length === 0 ? <div className="text-center p-16 bg-white dark:bg-gray-800 rounded-2xl"><FileText size={48} className="mx-auto text-gray-400" /><h3 className="mt-4 text-xl font-semibold">Nenhum evento encontrado</h3></div> :
             <TabelaEventos eventos={eventosFiltrados} onEdit={abrirModal} onDelete={handleDelete} onFinalize={handleFinalizeEvent} />
            }
            <ModalEvento aberto={modalAberto} aoFechar={() => setModalAberto(false)} aoSalvar={handleSalvar} evento={eventoEditando} clientes={clientes} usuarios={usuarios} inventoryItems={inventoryItems} reservasEstoque={reservasEstoque} onFinalize={handleFinalizeEvent}/>
        </div>
    );
}

// --- SUBCOMPONENTES ---
const TabelaEventos = ({ eventos, onEdit, onDelete, onFinalize }) => {
    const navigate = useNavigate();
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
            <table className="w-full text-left">
                <thead className="table-header"><tr><th className="p-4">Evento</th><th className="p-4 hidden sm:table-cell">Cliente</th><th className="p-4 hidden md:table-cell">Data</th><th className="p-4 hidden lg:table-cell text-right">Valor</th><th className="p-4">Status</th><th className="p-4 text-center">Ações</th></tr></thead>
                <tbody>
                    {eventos.map(evento => (
                        <tr key={evento.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="p-4 font-medium">{evento.title}</td>
                            <td className="p-4 hidden sm:table-cell">{evento.client?.nome || 'N/A'}</td>
                            <td className="p-4 hidden md:table-cell">{new Date(evento.startDate).toLocaleDateString('pt-BR')}</td>
                            <td className="p-4 hidden lg:table-cell text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(evento.valorTotal || 0)}</td>
                            <td className="p-4"><EventStatusBadge status={evento.status} /></td>
                            <td className="p-4 text-center flex justify-center items-center gap-1">
                                {evento.status === 'PLANEJADO' || evento.status === 'EM_ANDAMENTO' ? (
                                    <>
                                        <button onClick={() => onEdit(evento)} className="p-2 text-gray-500 hover:text-blue-500" title="Editar Evento"><Pencil size={18} /></button>
                                        <button onClick={() => onDelete(evento.id)} className="p-2 text-gray-500 hover:text-red-500" title="Deletar Evento"><Trash2 size={18} /></button>
                                        <button onClick={() => onFinalize(evento.id)} className="p-2 text-gray-500 hover:text-green-500" title="Finalizar Evento"><Check size={18} /></button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => navigate(`/contratos/${evento.id}`)} className="p-2 text-gray-500 hover:text-blue-500" title="Ver Detalhes"><Eye size={18} /></button>
                                        <button onClick={() => window.print()} className="p-2 text-gray-500 hover:text-indigo-500" title="Imprimir Contrato"><Printer size={18} /></button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

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
        const dataToSend = { ...formData, startDate: new Date(formData.startDate), endDate: formData.endDate ? new Date(formData.endDate) : null, setupDate: formData.setupDate || null, teardownDate: formData.teardownDate || null, convidados: Number(formData.convidados), valorTotal: parseFloat(formData.valorTotal), clientId: Number(formData.clientId), staff: formData.staff.map(userId => ({ userId })), eventItems: formData.eventItems.map(item => ({ inventoryItemId: item.inventoryItemId, quantidadeReservada: item.quantidadeReservada })) };
        aoSalvar(dataToSend);
    };

    const TabButton = ({ tabId, children }) => (<button type="button" onClick={() => setActiveTab(tabId)} className={`px-1 py-4 text-sm font-medium border-b-2 transition-all ${activeTab === tabId ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>{children}</button>);

    return (
        <>
        <AnimatePresence>
            {aberto && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col">
                        <div className="p-6 flex justify-between items-center flex-shrink-0"><h2 className="text-2xl font-bold">{evento ? "Editar Evento" : "Novo Evento"}</h2><button onClick={aoFechar} className="p-1 rounded-full hover:bg-gray-200"><IconX size={22}/></button></div>
                        <form onSubmit={handleSubmit} className="flex-grow overflow-hidden flex flex-col">
                            <div className="border-b dark:border-gray-700 flex-shrink-0 px-8"><nav className="flex space-x-8"><TabButton tabId="geral">Geral</TabButton><TabButton tabId="local">Local & Logística</TabButton><TabButton tabId="detalhes">Detalhes</TabButton><TabButton tabId="equipe">Equipe & Tarefas</TabButton><TabButton tabId="estoque">Estoque</TabButton></nav></div>
                            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-6 overflow-y-auto flex-grow max-h-[60vh]">
                                {activeTab === 'geral' && ( <div className="space-y-6"><h3 className="text-xl font-semibold">Informações Gerais</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"><div><label>Título*</label><input required name="title" value={formData.title} onChange={handleChange} className="input-form"/></div><div><label>Cliente*</label><select required name="clientId" value={formData.clientId} onChange={handleChange} className="input-form"><option value="">Selecione...</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></div><div><label>Início*</label><input required type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} className="input-form"/></div><div><label>Fim</label><input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} className="input-form"/></div><div><label>Convidados</label><input type="number" name="convidados" value={formData.convidados} onChange={handleChange} className="input-form"/></div><div><label>Valor (R$)</label><input type="number" step="0.01" name="valorTotal" value={formData.valorTotal} onChange={handleChange} className="input-form"/></div><div><label>Status</label><select name="status" value={formData.status} onChange={handleChange} className="input-form"><option value="PLANEJADO">Planejado</option><option value="EM_ANDAMENTO">Em Andamento</option><option value="CONCLUIDO">Concluído</option><option value="FINALIZADO">Finalizado</option><option value="CANCELADO">Cancelado</option></select></div></div></div> )}
                                {activeTab === 'local' && ( <div className="space-y-6"><h3 className="text-xl font-semibold">Local & Logística</h3><div className="space-y-4"><div><label>Nome do Local</label><input name="localNome" value={formData.localNome} onChange={handleChange} className="input-form"/></div><div><label>Endereço</label><input name="localEndereco" value={formData.localEndereco} onChange={handleChange} className="input-form"/></div><div className="grid grid-cols-3 gap-4"><div><label>Cidade</label><input name="localCidade" value={formData.localCidade} onChange={handleChange} className="input-form"/></div><div><label>Estado</label><input name="localEstado" value={formData.localEstado} onChange={handleChange} className="input-form"/></div><div><label>CEP</label><input name="localCEP" value={formData.localCEP} onChange={handleChange} className="input-form"/></div></div></div><div className="border-t pt-6 space-y-4"><h4 className="font-semibold">Montagem</h4><div className="grid grid-cols-3 gap-4"><div><label>Data</label><input type="date" name="setupDate" value={formData.setupDate} onChange={handleChange} className="input-form"/></div><div><label>Início</label><input type="time" name="setupTimeStart" value={formData.setupTimeStart} onChange={handleChange} className="input-form"/></div><div><label>Fim</label><input type="time" name="setupTimeEnd" value={formData.setupTimeEnd} onChange={handleChange} className="input-form"/></div></div></div><div className="border-t pt-6 space-y-4"><h4 className="font-semibold">Desmontagem</h4><div className="grid grid-cols-3 gap-4"><div><label>Data</label><input type="date" name="teardownDate" value={formData.teardownDate} onChange={handleChange} className="input-form"/></div><div><label>Início</label><input type="time" name="teardownTimeStart" value={formData.teardownTimeStart} onChange={handleChange} className="input-form"/></div><div><label>Fim</label><input type="time" name="teardownTimeEnd" value={formData.teardownTimeEnd} onChange={handleChange} className="input-form"/></div></div></div></div> )}
                                {activeTab === 'detalhes' && ( <div className="space-y-6"><h3 className="text-xl font-semibold">Detalhes Adicionais</h3><div className="grid grid-cols-2 gap-4"><div><label>Tipo de Evento</label><input name="eventType" value={formData.eventType} onChange={handleChange} className="input-form"/></div><div><label>Tema</label><input name="eventTheme" value={formData.eventTheme} onChange={handleChange} className="input-form"/></div></div><div><label>Requisitos Específicos</label><textarea name="specificRequirements" value={formData.specificRequirements} onChange={handleChange} rows="3" className="input-form"></textarea></div><div className="border-t pt-6 space-y-4"><h4 className="font-semibold">Contato no Local</h4><div className="grid grid-cols-2 gap-4"><div><label>Nome</label><input name="eventContactName" value={formData.eventContactName} onChange={handleChange} className="input-form"/></div><div><label>Telefone</label><input type="tel" name="eventContactPhone" value={formData.eventContactPhone} onChange={handleChange} className="input-form"/></div><div className="col-span-2"><label>Email</label><input type="email" name="eventContactEmail" value={formData.eventContactEmail} onChange={handleChange} className="input-form"/></div></div></div></div> )}
                                {activeTab === 'equipe' && ( <div className="grid grid-cols-2 gap-6"><div><h3 className="text-xl font-semibold mb-4">Tarefas</h3><div className="flex gap-2 mb-3"><input type="text" value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="Nova tarefa..." className="input-form flex-grow"/><button type="button" onClick={handleAddTask} className="btn-secondary"><Plus/></button></div><ul className="space-y-2 max-h-60 overflow-y-auto">{formData.tasks.map(task=><li key={task.id} className="flex justify-between p-2 bg-gray-50 rounded"><span>{task.descricao}</span><button type="button" onClick={()=>handleRemoveTask(task.id)}><Trash2 size={16}/></button></li>)}</ul></div><div><h3 className="text-xl font-semibold mb-4">Equipe</h3><div className="flex gap-2 mb-3"><select value={newStaff} onChange={e=>setNewStaff(e.target.value)} className="input-form flex-grow"><option value="">Adicionar...</option>{usuarios.map(u=><option key={u.id} value={u.id}>{u.nome}</option>)}</select><button type="button" onClick={handleAddStaff} className="btn-secondary"><Plus/></button></div><ul className="space-y-2 max-h-60 overflow-y-auto">{formData.staff.map(userId => { const user=usuarios.find(u=>u.id===userId); return user ? (<li key={userId} className="flex justify-between p-2 bg-gray-50 rounded"><span>{user.nome}</span><button type="button" onClick={()=>handleRemoveStaff(userId)}><Trash2 size={16}/></button></li>) : null })}</ul></div></div> )}
                                {activeTab === 'estoque' && ( <div><h3 className="text-xl font-semibold mb-4">Itens Reservados</h3><button type="button" onClick={() => setModalEstoqueAberto(true)} className="btn-secondary mb-4 gap-2 flex items-center"><Plus/>Adicionar Item</button><div className="space-y-2">{formData.eventItems.map(ei => { const item = inventoryItems.find(i => i.id === ei.inventoryItemId); return item ? (<div key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md"><span>{item.nome}</span><div className="flex items-center gap-2"><input type="number" value={ei.quantidadeReservada} onChange={e => handleUpdateEventItemQuantity(item.id, e.target.value)} className="input-form w-20 text-center" /><button type="button" onClick={() => handleRemoveEventItem(item.id)}><Trash2 size={16}/></button></div></div>) : null })}</div></div> )}
                            </motion.div>
                            <div className="p-6 flex justify-end gap-4 border-t dark:border-gray-700">
                                <button type="button" onClick={aoFechar} className="btn-secondary">Cancelar</button>
                                {evento && evento.status !== 'FINALIZADO' && evento.status !== 'CANCELADO' && (
                                    <button type="button" onClick={() => onFinalize(evento.id)} className="btn-success flex items-center gap-2">
                                        <Check size={16} /> Finalizar Evento
                                    </button>
                                )}
                                <button type="submit" className="btn-primary">Salvar</button>
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

function ModalSelecionarEstoque({ aberto, aoFechar, inventoryItems, onSelectItem }) {
    const [termoBusca, setTermoBusca] = useState('');
    const itensFiltrados = useMemo(() => { return inventoryItems.filter(item => item.nome.toLowerCase().includes(termoBusca.toLowerCase())); }, [inventoryItems, termoBusca]);
        return (
            <AnimatePresence>
                {aberto && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}} className="bg-white rounded-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
                            <div className="p-6 border-b">
                                <h2 className="text-2xl font-bold">Selecionar Item</h2>
                            </div>
                            <div className="p-6">
                                <input type="text" placeholder="Buscar..." value={termoBusca} onChange={e => setTermoBusca(e.target.value)} className="input-form w-full"/>
                            </div>
                            <div className="px-6 pb-6 overflow-y-auto space-y-2">
                                {itensFiltrados.map(item => (
                                    <div key={item.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-100">
                                        <span>{item.nome}</span>
                                        <button type="button" onClick={() => onSelectItem(item)} className="btn-secondary-sm">Adicionar</button>
                                    </div>
                                ))}
                            </div>
                            <div className="p-6 border-t flex justify-end">
                                <button type="button" onClick={aoFechar} className="btn-secondary">Fechar</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }