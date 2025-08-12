// Caminho: frontend/src/pages/ContratoNovo.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { getAllBudgets, createContract } from '@/services/api';

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

// A linha abaixo é crucial para o "default" export
export default function ContratoNovo() { 
  const navigate = useNavigate();
  const [orcamentosAprovados, setOrcamentosAprovados] = useState([]);
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState(null);
  const [conteudoContrato, setConteudoContrato] = useState('');
  const [isLoadingOrcamentos, setIsLoadingOrcamentos] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchOrcamentosAprovados = useCallback(async () => {
    try {
        setIsLoadingOrcamentos(true);
        const data = await getAllBudgets();
        const orcamentos = data
            .filter(b => b.status === 'Aprovado' && !b.contract)
            .map(b => ({
                value: b.id,
                label: `[${b.codigoOrcamento}] ${b.client.nome} - ${b.eventName || 'N/A'}`,
                budgetId: b.id,
                ...b
            }));
        setOrcamentosAprovados(orcamentos);
    } catch (err) {
        toast.error("Erro ao carregar orçamentos aprovados.");
    } finally {
        setIsLoadingOrcamentos(false);
    }
  }, []);

  useEffect(() => {
    fetchOrcamentosAprovados();
  }, [fetchOrcamentosAprovados]);

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

  const handleCreateContract = async () => {
    if (!orcamentoSelecionado || !conteudoContrato) {
        toast.error("Por favor, selecione um orçamento e preencha o contrato.");
        return;
    }
    setIsCreating(true);
    try {
        const novoContrato = await createContract({
            budgetId: orcamentoSelecionado.budgetId,
            conteudo: conteudoContrato
        });
        toast.success('Contrato criado com sucesso!');
        navigate(`/contratos/${novoContrato.id}`);
    } catch (err) {
        toast.error(`Erro ao criar contrato: ${err.message}`);
    } finally {
        setIsCreating(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-6">
        <Link to="/contratos" className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600">
            <ArrowLeft size={16}/> Voltar para Contratos
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 sm:p-12 shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold mb-6">Gerar Novo Contrato</h1>
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Orçamento Aprovado</label>
                {isLoadingOrcamentos ? (
                    <div className="mt-2 text-gray-500"><Loader2 className="animate-spin inline-block mr-2" /> Carregando orçamentos...</div>
                ) : (
                    <Select
                        options={orcamentosAprovados}
                        onChange={handleOrcamentoChange}
                        placeholder="Selecione um orçamento aprovado..."
                        isClearable
                    />
                )}
            </div>
            {orcamentoSelecionado && (
                <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-700">
                    <h4 className="font-bold">Detalhes do Orçamento:</h4>
                    <p>Cliente: {orcamentoSelecionado.client.nome}</p>
                    <p>Evento: {orcamentoSelecionado.eventName}</p>
                    <p>Valor: {formatarMoeda(orcamentoSelecionado.valorTotal)}</p>
                </div>
            )}
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
                <button onClick={handleCreateContract} disabled={isCreating} className="btn-primary">
                    {isCreating ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />} Salvar Contrato
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}