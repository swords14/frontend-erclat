// Caminho do arquivo: frontend/src/pages/Clientes.jsx
// VERSÃO ATUALIZADA: Adicionado o campo CPF para Pessoa Física no modal.

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
    Plus, Search, Pencil, Trash2, X as IconX, Users, UserPlus, Building, Briefcase, List, LayoutGrid, 
    FileText, Phone, Mail, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight 
} from 'lucide-react';
import { getAllClients, createClient, updateClient, deleteClient } from '../services/api';

// --- CONSTANTES E COMPONENTES AUXILIARES ---
const statusClienteOptions = ['Lead', 'Contato Inicial', 'Proposta Enviada', 'Em Negociação', 'Cliente Ativo', 'Inativo', 'Perdido'];
const ITEMS_PER_PAGE = 8;

const KPICard = ({ title, value, icon: Icon }) => ( <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex items-center gap-4"><div className="p-3 bg-indigo-100 dark:bg-gray-700 rounded-lg"><Icon className="text-indigo-500 dark:text-indigo-400" size={24}/></div><div><p className="text-sm text-gray-500 dark:text-gray-400">{title}</p><p className="text-xl font-bold">{value}</p></div></div> );
const TagBadge = ({ children }) => ( <span className="text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2.5 py-1 rounded-full">{children}</span> );
const Pagination = ({ currentPage, totalPages, onPageChange }) => { if (totalPages <= 1) return null; return ( <div className="flex items-center justify-center gap-2 mt-4"><button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="p-2 pagination-btn"><ChevronsLeft size={16}/></button><button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 pagination-btn"><ChevronLeft size={16}/></button><span className="text-sm text-gray-600 dark:text-gray-300">Página {currentPage} de {totalPages}</span><button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 pagination-btn"><ChevronRight size={16}/></button><button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="p-2 pagination-btn"><ChevronsRight size={16}/></button></div> ); };

// --- HOOK PERSONALIZADO PARA GERENCIAR CLIENTES ---
const useClientes = () => {
    const [clientes, setClientes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getAllClients();
            setClientes(data);
        } catch (error) {
            toast.error(error.message);
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
            toast.error(error.message);
            return false;
        }
    };

    const deleteCliente = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
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


// --- COMPONENTE PRINCIPAL ---
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
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Gestão de Clientes</h1>
                    <p className="mt-1 text-gray-500">Construa e gerencie o relacionamento com seus clientes.</p>
                </div>
                <motion.button onClick={abrirModalParaNovo} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary flex items-center gap-2">
                    <UserPlus size={20} /> Novo Cliente
                </motion.button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Total de Clientes" value={kpiData.total} icon={Users} />
                <KPICard title="Clientes Ativos" value={kpiData.ativos} icon={Briefcase} />
                <KPICard title="Novos Leads" value={kpiData.leads} icon={UserPlus} />
                <KPICard title="Pessoas Jurídicas" value={kpiData.pj} icon={Building} />
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md flex flex-col md:flex-row gap-4 flex-wrap">
                <div className="relative flex-grow">
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" name="termoBusca" placeholder="Buscar por nome, email, CPF/CNPJ..." value={filters.termoBusca} onChange={e => setFilters(p => ({...p, termoBusca: e.target.value}))} className="w-full pl-10 pr-4 py-2 input-form"/>
                </div>
                <select name="status" value={filters.status} onChange={e => setFilters(p => ({...p, status: e.target.value}))} className="input-form md:w-auto">
                    <option value="todos">Todos os Status</option>
                    {statusClienteOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select name="sortOrder" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="input-form md:w-auto">
                    <option value="nome_asc">Nome (A-Z)</option>
                    <option value="nome_desc">Nome (Z-A)</option>
                </select>
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-white dark:bg-gray-900 shadow-sm' : ''}`}><List size={20} /></button>
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition ${viewMode === 'grid' ? 'bg-white dark:bg-gray-900 shadow-sm' : ''}`}><LayoutGrid size={20} /></button>
                </div>
            </div>

            {isLoading ? <div className="text-center p-10">A carregar clientes...</div> : 
             processedData.totalCount === 0 ? <div className="text-center p-16 bg-white dark:bg-gray-800 rounded-2xl"><FileText size={48} className="mx-auto text-gray-400" /><h3 className="mt-4 text-xl font-semibold">Nenhum cliente encontrado</h3><p className="text-gray-500 mt-1">Tente ajustar seus filtros ou adicione um novo cliente.</p><button onClick={abrirModalParaNovo} className="btn-primary mt-6 flex items-center gap-2 mx-auto"><Plus size={20} /> Adicionar Cliente</button></div> :
             (
                <>
                    {viewMode === 'list' ? (
                        <ListView clientes={processedData.paginatedData} onEdit={abrirModalParaEditar} onDelete={deleteCliente} />
                    ) : (
                        <GridView clientes={processedData.paginatedData} onEdit={abrirModalParaEditar} onDelete={deleteCliente} />
                    )}
                    <Pagination currentPage={currentPage} totalPages={processedData.totalPages} onPageChange={setCurrentPage} />
                </>
             )
            }

            <ModalCliente aberto={modalAberto} aoFechar={() => setModalAberto(false)} aoSalvar={handleSalvarCliente} cliente={clienteEditando} />
        </div>
    );
}

// --- COMPONENTES DE VISUALIZAÇÃO (LISTA / GRID) ---
const ListView = ({ clientes, onEdit, onDelete }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-x-auto">
        <table className="w-full text-left">
            <thead className="table-header">
                <tr>
                    <th className="p-4">Nome / Tipo</th>
                    <th className="p-4 hidden lg:table-cell">Contato</th>
                    <th className="p-4 hidden md:table-cell">Status</th>
                    <th className="p-4 hidden lg:table-cell">Tags</th>
                    <th className="p-4 text-center">Ações</th>
                </tr>
            </thead>
            <tbody>
                {clientes.map(c => (
                    <tr key={c.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <td className="p-4 font-medium">{c.nome}<br/><span className="text-sm text-gray-500">{c.tipo}</span></td>
                        <td className="p-4 hidden lg:table-cell">{c.email}<br/><span className="text-sm text-gray-400">{c.telefone}</span></td>
                        <td className="p-4 hidden md:table-cell"><TagBadge>{c.status || 'Lead'}</TagBadge></td>
                        <td className="p-4 hidden lg:table-cell"><div className="flex flex-wrap gap-1">{(c.tags || []).slice(0, 3).map(tag => <TagBadge key={tag}>{tag}</TagBadge>)}</div></td>
                        <td className="p-4 flex justify-center gap-2">
                            <button onClick={() => onEdit(c)} className="p-2 text-blue-500 hover:text-blue-700" aria-label="Editar"><Pencil size={18} /></button>
                            <button onClick={() => onDelete(c.id)} className="p-2 text-red-500 hover:text-red-700" aria-label="Excluir"><Trash2 size={18} /></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const GridView = ({ clientes, onEdit, onDelete }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {clientes.map(c => (
            <motion.div key={c.id} layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md flex flex-col">
                <div className="p-6 flex-grow">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold pr-2">{c.nome}</h3>
                        <TagBadge>{c.status || 'Lead'}</TagBadge>
                    </div>
                    <p className="text-sm text-indigo-500 mb-4">{c.tipo}</p>
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2 mb-4">
                        <p className="flex items-center gap-2"><Mail size={14} /> {c.email || 'Não informado'}</p>
                        <p className="flex items-center gap-2"><Phone size={14} /> {c.telefone || 'Não informado'}</p>
                    </div>
                     <div className="flex flex-wrap gap-1">{(c.tags || []).slice(0, 3).map(tag => <TagBadge key={tag}>{tag}</TagBadge>)}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 flex justify-end gap-2 rounded-b-2xl">
                    <button onClick={() => onEdit(c)} className="btn-secondary text-sm">Editar</button>
                    <button onClick={() => onDelete(c.id)} className="btn-danger-secondary text-sm">Excluir</button>
                </div>
            </motion.div>
        ))}
    </div>
);

// --- MODAL DE CLIENTE COM O DESIGN CORRETO ---
const TagInput = ({ value, onChange, placeholder }) => { const [inputValue, setInputValue] = useState(''); const handleKeyDown = (e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); const newTag = inputValue.trim(); if (newTag && !value.includes(newTag)) { onChange([...value, newTag]); } setInputValue(''); } }; const removeTag = (tagToRemove) => { onChange(value.filter(tag => tag !== tagToRemove)); }; return ( <div><div className="flex flex-wrap gap-2 mb-2 min-h-[24px]">{value.map(tag => ( <span key={tag} className="flex items-center gap-1 bg-indigo-100 text-indigo-800 text-sm font-medium px-2.5 py-0.5 rounded-full dark:bg-indigo-900 dark:text-indigo-300"> {tag} <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-indigo-500 hover:text-indigo-700"><IconX size={14} /></button></span> ))}</div><input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyDown} className="input-form w-full" placeholder={placeholder} /></div> ); };

function ModalCliente({ aberto, aoFechar, aoSalvar, cliente }) {
    const initialState = { nome: '', email: '', cpf: '', telefone: '', tipo: 'Pessoa Física', cnpj: '', inscricaoEstadual: '', ramoAtividade: '', endereco: '', cidade: '', estado: '', cep: '', cargoContatoPrincipal: '', contatoSecundarioNome: '', contatoSecundarioTelefone: '', contatoSecundarioEmail: '', preferenciasEvento: '', origemCliente: '', dataAniversario: '', dataFundacaoEmpresa: '', status: 'Lead', tags: [], notas: '' };
    const [formData, setFormData] = useState(initialState);
    const [activeTab, setActiveTab] = useState('geral');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (aberto) {
            if (cliente) {
                setFormData({ ...initialState, ...cliente, tags: Array.isArray(cliente.tags) ? cliente.tags : [], dataAniversario: cliente.dataAniversario ? new Date(cliente.dataAniversario).toISOString().split('T')[0] : '', dataFundacaoEmpresa: cliente.dataFundacaoEmpresa ? new Date(cliente.dataFundacaoEmpresa).toISOString().split('T')[0] : '' });
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
            toast.error('Por favor, corrija os erros no formulário.');
            setActiveTab('geral');
            return;
        }
        aoSalvar({ ...formData, dataAniversario: formData.dataAniversario || null, dataFundacaoEmpresa: formData.dataFundacaoEmpresa || null }, cliente);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const TabButton = ({ tabId, children }) => (
        <button type="button" onClick={() => setActiveTab(tabId)}
            className={`px-1 py-4 text-sm font-medium border-b-2 transition-all duration-200 focus:outline-none
                ${activeTab === tabId
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'
                }
            `}
        >{children}</button>
    );

    return (
        <AnimatePresence>
            {aberto && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col">
                        <div className="p-6 flex justify-between items-center flex-shrink-0"><h2 className="text-2xl font-bold">{cliente ? "Editar Cliente" : "Novo Cliente"}</h2><button onClick={aoFechar} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><IconX size={22}/></button></div>
                        <form onSubmit={handleSubmit} className="flex-grow overflow-hidden flex flex-col">
                            <div className="border-b dark:border-gray-700 flex-shrink-0 px-8"><nav className="flex space-x-8"><TabButton tabId="geral">Geral</TabButton><TabButton tabId="contatos">Contatos</TabButton><TabButton tabId="endereco">Endereço</TabButton><TabButton tabId="organizacao">Organização</TabButton></nav></div>
                            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="p-8 space-y-6 overflow-y-auto flex-grow max-h-[60vh]">
                                {activeTab === 'geral' && (
                                    <div className="space-y-6"><h3 className="text-xl font-semibold text-gray-800 dark:text-white">Informações Gerais</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"><div><label className="label-form">Tipo de Cliente</label><select name="tipo" value={formData.tipo} onChange={handleChange} className="input-form w-full"><option>Pessoa Física</option><option>Pessoa Jurídica</option></select></div><div></div><div><label className="label-form">{formData.tipo === 'Pessoa Física' ? 'Nome Completo*' : 'Razão Social*'}</label><input type="text" name="nome" value={formData.nome} onChange={handleChange} className={`input-form w-full ${errors.nome ? 'input-error' : ''}`} /></div>
                                    {/* --- CAMPO CONDICIONAL CPF/CNPJ --- */}
                                    {formData.tipo === 'Pessoa Física' ? (
                                        <div><label className="label-form">CPF</label><input type="text" name="cpf" value={formData.cpf} onChange={handleChange} className="input-form w-full" /></div>
                                    ) : (
                                        <div><label className="label-form">CNPJ</label><input type="text" name="cnpj" value={formData.cnpj} onChange={handleChange} className="input-form w-full" /></div>
                                    )}
                                    </div>
                                    {formData.tipo === 'Pessoa Jurídica' && <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"><div><label className="label-form">Inscrição Estadual</label><input type="text" name="inscricaoEstadual" value={formData.inscricaoEstadual} onChange={handleChange} className="input-form w-full" /></div><div><label className="label-form">Ramo de Atividade</label><input type="text" name="ramoAtividade" value={formData.ramoAtividade} onChange={handleChange} className="input-form w-full" /></div></div>}
                                    <div><label className="label-form">{formData.tipo === 'Pessoa Física' ? 'Data de Aniversário' : 'Data de Fundação'}</label><input type="date" name={formData.tipo === 'Pessoa Física' ? 'dataAniversario' : 'dataFundacaoEmpresa'} value={formData.tipo === 'Pessoa Física' ? formData.dataAniversario : formData.dataFundacaoEmpresa} onChange={handleChange} className="input-form w-full" /></div>
                                    </div>
                                )}
                                {activeTab === 'contatos' && (
                                    <div className="space-y-6"><h3 className="text-xl font-semibold text-gray-800 dark:text-white">Informações de Contato</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"><div><label className="label-form">Email Principal*</label><input type="email" name="email" value={formData.email} onChange={handleChange} className={`input-form w-full ${errors.email ? 'input-error' : ''}`} /></div><div><label className="label-form">Telefone Principal</label><input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} className="input-form w-full" /></div><div className="md:col-span-2"><label className="label-form">Cargo do Contato Principal</label><input type="text" name="cargoContatoPrincipal" value={formData.cargoContatoPrincipal} onChange={handleChange} className="input-form w-full" /></div></div><div className="border-t dark:border-gray-700 mt-6 pt-6"><h3 className="text-lg font-semibold mb-4">Contato Secundário (Opcional)</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"><div><label className="label-form">Nome</label><input type="text" name="contatoSecundarioNome" value={formData.contatoSecundarioNome} onChange={handleChange} className="input-form w-full" /></div><div><label className="label-form">Telefone</label><input type="tel" name="contatoSecundarioTelefone" value={formData.contatoSecundarioTelefone} onChange={handleChange} className="input-form w-full" /></div><div className="md:col-span-2"><label className="label-form">Email</label><input type="email" name="contatoSecundarioEmail" value={formData.contatoSecundarioEmail} onChange={handleChange} className="input-form w-full" /></div></div></div></div>
                                )}
                                {activeTab === 'endereco' && (
                                    <div className="space-y-6"><h3 className="text-xl font-semibold text-gray-800 dark:text-white">Endereço</h3><div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4"><div><label className="label-form">CEP</label><input type="text" name="cep" value={formData.cep} onChange={handleChange} className="input-form w-full" /></div><div className="md:col-span-3"><label className="label-form">Endereço Completo</label><input type="text" name="endereco" value={formData.endereco} onChange={handleChange} className="input-form w-full" /></div><div className="md:col-span-2"><label className="label-form">Cidade</label><input type="text" name="cidade" value={formData.cidade} onChange={handleChange} className="input-form w-full" /></div><div className="md:col-span-2"><label className="label-form">Estado</label><input type="text" name="estado" value={formData.estado} onChange={handleChange} className="input-form w-full" /></div></div></div>
                                )}
                                {activeTab === 'organizacao' && (
                                    <div className="space-y-6"><h3 className="text-xl font-semibold text-gray-800 dark:text-white">Organização e CRM</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"><div><label className="label-form">Status do Cliente (Funil)</label><select name="status" value={formData.status} onChange={handleChange} className="input-form w-full">{statusClienteOptions.map(s => <option key={s} value={s}>{s}</option>)}</select></div><div><label className="label-form">Origem do Cliente</label><input type="text" name="origemCliente" value={formData.origemCliente} onChange={handleChange} className="input-form w-full" placeholder="Ex: Indicação, Redes Sociais..." /></div></div><div><label className="label-form">Tags</label><TagInput value={formData.tags} onChange={(tags) => setFormData(p=>({...p, tags}))} placeholder="Adicione tags e tecle Enter..." /></div><div><label className="label-form">Preferências e Anotações</label><textarea name="notas" value={formData.notas} onChange={handleChange} rows="4" className="input-form w-full" placeholder="Detalhes importantes, preferências de evento, etc."></textarea></div></div>
                                )}
                            </motion.div>
                            <div className="p-6 flex justify-end gap-4 border-t dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl"><button type="button" onClick={aoFechar} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Salvar Cliente</button></div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}