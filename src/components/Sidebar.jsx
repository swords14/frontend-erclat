import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Users, DollarSign, FileText, Settings, LogOut, Menu, X, ChevronsLeft, ChevronsRight,
  Truck,
  BarChart2,
  CalendarClock,
  Archive,
  FileSignature,
  Star,
  ClipboardCheck, // Ícone já importado, ótimo!
  Filter,
  Grid,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const linkClasses = "flex items-center gap-3 p-2 rounded-lg transition-colors";
const activeLinkClasses = "font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-gray-700";
const inactiveLinkClasses = "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400";

export default function Sidebar({ isCollapsed, toggleSidebar }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { logout } = useAuth();

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink to={to} title={isCollapsed ? label : ''} className={({ isActive }) => `${linkClasses} ${isCollapsed ? 'justify-center' : ''} ${isActive ? activeLinkClasses : inactiveLinkClasses}`} onClick={() => setMobileSidebarOpen(false)}>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{label}</span>
    </NavLink>
  );

  return (
    <>
      <button className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(true)} aria-label="Abrir menu"><Menu className="w-6 h-6" /></button>
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 shadow-lg flex flex-col transform transition-all duration-300 ease-in-out ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className={`flex items-center p-4 transition-all ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <h1 className={`text-2xl font-bold text-indigo-600 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>ÉclatERP</h1>
          <button className="md:hidden p-2 rounded-md hover:bg-indigo-100 dark:hover:bg-gray-700" onClick={() => setMobileSidebarOpen(false)} aria-label="Fechar menu"><X className="w-6 h-6" /></button>
        </div>
        <nav className="flex flex-col gap-2 px-4 flex-grow">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/eventos" icon={CalendarDays} label="Eventos" />
          <NavItem to="/clientes" icon={Users} label="Clientes" />
          <NavItem to="/funil-de-vendas" icon={Filter} label="Funil de Vendas" />
          <NavItem to="/orcamentos" icon={FileText} label="Orçamentos" />
          <NavItem to="/contratos" icon={FileSignature} label="Contratos" />
          
          {/* --- NOVO ITEM DE MENU ADICIONADO --- */}
          <NavItem to="/tarefas" icon={ClipboardCheck} label="Tarefas" />
          
          <NavItem to="/financeiro" icon={DollarSign} label="Financeiro" />
          
          <div className="my-2 border-t dark:border-gray-700"></div>
          <NavItem to="/layouts" icon={Grid} label="Studio de Layouts" />
          <div className="my-2 border-t dark:border-gray-700"></div>
          
          <NavItem to="/fornecedores" icon={Truck} label="Fornecedores" />
          <NavItem to="/estoque" icon={Archive} label="Estoque" />
          <NavItem to="/calendario-equipe" icon={CalendarClock} label="Calendário Equipe" />
          <NavItem to="/relatorios" icon={BarChart2} label="Relatórios" />
          <NavItem to="/avaliacoes" icon={Star} label="Avaliações" />
         <NavItem to="/auditoria" icon={ClipboardCheck} label="Auditoria" />
          <div className="my-2 border-t dark:border-gray-700"></div>

          <NavItem to="/configuracoes" icon={Settings} label="Configurações" />
        </nav>
        <div className="p-4 border-t dark:border-gray-700">
          <button onClick={toggleSidebar} className={`hidden md:flex ${linkClasses} ${inactiveLinkClasses} w-full`}>
            {isCollapsed ? <ChevronsRight className="h-5 w-5 flex-shrink-0" /> : <ChevronsLeft className="h-5 w-5 flex-shrink-0" />}
            <span className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Recolher</span>
          </button>
          <button onClick={logout} title={isCollapsed ? 'Sair' : ''} className={`flex items-center gap-3 p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition w-full ${isCollapsed ? 'justify-center' : ''}`}>
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}