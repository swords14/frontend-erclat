import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Eventos from './pages/Eventos';
import Clientes from './pages/Clientes';
import Orcamentos from './pages/Orcamentos';
import Contratos from './pages/Contratos';
import ContratoDetalhe from './pages/ContratoDetalhe';
import Financeiro from './pages/Financeiro';
import Fornecedores from './pages/Fornecedores';
import Estoque from './pages/Estoque';
import CalendarioEquipe from './pages/CalendarioEquipe';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import PerfilCliente from './pages/PerfilCliente';
import { Toaster } from 'react-hot-toast';

// Imports existentes
import Avaliacoes from './pages/Avaliacoes';
import FeedbackForm from './pages/FeedbackForm';
import AuditoriaPage from './pages/AuditoriaPage';
import FunilDeVendas from './pages/FunilDeVendas';

// --- Páginas do Studio de Layouts ---
import LayoutListPage from './pages/LayoutListPage';
import LayoutEditorPage from './pages/LayoutEditorPage';

// --- NOVA PÁGINA DE TAREFAS ---
import TarefasPage from './pages/TarefasPage';

// --- NOVO IMPORT PARA O COMPONENTE DE EDIÇÃO/CRIAÇÃO DE CONTRATO ---
import ContratoEditor from './pages/ContratoEditor';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/feedback/:feedbackId" element={<FeedbackForm />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="eventos" element={<Eventos />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/:clienteId" element={<PerfilCliente />} />
          <Route path="funil-de-vendas" element={<FunilDeVendas />} />
          <Route path="orcamentos" element={<Orcamentos />} />
          <Route path="contratos" element={<Contratos />} />
          <Route path="contratos/:contratoId" element={<ContratoDetalhe />} />

          {/* ROTA ATUALIZADA PARA EDIÇÃO E CRIAÇÃO */}
          <Route path="contratos/editor/:contratoId" element={<ContratoEditor />} />

          {/* --- ROTA PARA A NOVA PÁGINA DE TAREFAS --- */}
          <Route path="tarefas" element={<TarefasPage />} />

          <Route path="financeiro" element={<Financeiro />} />
          
          {/* --- Rotas para o Studio de Layouts --- */}
          <Route path="layouts" element={<LayoutListPage />} />
          <Route path="layouts/new" element={<LayoutEditorPage />} />
          <Route path="layouts/edit/:id" element={<LayoutEditorPage />} />
          
          <Route path="fornecedores" element={<Fornecedores />} />
          <Route path="estoque" element={<Estoque />} />
          <Route path="calendario-equipe" element={<CalendarioEquipe />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="avaliacoes" element={<Avaliacoes />} />
          <Route path="auditoria" element={<AuditoriaPage />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
