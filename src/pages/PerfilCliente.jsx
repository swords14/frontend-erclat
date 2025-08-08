import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Plus, Calendar, FileText, MessageSquare } from 'lucide-react';

// DADOS DE EXEMPLO (Em um app real, seriam buscados de uma API)
const mockClientes = [
    { id: 1, nome: 'Ana Souza', email: 'ana.souza@example.com', telefone: '(85) 99999-1111', dataCadastro: '2025-01-15' },
    { id: 2, nome: 'Carlos Lima', email: 'carlos.lima@example.com', telefone: '(85) 98888-2222', dataCadastro: '2025-02-20' },
    { id: 3, nome: 'Mariana Reis', email: 'mariana.reis@example.com', telefone: '(85) 99999-3333', dataCadastro: '2025-03-10' },
    { id: 4, nome: 'Pedro Costa', email: 'pedro.costa@example.com', telefone: '(85) 98888-4444', dataCadastro: '2025-04-05' },
];
const mockEventosDoCliente = [
    { id: 1, evento: 'Casamento', data: '2025-12-15', status: 'Realizado', valor: 12500 },
    { id: 2, evento: 'Aniversário', data: '2026-08-20', status: 'Confirmado', valor: 7200 }
];
const mockOrcamentosDoCliente = [
    { id: 1, evento: 'Bodas de Prata', data: '2026-02-10', status: 'Enviado', valor: 9800 }
];

export default function PerfilCliente() {
  const { clienteId } = useParams(); // Pega o ID do cliente da URL
  const [abaAtiva, setAbaAtiva] = useState('eventos');

  // Simula a busca do cliente e seus dados relacionados
  const cliente = useMemo(() => mockClientes.find(c => c.id == clienteId), [clienteId]);
  
  if (!cliente) {
    return (
        <div className="text-center p-8">
            <h1 className="text-2xl font-bold mb-4">Cliente não encontrado</h1>
            <Link to="/clientes" className="text-indigo-600 hover:underline">
                Voltar para a lista de clientes
            </Link>
        </div>
    );
  }

  const abas = [
    {id: 'eventos', nome: 'Histórico de Eventos', icon: Calendar},
    {id: 'orcamentos', nome: 'Orçamentos', icon: FileText},
    {id: 'anotacoes', nome: 'Anotações', icon: MessageSquare}
  ];

  return (
    <div className="space-y-6">
      {/* --- CABEÇALHO DO PERFIL --- */}
      <div>
        <Link to="/clientes" className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-4">
            <ArrowLeft size={16}/> Voltar para a lista de clientes
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <img src={`https://i.pravatar.cc/100?u=${cliente.email}`} alt={cliente.nome} className="w-20 h-20 rounded-full"/>
            <div>
              <h1 className="text-3xl font-bold">{cliente.nome}</h1>
              <p className="text-gray-500">{cliente.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary flex items-center gap-2"><Edit size={16}/> Editar Cliente</button>
            <button className="btn-primary flex items-center gap-2"><Plus size={16}/> Novo Orçamento</button>
          </div>
        </div>
      </div>
      
      {/* --- KPIS DO CLIENTE --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md text-center"><p className="text-sm text-gray-500">Total Gasto</p><p className="text-2xl font-bold text-green-500">R$ 19.700,00</p></div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md text-center"><p className="text-sm text-gray-500">Eventos Realizados</p><p className="text-2xl font-bold">2</p></div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md text-center"><p className="text-sm text-gray-500">Próximo Evento</p><p className="text-2xl font-bold">20/08/2026</p></div>
      </div>

      {/* --- ABAS COM CONTEÚDO --- */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
        <div className="flex items-center border-b dark:border-gray-700 mb-4">
            {abas.map(aba => (
                 <button key={aba.id} onClick={() => setAbaAtiva(aba.id)} className={`px-4 py-2 font-semibold transition flex items-center gap-2 ${abaAtiva === aba.id ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-white' : 'text-gray-500'}`}>
                    <aba.icon size={16}/> {aba.nome}
                 </button>
            ))}
        </div>
        <div>
            {abaAtiva === 'eventos' && (
                <ul className="space-y-3">{mockEventosDoCliente.map(e => <li key={e.id} className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 flex justify-between"><div><span className="font-semibold">{e.evento}</span> - <span className="text-sm text-gray-500">{new Date(e.data).toLocaleDateString('pt-BR')}</span></div><span className="font-bold">{new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'}).format(e.valor)}</span></li>)}</ul>
            )}
             {abaAtiva === 'orcamentos' && (
                <ul className="space-y-3">{mockOrcamentosDoCliente.map(o => <li key={o.id} className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 flex justify-between"><div><span className="font-semibold">{o.evento}</span> - <span className="text-sm text-gray-500">{new Date(o.data).toLocaleDateString('pt-BR')}</span></div><span className={`px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800`}>{o.status}</span></li>)}</ul>
            )}
            {abaAtiva === 'anotacoes' && (
                <div className="space-y-4"><textarea className="input-form w-full" rows="4" placeholder="Adicionar uma nova anotação sobre este cliente..."></textarea><div className="flex justify-end"><button className="btn-primary">Salvar Anotação</button></div></div>
            )}
        </div>
      </div>
    </div>
  );
}