// Caminho: frontend/src/pages/Contratos.jsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, CheckCircle, Clock, XCircle, Loader2, ServerCrash, Check, X, Edit, Printer } from 'lucide-react';
import { getContracts, updateContractStatus } from '../services/api';
import toast from 'react-hot-toast';

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const StatusBadge = ({ status }) => {
  const statusInfo = {
    'Aguardando Assinatura': { color: 'yellow', icon: Clock },
    'Assinado': { color: 'green', icon: CheckCircle },
    'Finalizado': { color: 'blue', icon: CheckCircle },
    'Cancelado': { color: 'red', icon: XCircle },
  }[status] || { color: 'gray', icon: Clock };
  
  const colors = { 
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', 
      green: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', 
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', 
      red: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700'
  };
  
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[statusInfo.color]}`}><statusInfo.icon size={14} />{status}</span>;
};

export default function Contratos() {
  const [contratos, setContratos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(null);
  const [error, setError] = useState(null);
  const [termoBusca, setTermoBusca] = useState('');
  const navigate = useNavigate();

  const fetchContratos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getContracts();
      setContratos(data);
    } catch (err) {
      setError(err.message);
      toast.error(`Erro ao buscar contratos: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContratos();
  }, [fetchContratos]);

  const handleStatusChange = async (contratoId, newStatus) => {
    if (!window.confirm(`Tem certeza que deseja alterar o status para "${newStatus}"?`)) return;
    
    setIsUpdatingStatus(contratoId);
    try {
        await updateContractStatus(contratoId, newStatus);
        toast.success(`Status do contrato atualizado para "${newStatus}"!`);
        if (newStatus === 'Assinado') {
            toast('Um novo evento foi gerado automaticamente!', { icon: '🎉' });
        }
        fetchContratos();
    } catch (err) {
        toast.error(`Erro ao atualizar status: ${err.message}`);
    } finally {
        setIsUpdatingStatus(null);
    }
  };
  
  const handlePrintClick = (contratoId) => {
    // Redireciona para a página de detalhes com um parâmetro para imprimir
    navigate(`/contratos/${contratoId}?print=true`);
  };

  const contratosFiltrados = useMemo(() =>
    contratos.filter(c => 
        c.client?.nome?.toLowerCase().includes(termoBusca.toLowerCase()) ||
        c.codigoContrato?.toLowerCase().includes(termoBusca.toLowerCase())
    ),
    [contratos, termoBusca]
  );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-3xl font-bold">Gestão de Contratos</h1><p className="mt-1 text-gray-500">Visualize e gerencie seus contratos ativos.</p></div>
        <motion.button onClick={() => navigate('/contratos/editor/novo')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary flex items-center gap-2"><Plus size={20} />Gerar Contrato</motion.button>
      </div>
      
      <div className="relative">
        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar por cliente ou código do contrato..." value={termoBusca} onChange={e => setTermoBusca(e.target.value)} className="w-full pl-10 pr-4 py-2 input-form"/>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="table-header"><tr><th className="p-4">Contrato / Cliente</th><th className="p-4 hidden md:table-cell">Data de Emissão</th><th className="p-4">Status</th><th className="p-4 text-right">Valor</th><th className="p-4 text-center">Ações</th></tr></thead>
            <tbody>
                {isLoading ? (
                    <tr><td colSpan="5" className="text-center p-8"><Loader2 className="animate-spin inline-block mr-2" /> Carregando contratos...</td></tr>
                ) : error ? (
                    <tr><td colSpan="5" className="text-center p-8 text-red-500"><ServerCrash className="inline-block mr-2" /> {error}</td></tr>
                ) : contratosFiltrados.length === 0 ? (
                    <tr><td colSpan="5" className="text-center p-8 text-gray-500">Nenhum contrato encontrado.</td></tr>
                ) : (
                    contratosFiltrados.map(c => (
                    <tr key={c.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <td className="p-4 font-medium" onClick={() => navigate(`/contratos/${c.id}`)}><span className="cursor-pointer hover:underline">{c.codigoContrato}</span><br/><span className="text-sm text-gray-500">{c.client.nome}</span></td>
                        <td className="p-4 hidden md:table-cell" onClick={() => navigate(`/contratos/${c.id}`)}>{new Date(c.dataEmissao).toLocaleDateString('pt-BR')}</td>
                        <td className="p-4" onClick={() => navigate(`/contratos/${c.id}`)}><StatusBadge status={c.status} /></td>
                        <td className="p-4 text-right font-semibold" onClick={() => navigate(`/contratos/${c.id}`)}>{formatarMoeda(c.valor)}</td>
                        <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <motion.button onClick={() => navigate(`/contratos/editor/${c.id}`)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                    <Edit size={18} className="text-gray-600 dark:text-gray-300" />
                                </motion.button>
                                <motion.button onClick={() => handlePrintClick(c.id)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                    <Printer size={18} className="text-indigo-600" />
                                </motion.button>
                                {c.status === 'Aguardando Assinatura' && (
                                    <>
                                        <motion.button 
                                            onClick={() => handleStatusChange(c.id, 'Assinado')} 
                                            disabled={isUpdatingStatus === c.id}
                                            whileHover={{ scale: 1.1 }} 
                                            whileTap={{ scale: 0.9 }} 
                                            className="p-2 rounded-md text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50"
                                        >
                                            {isUpdatingStatus === c.id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                        </motion.button>
                                        <motion.button 
                                            onClick={() => handleStatusChange(c.id, 'Cancelado')}
                                            disabled={isUpdatingStatus === c.id}
                                            whileHover={{ scale: 1.1 }} 
                                            whileTap={{ scale: 0.9 }} 
                                            className="p-2 rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50"
                                        >
                                            <X size={18} />
                                        </motion.button>
                                    </>
                                )}
                            </div>
                        </td>
                    </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}