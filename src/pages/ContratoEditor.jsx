// Caminho: frontend/src/pages/ContratoEditor.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader2, ServerCrash } from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { getAllBudgets, getContractById, createContract, updateContract, getAllClients } from '../services/api';

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

export default function ContratoEditor() {
  const navigate = useNavigate();
  const { contratoId } = useParams(); // Pode ser "novo" ou um ID
  
  const [isNewContract, setIsNewContract] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [orcamentosAprovados, setOrcamentosAprovados] = useState([]);
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState(null);
  const [conteudoContrato, setConteudoContrato] = useState('');
  const [contratoExistente, setContratoExistente] = useState(null);
  
  const fetchDadosIniciais = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
        if (contratoId === 'novo') {
            setIsNewContract(true);
            const budgets = await getAllBudgets();
            const orcamentos = budgets
                .filter(b => b.status === 'Aprovado' && !b.contract)
                .map(b => ({
                    value: b.id,
                    label: `[${b.codigoOrcamento}] ${b.client.nome} - ${b.eventName || 'N/A'}`,
                    ...b
                }));
            setOrcamentosAprovados(orcamentos);
        } else {
            setIsNewContract(false);
            const contrato = await getContractById(contratoId);
            setContratoExistente(contrato);
            setConteudoContrato(contrato.conteudo || '');
        }
    } catch (err) {
        setError(err.message);
        toast.error(`Erro ao carregar dados: ${err.message}`);
    } finally {
        setIsLoading(false);
    }
  }, [contratoId]);

  useEffect(() => {
    fetchDadosIniciais();
  }, [fetchDadosIniciais]);

  const handleOrcamentoChange = (orcamento) => {
    setOrcamentoSelecionado(orcamento);
    if (orcamento) {
        const template = `
            <h2>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>
            <p>O presente contrato tem como objeto a prestação de serviços para o evento <strong>${orcamento.eventName}</strong>.</p>
            <p>O valor total dos serviços contratados é de <strong>${formatarMoeda(orcamento.valorTotal)}</strong>.</p>
            <p>Condições de pagamento: ${orcamento.condicoesPagamento || "A combinar."}</p>
            <p>Contratante: ${orcamento.client.nome}</p>
        `;
        setConteudoContrato(template);
    } else {
        setConteudoContrato('');
    }
  };

  const handleSaveContract = async () => {
    if (isNewContract && !orcamentoSelecionado) {
        toast.error("Por favor, selecione um orçamento.");
        return;
    }
    if (!conteudoContrato) {
        toast.error("O conteúdo do contrato não pode estar vazio.");
        return;
    }
    
    setIsSaving(true);
    try {
        if (isNewContract) {
            await createContract({
                budgetId: orcamentoSelecionado.id,
                conteudo: conteudoContrato
            });
            toast.success('Contrato criado com sucesso!');
        } else {
            await updateContract(contratoId, { conteudo: conteudoContrato });
            toast.success('Contrato atualizado com sucesso!');
        }
        navigate('/contratos');
    } catch (err) {
        toast.error(`Erro ao salvar contrato: ${err.message}`);
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Carregando...</div>;
  if (error) return <div className="p-8 text-center text-red-500"><ServerCrash className="inline-block mr-2" /> {error}</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-6">
        <Link to="/contratos" className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600">
            <ArrowLeft size={16}/> Voltar para Contratos
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 sm:p-12 shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold mb-6">{isNewContract ? 'Gerar Novo Contrato' : `Editar Contrato #${contratoExistente?.codigoContrato}`}</h1>
        <div className="space-y-4">
            {isNewContract && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Orçamento Aprovado</label>
                    <Select
                        options={orcamentosAprovados}
                        onChange={handleOrcamentoChange}
                        placeholder="Selecione um orçamento aprovado..."
                        isClearable
                    />
                </div>
            )}
            
            {(isNewContract && orcamentoSelecionado) || (!isNewContract && contratoExistente) ? (
                <>
                    <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-700">
                        <h4 className="font-bold">Detalhes:</h4>
                        {isNewContract ? (
                            <>
                                <p>Cliente: {orcamentoSelecionado.client.nome}</p>
                                <p>Evento: {orcamentoSelecionado.eventName}</p>
                                <p>Valor: {formatarMoeda(orcamentoSelecionado.valorTotal)}</p>
                            </>
                        ) : (
                            <>
                                <p>Cliente: {contratoExistente.client.nome}</p>
                                <p>Valor: {formatarMoeda(contratoExistente.valor)}</p>
                                <p>Status: {contratoExistente.status}</p>
                            </>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Conteúdo do Contrato</label>
                        <textarea
                            value={conteudoContrato}
                            onChange={(e) => setConteudoContrato(e.target.value)}
                            rows="15"
                            className="mt-1 block w-full input-form font-mono text-sm"
                            placeholder="Escreva o conteúdo do contrato aqui..."
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={handleSaveContract} disabled={isSaving} className="btn-primary">
                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />} Salvar Contrato
                        </button>
                    </div>
                </>
            ) : (
                isNewContract && <p>Selecione um orçamento para começar a editar o contrato.</p>
            )}
        </div>
      </div>
    </div>
  );
}