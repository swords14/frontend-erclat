import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
    Plus, Search, Pencil, Trash2, X as IconX, Star, ThumbsUp, List, LayoutGrid, 
    FileText, Users, MapPin, Briefcase as BriefcaseIcon, Phone, Mail, 
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, Sparkles, CreditCard, ListOrdered, CheckCircle
} from 'lucide-react';
import {
    getAllSuppliers, createSupplier, updateSupplier, deleteSupplier, getSupplierCategories
} from '@/services/api';

const ITEMS_PER_PAGE = 8;

const inputPremiumClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-gray-700 font-medium";
const labelPremiumClass = "block text-sm font-bold text-gray-700 mb-1.5 ml-1";

const RatingStars = ({ rating, setRating }) => (
    <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
            <Star
                key={i}
                size={setRating ? 24 : 16}
                strokeWidth={setRating ? 1.5 : 2}
                className={`transition-colors ${setRating ? 'cursor-pointer hover:scale-110' : ''} ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                onClick={() => setRating && setRating(i + 1)}
            />
        ))}
    </div>
);

const StatusBadge = ({ status }) => { 
    const statusConfig = { 
        'Ativo': 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        'Preferencial': 'bg-amber-50 text-amber-700 border-amber-200', 
        'Inativo': 'bg-gray-100 text-gray-600 border-gray-200', 
    }[status] || 'bg-gray-100 text-gray-600 border-gray-200'; 
    
    return <span className={`px-3 py-1 text-xs font-bold rounded-full border shadow-sm tracking-wide ${statusConfig}`}>{status}</span>; 
};

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

const useSuppliers = () => {
    const [fornecedores, setFornecedores] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [suppliersData, categoriesData] = await Promise.all([
                getAllSuppliers(),
                getSupplierCategories(),
            ]);
            setFornecedores(suppliersData);
            setCategorias(categoriesData);
        } catch (error) {
            toast.error(error.message);
            setFornecedores([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async (dados, fornecedorEditando) => {
        const isEditing = !!fornecedorEditando;
        try {
            if (isEditing) {
                await updateSupplier(fornecedorEditando.id, dados);
            } else {
                await createSupplier(dados);
            }
            toast.success(`Fornecedor ${isEditing ? 'atualizado' : 'adicionado'} com sucesso!`);
            fetchData();
            return true;
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Atenção: Tem certeza que deseja excluir este fornecedor permanentemente?")) {
            try {
                await deleteSupplier(id);
                toast.success('Fornecedor excluído da base.');
                fetchData();
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    return { fornecedores, categorias, isLoading, handleSave, handleDelete };
};

export default function Fornecedores() {
    const { fornecedores, categorias, isLoading, handleSave, handleDelete } = useSuppliers();
    const [modalAberto, setModalAberto] = useState(false);
    const [fornecedorEditando, setFornecedorEditando] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [filters, setFilters] = useState({ termoBusca: '', categoria: 'todas', status: 'todos' });
    const [sortOrder, setSortOrder] = useState('nome_asc');
    const [currentPage, setCurrentPage] = useState(1);

    const processedData = useMemo(() => {
        let filtered = [...fornecedores];
        
        if (filters.termoBusca) {
            const termo = filters.termoBusca.toLowerCase();
            filtered = filtered.filter(f =>
                (f.nome || '').toLowerCase().includes(termo) ||
                (f.contato || '').toLowerCase().includes(termo) ||
                (f.categoria || '').toLowerCase().includes(termo) ||
                (f.email || '').toLowerCase().includes(termo)
            );
        }
        if (filters.categoria !== 'todas') {
            filtered = filtered.filter(f => f.categoria === filters.categoria);
        }
        if (filters.status !== 'todos') {
            filtered = filtered.filter(f => f.status === filters.status);
        }

        filtered.sort((a, b) => {
            switch (sortOrder) {
                case 'nome_desc': return b.nome.localeCompare(a.nome);
                case 'rating_asc': return a.rating - b.rating;
                case 'rating_desc': return b.rating - a.rating;
                case 'nome_asc':
                default:
                    return a.nome.localeCompare(b.nome);
            }
        });

        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

        return { paginatedData: paginated, totalPages, totalCount: filtered.length };
    }, [fornecedores, filters, sortOrder, currentPage]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, sortOrder]);

    const abrirModalParaNovo = () => {
        setFornecedorEditando(null);
        setModalAberto(true);
    };

    const abrirModalParaEditar = (fornecedor) => {
        setFornecedorEditando(fornecedor);
        setModalAberto(true);
    };

    const handleSalvarFornecedor = async (dados) => {
        const success = await handleSave(dados, fornecedorEditando);
        if (success) {
            setModalAberto(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    }

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8 min-h-screen">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-light text-gray-800 tracking-wide flex items-center gap-3">
                        Gestão de <span className="font-bold text-amber-600">Fornecedores</span>
                        <BriefcaseIcon className="text-amber-400" size={24} />
                    </h1>
                    <p className="mt-1 text-gray-500 font-medium">Cadastre, avalie e gerencie seus parceiros estratégicos.</p>
                </div>
                <button onClick={abrirModalParaNovo} className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all duration-300">
                    <Plus size={20} /> Novo Fornecedor
                </button>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total de Parceiros" value={fornecedores.length} icon={Users} corIcone="text-blue-500" bgIcone="bg-blue-50" />
                <KPICard title="Parceiros Preferenciais" value={fornecedores.filter(f => f.status === 'Preferencial').length} icon={ThumbsUp} corIcone="text-amber-500" bgIcone="bg-amber-50" />
                <KPICard title="Fornecedores Ativos" value={fornecedores.filter(f => f.status === 'Ativo').length} icon={CheckCircle} corIcone="text-emerald-500" bgIcone="bg-emerald-50" />
                <KPICard title="Média de Avaliação" value={(fornecedores.reduce((acc, f) => acc + f.rating, 0) / (fornecedores.length || 1)).toFixed(1)} icon={Star} corIcone="text-orange-500" bgIcone="bg-orange-50" />
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-4 flex-wrap items-center">
                <div className="relative flex-grow w-full md:w-auto">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        name="termoBusca" 
                        placeholder="Buscar por nome, contato, email..." 
                        value={filters.termoBusca} 
                        onChange={handleFilterChange} 
                        className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-gray-700 font-medium"
                    />
                </div>
                
                <div className="flex gap-4 w-full md:w-auto">
                    <select name="categoria" value={filters.categoria} onChange={handleFilterChange} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-amber-500 outline-none font-medium text-gray-700 w-full md:w-auto">
                        <option value="todas">Todas as Categorias</option>
                        {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-amber-500 outline-none font-medium text-gray-700 w-full md:w-auto">
                        <option value="todos">Todos os Status</option>
                        <option value="Ativo">Ativo</option>
                        <option value="Preferencial">Preferencial</option>
                        <option value="Inativo">Inativo</option>
                    </select>
                    
                    <select name="sortOrder" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-amber-500 outline-none font-medium text-gray-700 w-full md:w-auto">
                        <option value="nome_asc">Nome (A-Z)</option>
                        <option value="nome_desc">Nome (Z-A)</option>
                        <option value="rating_desc">Melhor Avaliados</option>
                        <option value="rating_asc">Pior Avaliados</option>
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
                    <p className="text-gray-500 font-medium">Carregando carteira de fornecedores...</p>
                </div> 
            ) : processedData.totalCount === 0 ? (
                <EmptyState onAddClick={abrirModalParaNovo} />
            ) : (
                <div className="flex flex-col">
                    {viewMode === 'list' ? (
                        <ListView fornecedores={processedData.paginatedData} onEdit={abrirModalParaEditar} onDelete={handleDelete} />
                    ) : (
                        <GridView fornecedores={processedData.paginatedData} onEdit={abrirModalParaEditar} onDelete={handleDelete} />
                    )}
                    <Pagination currentPage={currentPage} totalPages={processedData.totalPages} onPageChange={setCurrentPage} />
                </div>
            )}

            <ModalFornecedor aberto={modalAberto} aoFechar={() => setModalAberto(false)} aoSalvar={handleSalvarFornecedor} fornecedor={fornecedorEditando} categoriasFornecedores={categorias} />
        </div>
    );
}

const ListView = ({ fornecedores, onEdit, onDelete }) => (
    <div className="bg-white rounded-[2rem] border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-200">
                    <tr>
                        <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500">Empresa / Categoria</th>
                        <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 hidden lg:table-cell">Contato Principal</th>
                        <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 hidden md:table-cell">Telefone</th>
                        <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500">Qualidade</th>
                        <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500">Status</th>
                        <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    <AnimatePresence>
                        {fornecedores.map(f => (
                            <motion.tr key={f.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="hover:bg-amber-50/30 transition-colors group">
                                <td className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-sm text-gray-600 border border-gray-200">
                                            {f.nome ? f.nome.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 leading-tight">{f.nome}</p>
                                            <p className="text-xs text-gray-500 font-medium">{f.categoria}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5 hidden lg:table-cell">
                                    <p className="font-bold text-gray-700 text-sm">{f.contato || '—'}</p>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5"><Mail size={12}/> <span className="truncate max-w-[150px]">{f.email || 'S/ Email'}</span></div>
                                </td>
                                <td className="p-5 hidden md:table-cell font-medium text-gray-600 text-sm">
                                    {f.telefone || '—'}
                                </td>
                                <td className="p-5"><RatingStars rating={f.rating} /></td>
                                <td className="p-5"><StatusBadge status={f.status} /></td>
                                <td className="p-5 text-center">
                                    <div className="flex justify-center items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onEdit(f)} className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Editar"><Pencil size={18} strokeWidth={2}/></button>
                                        <button onClick={() => onDelete(f.id)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Excluir"><Trash2 size={18} strokeWidth={2}/></button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </AnimatePresence>
                </tbody>
            </table>
        </div>
    </div>
);

const GridView = ({ fornecedores, onEdit, onDelete }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
            {fornecedores.map(f => (
                <motion.div key={f.id} layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ duration: 0.3 }} className="bg-white rounded-[2rem] border border-gray-200 shadow-sm flex flex-col overflow-hidden hover:border-amber-300 transition-colors group">
                    <div className="p-6 flex-grow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-bold text-lg text-gray-700 shadow-sm">
                                {f.nome ? f.nome.charAt(0).toUpperCase() : '?'}
                            </div>
                            <StatusBadge status={f.status} />
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 truncate" title={f.nome}>{f.nome}</h3>
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-5">{f.categoria}</p>
                        
                        <div className="space-y-2.5 mb-5">
                            <p className="flex items-center gap-3 text-sm text-gray-600 font-medium"><div className="w-6 flex justify-center"><Mail size={16} className="text-gray-400" /></div> <span className="truncate">{f.email || 'S/ Email'}</span></p>
                            <p className="flex items-center gap-3 text-sm text-gray-600 font-medium"><div className="w-6 flex justify-center"><Phone size={16} className="text-gray-400" /></div> {f.telefone || 'S/ Telefone'}</p>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase">Avaliação</span>
                            <RatingStars rating={f.rating} />
                        </div>
                    </div>
                    <div className="bg-gray-50/80 p-4 border-t border-gray-100 flex justify-end gap-3 transition-colors group-hover:bg-amber-50/30">
                        <button onClick={() => onEdit(f)} className="px-4 py-2 bg-white border border-gray-200 hover:border-amber-300 text-gray-700 hover:text-amber-600 rounded-xl font-bold text-sm shadow-sm transition-all">Editar</button>
                        <button onClick={() => onDelete(f.id)} className="px-4 py-2 bg-white border border-gray-200 hover:border-rose-300 text-gray-700 hover:text-rose-600 rounded-xl font-bold text-sm shadow-sm transition-all">Excluir</button>
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
    </div>
);

const EmptyState = ({ onAddClick }) => (
    <div className="text-center py-20 px-6 bg-white rounded-[2rem] shadow-sm border border-gray-200 flex flex-col items-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
            <BriefcaseIcon size={40} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Nenhum parceiro encontrado</h3>
        <p className="mt-2 text-gray-500 font-medium max-w-sm">Sua lista de fornecedores atende não atende a esses filtros ou ainda está vazia.</p>
        <button onClick={onAddClick} className="mt-8 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all">
            <Plus size={20} /> Cadastrar Fornecedor
        </button>
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
                        <button type="button" onClick={() => removeTag(tag)} className="text-gray-500 hover:text-rose-600">
                            <IconX size={14} />
                        </button>
                    </span>
                ))}
            </div>
            <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-none outline-none px-2 py-1 text-sm font-medium text-gray-700 placeholder-gray-400"
                placeholder={placeholder}
            />
        </div>
    );
};

function ModalFornecedor({ aberto, aoFechar, aoSalvar, fornecedor, categoriasFornecedores }) {
    const initialState = {
        nome: '', categoria: '', contato: '', cargoContato: '', telefone: '', telefoneAlternativo: '',
        email: '', emailAlternativo: '', cnpj: '', inscricaoEstadual: '',
        endereco: '', cidade: '', estado: '', cep: '',
        termosPagamento: '', banco: '', agencia: '', conta: '', chavePix: '',
        servicosOferecidos: [],
        dataUltimoContato: '',
        rating: 0, status: 'Ativo', notas: ''
    };
    const [formData, setFormData] = useState(initialState);
    const [activeTab, setActiveTab] = useState('geral');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (aberto) {
            if (fornecedor) {
                setFormData({
                    ...initialState,
                    ...fornecedor,
                    dataUltimoContato: fornecedor.dataUltimoContato ? new Date(fornecedor.dataUltimoContato).toISOString().split('T')[0] : '',
                    servicosOferecidos: Array.isArray(fornecedor.servicosOferecidos) ? fornecedor.servicosOferecidos : [],
                });
            } else {
                setFormData(initialState);
            }
            setActiveTab('geral');
            setErrors({});
        }
    }, [fornecedor, aberto]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.nome) newErrors.nome = 'Nome da empresa é obrigatório.';
        if (!formData.categoria) newErrors.categoria = 'Categoria é obrigatória.';
        if (!formData.email) newErrors.email = 'Email principal é obrigatório.';
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email principal inválido.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error('Preencha os campos obrigatórios na aba Identificação.');
            setActiveTab('geral');
            return;
        }
        const dadosParaSalvar = {
            ...formData,
            rating: Number(formData.rating),
            dataUltimoContato: formData.dataUltimoContato ? new Date(formData.dataUltimoContato) : null,
        };
        aoSalvar(dadosParaSalvar);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };
    
    const handleTagChange = (newTags) => {
        setFormData(prev => ({ ...prev, servicosOferecidos: newTags }));
    };

    const setRating = (newRating) => {
        setFormData(prev => ({ ...prev, rating: newRating }));
    };

    const TabButton = ({ tabId, icon: Icon, children, hasError }) => (
        <button
            type="button"
            onClick={() => setActiveTab(tabId)}
            className={`flex items-center gap-2 px-4 py-4 text-sm font-bold border-b-2 transition-all duration-200 outline-none whitespace-nowrap
                ${activeTab === tabId
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200'
                }
                ${hasError && activeTab !== tabId ? 'text-rose-500 border-rose-200' : ''}
            `}
        >
            <Icon size={18} /> {children}
        </button>
    );

    return (
        <AnimatePresence>
            {aberto && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
                    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} transition={{ duration: 0.2 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
                        
                        <div className="p-6 md:p-8 flex justify-between items-center border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                {fornecedor ? <Pencil className="text-amber-500" /> : <BriefcaseIcon className="text-amber-500" />}
                                {fornecedor ? "Editar Fornecedor" : "Cadastrar Fornecedor"}
                            </h2>
                            <button onClick={aoFechar} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"><IconX size={24}/></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="flex-grow overflow-hidden flex flex-col">
                            <div className="border-b border-gray-200 flex-shrink-0 bg-white">
                                <nav className="flex space-x-2 overflow-x-auto px-8 custom-scrollbar">
                                    <TabButton tabId="geral" icon={FileText} hasError={errors.nome || errors.categoria || errors.email}>Identificação</TabButton>
                                    <TabButton tabId="endereco" icon={MapPin}>Fiscal e Endereço</TabButton>
                                    <TabButton tabId="financeiro" icon={CreditCard}>Serviços e Banco</TabButton>
                                    <TabButton tabId="outros" icon={ListOrdered}>Gestão e Notas</TabButton>
                                </nav>
                            </div>
                            
                            <div className="p-8 space-y-6 overflow-y-auto flex-grow bg-white custom-scrollbar">
                                {activeTab === 'geral' && (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className={labelPremiumClass}>Nome da Empresa / Profissional*</label>
                                                <input type="text" name="nome" value={formData.nome} onChange={handleChange} className={`${inputPremiumClass} ${errors.nome ? 'border-rose-400 bg-rose-50' : ''}`} placeholder="Ex: Silva Decorações" />
                                                {errors.nome && <p className="text-rose-500 text-xs font-bold mt-1">{errors.nome}</p>}
                                            </div>
                                            <div>
                                                <label className={labelPremiumClass}>Categoria*</label>
                                                <select name="categoria" value={formData.categoria} onChange={handleChange} className={`${inputPremiumClass} ${errors.categoria ? 'border-rose-400 bg-rose-50' : ''}`}>
                                                    <option value="">Selecione uma categoria...</option>
                                                    {categoriasFornecedores.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                {errors.categoria && <p className="text-rose-500 text-xs font-bold mt-1">{errors.categoria}</p>}
                                            </div>
                                        </div>
                                        
                                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                                            <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><Users size={18} className="text-amber-500"/> Contatos Principais</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div><label className={labelPremiumClass}>Pessoa de Contato</label><input type="text" name="contato" value={formData.contato} onChange={handleChange} className={inputPremiumClass} placeholder="Nome do representante" /></div>
                                                <div><label className={labelPremiumClass}>Cargo do Contato</label><input type="text" name="cargoContato" value={formData.cargoContato} onChange={handleChange} className={inputPremiumClass} /></div>
                                                <div><label className={labelPremiumClass}>Telefone / WhatsApp</label><input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} className={inputPremiumClass} placeholder="(00) 00000-0000" /></div>
                                                <div><label className={labelPremiumClass}>Telefone Alternativo</label><input type="tel" name="telefoneAlternativo" value={formData.telefoneAlternativo} onChange={handleChange} className={inputPremiumClass} /></div>
                                                <div>
                                                    <label className={labelPremiumClass}>Email Principal*</label>
                                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={`${inputPremiumClass} ${errors.email ? 'border-rose-400 bg-rose-50' : ''}`} placeholder="email@fornecedor.com" />
                                                    {errors.email && <p className="text-rose-500 text-xs font-bold mt-1">{errors.email}</p>}
                                                </div>
                                                <div><label className={labelPremiumClass}>Email Secundário</label><input type="email" name="emailAlternativo" value={formData.emailAlternativo} onChange={handleChange} className={inputPremiumClass} /></div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                
                                {activeTab === 'endereco' && (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div><label className={labelPremiumClass}>CNPJ / CPF</label><input type="text" name="cnpj" value={formData.cnpj} onChange={handleChange} className={inputPremiumClass} placeholder="00.000.000/0000-00" /></div>
                                            <div><label className={labelPremiumClass}>Inscrição Estadual (IE)</label><input type="text" name="inscricaoEstadual" value={formData.inscricaoEstadual} onChange={handleChange} className={inputPremiumClass} /></div>
                                        </div>
                                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                                            <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><MapPin size={18} className="text-amber-500"/> Localização</h4>
                                            <div><label className={labelPremiumClass}>Endereço Completo</label><input type="text" name="endereco" value={formData.endereco} onChange={handleChange} className={inputPremiumClass} placeholder="Rua, Número, Complemento, Bairro" /></div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div><label className={labelPremiumClass}>Cidade</label><input type="text" name="cidade" value={formData.cidade} onChange={handleChange} className={inputPremiumClass} /></div>
                                                <div><label className={labelPremiumClass}>Estado</label><input type="text" name="estado" value={formData.estado} onChange={handleChange} className={inputPremiumClass} placeholder="Sigla (SP)" /></div>
                                                <div><label className={labelPremiumClass}>CEP</label><input type="text" name="cep" value={formData.cep} onChange={handleChange} className={inputPremiumClass} placeholder="00000-000" /></div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'financeiro' && (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                        <div>
                                            <label className={labelPremiumClass}>Portfólio / Serviços Específicos Oferecidos</label>
                                            <TagInput value={formData.servicosOferecidos} onChange={handleTagChange} placeholder="Digite uma tag (ex: Iluminação, Bolos) e tecle Enter..." />
                                        </div>
                                        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-4">
                                            <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-2"><CreditCard size={18}/> Dados Bancários e Faturamento</h4>
                                            <div><label className={labelPremiumClass}>Termos Comuns de Pagamento</label><input type="text" name="termosPagamento" value={formData.termosPagamento} onChange={handleChange} className={inputPremiumClass} placeholder="Ex: 30% sinal PIX, 70% boleto 15 dias antes." /></div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div><label className={labelPremiumClass}>Chave PIX principal</label><input type="text" name="chavePix" value={formData.chavePix} onChange={handleChange} className={inputPremiumClass} /></div>
                                                <div><label className={labelPremiumClass}>Banco</label><input type="text" name="banco" value={formData.banco} onChange={handleChange} className={inputPremiumClass} /></div>
                                                <div><label className={labelPremiumClass}>Agência</label><input type="text" name="agencia" value={formData.agencia} onChange={handleChange} className={inputPremiumClass} /></div>
                                                <div><label className={labelPremiumClass}>Conta (com dígito)</label><input type="text" name="conta" value={formData.conta} onChange={handleChange} className={inputPremiumClass} /></div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'outros' && (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                                                <div>
                                                    <label className={labelPremiumClass}>Nível de Confiança / Avaliação</label>
                                                    <div className="mt-2 bg-white px-4 py-3 rounded-xl border border-gray-200 inline-block shadow-sm">
                                                        <RatingStars rating={formData.rating} setRating={setRating} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className={labelPremiumClass}>Status do Parceiro</label>
                                                    <select name="status" value={formData.status} onChange={handleChange} className={inputPremiumClass}>
                                                        <option value="Ativo">Ativo na base</option>
                                                        <option value="Preferencial">Preferencial (VIP)</option>
                                                        <option value="Inativo">Inativo / Bloqueado</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <div><label className={labelPremiumClass}>Data da Última Reunião/Contato</label><input type="date" name="dataUltimoContato" value={formData.dataUltimoContato} onChange={handleChange} className={inputPremiumClass}/></div>
                                                <div><label className={labelPremiumClass}>Anotações Gerais Internas</label><textarea name="notas" value={formData.notas} onChange={handleChange} rows="4" className={`${inputPremiumClass} resize-none`} placeholder="Histórico de entregas, problemas passados ou acordos verbais..."></textarea></div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                            
                            <div className="p-6 md:p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-4 flex-shrink-0 rounded-b-[2rem]">
                                <button type="button" onClick={aoFechar} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
                                <button type="submit" className="px-8 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all">
                                    {fornecedor ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}