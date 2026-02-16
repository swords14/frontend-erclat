import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Filter, X, Eye, Code, ClipboardCheck, User, Calendar, 
    ShieldCheck, Search, ChevronDown, Terminal, Loader2 // <-- ADICIONADO AQUI
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAuditLogs, getAllUsers } from '@/services/api';

const inputPremiumClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-gray-700 font-medium";
const labelPremiumClass = "block text-sm font-bold text-gray-700 mb-1.5 ml-1";

const entityTypeTranslations = { 
    'Client': 'Clientes', 'Event': 'Eventos', 'Transaction': 'Financeiro', 
    'Supplier': 'Fornecedores', 'InventoryItem': 'Estoque', 'User': 'Usuários', 
    'Auth': 'Segurança', 'Task': 'Tarefas', 'Budget': 'Orçamentos' 
};

const actionTranslations = { 
    'CREATE': 'Criação', 'UPDATE': 'Edição', 'DELETE': 'Exclusão', 
    'LOGIN_SUCCESS': 'Acesso', 'LOGIN_FAILURE': 'Falha Login', 
    'LOGIN_SUCCESS_2FA': 'Acesso 2FA', '2FA_LOGIN_FAILURE': 'Erro 2FA', 
    'USER_REGISTERED': 'Novo Registro' 
};

const formatarData = (isoString) => isoString ? new Date(isoString).toLocaleString('pt-BR') : '—';

export default function AuditoriaPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ dataInicio: '', dataFim: '', usuarioId: '', entityType: '', action: '' });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, itemsPerPage: 15 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showTechnicalLog, setShowTechnicalLog] = useState(false);
  const [usuarios, setUsuarios] = useState([]);

  const fetchUsers = useCallback(async () => {
    try {
        const usersData = await getAllUsers();
        setUsuarios(usersData);
    } catch (error) { 
        toast.error('Erro ao sincronizar usuários'); 
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ 
        page: pagination.currentPage.toString(), 
        limit: pagination.itemsPerPage.toString() 
    });
    Object.entries(filters).forEach(([key, value]) => { if (value) params.append(key, value); });

    try {
      const result = await getAuditLogs(params.toString());
      setLogs(result.data);
      setPagination(prev => ({ ...prev, totalPages: result.totalPages, currentPage: result.currentPage }));
    } catch (err) { 
        toast.error("Erro ao carregar trilha de auditoria."); 
    } 
    finally { setLoading(false); }
  }, [pagination.currentPage, pagination.itemsPerPage, filters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleRowClick = (log) => {
    setSelectedLog(log);
    setShowTechnicalLog(false);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-light text-gray-800 tracking-wide flex items-center gap-3">
                Trilha de <span className="font-bold text-amber-600">Auditoria</span>
                <ShieldCheck className="text-amber-400" size={28} />
            </h1>
            <p className="mt-1 text-gray-500 font-medium">Histórico completo de ações e acessos ao sistema.</p>
        </div>
      </header>

      <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 mb-6 px-2 text-gray-800">
            <Filter size={18} className="text-amber-500" />
            <span className="font-bold">Filtrar Atividades</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div><label className={labelPremiumClass}>Início</label><input type="date" name="dataInicio" value={filters.dataInicio} onChange={handleFilterChange} className={inputPremiumClass} /></div>
          <div><label className={labelPremiumClass}>Fim</label><input type="date" name="dataFim" value={filters.dataFim} onChange={handleFilterChange} className={inputPremiumClass} /></div>
          <div>
            <label className={labelPremiumClass}>Usuário</label>
            <select name="usuarioId" value={filters.usuarioId} onChange={handleFilterChange} className={inputPremiumClass}>
                <option value="">Todos</option>
                {usuarios.map(user => (<option key={user.id} value={user.id}>{user.nome}</option>))}
            </select>
          </div>
          <div>
            <label className={labelPremiumClass}>Módulo</label>
            <select name="entityType" value={filters.entityType} onChange={handleFilterChange} className={inputPremiumClass}>
                <option value="">Todos</option>
                {Object.entries(entityTypeTranslations).map(([key, value]) => (<option key={key} value={key}>{value}</option>))}
            </select>
          </div>
          <div>
            <label className={labelPremiumClass}>Ação</label>
            <select name="action" value={filters.action} onChange={handleFilterChange} className={inputPremiumClass}>
                <option value="">Todas</option>
                {Object.entries(actionTranslations).map(([key, value]) => (<option key={key} value={key}>{value}</option>))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Data / Hora</th>
                <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuário</th>
                <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Módulo</th>
                <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Ação Realizada</th>
                <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Referência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                    <td colSpan="5" className="p-16 text-center">
                        <Loader2 className="animate-spin text-amber-500 mx-auto" size={32}/>
                        <p className="mt-2 text-gray-500 font-medium">Buscando registros...</p>
                    </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="5" className="p-16 text-center text-gray-400 font-medium">Nenhum evento registrado com esses filtros.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-amber-50/30 cursor-pointer transition-colors group" onClick={() => handleRowClick(log)}>
                    <td className="p-5 font-medium text-gray-500 text-sm">{formatarData(log.createdAt)}</td>
                    <td className="p-5">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                                {log.user?.nome ? log.user.nome.charAt(0).toUpperCase() : '?'}
                            </div>
                            <span className="font-bold text-gray-900 text-sm">{log.user?.nome || 'Sistema'}</span>
                        </div>
                    </td>
                    <td className="p-5 font-bold text-gray-700 text-xs">
                        <span className="bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
                            {entityTypeTranslations[log.entityType] || log.entityType}
                        </span>
                    </td>
                    <td className="p-5">
                        <span className={`text-xs font-black uppercase tracking-tighter ${
                            log.action === 'DELETE' ? 'text-rose-600' : 
                            log.action === 'CREATE' ? 'text-emerald-600' : 
                            'text-amber-600'
                        }`}>
                            {actionTranslations[log.action] || log.action}
                        </span>
                    </td>
                    <td className="p-5"><span className="font-mono text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">ID: {log.entityId}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm font-bold text-gray-500">Página {pagination.currentPage} de {pagination.totalPages}</p>
          <div className="flex items-center gap-3">
            <button 
                onClick={() => setPagination(p => ({...p, currentPage: Math.max(p.currentPage - 1, 1)}))} 
                disabled={pagination.currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-all"
            > Anterior </button>
            <button 
                onClick={() => setPagination(p => ({...p, currentPage: Math.min(p.currentPage + 1, p.totalPages)}))} 
                disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-all"
            > Próxima </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && selectedLog && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                    
                    <div className="p-6 md:p-8 flex justify-between items-center border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                            <Terminal className="text-amber-500" size={24}/> Detalhes da Atividade
                        </h2>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"><X size={24}/></button>
                    </div>

                    <div className="p-8 space-y-8 overflow-y-auto flex-grow custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <User className="text-amber-500" size={18}/>
                                <div><p className="text-xs font-bold text-gray-400 uppercase">Usuário</p><p className="font-bold text-gray-800">{selectedLog.user.nome}</p></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="text-amber-500" size={18}/>
                                <div><p className="text-xs font-bold text-gray-400 uppercase">Data/Hora</p><p className="font-bold text-gray-800">{formatarData(selectedLog.createdAt)}</p></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Search className="text-amber-500" size={18}/>
                                <div><p className="text-xs font-bold text-gray-400 uppercase">Módulo</p><p className="font-bold text-gray-800">{entityTypeTranslations[selectedLog.entityType] || selectedLog.entityType}</p></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="text-amber-500" size={18}/>
                                <div><p className="text-xs font-bold text-gray-400 uppercase">Ação</p><p className="font-bold text-gray-800">{actionTranslations[selectedLog.action] || selectedLog.action}</p></div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Resumo Executivo</h3>
                            <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl text-amber-900 font-medium leading-relaxed">
                                {selectedLog.action.includes('LOGIN') ? (
                                    <p>O sistema registrou uma tentativa de acesso via IP <span className="font-black underline">{selectedLog.details?.ip || 'não identificado'}</span> com status de <span className="font-black uppercase">{selectedLog.action}</span>.</p>
                                ) : (
                                    <p>O usuário realizou uma operação de <span className="font-black">{actionTranslations[selectedLog.action]}</span> no item de referência <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-200">{selectedLog.entityId}</span> do módulo {entityTypeTranslations[selectedLog.entityType]}.</p>
                                )}
                            </div>
                        </div>

                        <div className="pt-2">
                            <button 
                                onClick={() => setShowTechnicalLog(!showTechnicalLog)} 
                                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all"
                            >
                                <div className="flex items-center gap-2 font-bold text-gray-700">
                                    <Code size={18} className="text-indigo-500" />
                                    Dados Técnicos do Evento (JSON)
                                </div>
                                <ChevronDown size={20} className={`text-gray-400 transition-transform ${showTechnicalLog ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {showTechnicalLog && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <div className="mt-4 p-4 bg-zinc-900 rounded-xl">
                                            <pre className="text-xs text-emerald-400 font-mono overflow-x-auto p-2 custom-scrollbar leading-relaxed">
                                                {JSON.stringify(selectedLog.details, null, 2)}
                                            </pre>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end flex-shrink-0">
                        <button onClick={() => setIsModalOpen(false)} className="px-8 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-colors">Fechar Inspeção</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}