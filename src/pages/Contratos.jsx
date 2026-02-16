import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, CheckCircle, Clock, XCircle, Loader2, ServerCrash, Check, X, Pencil, Printer, FileSignature } from 'lucide-react';
import { getContracts, updateContractStatus } from '@/services/api';
import toast from 'react-hot-toast';

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const StatusBadge = ({ status }) => {
  const statusInfo = {
    'Aguardando Assinatura': { color: 'amber', icon: Clock, bg: 'bg-amber-50', textCol: 'text-amber-700', border: 'border-amber-200' },
    'Assinado': { color: 'emerald', icon: FileSignature, bg: 'bg-emerald-50', textCol: 'text-emerald-700', border: 'border-emerald-200' },
    'Finalizado': { color: 'blue', icon: CheckCircle, bg: 'bg-blue-50', textCol: 'text-blue-700', border: 'border-blue-200' },
    'Cancelado': { color: 'rose', icon: XCircle, bg: 'bg-rose-50', textCol: 'text-rose-700', border: 'border-rose-200' },
  }[status] || { color: 'gray', icon: Clock, bg: 'bg-gray-100', textCol: 'text-gray-700', border: 'border-gray-200' };
  
  return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm tracking-wide ${statusInfo.bg} ${statusInfo.textCol} ${statusInfo.border}`}>
          <statusInfo.icon size={12} strokeWidth={2.5} />
          {status}
      </span>
  );
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
        toast.success(`Status atualizado para "${newStatus}"!`);
        if (newStatus === 'Assinado') {
            toast('O evento vinculado foi atualizado!', { icon: '🎉' });
        }
        fetchContratos();
    } catch (err) {
        toast.error(`Erro ao atualizar status: ${err.message}`);
    } finally {
        setIsUpdatingStatus(null);
    }
  };
  
  const handlePrintClick = (e, contratoId) => {
    e.stopPropagation();
    navigate(`/contratos/${contratoId}?print=true`);
  };

  const handleEditClick = (e, contratoId) => {
    e.stopPropagation();
    navigate(`/contratos/editor/${contratoId}`);
  };

  const contratosFiltrados = useMemo(() =>
    contratos.filter(c => 
        c.client?.nome?.toLowerCase().includes(termoBusca.toLowerCase()) ||
        c.codigoContrato?.toLowerCase().includes(termoBusca.toLowerCase())
    ),
    [contratos, termoBusca]
  );

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-light text-gray-800 tracking-wide flex items-center gap-3">
                Gestão de <span className="font-bold text-amber-600">Contratos</span>
                <FileSignature className="text-amber-400" size={24} />
            </h1>
            <p className="mt-1 text-gray-500 font-medium">Visualize e gerencie as formalizações dos seus eventos.</p>
        </div>
        <button 
            onClick={() => navigate('/contratos/editor/novo')} 
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all duration-300"
        >
            <Plus size={20} /> Gerar Contrato
        </button>
      </header>
      
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
            type="text" 
            placeholder="Buscar por nome do cliente ou código do contrato..." 
            value={termoBusca} 
            onChange={e => setTermoBusca(e.target.value)} 
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-gray-700 font-medium"
        />
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-200">
                <tr>
                    <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500">Ref. Contrato / Cliente</th>
                    <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 hidden md:table-cell">Emissão</th>
                    <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500">Status Legal</th>
                    <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 text-right">Valor Formalizado</th>
                    <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 text-center">Ações Rápidas</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                    <tr><td colSpan="5" className="text-center p-12 text-gray-500 font-medium"><Loader2 className="animate-spin inline-block mr-2 text-amber-500" /> Sincronizando contratos...</td></tr>
                ) : error ? (
                    <tr><td colSpan="5" className="text-center p-12 text-rose-500 font-medium"><ServerCrash className="inline-block mr-2" /> Ocorreu um erro: {error}</td></tr>
                ) : contratosFiltrados.length === 0 ? (
                    <tr><td colSpan="5" className="text-center p-16 text-gray-400 font-medium">Nenhum documento encontrado com os termos pesquisados.</td></tr>
                ) : (
                    contratosFiltrados.map(c => (
                    <tr key={c.id} onClick={() => navigate(`/contratos/${c.id}`)} className="hover:bg-amber-50/30 transition-colors group cursor-pointer">
                        <td className="p-5">
                            <p className="font-bold text-indigo-600 group-hover:text-amber-600 transition-colors">{c.codigoContrato}</p>
                            <p className="text-sm text-gray-600 font-medium mt-0.5">{c.client.nome}</p>
                        </td>
                        <td className="p-5 hidden md:table-cell font-medium text-gray-500">
                            {new Date(c.dataEmissao).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-5">
                            <StatusBadge status={c.status} />
                        </td>
                        <td className="p-5 text-right font-bold text-gray-900">
                            {formatarMoeda(c.valor)}
                        </td>
                        <td className="p-5 text-center">
                            <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => handleEditClick(e, c.id)} className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Editar Contrato">
                                    <Pencil size={18} strokeWidth={2} />
                                </button>
                                <button onClick={(e) => handlePrintClick(e, c.id)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Imprimir / PDF">
                                    <Printer size={18} strokeWidth={2} />
                                </button>
                                
                                {c.status === 'Aguardando Assinatura' && (
                                    <>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleStatusChange(c.id, 'Assinado'); }} 
                                            disabled={isUpdatingStatus === c.id}
                                            className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                                            title="Marcar como Assinado"
                                        >
                                            {isUpdatingStatus === c.id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} strokeWidth={2} />}
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleStatusChange(c.id, 'Cancelado'); }}
                                            disabled={isUpdatingStatus === c.id}
                                            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                            title="Cancelar Contrato"
                                        >
                                            <X size={18} strokeWidth={2} />
                                        </button>
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