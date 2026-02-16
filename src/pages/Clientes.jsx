import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
    Plus, Search, Pencil, Trash2, X as IconX, Users, UserPlus, Building, Briefcase, List, LayoutGrid, 
    FileText, Phone, Mail, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Tag, MapPin, AlignLeft
} from 'lucide-react';
import { getAllClients, createClient, updateClient, deleteClient } from '@/services/api';

const statusClienteOptions = ['Lead', 'Contato Inicial', 'Proposta Enviada', 'Em Negociação', 'Cliente Ativo', 'Inativo', 'Perdido'];
const ITEMS_PER_PAGE = 8;

const inputPremiumClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-gray-700 font-medium";
const labelPremiumClass = "block text-sm font-bold text-gray-700 mb-1.5 ml-1";

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

const TagBadge = ({ children, customClass = "bg-amber-50 text-amber-700 border-amber-200" }) => (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm tracking-wide ${customClass}`}>
        {children}
    </span>
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

const useClientes = () => {
    const [clientes, setClientes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getAllClients();
            setClientes(data || []);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar clientes.');
            setClientes([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const saveCliente = async (dados, clienteEditando) => {
        const isEditing = !!clienteEditando;
        try {
            if (isEditing) {
                await updateClient(clienteEditando.id, dados);
            } else {
                await createClient(dados);
            }
            toast.success(`Cliente ${isEditing ? 'atualizado' : 'adicionado'} com sucesso!`);
            fetchData();
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Erro ao salvar cliente.');
            return false;
        }
    };

    const deleteCliente = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir este cliente? Todos os dados vinculados podem ser afetados.")) {
            try {
                await deleteClient(id);
                toast.success('Cliente excluído com sucesso!');
                fetchData();
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    return { clientes, isLoading, saveCliente, deleteCliente };
};


export default function Clientes() {
    const { clientes, isLoading, saveCliente, deleteCliente } = useClientes();
    const [modalAberto, setModalAberto] = useState(false);
    const [clienteEditando, setClienteEditando] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [filters, setFilters] = useState({ termoBusca: '', status: 'todos' });
    const [sortOrder, setSortOrder] = useState('nome_asc');
    const [currentPage, setCurrentPage] = useState(1);
    
    const processedData = useMemo(() => {
        let filtered = [...clientes];
        
        if (filters.termoBusca) {
            const termo = filters.termoBusca.toLowerCase();
            filtered = filtered.filter(c =>
                (c.nome || '').toLowerCase().includes(termo) ||
                (c.email || '').toLowerCase().includes(termo) ||
                (c.cpf || '').toLowerCase().includes(termo) ||
                (c.cnpj || '').toLowerCase().includes(termo) ||
                (c.tipo || '').toLowerCase().includes(termo)
            );
        }
        if (filters.status !== 'todos') {
            filtered = filtered.filter(c => (c.status || 'Lead') === filters.status);
        }

        filtered.sort((a, b) => {
            const valA = a.nome || '';
            const valB = b.nome || '';
            return sortOrder === 'nome_asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        });

        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

        return { paginatedData, totalPages, totalCount: filtered.length };
    }, [clientes, filters, sortOrder, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [filters, sortOrder]);

    const abrirModalParaNovo = () => {
        setClienteEditando(null);
        setModalAberto(true);
    };

    const abrirModalParaEditar = (cliente) => {
        setClienteEditando(cliente);
        setModalAberto(true);
    };

    const handleSalvarCliente = async (dados) => {
        const success = await saveCliente(dados, clienteEditando);
        if (success) {
            setModalAberto(false);
        }
    };
    
    const kpiData = useMemo(() => ({
        total: clientes.length,
        ativos: clientes.filter(c => c.status === 'Cliente Ativo').length,
        leads: clientes.filter(c => c.status === 'Lead').length,
        pj: clientes.filter(c => c.tipo === 'Pessoa Jurídica').length,
    }), [clientes]);

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8 min-h-screen">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-light text-gray-800 tracking-wide flex items-center gap-3">
                        Carteira de <span className="font-bold text-amber-600">Clientes</span>
                    </h1>
                    <p className="mt-1 text-gray-500 font-medium">Construa e gerencie o relacionamento com sua rede.</p>
                </div>
                <button onClick={abrirModalParaNovo} className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all duration-300">
                    <UserPlus size={20} /> Novo Cliente
                </button>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total de Clientes" value={kpiData.total} icon={Users} corIcone="text-blue-500" bgIcone="bg-blue-50" />
                <KPICard title="Clientes Ativos" value={kpiData.ativos} icon={Briefcase} corIcone="text-emerald-500" bgIcone="bg-emerald-50" />
                <KPICard title="Novos Leads" value={kpiData.leads} icon={UserPlus} corIcone="text-amber-500" bgIcone="bg-amber-50" />
                <KPICard title="Pessoas Jurídicas" value={kpiData.pj} icon={Building} corIcone="text-indigo-500" bgIcone="bg-indigo-50" />
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-4 flex-wrap items-center">
                <div className="relative flex-grow w-full md:w-auto">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nome, email, CPF/CNPJ..." 
                        value={filters.termoBusca} 
                        onChange={e => setFilters(p => ({...p, termoBusca: e.target.value}))} 
                        className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-gray-700 font-medium"
                    />
                </div>
                
                <div className="flex gap-4 w-full md:w-auto">
                    <select value={filters.status} onChange={e => setFilters(p => ({...p, status: e.target.value}))} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-amber-500 outline-none font-medium text-gray-700 w-full md:w-auto">
                        <option value="todos">Todos os Status</option>
                        {statusClienteOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    
                    <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-amber-500 outline-none font-medium text-gray-700 w-full md:w-auto">
                        <option value="nome_asc">Nome (A-Z)</option>
                        <option value="nome_desc">Nome (Z-A)</option>
                    </select>
                </div>
                
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1 w-full md:w-auto justify-center">
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-400 hover:text-gray-700'}`}><List size={20} /></button>
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-400 hover:text-gray-700'}`}><LayoutGrid size={20} /></button>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center p-12 bg-white rounded-[2rem] border border-gray-200 shadow-sm">
                    <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Buscando clientes...</p>
                </div> 
            ) : processedData.totalCount === 0 ? (
                <div className="text-center p-20 bg-white rounded-[2rem] border border-gray-200 shadow-sm flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                        <Users size={40} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Nenhum cliente encontrado</h3>
                    <p className="text-gray-500 mt-2 font-medium max-w-sm">Ajuste os filtros de busca ou cadastre um novo contato na sua base.</p>
                </div>
             ) : (
                <div className="flex flex-col">
                    {viewMode === 'list' ? (
                        <ListView clientes={processedData.paginatedData} onEdit={abrirModalParaEditar} onDelete={deleteCliente} />
                    ) : (
                        <GridView clientes={processedData.paginatedData} onEdit={abrirModalParaEditar} onDelete={deleteCliente} />
                    )}
                    <Pagination currentPage={currentPage} totalPages={processedData.totalPages} onPageChange={setCurrentPage} />
                </div>
             )
            }

            <ModalCliente aberto={modalAberto} aoFechar={() => setModalAberto(false)} aoSalvar={handleSalvarCliente} cliente={clienteEditando} />
        </div>
    );
}


const ListView = ({ clientes, onEdit, onDelete }) => (
    <div className="bg-white rounded-[2rem] border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-200">
                    <tr>
                        <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500">Nome / Empresa</th>
                        <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 hidden lg:table-cell">Contatos Principais</th>
                        <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 hidden md:table-cell">Status</th>
                        <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 hidden xl:table-cell">Tags</th>
                        <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {clientes.map(c => (
                        <tr key={c.id} className="hover:bg-amber-50/30 transition-colors group">
                            <td className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${c.tipo === 'Pessoa Jurídica' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {c.nome ? c.nome.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{c.nome}</p>
                                        <p className="text-xs text-gray-500 font-medium">{c.tipo}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="p-5 hidden lg:table-cell">
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1"><Mail size={14} className="text-gray-400"/> {c.email || '—'}</div>
                                <div className="flex items-center gap-2 text-sm text-gray-600"><Phone size={14} className="text-gray-400"/> {c.telefone || '—'}</div>
                            </td>
                            <td className="p-5 hidden md:table-cell">
                                <TagBadge customClass={
                                    c.status === 'Cliente Ativo' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                    c.status === 'Perdido' ? "bg-rose-50 text-rose-700 border-rose-200" :
                                    "bg-amber-50 text-amber-700 border-amber-200"
                                }>
                                    {c.status || 'Lead'}
                                </TagBadge>
                            </td>
                            <td className="p-5 hidden xl:table-cell">
                                <div className="flex flex-wrap gap-1.5">
                                    {(c.tags || []).slice(0, 2).map(tag => <TagBadge key={tag} customClass="bg-gray-100 text-gray-600 border-gray-200">{tag}</TagBadge>)}
                                    {(c.tags && c.tags.length > 2) && <span className="text-xs text-gray-400 font-bold ml-1">+{c.tags.length - 2}</span>}
                                </div>
                            </td>
                            <td className="p-5 text-center">
                                <div className="flex justify-center items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onEdit(c)} className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" aria-label="Editar"><Pencil size={18} strokeWidth={2}/></button>
                                    <button onClick={() => onDelete(c.id)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" aria-label="Excluir"><Trash2 size={18} strokeWidth={2}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const GridView = ({ clientes, onEdit, onDelete }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {clientes.map(c => (
            <motion.div key={c.id} layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] border border-gray-200 shadow-sm flex flex-col overflow-hidden hover:border-amber-300 transition-colors group">
                <div className="p-6 flex-grow">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${c.tipo === 'Pessoa Jurídica' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                            {c.nome ? c.nome.charAt(0).toUpperCase() : '?'}
                        </div>
                        <TagBadge customClass={
                            c.status === 'Cliente Ativo' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            c.status === 'Perdido' ? "bg-rose-50 text-rose-700 border-rose-200" :
                            "bg-amber-50 text-amber-700 border-amber-200"
                        }>
                            {c.status || 'Lead'}
                        </TagBadge>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{c.nome}</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">{c.tipo}</p>
                    
                    <div className="space-y-2.5 mb-5">
                        <p className="flex items-center gap-3 text-sm text-gray-600 font-medium"><div className="w-6 flex justify-center"><Mail size={16} className="text-gray-400" /></div> <span className="truncate">{c.email || 'S/ Email'}</span></p>
                        <p className="flex items-center gap-3 text-sm text-gray-600 font-medium"><div className="w-6 flex justify-center"><Phone size={16} className="text-gray-400" /></div> {c.telefone || 'S/ Telefone'}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                        {(c.tags || []).slice(0, 3).map(tag => <TagBadge key={tag} customClass="bg-gray-50 text-gray-600 border-gray-200 shadow-none">{tag}</TagBadge>)}
                    </div>
                </div>
                
                <div className="bg-gray-50/80 p-4 border-t border-gray-100 flex justify-end gap-3 transition-colors group-hover:bg-amber-50/30">
                    <button onClick={() => onEdit(c)} className="px-4 py-2 bg-white border border-gray-200 hover:border-amber-300 text-gray-700 hover:text-amber-600 rounded-xl font-bold text-sm shadow-sm transition-all">Editar</button>
                    <button onClick={() => onDelete(c.id)} className="px-4 py-2 bg-white border border-gray-200 hover:border-rose-300 text-gray-700 hover:text-rose-600 rounded-xl font-bold text-sm shadow-sm transition-all">Excluir</button>
                </div>
            </motion.div>
        ))}
    </div>
);


const TagInput = ({ value, onChange, placeholder }) => { 
    const [inputValue, setInputValue] = useState(''); 
    
    const handleKeyDown = (e) => { 
        if (e.key === 'Enter' || e.key === ',') { 
            e.preventDefault(); 
            const newTag = inputValue.trim(); 
            if (newTag && !value.includes(newTag)) { 
                onChange([...value, newTag]); 
            } 
            setInputValue(''); 
        } 
    }; 
    
    const removeTag = (tagToRemove) => { 
        onChange(value.filter(tag => tag !== tagToRemove)); 
    }; 
    
    return ( 
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-2 focus-within:bg-white focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10 transition-all">
            <div className="flex flex-wrap gap-2 mb-1 min-h-[24px]">
                {value.map(tag => ( 
                    <span key={tag} className="flex items-center gap-1.5 bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1 rounded-lg"> 
                        {tag} 
                        <button type="button" onClick={() => removeTag(tag)} className="text-gray-500 hover:text-rose-600"><IconX size={14} /></button>
                    </span> 
                ))}
            </div>
            <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyDown} className="w-full bg-transparent border-none outline-none px-2 py-1 text-sm font-medium text-gray-700 placeholder-gray-400" placeholder={placeholder} />
        </div> 
    ); 
};

function ModalCliente({ aberto, aoFechar, aoSalvar, cliente }) {
    const initialState = { 
        nome: '', email: '', cpf: '', telefone: '', tipo: 'Pessoa Física', cnpj: '', 
        inscricaoEstadual: '', ramoAtividade: '', endereco: '', cidade: '', estado: '', cep: '', 
        cargoContatoPrincipal: '', contatoSecundarioNome: '', contatoSecundarioTelefone: '', 
        contatoSecundarioEmail: '', preferenciasEvento: '', origemCliente: '', 
        dataAniversario: '', dataFundacaoEmpresa: '', status: 'Lead', tags: [], notas: '' 
    };
    const [formData, setFormData] = useState(initialState);
    const [activeTab, setActiveTab] = useState('geral');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (aberto) {
            if (cliente) {
                let contatoSec = { nome: '', telefone: '', email: '' };
                let cargoPrincipal = '';

                if (cliente.contacts && Array.isArray(cliente.contacts)) {
                    const principal = cliente.contacts.find(c => c.isPrincipal);
                    const secundario = cliente.contacts.find(c => !c.isPrincipal);
                    
                    if (principal) cargoPrincipal = principal.cargo || '';
                    if (secundario) {
                        contatoSec = {
                            nome: secundario.nome || '',
                            telefone: secundario.telefone || '',
                            email: secundario.email || ''
                        };
                    }
                }

                setFormData({ 
                    ...initialState, 
                    ...cliente, 
                    cargoContatoPrincipal: cargoPrincipal,
                    contatoSecundarioNome: contatoSec.nome,
                    contatoSecundarioTelefone: contatoSec.telefone,
                    contatoSecundarioEmail: contatoSec.email,
                    tags: Array.isArray(cliente.tags) ? cliente.tags : [], 
                    dataAniversario: cliente.dataAniversario ? new Date(cliente.dataAniversario).toISOString().split('T')[0] : '', 
                    dataFundacaoEmpresa: cliente.dataFundacaoEmpresa ? new Date(cliente.dataFundacaoEmpresa).toISOString().split('T')[0] : '' 
                });
            } else {
                setFormData(initialState);
            }
            setActiveTab('geral');
            setErrors({});
        }
    }, [cliente, aberto]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.nome) newErrors.nome = 'Nome é obrigatório.';
        if (!formData.email) newErrors.email = 'Email é obrigatório.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error('Por favor, verifique os campos obrigatórios.');
            setActiveTab('geral');
            return;
        }

        const contacts = [];
        contacts.push({
            nome: formData.nome,
            email: formData.email,
            telefone: formData.telefone,
            cargo: formData.cargoContatoPrincipal,
            isPrincipal: true
        });

        if (formData.contatoSecundarioNome) {
            contacts.push({
                nome: formData.contatoSecundarioNome,
                email: formData.contatoSecundarioEmail,
                telefone: formData.contatoSecundarioTelefone,
                cargo: 'Secundário',
                isPrincipal: false
            });
        }

        const dadosParaEnviar = {
            ...formData,
            dataAniversario: formData.dataAniversario || null,
            dataFundacaoEmpresa: formData.dataFundacaoEmpresa || null,
            contacts: contacts 
        };

        aoSalvar(dadosParaEnviar, cliente);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const TabButton = ({ tabId, icon: Icon, children }) => (
        <button 
            type="button" 
            onClick={() => setActiveTab(tabId)}
            className={`flex items-center gap-2 px-4 py-4 text-sm font-bold border-b-2 transition-all duration-200 outline-none
                ${activeTab === tabId
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200'
                }
            `}
        ><Icon size={18}/> {children}</button>
    );

    return (
        <AnimatePresence>
            {aberto && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
                    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} transition={{ duration: 0.2 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
                        
                        <div className="p-6 md:p-8 flex justify-between items-center flex-shrink-0 bg-gray-50/50 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                {cliente ? <Pencil className="text-amber-500" /> : <UserPlus className="text-amber-500" />}
                                {cliente ? "Editar Ficha de Cliente" : "Cadastrar Novo Cliente"}
                            </h2>
                            <button onClick={aoFechar} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"><IconX size={24}/></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="flex-grow overflow-hidden flex flex-col">
                            <div className="border-b border-gray-200 flex-shrink-0 px-8 bg-white">
                                <nav className="flex space-x-2 overflow-x-auto custom-scrollbar">
                                    <TabButton tabId="geral" icon={FileText}>Identificação</TabButton>
                                    <TabButton tabId="contatos" icon={Users}>Contatos</TabButton>
                                    <TabButton tabId="endereco" icon={MapPin}>Endereço</TabButton>
                                    <TabButton tabId="organizacao" icon={Tag}>CRM & Tags</TabButton>
                                </nav>
                            </div>
                            
                            <motion.div key={activeTab} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="p-8 space-y-6 overflow-y-auto flex-grow bg-white custom-scrollbar">
                                
                                {activeTab === 'geral' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="md:col-span-2">
                                                <div className="flex bg-gray-100 p-1 rounded-xl w-fit mb-4 border border-gray-200">
                                                    <button type="button" onClick={() => setFormData(p=>({...p, tipo: 'Pessoa Física', cnpj: ''}))} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${formData.tipo === 'Pessoa Física' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>Pessoa Física</button>
                                                    <button type="button" onClick={() => setFormData(p=>({...p, tipo: 'Pessoa Jurídica', cpf: ''}))} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${formData.tipo === 'Pessoa Jurídica' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>Pessoa Jurídica</button>
                                                </div>
                                            </div>
                                            
                                            <div className="md:col-span-2">
                                                <label className={labelPremiumClass}>{formData.tipo === 'Pessoa Física' ? 'Nome Completo*' : 'Razão Social*'}</label>
                                                <input type="text" name="nome" value={formData.nome} onChange={handleChange} className={`${inputPremiumClass} ${errors.nome ? 'border-rose-400 bg-rose-50' : ''}`} placeholder={formData.tipo === 'Pessoa Física' ? 'Ex: João da Silva' : 'Ex: Silva Eventos LTDA'}/>
                                                {errors.nome && <p className="text-rose-500 text-xs font-bold mt-1">{errors.nome}</p>}
                                            </div>
                                            
                                            {formData.tipo === 'Pessoa Física' ? (
                                                <div><label className={labelPremiumClass}>CPF</label><input type="text" name="cpf" value={formData.cpf} onChange={handleChange} className={inputPremiumClass} placeholder="000.000.000-00"/></div>
                                            ) : (
                                                <div><label className={labelPremiumClass}>CNPJ</label><input type="text" name="cnpj" value={formData.cnpj} onChange={handleChange} className={inputPremiumClass} placeholder="00.000.000/0000-00"/></div>
                                            )}
                                            
                                            <div><label className={labelPremiumClass}>{formData.tipo === 'Pessoa Física' ? 'Data de Aniversário' : 'Data de Fundação'}</label><input type="date" name={formData.tipo === 'Pessoa Física' ? 'dataAniversario' : 'dataFundacaoEmpresa'} value={formData.tipo === 'Pessoa Física' ? formData.dataAniversario : formData.dataFundacaoEmpresa} onChange={handleChange} className={inputPremiumClass} /></div>

                                            {formData.tipo === 'Pessoa Jurídica' && (
                                                <>
                                                    <div><label className={labelPremiumClass}>Inscrição Estadual</label><input type="text" name="inscricaoEstadual" value={formData.inscricaoEstadual} onChange={handleChange} className={inputPremiumClass} /></div>
                                                    <div><label className={labelPremiumClass}>Ramo de Atividade</label><input type="text" name="ramoAtividade" value={formData.ramoAtividade} onChange={handleChange} className={inputPremiumClass} /></div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'contatos' && (
                                    <div className="space-y-8">
                                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                                            <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><Users size={18} className="text-amber-500"/> Contato Principal</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className={labelPremiumClass}>Email Principal*</label>
                                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={`${inputPremiumClass} ${errors.email ? 'border-rose-400 bg-rose-50' : ''}`} placeholder="email@exemplo.com"/>
                                                    {errors.email && <p className="text-rose-500 text-xs font-bold mt-1">{errors.email}</p>}
                                                </div>
                                                <div><label className={labelPremiumClass}>Telefone / WhatsApp</label><input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} className={inputPremiumClass} placeholder="(00) 00000-0000"/></div>
                                                {formData.tipo === 'Pessoa Jurídica' && <div className="md:col-span-2"><label className={labelPremiumClass}>Cargo na Empresa</label><input type="text" name="cargoContatoPrincipal" value={formData.cargoContatoPrincipal} onChange={handleChange} className={inputPremiumClass} placeholder="Ex: Diretor de Marketing" /></div>}
                                            </div>
                                        </div>

                                        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-4">
                                            <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-2"><Users size={18}/> Contato Secundário (Opcional)</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div><label className={labelPremiumClass}>Nome do Contato</label><input type="text" name="contatoSecundarioNome" value={formData.contatoSecundarioNome} onChange={handleChange} className={inputPremiumClass} /></div>
                                                <div><label className={labelPremiumClass}>Telefone</label><input type="tel" name="contatoSecundarioTelefone" value={formData.contatoSecundarioTelefone} onChange={handleChange} className={inputPremiumClass} /></div>
                                                <div className="md:col-span-2"><label className={labelPremiumClass}>Email</label><input type="email" name="contatoSecundarioEmail" value={formData.contatoSecundarioEmail} onChange={handleChange} className={inputPremiumClass} /></div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'endereco' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                            <div><label className={labelPremiumClass}>CEP</label><input type="text" name="cep" value={formData.cep} onChange={handleChange} className={inputPremiumClass} placeholder="00000-000"/></div>
                                            <div className="md:col-span-3"><label className={labelPremiumClass}>Endereço Completo</label><input type="text" name="endereco" value={formData.endereco} onChange={handleChange} className={inputPremiumClass} placeholder="Rua, Número, Complemento, Bairro"/></div>
                                            <div className="md:col-span-2"><label className={labelPremiumClass}>Cidade</label><input type="text" name="cidade" value={formData.cidade} onChange={handleChange} className={inputPremiumClass} /></div>
                                            <div className="md:col-span-2"><label className={labelPremiumClass}>Estado</label><input type="text" name="estado" value={formData.estado} onChange={handleChange} className={inputPremiumClass} placeholder="Sigla (Ex: SP)" /></div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'organizacao' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className={labelPremiumClass}>Status do Cliente (Funil)</label>
                                                <select name="status" value={formData.status} onChange={handleChange} className={inputPremiumClass}>
                                                    {statusClienteOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            <div><label className={labelPremiumClass}>Origem do Cliente</label><input type="text" name="origemCliente" value={formData.origemCliente} onChange={handleChange} className={inputPremiumClass} placeholder="Ex: Indicação, Instagram, Google..." /></div>
                                        </div>
                                        <div>
                                            <label className={labelPremiumClass}>Tags e Segmentação</label>
                                            <TagInput value={formData.tags} onChange={(tags) => setFormData(p=>({...p, tags}))} placeholder="Digite uma tag e pressione Enter (Ex: VIP, Casamento...)" />
                                        </div>
                                        <div>
                                            <label className={labelPremiumClass}>Anotações Gerais / Histórico</label>
                                            <textarea name="notas" value={formData.notas} onChange={handleChange} rows="5" className={`${inputPremiumClass} resize-none`} placeholder="Registre preferências, detalhes de reuniões ou informações importantes sobre este cliente."></textarea>
                                        </div>
                                    </div>
                                )}

                            </motion.div>
                            
                            <div className="p-6 md:p-8 flex justify-end gap-4 border-t border-gray-200 bg-gray-50/50 flex-shrink-0 rounded-b-[2rem]">
                                <button type="button" onClick={aoFechar} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
                                <button type="submit" className="px-8 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all">
                                    {cliente ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}