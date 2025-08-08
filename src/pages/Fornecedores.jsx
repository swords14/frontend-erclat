// Caminho do arquivo: frontend/src/pages/Fornecedores.jsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
    Plus, Search, Pencil, Trash2, X as IconX, Star, ThumbsUp, ThumbsDown, List, LayoutGrid, 
    FileText, Users, MapPin, Briefcase as BriefcaseIcon, Phone, Mail, Banknote, 
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2
} from 'lucide-react';
import {
    getAllSuppliers, createSupplier, updateSupplier, deleteSupplier, getSupplierCategories
} from '../services/api';

// --- CONSTANTES E COMPONENTES AUXILIARES ---
const ITEMS_PER_PAGE = 8;

const RatingStars = ({ rating, setRating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <Star
                key={i}
                size={setRating ? 24 : 16}
                className={`cursor-pointer ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
                onClick={() => setRating && setRating(i + 1)}
            />
        ))}
    </div>
);
const StatusBadge = ({ status }) => { 
    const statusStyle = { 
        'Ativo': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', 
        'Preferencial': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', 
        'Inativo': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', 
    }[status]; 
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyle}`}>{status}</span>; 
};
const KPICard = ({ title, value, icon: Icon }) => ( <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex items-center gap-4"><div className="p-3 bg-indigo-100 dark:bg-gray-700 rounded-lg"><Icon className="text-indigo-500 dark:text-indigo-400" size={24}/></div><div><p className="text-sm text-gray-500 dark:text-gray-400">{title}</p><p className="text-xl font-bold">{value}</p></div></div> );
const Pagination = ({ currentPage, totalPages, onPageChange }) => { if (totalPages <= 1) return null; return ( <div className="flex items-center justify-center gap-2 mt-4"><button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="p-2 pagination-btn"><ChevronsLeft size={16}/></button><button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 pagination-btn"><ChevronLeft size={16}/></button><span className="text-sm text-gray-600 dark:text-gray-300">Página {currentPage} de {totalPages}</span><button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 pagination-btn"><ChevronRight size={16}/></button><button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="p-2 pagination-btn"><ChevronsRight size={16}/></button></div> ); };

// --- HOOK PERSONALIZADO PARA GERENCIAR FORNECEDORES ---
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
        if (window.confirm("Tem certeza que deseja excluir este fornecedor?")) {
            try {
                await deleteSupplier(id);
                toast.success('Fornecedor excluído com sucesso!');
                fetchData();
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    return { fornecedores, categorias, isLoading, handleSave, handleDelete };
};


// --- COMPONENTE PRINCIPAL ---
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
        
        // 1. Filtragem
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

        // 2. Ordenação
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

        // 3. Paginação
        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

        return { paginatedData: paginated, totalPages, totalCount: filtered.length };
    }, [fornecedores, filters, sortOrder, currentPage]);
    
    // Resetar para a página 1 quando filtros mudam
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
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div><h1 className="text-3xl font-bold">Gestão de Fornecedores</h1><p className="mt-1 text-gray-500">Avalie e gerencie seus parceiros estratégicos.</p></div>
                <motion.button onClick={abrirModalParaNovo} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary flex items-center gap-2"><Plus size={20} /> Novo Fornecedor</motion.button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Total de Fornecedores" value={fornecedores.length} icon={Users} />
                <KPICard title="Parceiros Preferenciais" value={fornecedores.filter(f => f.status === 'Preferencial').length} icon={ThumbsUp} />
                <KPICard title="Fornecedores Ativos" value={fornecedores.filter(f => f.status === 'Ativo').length} icon={BriefcaseIcon} />
                <KPICard title="Média de Avaliação" value={(fornecedores.reduce((acc, f) => acc + f.rating, 0) / (fornecedores.length || 1)).toFixed(1)} icon={Star} />
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md flex flex-col md:flex-row gap-4 flex-wrap">
                <div className="relative flex-grow"><Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" name="termoBusca" placeholder="Buscar por nome, contato..." value={filters.termoBusca} onChange={handleFilterChange} className="w-full pl-10 pr-4 py-2 input-form"/></div>
                <select name="categoria" value={filters.categoria} onChange={handleFilterChange} className="input-form md:w-auto"><option value="todas">Todas as Categorias</option>{categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
                <select name="status" value={filters.status} onChange={handleFilterChange} className="input-form md:w-auto"><option value="todos">Todos os Status</option><option value="Ativo">Ativo</option><option value="Preferencial">Preferencial</option><option value="Inativo">Inativo</option></select>
                <select name="sortOrder" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="input-form md:w-auto"><option value="nome_asc">Nome (A-Z)</option><option value="nome_desc">Nome (Z-A)</option><option value="rating_desc">Melhor Avaliados</option><option value="rating_asc">Pior Avaliados</option></select>
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-white dark:bg-gray-900 shadow-sm' : ''}`}><List size={20} /></button>
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition ${viewMode === 'grid' ? 'bg-white dark:bg-gray-900 shadow-sm' : ''}`}><LayoutGrid size={20} /></button>
                </div>
            </div>

            {isLoading ? <div className="text-center p-10"><Loader2 className="animate-spin inline-block mr-2" /> A carregar fornecedores...</div> : 
             processedData.totalCount === 0 ? <EmptyState onAddClick={abrirModalParaNovo} /> :
             (
                <>
                    {viewMode === 'list' ? (
                        <ListView fornecedores={processedData.paginatedData} onEdit={abrirModalParaEditar} onDelete={handleDelete} />
                    ) : (
                        <GridView fornecedores={processedData.paginatedData} onEdit={abrirModalParaEditar} onDelete={handleDelete} />
                    )}
                    <Pagination currentPage={currentPage} totalPages={processedData.totalPages} onPageChange={setCurrentPage} />
                </>
             )
            }

            <ModalFornecedor aberto={modalAberto} aoFechar={() => setModalAberto(false)} aoSalvar={handleSalvarFornecedor} fornecedor={fornecedorEditando} categoriasFornecedores={categorias} />
        </div>
    );
}


// --- COMPONENTES DE VISUALIZAÇÃO E UI (LIST/GRID/PAGINATION/ETC) ---

const ListView = ({ fornecedores, onEdit, onDelete }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-x-auto">
        <table className="w-full text-left">
            <thead className="table-header"><tr><th className="p-4">Nome / Categoria</th><th className="p-4 hidden lg:table-cell">Contato Principal</th><th className="p-4 hidden md:table-cell">Telefone</th><th className="p-4">Avaliação</th><th className="p-4">Status</th><th className="p-4 text-center">Ações</th></tr></thead>
            <tbody>
                <AnimatePresence>
                    {fornecedores.map(f => (
                        <motion.tr key={f.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="p-4 font-medium">{f.nome}<br/><span className="text-sm text-gray-500">{f.categoria}</span></td>
                            <td className="p-4 hidden lg:table-cell">{f.contato} <br/> <span className="text-sm text-gray-400">{f.email}</span></td>
                            <td className="p-4 hidden md:table-cell">{f.telefone}</td>
                            <td className="p-4"><RatingStars rating={f.rating} /></td>
                            <td className="p-4"><StatusBadge status={f.status} /></td>
                            <td className="p-4 flex justify-center gap-2"><button onClick={() => onEdit(f)} className="p-2 text-blue-500 hover:text-blue-700" aria-label="Editar"><Pencil size={18} /></button><button onClick={() => onDelete(f.id)} className="p-2 text-red-500 hover:text-red-700" aria-label="Excluir"><Trash2 size={18} /></button></td>
                        </motion.tr>
                    ))}
                </AnimatePresence>
            </tbody>
        </table>
    </div>
);

const GridView = ({ fornecedores, onEdit, onDelete }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
            {fornecedores.map(f => (
                <motion.div key={f.id} layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ duration: 0.3 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md flex flex-col">
                    <div className="p-6 flex-grow">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold pr-2">{f.nome}</h3>
                            <StatusBadge status={f.status} />
                        </div>
                        <p className="text-sm text-indigo-500 mb-4">{f.categoria}</p>
                        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2 mb-4">
                            <p className="flex items-center gap-2"><Mail size={14} /> {f.email || 'Não informado'}</p>
                            <p className="flex items-center gap-2"><Phone size={14} /> {f.telefone || 'Não informado'}</p>
                        </div>
                        <RatingStars rating={f.rating} />
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 flex justify-end gap-2 rounded-b-2xl">
                        <button onClick={() => onEdit(f)} className="btn-secondary text-sm">Editar</button>
                        <button onClick={() => onDelete(f.id)} className="btn-danger-secondary text-sm">Excluir</button>
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
    </div>
);

const EmptyState = ({ onAddClick }) => (
    <div className="text-center p-16 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
        <FileText size={48} className="mx-auto text-gray-400" />
        <h3 className="mt-4 text-xl font-semibold">Nenhum fornecedor encontrado</h3>
        <p className="text-gray-500 mt-1">Tente ajustar seus filtros ou adicione um novo parceiro.</p>
        <button onClick={onAddClick} className="btn-primary mt-6 flex items-center gap-2 mx-auto">
            <Plus size={20} /> Adicionar Fornecedor
        </button>
    </div>
);

// --- MODAL DE CADASTRO/EDIÇÃO COM ABAS ---
const TabButton = ({ tabId, children, hasError }) => (
    <button
        type="button"
        onClick={() => setActiveTab(tabId)}
        className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === tabId
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        } ${hasError ? 'text-red-500 border-red-500' : ''}`}
    >
        {children}
    </button>
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
        <div>
            <div className="flex flex-wrap gap-2 mb-2">
                {value.map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-indigo-100 text-indigo-800 text-sm font-medium px-2.5 py-0.5 rounded-full dark:bg-indigo-900 dark:text-indigo-300">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-indigo-500 hover:text-indigo-700">
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
                className="input-form w-full"
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
            toast.error('Por favor, corrija os erros no formulário.');
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

    const tabs = [
        { id: 'geral', name: 'Geral', hasError: errors.nome || errors.categoria || errors.email },
        { id: 'endereco', name: 'Endereço & Fiscal', hasError: false },
        { id: 'financeiro', name: 'Serviços & Financeiro', hasError: false },
        { id: 'outros', name: 'Outros', hasError: false },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'endereco':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Endereço e Dados Fiscais</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="label-form">CNPJ</label><input type="text" name="cnpj" value={formData.cnpj} onChange={handleChange} className="input-form w-full" /></div>
                            <div><label className="label-form">Inscrição Estadual</label><input type="text" name="inscricaoEstadual" value={formData.inscricaoEstadual} onChange={handleChange} className="input-form w-full" /></div>
                        </div>
                        <div><label className="label-form">Endereço Completo</label><input type="text" name="endereco" value={formData.endereco} onChange={handleChange} className="input-form w-full" placeholder="Rua, Número, Complemento" /></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className="label-form">Cidade</label><input type="text" name="cidade" value={formData.cidade} onChange={handleChange} className="input-form w-full" /></div>
                            <div><label className="label-form">Estado</label><input type="text" name="estado" value={formData.estado} onChange={handleChange} className="input-form w-full" /></div>
                            <div><label className="label-form">CEP</label><input type="text" name="cep" value={formData.cep} onChange={handleChange} className="input-form w-full" /></div>
                        </div>
                    </div>
                );
            case 'financeiro':
                 return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Serviços e Dados Financeiros</h3>
                         <div>
                            <label className="label-form">Serviços Oferecidos</label>
                            <TagInput value={formData.servicosOferecidos} onChange={handleTagChange} placeholder="Digite um serviço e tecle Enter..." />
                        </div>
                        <div><label className="label-form">Termos de Pagamento</label><input type="text" name="termosPagamento" value={formData.termosPagamento} onChange={handleChange} className="input-form w-full" placeholder="Ex: 50% na contratação, 50% na entrega" /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="label-form">Banco</label><input type="text" name="banco" value={formData.banco} onChange={handleChange} className="input-form w-full" /></div>
                            <div><label className="label-form">Agência</label><input type="text" name="agencia" value={formData.agencia} onChange={handleChange} className="input-form w-full" /></div>
                            <div><label className="label-form">Conta</label><input type="text" name="conta" value={formData.conta} onChange={handleChange} className="input-form w-full" /></div>
                            <div><label className="label-form">Chave Pix</label><input type="text" name="chavePix" value={formData.chavePix} onChange={handleChange} className="input-form w-full" /></div>
                        </div>
                    </div>
                );
            case 'outros':
                 return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Outras Informações</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className="label-form">Status</label><select name="status" value={formData.status} onChange={handleChange} className="input-form w-full"><option value="Ativo">Ativo</option><option value="Preferencial">Preferencial</option><option value="Inativo">Inativo</option></select></div>
                            <div><label className="label-form">Avaliação</label><RatingStars rating={formData.rating} setRating={setRating} /></div>
                        </div>
                        <div><label className="label-form">Data do Último Contato</label><input type="date" name="dataUltimoContato" value={formData.dataUltimoContato} onChange={handleChange} className="input-form w-full"/></div>
                        <div><label className="label-form">Anotações Internas</label><textarea name="notas" value={formData.notas} onChange={handleChange} rows="5" className="input-form w-full" placeholder="Informações relevantes, acordos, etc."></textarea></div>
                    </div>
                 );
            case 'geral':
            default:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Informações Gerais e Contato</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label-form">Nome da Empresa*</label>
                                <input type="text" name="nome" value={formData.nome} onChange={handleChange} className={`input-form w-full ${errors.nome ? 'input-error' : ''}`} />
                                {errors.nome && <p className="error-message">{errors.nome}</p>}
                            </div>
                            <div>
                                <label className="label-form">Categoria*</label>
                                <select name="categoria" value={formData.categoria} onChange={handleChange} className={`input-form w-full ${errors.categoria ? 'input-error' : ''}`}>
                                    <option value="">Selecione...</option>
                                    {categoriasFornecedores.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                {errors.categoria && <p className="error-message">{errors.categoria}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="label-form">Nome do Contato</label><input type="text" name="contato" value={formData.contato} onChange={handleChange} className="input-form w-full" /></div>
                            <div><label className="label-form">Cargo do Contato</label><input type="text" name="cargoContato" value={formData.cargoContato} onChange={handleChange} className="input-form w-full" /></div>
                            <div><label className="label-form">Telefone Principal</label><input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} className="input-form w-full" /></div>
                            <div><label className="label-form">Telefone Alternativo</label><input type="tel" name="telefoneAlternativo" value={formData.telefoneAlternativo} onChange={handleChange} className="input-form w-full" /></div>
                            <div>
                                <label className="label-form">Email Principal</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className={`input-form w-full ${errors.email ? 'input-error' : ''}`} />
                                {errors.email && <p className="error-message">{errors.email}</p>}
                            </div>
                            <div><label className="label-form">Email Alternativo</label><input type="email" name="emailAlternativo" value={formData.emailAlternativo} onChange={handleChange} className="input-form w-full" /></div>
                        </div>
                    </div>
                );
        }
    };
    
    const TabButton = ({ tabId, children }) => (
        <button
            type="button"
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === tabId ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
            {children}
        </button>
    );

    return (
        <AnimatePresence>
            {aberto && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} transition={{ duration: 0.2 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col">
                        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-2xl font-bold">{fornecedor ? "Editar Fornecedor" : "Novo Fornecedor"}</h2>
                            <button onClick={aoFechar} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><IconX size={22}/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex-grow overflow-hidden flex flex-col">
                            <div className="border-b dark:border-gray-700 flex-shrink-0">
                                <nav className="flex space-x-2">
                                    <TabButton tabId="geral">Geral</TabButton>
                                    <TabButton tabId="endereco">Endereço & Fiscal</TabButton>
                                    <TabButton tabId="financeiro">Serviços & Financeiro</TabButton>
                                    <TabButton tabId="outros">Outros</TabButton>
                                    <button type="button" className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-400 cursor-not-allowed" disabled>Documentos</button>
                                    <button type="button" className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-400 cursor-not-allowed" disabled>Histórico</button>
                                </nav>
                            </div>
                            <div className="p-6 space-y-6 overflow-y-auto flex-grow">
                                {renderTabContent()}
                            </div>
                            <div className="p-6 flex justify-end gap-4 border-t dark:border-gray-700 flex-shrink-0">
                                <button type="button" onClick={aoFechar} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">Salvar Fornecedor</button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}