// Caminho do arquivo: frontend/src/pages/Estoque.jsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, X as IconX, Package, PackageCheck, PackageX, DollarSign, List, LayoutGrid, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, FileText, Loader2, Image as ImageIcon } from 'lucide-react';
import {
    getInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem, getSupplierCategories, getAllSuppliers, getInventoryCategories
} from '@/services/api';

// --- Constantes e Funções Auxiliares ---
const ITEMS_PER_PAGE = 12;
const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

// --- HOOK PERSONALIZADO PARA GERENCIAR O ESTOQUE ---
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
        if (window.confirm("Tem certeza que deseja excluir este item?")) {
            try {
                await deleteInventoryItem(id);
                toast.success('Item excluído com sucesso!');
                fetchData();
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    return { items, suppliers, categories, isLoading, saveItem, deleteItem };
};


// --- COMPONENTES DE UI ---
const KPICard = ({ title, value, icon: Icon }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex items-center gap-4">
        <div className="p-3 bg-indigo-100 dark:bg-gray-700 rounded-lg"><Icon className="text-indigo-500 dark:text-indigo-400" size={24}/></div>
        <div><p className="text-sm text-gray-500 dark:text-gray-400">{title}</p><p className="text-xl font-bold">{value}</p></div>
    </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-center gap-2 mt-4">
            <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="p-2 pagination-btn"><ChevronsLeft size={16}/></button>
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 pagination-btn"><ChevronLeft size={16}/></button>
            <span className="text-sm text-gray-600 dark:text-gray-300">Página {currentPage} de {totalPages}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 pagination-btn"><ChevronRight size={16}/></button>
            <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="p-2 pagination-btn"><ChevronsRight size={16}/></button>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
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
        <div className="flex flex-col gap-6 p-4 sm:p-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div><h1 className="text-3xl font-bold">Controle de Estoque</h1><p className="mt-1 text-gray-500">Gerencie os itens e ativos da sua empresa.</p></div>
                <motion.button onClick={abrirModalParaNovo} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary flex items-center gap-2"><Plus size={20} /> Novo Item</motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Valor Total em Estoque" value={formatarMoeda(kpiData.valorTotal)} icon={DollarSign} />
                <KPICard title="Itens em Estoque" value={items.filter(item => item.quantidade > item.estoqueMinimo).length} icon={PackageCheck} />
                <KPICard title="Itens com Nível Baixo" value={items.filter(item => item.quantidade > 0 && item.quantidade <= item.estoqueMinimo).length} icon={PackageX} />
                <KPICard title="Total de Itens" value={items.length} icon={Package} />
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex flex-col md:flex-row gap-4 flex-wrap">
                <div className="relative flex-grow"><Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" name="termoBusca" placeholder="Buscar por nome ou SKU..." value={filtros.termoBusca} onChange={(e) => setFiltros(p => ({...p, termoBusca: e.target.value}))} className="w-full pl-10 pr-4 py-2 input-form"/></div>
                <select name="categoria" value={filtros.categoria} onChange={(e) => setFiltros(p => ({...p, categoria: e.target.value}))} className="input-form md:w-auto"><option value="todas">Todas as Categorias</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                <select name="status" value={filtros.status} onChange={(e) => setFiltros(p => ({...p, status: e.target.value}))} className="input-form md:w-auto"><option value="todos">Todos os Status</option><option value="Em Estoque">Em Estoque</option><option value="Nível Baixo">Nível Baixo</option><option value="Esgotado">Esgotado</option></select>
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition ${viewMode === 'grid' ? 'bg-white dark:bg-gray-900 shadow-sm' : ''}`}><LayoutGrid size={20} /></button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-white dark:bg-gray-900 shadow-sm' : ''}`}><List size={20} /></button>
                </div>
            </div>

            {isLoading ? <div className="text-center p-10"><Loader2 className="animate-spin inline-block mr-2" /> Carregando estoque...</div> : 
             processedData.totalCount === 0 ? <div className="text-center p-16 bg-white dark:bg-gray-800 rounded-2xl"><FileText size={48} className="mx-auto text-gray-400" /><h3 className="mt-4 text-xl font-semibold">Nenhum item encontrado</h3><p className="text-gray-500 mt-1">Adicione seu primeiro item ao estoque para começar.</p><button onClick={abrirModalParaNovo} className="btn-primary mt-6 flex items-center gap-2 mx-auto"><Plus size={20} /> Adicionar Item</button></div> :
             (
                <>
                    {viewMode === 'grid' ? <GridView items={processedData.paginatedData} onEdit={abrirModalParaEditar} onDelete={deleteItem} /> : <ListView items={processedData.paginatedData} onEdit={abrirModalParaEditar} onDelete={deleteItem} />}
                    <Pagination currentPage={currentPage} totalPages={processedData.totalPages} onPageChange={setCurrentPage} />
                </>
             )
            }
            
            <ModalItemEstoque aberto={modalAberto} aoFechar={() => setModalAberto(false)} aoSalvar={handleSalvarItem} item={itemEmEdicao} fornecedores={suppliers} categorias={categories} />
        </div>
    );
}

// --- SUBCOMPONENTES DE VISUALIZAÇÃO ---
const StatusEstoqueBadge = ({ status }) => {
    const styleMap = {
        'Em Estoque': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'Nível Baixo': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        'Esgotado': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styleMap[status]}`}>{status}</span>;
};

const GridView = ({ items, onEdit, onDelete }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map(item => (
            <motion.div key={item.id} layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-md flex flex-col">
                 {item.imageUrl ? <img src={item.imageUrl} alt={item.nome} className="w-full h-40 object-cover rounded-t-xl" /> : <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-t-xl flex items-center justify-center"><Package size={48} className="text-gray-400"/></div>}
                <div className="p-4 flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-base font-bold pr-2">{item.nome}</h3>
                        <StatusEstoqueBadge status={item.status} />
                    </div>
                    <p className="text-sm text-indigo-500 mb-2 flex-grow">{item.categoria}</p>
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-4">
                        <p><strong>SKU:</strong> {item.sku || 'N/A'}</p>
                        <p><strong>Quantidade:</strong> {item.quantidade}</p>
                        <p><strong>Valor:</strong> {formatarMoeda(item.valorUnitario)}</p>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 flex justify-end gap-2 rounded-b-xl">
                    <button onClick={() => onEdit(item)} className="btn-secondary text-sm">Editar</button>
                    <button onClick={() => onDelete(item.id)} className="btn-danger-secondary text-sm">Excluir</button>
                </div>
            </motion.div>
        ))}
    </div>
);

const ListView = ({ items, onEdit, onDelete }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-x-auto">
        <table className="w-full text-left">
            <thead className="table-header">
                <tr>
                    <th className="p-4">Nome do Item</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4 hidden md:table-cell">Categoria</th>
                    <th className="p-4 text-center">Quantidade</th>
                    <th className="p-4 hidden sm:table-cell text-right">Valor Unitário</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Ações</th>
                </tr>
            </thead>
            <tbody>
                {items.map(item => (
                    <tr key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <td className="p-4 font-medium flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-md flex-shrink-0 flex items-center justify-center">
                                {item.imageUrl ? <img src={item.imageUrl} alt={item.nome} className="w-full h-full object-cover rounded-md" /> : <Package size={24} className="text-gray-400"/> }
                            </div>
                            <span>{item.nome}</span>
                        </td>
                        <td className="p-4 font-mono text-xs">{item.sku || 'N/A'}</td>
                        <td className="p-4 hidden md:table-cell">{item.categoria}</td>
                        <td className="p-4 text-center font-semibold">{item.quantidade}</td>
                        <td className="p-4 hidden sm:table-cell text-right">{formatarMoeda(item.valorUnitario)}</td>
                        <td className="p-4"><StatusEstoqueBadge status={item.status} /></td>
                        <td className="p-4 flex justify-center gap-2">
                            <button onClick={() => onEdit(item)} className="p-2 text-blue-500 hover:text-blue-700" aria-label="Editar"><Pencil size={18} /></button>
                            <button onClick={() => onDelete(item.id)} className="p-2 text-red-500 hover:text-red-700" aria-label="Excluir"><Trash2 size={18} /></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


// --- NOVO MODAL DE ESTOQUE ---
const ModalTabs = ({ tabs, activeTab, setActiveTab, errors }) => {
    const hasError = (tabId) => {
        switch (tabId) {
            case 'principal':
                return errors.nome || errors.categoria;
            case 'estoque':
                return errors.quantidade || errors.valorUnitario;
            case 'fornecedor':
                return false;
        }
    };
    return (
        <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex gap-6 px-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`${
                            activeTab === tab.id
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                        } flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                        {tab.name}
                        {hasError(tab.id) && <span className="ml-2 text-red-500">!</span>}
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
            // Ações para limpar erros
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
        if (!formData.nome) newErrors.nome = 'Nome do item é obrigatório.';
        if (!formData.categoria) newErrors.categoria = 'Categoria é obrigatória.';
        if (formData.quantidade < 0) newErrors.quantidade = 'Quantidade não pode ser negativa.';
        if (formData.estoqueMinimo < 0) newErrors.estoqueMinimo = 'Estoque mínimo não pode ser negativo.';
        if (formData.valorUnitario < 0) newErrors.valorUnitario = 'Valor unitário não pode ser negativo.';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Por favor, corrija os erros no formulário.");
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
        { id: 'principal', name: 'Principal' },
        { id: 'estoque', name: 'Estoque e Compra' },
        { id: 'fornecedor', name: 'Fornecedor' },
    ];
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'estoque':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label-form">Quantidade Inicial*</label>
                            <input type="number" name="quantidade" value={formData.quantidade} onChange={handleChange} className={`input-form w-full ${errors.quantidade ? 'input-error' : ''}`} disabled={!!item} />
                            {item && <p className="text-xs text-gray-400 mt-1">A quantidade só pode ser alterada via movimentação de estoque.</p>}
                            {errors.quantidade && <p className="error-message">{errors.quantidade}</p>}
                        </div>
                        <div>
                            <label className="label-form">Estoque Mínimo</label>
                            <input type="number" name="estoqueMinimo" value={formData.estoqueMinimo} onChange={handleChange} className={`input-form w-full ${errors.estoqueMinimo ? 'input-error' : ''}`} />
                            {errors.estoqueMinimo && <p className="error-message">{errors.estoqueMinimo}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="label-form">Valor Unitário de Compra (R$)</label>
                            <input type="number" name="valorUnitario" step="0.01" value={formData.valorUnitario} onChange={handleChange} className={`input-form w-full ${errors.valorUnitario ? 'input-error' : ''}`} />
                            {errors.valorUnitario && <p className="error-message">{errors.valorUnitario}</p>}
                        </div>
                    </div>
                );
            case 'fornecedor':
                return (
                    <div>
                        <label className="label-form">Fornecedor Padrão</label>
                        <select name="supplierId" value={formData.supplierId || ''} onChange={handleChange} className="input-form w-full">
                            <option value="">Nenhum</option>
                            {fornecedores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                        </select>
                        <p className="text-xs text-gray-400 mt-2">Associe um fornecedor a este item para facilitar futuras ordens de compra.</p>
                    </div>
                );
            case 'principal':
            default:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="label-form">Nome do Item*</label>
                            <input type="text" name="nome" value={formData.nome} onChange={handleChange} className={`input-form w-full ${errors.nome ? 'input-error' : ''}`} />
                            {errors.nome && <p className="error-message">{errors.nome}</p>}
                        </div>
                        <div>
                            <label className="label-form">SKU (Código do Item)</label>
                            <input type="text" name="sku" value={formData.sku} onChange={handleChange} className="input-form w-full" />
                        </div>
                        <div>
                            <label className="label-form">Categoria*</label>
                            <select name="categoria" value={formData.categoria} onChange={handleChange} className={`input-form w-full ${errors.categoria ? 'input-error' : ''}`}>
                                <option value="">Selecione...</option>
                                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {errors.categoria && <p className="error-message">{errors.categoria}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="label-form">Descrição Detalhada</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="input-form w-full"></textarea>
                        </div>
                        <div className="md:col-span-2">
                            <label className="label-form">Imagem do Item</label>
                            <div className="mt-2 flex items-center gap-6">
                                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                                   {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" /> : <Package size={32} className="text-gray-400" />}
                                </div>
                                <input type="file" id="imageUpload" name="image" onChange={handleImageChange} accept="image/*" className="hidden" />
                                <label htmlFor="imageUpload" className="btn-secondary cursor-pointer">{previewUrl ? 'Trocar Imagem' : 'Carregar Imagem'}</label>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <AnimatePresence>
            {aberto && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
                        <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
                            <h2 className="text-xl font-bold">{item ? "Editar Item" : "Novo Item no Estoque"}</h2>
                            <button onClick={aoFechar} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><IconX size={22}/></button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
                            <div className="p-4 border-b dark:border-gray-700">
                                <div className="flex space-x-2">
                                    <ModalTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} errors={errors} />
                                </div>
                            </div>

                            <div className="p-6 space-y-5 overflow-y-auto">
                                {renderTabContent()}
                            </div>
                            
                            <div className="p-4 flex justify-end gap-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <button type="button" onClick={aoFechar} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">Salvar</button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}