import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
    Plus, Search, Pencil, Trash2, X as IconX, Package, PackageCheck, PackageX, 
    DollarSign, List, LayoutGrid, ChevronsLeft, ChevronLeft, ChevronRight, 
    ChevronsRight, FileText, Loader2, Image as ImageIcon, Sparkles, Truck, Box
} from 'lucide-react';
import {
    getInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem, 
    getAllSuppliers, getInventoryCategories
} from '@/services/api';

const ITEMS_PER_PAGE = 12;
const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const inputPremiumClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-gray-700 font-medium";
const labelPremiumClass = "block text-sm font-bold text-gray-700 mb-1.5 ml-1";

const StatusEstoqueBadge = ({ status }) => {
    const styleMap = {
        'Em Estoque': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Nível Baixo': 'bg-amber-50 text-amber-700 border-amber-200',
        'Esgotado': 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return <span className={`px-3 py-1 text-xs font-bold rounded-full border shadow-sm tracking-wide ${styleMap[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>{status}</span>;
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

const useEstoque = () => {
    const [items, setItems] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [itemsData, suppliersData, categoriesData] = await Promise.all([
                getInventoryItems(),
                getAllSuppliers(),
                getInventoryCategories(),
            ]);
            setItems(itemsData);
            setSuppliers(suppliersData);
            setCategories(categoriesData);

        } catch (error) {
            toast.error(error.message || 'Falha ao buscar itens do estoque.');
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const saveItem = async (itemData, imagemArquivo, itemEmEdicao) => {
        const isEditing = !!itemEmEdicao;
        try {
            if (isEditing) {
                await updateInventoryItem(itemEmEdicao.id, itemData, imagemArquivo);
            } else {
                await createInventoryItem(itemData, imagemArquivo);
            }
            toast.success(`Item ${isEditing ? 'atualizado' : 'adicionado'} com sucesso!`);
            fetchData();
            return true;
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    const deleteItem = async (id) => {
        if (window.confirm("Atenção: Tem certeza que deseja excluir este item permanentemente?")) {
            try {
                await deleteInventoryItem(id);
                toast.success('Item excluído do acervo.');
                fetchData();
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    return { items, suppliers, categories, isLoading, saveItem, deleteItem };
};

export default function Estoque() {
    const { items, suppliers, categories, isLoading, saveItem, deleteItem } = useEstoque();
    const [modalAberto, setModalAberto] = useState(false);
    const [itemEmEdicao, setItemEmEdicao] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [filtros, setFiltros] = useState({ termoBusca: '', categoria: 'todas', status: 'todos' });
    const [currentPage, setCurrentPage] = useState(1);

    const getStatus = (item) => {
        if (item.quantidade <= 0) return 'Esgotado';
        if (item.quantidade <= item.estoqueMinimo) return 'Nível Baixo';
        return 'Em Estoque';
    };

    const processedData = useMemo(() => {
        let filtered = items.map(item => ({ ...item, status: getStatus(item) }));
        
        if (filtros.termoBusca) {
            const termo = filtros.termoBusca.toLowerCase();
            filtered = filtered.filter(item => (item.nome || '').toLowerCase().includes(termo) || (item.sku || '').toLowerCase().includes(termo));
        }
        if (filtros.categoria !== 'todas') {
            filtered = filtered.filter(item => item.categoria === filtros.categoria);
        }
        if (filtros.status !== 'todos') {
            filtered = filtered.filter(item => item.status === filtros.status);
        }

        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

        return { paginatedData, totalPages, totalCount: filtered.length };
    }, [items, filtros, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filtros]);

    const kpiData = useMemo(() => {
        const valorTotal = items.reduce((acc, item) => acc + (item.valorUnitario * item.quantidade), 0);
        return { valorTotal };
    }, [items]);

    const abrirModalParaNovo = () => {
        setItemEmEdicao(null);
        setModalAberto(true);
    };

    const abrirModalParaEditar = (item) => {
        setItemEmEdicao(item);
        setModalAberto(true);
    };

    const handleSalvarItem = async (data, imagemArquivo) => {
        const success = await saveItem(data, imagemArquivo, itemEmEdicao);
        if (success) {
            setModalAberto(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8 min-h-screen">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-light text-gray-800 tracking-wide flex items-center gap-3">
                        Acervo e <span className="font-bold text-amber-600">Estoque</span>
                        <Package className="text-amber-400" size={24} />
                    </h1>
                    <p className="mt-1 text-gray-500 font-medium">Controle de materiais, equipamentos e insumos.</p>
                </div>
                <button onClick={abrirModalParaNovo} className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all duration-300">
                    <Plus size={20} /> Novo Item
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Valor Total em Estoque" value={formatarMoeda(kpiData.valorTotal)} icon={DollarSign} corIcone="text-blue-500" bgIcone="bg-blue-50" />
                <KPICard title="Itens Disponíveis" value={items.filter(item => item.quantidade > item.estoqueMinimo).length} icon={PackageCheck} corIcone="text-emerald-500" bgIcone="bg-emerald-50" />
                <KPICard title="Atenção (Nível Baixo)" value={items.filter(item => item.quantidade > 0 && item.quantidade <= item.estoqueMinimo).length} icon={PackageX} corIcone="text-amber-500" bgIcone="bg-amber-50" />
                <KPICard title="Itens Esgotados" value={items.filter(item => item.quantidade <= 0).length} icon={PackageX} corIcone="text-rose-500" bgIcone="bg-rose-50" />
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-4 flex-wrap items-center">
                <div className="relative flex-grow w-full md:w-auto">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        name="termoBusca" 
                        placeholder="Buscar por nome ou SKU..." 
                        value={filtros.termoBusca} 
                        onChange={(e) => setFiltros(p => ({...p, termoBusca: e.target.value}))} 
                        className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-gray-700 font-medium"
                    />
                </div>
                
                <div className="flex gap-4 w-full md:w-auto">
                    <select name="categoria" value={filtros.categoria} onChange={(e) => setFiltros(p => ({...p, categoria: e.target.value}))} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-amber-500 outline-none font-medium text-gray-700 w-full md:w-auto">
                        <option value="todas">Todas as Categorias</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    
                    <select name="status" value={filtros.status} onChange={(e) => setFiltros(p => ({...p, status: e.target.value}))} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-amber-500 outline-none font-medium text-gray-700 w-full md:w-auto">
                        <option value="todos">Todos os Status</option>
                        <option value="Em Estoque">Em Estoque</option>
                        <option value="Nível Baixo">Nível Baixo</option>
                        <option value="Esgotado">Esgotado</option>
                    </select>
                </div>
                
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1 w-full md:w-auto justify-center">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-400 hover:text-gray-700'}`}><LayoutGrid size={20} /></button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-400 hover:text-gray-700'}`}><List size={20} /></button>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center p-12 bg-white rounded-[2rem] border border-gray-200 shadow-sm">
                    <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Carregando acervo...</p>
                </div> 
            ) : processedData.totalCount === 0 ? (
                <div className="text-center py-20 px-6 bg-white rounded-[2rem] shadow-sm border border-gray-200 flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                        <Package size={40} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Nenhum item localizado</h3>
                    <p className="mt-2 text-gray-500 font-medium max-w-sm">Seu acervo atende não atende a esses filtros ou ainda está vazio.</p>
                    <button onClick={abrirModalParaNovo} className="mt-8 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all">
                        <Plus size={20} /> Cadastrar Primeiro Item
                    </button>
                </div>
            ) : (
                <div className="flex flex-col">
                    {viewMode === 'grid' ? <GridView items={processedData.paginatedData} onEdit={abrirModalParaEditar} onDelete={deleteItem} /> : <ListView items={processedData.paginatedData} onEdit={abrirModalParaEditar} onDelete={deleteItem} />}
                    <Pagination currentPage={currentPage} totalPages={processedData.totalPages} onPageChange={setCurrentPage} />
                </div>
            )}
            
            <ModalItemEstoque aberto={modalAberto} aoFechar={() => setModalAberto(false)} aoSalvar={handleSalvarItem} item={itemEmEdicao} fornecedores={suppliers} categorias={categories} />
        </div>
    );
}

const GridView = ({ items, onEdit, onDelete }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
            {items.map(item => (
                <motion.div key={item.id} layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ duration: 0.3 }} className="bg-white rounded-[2rem] border border-gray-200 shadow-sm flex flex-col overflow-hidden hover:border-amber-300 transition-colors group">
                    <div className="h-48 bg-gray-50 border-b border-gray-100 relative">
                        {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.nome} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Package size={48} className="text-gray-300" strokeWidth={1.5}/>
                            </div>
                        )}
                        <div className="absolute top-4 right-4">
                            <StatusEstoqueBadge status={item.status} />
                        </div>
                    </div>
                    
                    <div className="p-6 flex-grow flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 truncate" title={item.nome}>{item.nome}</h3>
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-4 flex-grow">{item.categoria}</p>
                        
                        <div className="text-sm text-gray-600 space-y-2 mb-2">
                            <p className="flex justify-between border-b border-gray-100 pb-1">
                                <span className="font-medium">SKU:</span> 
                                <span className="font-bold text-gray-800">{item.sku || 'N/A'}</span>
                            </p>
                            <p className="flex justify-between border-b border-gray-100 pb-1">
                                <span className="font-medium">Quantidade:</span> 
                                <span className="font-bold text-gray-800">{item.quantidade}</span>
                            </p>
                            <p className="flex justify-between">
                                <span className="font-medium">Valor Unit:</span> 
                                <span className="font-bold text-emerald-600">{formatarMoeda(item.valorUnitario)}</span>
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50/80 p-4 border-t border-gray-100 flex justify-end gap-3 transition-colors group-hover:bg-amber-50/30">
                        <button onClick={() => onEdit(item)} className="px-4 py-2 bg-white border border-gray-200 hover:border-amber-300 text-gray-700 hover:text-amber-600 rounded-xl font-bold text-sm shadow-sm transition-all">Editar</button>
                        <button onClick={() => onDelete(item.id)} className="px-4 py-2 bg-white border border-gray-200 hover:border-rose-300 text-gray-700 hover:text-rose-600 rounded-xl font-bold text-sm shadow-sm transition-all">Excluir</button>
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
    </div>
);

const ListView = ({ items, onEdit, onDelete }) => (
    <div className="bg-white rounded-[2rem] border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-200">
                    <tr>
                        <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500">Item do Acervo</th>
                        <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500">SKU</th>
                        <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 hidden md:table-cell">Categoria</th>
                        <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 text-center">Qtd.</th>
                        <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 hidden sm:table-cell text-right">Valor Unitário</th>
                        <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500">Status</th>
                        <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    <AnimatePresence>
                        {items.map(item => (
                            <motion.tr key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="hover:bg-amber-50/30 transition-colors group">
                                <td className="p-5 font-medium flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        {item.imageUrl ? <img src={item.imageUrl} alt={item.nome} className="w-full h-full object-cover" /> : <Package size={20} className="text-gray-400" strokeWidth={1.5}/> }
                                    </div>
                                    <span className="font-bold text-gray-900">{item.nome}</span>
                                </td>
                                <td className="p-5 font-mono text-sm font-bold text-gray-500">{item.sku || 'N/A'}</td>
                                <td className="p-5 hidden md:table-cell font-medium text-gray-600 text-sm">{item.categoria}</td>
                                <td className="p-5 text-center font-bold text-gray-800 text-lg">{item.quantidade}</td>
                                <td className="p-5 hidden sm:table-cell text-right font-bold text-gray-900">{formatarMoeda(item.valorUnitario)}</td>
                                <td className="p-5"><StatusEstoqueBadge status={item.status} /></td>
                                <td className="p-5 text-center">
                                    <div className="flex justify-center items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onEdit(item)} className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Editar"><Pencil size={18} strokeWidth={2}/></button>
                                        <button onClick={() => onDelete(item.id)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Excluir"><Trash2 size={18} strokeWidth={2}/></button>
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

const ModalTabs = ({ tabs, activeTab, setActiveTab, errors }) => {
    const hasError = (tabId) => {
        switch (tabId) {
            case 'principal': return errors.nome || errors.categoria;
            case 'estoque': return errors.quantidade || errors.valorUnitario;
            case 'fornecedor': return false;
            default: return false;
        }
    };
    return (
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
                            ${hasError(tab.id) && activeTab !== tab.id ? 'text-rose-500 border-rose-200' : ''}
                        `}
                    >
                        <tab.icon size={18} /> {tab.name} {hasError(tab.id) && <span className="w-2 h-2 rounded-full bg-rose-500 ml-1"></span>}
                    </button>
                ))}
            </nav>
        </div>
    );
};

function ModalItemEstoque({ aberto, aoFechar, aoSalvar, item, fornecedores, categorias }) {
    const initialState = { nome: '', sku: '', description: '', categoria: '', quantidade: 0, estoqueMinimo: 0, valorUnitario: 0.00, supplierId: null };
    const [formData, setFormData] = useState(initialState);
    const [imagemArquivo, setImagemArquivo] = useState(null); 
    const [previewUrl, setPreviewUrl] = useState(null);
    const [errors, setErrors] = useState({});
    const [activeTab, setActiveTab] = useState('principal');

    useEffect(() => {
        if (aberto) {
            setActiveTab('principal');
            if (item) {
                setFormData({
                    nome: item.nome || '',
                    sku: item.sku || '',
                    description: item.description || '',
                    categoria: item.categoria || '',
                    quantidade: item.quantidade || 0,
                    estoqueMinimo: item.estoqueMinimo || 0,
                    valorUnitario: item.valorUnitario || 0.00,
                    supplierId: item.supplierId || null,
                });
                setPreviewUrl(item.imageUrl || null);
            } else {
                setFormData(initialState);
                setPreviewUrl(null);
            }
            setImagemArquivo(null);
            setErrors({});
        }
    }, [item, aberto]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? Number(value) : value,
            ... (errors[name] && { [name]: null })
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagemArquivo(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };
    
    const validateForm = () => {
        const newErrors = {};
        if (!formData.nome) newErrors.nome = 'Obrigatório.';
        if (!formData.categoria) newErrors.categoria = 'Obrigatório.';
        if (formData.quantidade < 0) newErrors.quantidade = 'Inválido.';
        if (formData.estoqueMinimo < 0) newErrors.estoqueMinimo = 'Inválido.';
        if (formData.valorUnitario < 0) newErrors.valorUnitario = 'Inválido.';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Preencha os campos obrigatórios corretamente.");
            return;
        }
        const dataToSave = {
            ...formData,
            quantidade: Number(formData.quantidade),
            estoqueMinimo: Number(formData.estoqueMinimo),
            valorUnitario: Number(formData.valorUnitario),
            supplierId: formData.supplierId || null,
        };
        aoSalvar(dataToSave, imagemArquivo);
    };

    const tabs = [
        { id: 'principal', name: 'Identificação', icon: FileText },
        { id: 'estoque', name: 'Valores e Quantidade', icon: Box },
        { id: 'fornecedor', name: 'Fornecimento', icon: Truck },
    ];
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'estoque':
                return (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <label className={labelPremiumClass}>Quantidade Atual no Acervo*</label>
                                <input type="number" name="quantidade" value={formData.quantidade} onChange={handleChange} className={`${inputPremiumClass} font-black text-lg ${errors.quantidade ? 'border-rose-400 bg-rose-50' : ''}`} disabled={!!item} />
                                {item && <p className="text-xs font-bold text-amber-600 mt-2">Alterações futuras devem ser feitas via movimentação (Entrada/Saída).</p>}
                                {errors.quantidade && <p className="text-rose-500 text-xs font-bold mt-1">{errors.quantidade}</p>}
                            </div>
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <label className={labelPremiumClass}>Estoque Mínimo (Alerta)</label>
                                <input type="number" name="estoqueMinimo" value={formData.estoqueMinimo} onChange={handleChange} className={`${inputPremiumClass} font-bold ${errors.estoqueMinimo ? 'border-rose-400 bg-rose-50' : ''}`} />
                                <p className="text-xs font-medium text-gray-500 mt-2">O sistema avisará quando a quantidade atingir este número.</p>
                                {errors.estoqueMinimo && <p className="text-rose-500 text-xs font-bold mt-1">{errors.estoqueMinimo}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelPremiumClass}>Custo de Reposição / Valor Unitário (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">R$</span>
                                    <input type="number" name="valorUnitario" step="0.01" value={formData.valorUnitario} onChange={handleChange} className={`${inputPremiumClass} pl-12 font-bold ${errors.valorUnitario ? 'border-rose-400 bg-rose-50' : ''}`} />
                                </div>
                                {errors.valorUnitario && <p className="text-rose-500 text-xs font-bold mt-1">{errors.valorUnitario}</p>}
                            </div>
                        </div>
                    </motion.div>
                );
            case 'fornecedor':
                return (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><Truck size={18} className="text-amber-500"/> Logística e Compras</h4>
                            <label className={labelPremiumClass}>Fornecedor Preferencial (Opcional)</label>
                            <select name="supplierId" value={formData.supplierId || ''} onChange={handleChange} className={inputPremiumClass}>
                                <option value="">Não vinculado a um fornecedor específico...</option>
                                {fornecedores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                            </select>
                            <p className="text-sm font-medium text-gray-500 mt-3">Vincular um fornecedor facilita a reposição automática e emissão de ordens de compra.</p>
                        </div>
                    </motion.div>
                );
            case 'principal':
            default:
                return (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className={labelPremiumClass}>Nome Comercial do Item*</label>
                            <input type="text" name="nome" value={formData.nome} onChange={handleChange} className={`${inputPremiumClass} ${errors.nome ? 'border-rose-400 bg-rose-50' : ''}`} placeholder="Ex: Cadeira Tiffany Dourada"/>
                            {errors.nome && <p className="text-rose-500 text-xs font-bold mt-1">{errors.nome}</p>}
                        </div>
                        <div>
                            <label className={labelPremiumClass}>SKU / Código Interno</label>
                            <input type="text" name="sku" value={formData.sku} onChange={handleChange} className={inputPremiumClass} placeholder="Ex: MOV-CAD-001"/>
                        </div>
                        <div>
                            <label className={labelPremiumClass}>Categoria Principal*</label>
                            <select name="categoria" value={formData.categoria} onChange={handleChange} className={`${inputPremiumClass} ${errors.categoria ? 'border-rose-400 bg-rose-50' : ''}`}>
                                <option value="">Selecione na lista...</option>
                                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {errors.categoria && <p className="text-rose-500 text-xs font-bold mt-1">{errors.categoria}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelPremiumClass}>Descrição / Especificações Técnicas</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className={`${inputPremiumClass} resize-none`} placeholder="Cor, material, voltagem, dimensões..."></textarea>
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelPremiumClass}>Imagem de Referência</label>
                            <div className="mt-2 flex items-center gap-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <div className="w-24 h-24 bg-white border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                                    {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon size={32} className="text-gray-300" strokeWidth={1.5} />}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <input type="file" id="imageUpload" name="image" onChange={handleImageChange} accept="image/*" className="hidden" />
                                    <label htmlFor="imageUpload" className="px-6 py-2 bg-white border border-gray-200 hover:border-amber-300 text-gray-700 hover:text-amber-600 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer inline-flex items-center gap-2">
                                        {previewUrl ? 'Substituir Imagem' : 'Carregar Imagem'}
                                    </label>
                                    <p className="text-xs font-medium text-gray-400">JPG ou PNG. Tamanho máximo recomendado 2MB.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
        }
    };

    return (
        <AnimatePresence>
            {aberto && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
                    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden">
                        
                        <div className="p-6 md:p-8 flex justify-between items-center border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                {item ? <Pencil className="text-amber-500" /> : <Package className="text-amber-500" />}
                                {item ? "Editar Item do Acervo" : "Cadastrar Novo Item"}
                            </h2>
                            <button onClick={aoFechar} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"><IconX size={24}/></button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
                            <div className="flex-shrink-0">
                                <ModalTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} errors={errors} />
                            </div>

                            <div className="p-8 space-y-5 overflow-y-auto flex-grow bg-white custom-scrollbar">
                                {renderTabContent()}
                            </div>
                            
                            <div className="p-6 md:p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-4 flex-shrink-0 rounded-b-[2rem]">
                                <button type="button" onClick={aoFechar} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
                                <button type="submit" className="px-8 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all">
                                    {item ? 'Salvar Alterações' : 'Cadastrar no Estoque'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}