import React, { useState, useEffect, useCallback } from 'react';
import { Filter, X, Eye, Code, ClipboardCheck } from 'lucide-react';
import toast from 'react-hot-toast';
// Importe as funções da sua API central
import { getAuditLogs, getAllUsers } from '../services/api'; // Ajuste o caminho se necessário

// --- Constantes de Estilo (Tailwind CSS) ---
const thStyle = "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider";
const tdStyle = "px-4 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200";
const inputStyle = "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5";
const btnSecondary = "py-2 px-4 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-indigo-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700";

// --- Componentes Auxiliares ---

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-transform duration-300 scale-95 animate-modal-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-10"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>
);

// --- Lógica de Tradução e Formatação ---

const entityTypeTranslations = { 'Client': 'Clientes', 'Event': 'Eventos', 'Transaction': 'Transações', 'Supplier': 'Fornecedores', 'InventoryItem': 'Estoque', 'User': 'Usuários', 'Auth': 'Autenticação', 'Task': 'Tarefas', 'Budget': 'Orçamentos' };
const actionTranslations = { 'CREATE': 'Criação', 'UPDATE': 'Atualização', 'DELETE': 'Exclusão', 'LOGIN_SUCCESS': 'Login (Sucesso)', 'LOGIN_FAILURE': 'Login (Falha)', 'LOGIN_SUCCESS_2FA': 'Login (2 Fatores)', '2FA_LOGIN_FAILURE': 'Login (Falha 2FA)', 'USER_REGISTERED': 'Registro de Usuário' };
const formatarData = (isoString) => isoString ? new Date(isoString).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

const generateHumanReadableDetails = (log) => {
    if (!log) return null;
    const details = log.details || {};
    switch (log.action) {
        case 'LOGIN_SUCCESS': case 'LOGIN_SUCCESS_2FA':
            return <p>O acesso ao sistema foi realizado com sucesso a partir do IP: <span className="font-semibold text-green-600 dark:text-green-400">{details.ip || 'Não registrado'}</span>.</p>;
        case 'LOGIN_FAILURE':
            return <p>Houve uma tentativa de login malsucedida. Motivo: <span className="font-semibold text-red-600 dark:text-red-400">{details.reason || 'Desconhecido'}</span>.</p>;
        case 'USER_REGISTERED':
            return <p>Um novo usuário foi criado no sistema, originado do IP: <span className="font-semibold">{details.ip || 'Não registrado'}</span>.</p>;
        default:
            return <p className="text-gray-600 dark:text-gray-400">Esta ação não possui um resumo detalhado. Verifique o log técnico para mais informações.</p>;
    }
};

// --- Componente Principal ---

export default function AuditoriaPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ dataInicio: '', dataFim: '', usuarioId: '', entityType: '', action: '' });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, itemsPerPage: 15 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showTechnicalLog, setShowTechnicalLog] = useState(false);
  const [usuarios, setUsuarios] = useState([]);

  // CORRIGIDO: Usa a função centralizada getAllUsers
  const fetchUsers = useCallback(async () => {
    try {
        const usersData = await getAllUsers();
        setUsuarios(usersData);
    } catch (error) { 
        toast.error(error.message || 'Falha ao buscar usuários'); 
    }
  }, []);

  // CORRIGIDO: Usa a função centralizada getAuditLogs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: pagination.currentPage.toString(), limit: pagination.itemsPerPage.toString() });
    Object.entries(filters).forEach(([key, value]) => { if (value) params.append(key, value); });

    try {
      const result = await getAuditLogs(params.toString());
      setLogs(result.data);
      setPagination(prev => ({ ...prev, totalPages: result.totalPages, currentPage: result.currentPage }));
    } catch (err) { 
        toast.error(err.message || "Erro ao carregar logs."); 
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
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header className="flex items-center gap-4 mb-8">
        <div className="bg-indigo-100 dark:bg-indigo-900/40 p-3 rounded-xl"><ClipboardCheck className="h-8 w-8 text-indigo-600 dark:text-indigo-400" /></div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Auditoria do Sistema</h1>
      </header>

      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2"><Filter className="w-5 h-5" /> Filtros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <input type="date" name="dataInicio" value={filters.dataInicio} onChange={handleFilterChange} className={inputStyle} />
          <input type="date" name="dataFim" value={filters.dataFim} onChange={handleFilterChange} className={inputStyle} />
          <select name="usuarioId" value={filters.usuarioId} onChange={handleFilterChange} className={inputStyle}>
            <option value="">Todos os Usuários</option>
            {usuarios.map(user => (<option key={user.id} value={user.id}>{user.nome}</option>))}
          </select>
          <select name="entityType" value={filters.entityType} onChange={handleFilterChange} className={inputStyle}>
            <option value="">Todos os Módulos</option>
            {Object.entries(entityTypeTranslations).map(([key, value]) => (<option key={key} value={key}>{value}</option>))}
          </select>
          <select name="action" value={filters.action} onChange={handleFilterChange} className={inputStyle}>
            <option value="">Todas as Ações</option>
            {Object.entries(actionTranslations).map(([key, value]) => (<option key={key} value={key}>{value}</option>))}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className={thStyle}>Data/Hora</th><th className={thStyle}>Usuário</th>
                <th className={thStyle}>Módulo</th><th className={thStyle}>Ação</th>
                <th className={thStyle}>Item Afetado (ID)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan="5"><LoadingSpinner /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="5" className="py-8 text-center text-gray-500">Nenhum registro encontrado.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer transition-colors duration-150" onClick={() => handleRowClick(log)}>
                    <td className={tdStyle}>{formatarData(log.createdAt)}</td><td className={tdStyle}>{log.user?.nome || 'Usuário Deletado'}</td>
                    <td className={tdStyle}>{entityTypeTranslations[log.entityType] || log.entityType}</td>
                    <td className={tdStyle}>{actionTranslations[log.action] || log.action}</td>
                    <td className={tdStyle}><span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md text-xs">{log.entityId}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 sm:px-6 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-700 dark:text-gray-300 border-t dark:border-gray-700">
          <div>Página <strong>{pagination.currentPage}</strong> de <strong>{pagination.totalPages}</strong></div>
          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <button onClick={() => setPagination(p => ({...p, currentPage: Math.max(p.currentPage - 1, 1)}))} disabled={pagination.currentPage === 1} className={btnSecondary}>Anterior</button>
            <button onClick={() => setPagination(p => ({...p, currentPage: Math.min(p.currentPage + 1, p.totalPages)}))} disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0} className={btnSecondary}>Próxima</button>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Detalhes da Atividade">
        {selectedLog && (
          <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                <div><strong className="font-semibold text-gray-900 dark:text-white">Usuário:</strong> {selectedLog.user.nome}</div>
                <div><strong className="font-semibold text-gray-900 dark:text-white">Data/Hora:</strong> {formatarData(selectedLog.createdAt)}</div>
                <div><strong className="font-semibold text-gray-900 dark:text-white">Módulo:</strong> {entityTypeTranslations[selectedLog.entityType] || selectedLog.entityType}</div>
                <div><strong className="font-semibold text-gray-900 dark:text-white">Ação:</strong> {actionTranslations[selectedLog.action] || selectedLog.action}</div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">Resumo:</h4>
              <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">{generateHumanReadableDetails(selectedLog)}</div>
            </div>

            {showTechnicalLog && (
                 <div className="space-y-2 pt-4 border-t dark:border-gray-700 animate-fade-in">
                    <h4 className="font-semibold text-amber-600 dark:text-amber-400">Log Técnico</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                        <div><strong className="font-semibold text-gray-900 dark:text-white">Log ID:</strong> {selectedLog.id}</div>
                        <div><strong className="font-semibold text-gray-900 dark:text-white">Item ID:</strong> {selectedLog.entityId}</div>
                     </div>
                    <pre className="bg-gray-900 text-white p-4 rounded-md text-xs whitespace-pre-wrap overflow-x-auto">{JSON.stringify(selectedLog.details, null, 2)}</pre>
                 </div>
            )}
            
            <div className="pt-6 flex justify-end">
                <button onClick={() => setShowTechnicalLog(!showTechnicalLog)} className={`${btnSecondary} flex items-center gap-2`}>
                    {showTechnicalLog ? <><Eye className="w-4 h-4" /> Visão Simplificada</> : <><Code className="w-4 h-4" /> Ver Log Técnico</>}
                </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
