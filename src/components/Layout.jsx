import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  // 1. Estado para controlar se a sidebar está recolhida
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      {/* 2. Passa o estado e a função para a Sidebar */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} 
      />
      {/* O <main> se ajustará automaticamente por causa do flexbox */}
      <main className="flex-1 p-6 lg:p-8 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}