import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLayouts } from '@/services/api'; // <-- MUDANÇA IMPORTANTE AQUI
import { PlusCircle, Grid } from 'lucide-react';

export default function LayoutListPage() {
  const [layouts, setLayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLayouts()
      .then(response => {
        setLayouts(response);
      })
      .catch(error => console.error("Erro ao buscar layouts:", error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div>Carregando layouts...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Studio de Layouts</h1>
        <Link
          to="/layouts/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
        >
          <PlusCircle size={20} />
          Criar Novo Layout
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {layouts.map(layout => (
          <Link to={`/layouts/edit/${layout.id}`} key={layout.id} className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
            <Grid className="text-indigo-500 mb-2" size={32} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{layout.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Atualizado em: {new Date(layout.updatedAt).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>
       {layouts.length === 0 && !loading && (
        <div className="text-center py-10 col-span-full">
          <p className="text-gray-500">Nenhum layout encontrado. Que tal criar o primeiro?</p>
        </div>
      )}
    </div>
  );
}