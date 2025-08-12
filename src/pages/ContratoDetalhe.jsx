// Caminho: frontend/src/pages/ContratoDetalhe.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Edit, Loader2, ServerCrash, Check, X } from 'lucide-react';
import { getContractById, updateContractStatus } from '@/services/api';
import toast from 'react-hot-toast';

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
const formatarData = (data) => data ? new Date(data).toLocaleDateString('pt-BR') : 'N/A';

export default function ContratoDetalhe() {
  const { contratoId } = useParams();
  const navigate = useNavigate();
  const [contrato, setContrato] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const fetchContrato = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getContractById(contratoId);
      setContrato(data);
    } catch (err) {
      setError(err.message);
      toast.error(`Erro ao buscar detalhes do contrato: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [contratoId]);

  useEffect(() => {
    fetchContrato();
  }, [fetchContrato]);

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Tem certeza que deseja alterar o status para "${newStatus}"?`)) return;

    setIsUpdating(true);
    try {
      await updateContractStatus(contratoId, newStatus);
      toast.success(`Status do contrato atualizado para "${newStatus}"!`);
      if (newStatus === 'Assinado') {
          toast('Um novo evento foi gerado automaticamente!', { icon: '🎉' });
      }
      fetchContrato();
    } catch (err) {
      toast.error(`Erro ao atualizar status: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Carregando contrato...</div>;
  if (error) return <div className="p-8 text-center text-red-500"><ServerCrash className="inline-block mr-2" /> {error}</div>;
  if (!contrato) return <div className="p-8 text-center">Contrato não encontrado.</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <Link to="/contratos" className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600">
            <ArrowLeft size={16}/> Voltar para a lista de contratos
        </Link>
        <div className="flex items-center gap-2">
            {contrato.status === 'Aguardando Assinatura' && (
                <>
                    <button onClick={() => handleStatusChange('Assinado')} disabled={isUpdating} className="btn-success flex items-center gap-2">
                        {isUpdating ? <Loader2 className="animate-spin"/> : <Check size={16}/>} Marcar como Assinado
                    </button>
                    <button onClick={() => handleStatusChange('Cancelado')} disabled={isUpdating} className="btn-danger flex items-center gap-2">
                        <X size={16}/> Cancelar Contrato
                    </button>
                </>
            )}
            <button onClick={() => window.print()} className="btn-primary flex items-center gap-2"><Printer size={16}/> Imprimir / Salvar PDF</button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 sm:p-12 shadow-lg rounded-lg printable-area">
        <header className="flex justify-between items-start border-b pb-6">
            <div>
                <h1 className="text-3xl font-bold">ÉclatERP</h1>
                <p className="text-sm">Seu Parceiro de Eventos</p>
            </div>
            <div className="text-right">
                <h2 className="text-2xl font-bold">CONTRATO #{contrato.codigoContrato}</h2>
                <p className="text-sm">Data de Emissão: {formatarData(contrato.dataEmissao)}</p>
                <p className="text-sm font-semibold">Status: {contrato.status}</p>
            </div>
        </header>

        {contrato.conteudo ? (
            <div className="my-8 text-sm" dangerouslySetInnerHTML={{ __html: contrato.conteudo }} />
        ) : (
            <>
                <section className="my-8 space-y-4 text-sm">
                    <h3 className="font-bold text-lg mb-4">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h3>
                    <div>
                        <p className="font-semibold">CONTRATADA:</p>
                        <p>ÉCLAT SOLUÇÕES EM EVENTOS LTDA (Exemplo), CNPJ 00.000.000/0001-00.</p>
                    </div>
                    <div>
                        <p className="font-semibold">CONTRATANTE:</p>
                        <p>{contrato.client.nome}, CPF/CNPJ: {contrato.client.cpf || contrato.client.cnpj}</p>
                    </div>
                </section>

                <section className="my-8 text-sm space-y-2">
                    <h4 className="font-bold border-b pb-1">CLÁUSULA 1ª - DO OBJETO DO CONTRATO</h4>
                    <p>O presente contrato tem como objeto a prestação de serviços para o evento **{contrato.budget.eventName}**.</p>
                </section>
                
                <section className="my-8 text-sm space-y-2">
                    <h4 className="font-bold border-b pb-1">CLÁUSULA 2ª - DO VALOR E DA FORMA DE PAGAMENTO</h4>
                    <p>O valor total dos serviços contratados é de **{formatarMoeda(contrato.valor)}**.</p>
                    <p>Condições de pagamento: {contrato.budget.condicoesPagamento || "A combinar."}</p>
                </section>
            </>
        )}

        <footer className="pt-12 mt-12 text-center text-sm">
            <div className="grid grid-cols-2 gap-8">
                <div><hr className="border-gray-400"/><p className="mt-2">CONTRATADA</p></div>
                <div><hr className="border-gray-400"/><p className="mt-2">{contrato.client.nome}</p></div>
            </div>
        </footer>
      </div>
    </div>
  );
}