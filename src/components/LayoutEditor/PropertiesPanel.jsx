import React from 'react';
import { MousePointerClick, Copy, Trash2 } from 'lucide-react';

export default function PropertiesPanel({ selectedObject, onUpdate, onDelete, onDuplicate }) {
  if (!selectedObject) {
    return (
      <div className="text-center mt-16 flex flex-col items-center">
        <MousePointerClick className="h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">Nenhum objeto selecionado</h3>
        <p className="mt-1 text-sm text-gray-500">Clique em um objeto no palco para ver suas propriedades.</p>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericValue = ['rotation'].includes(name) ? parseFloat(value) : value;
    
    onUpdate({
      ...selectedObject,
      [name]: numericValue,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rótulo</label>
        <input
          type="text"
          name="label"
          value={selectedObject.label || ''}
          onChange={handleChange}
          className="block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cor de Preenchimento</label>
        <input
          type="color"
          name="fill"
          value={selectedObject.fill || '#D2B48C'}
          onChange={handleChange}
          className="block w-full h-10 rounded-md border-gray-300 dark:border-gray-600 p-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Rotação: {Math.round(selectedObject.rotation || 0)}°
        </label>
        <input
          type="range"
          name="rotation"
          min="0"
          max="360"
          step="1"
          value={selectedObject.rotation || 0}
          onChange={handleChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-3">
         <button
          onClick={() => onDuplicate(selectedObject.id)}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <Copy size={16} />
          Duplicar
        </button>

        <button
          onClick={() => onDelete(selectedObject.id)}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
          Deletar
        </button>
      </div>
    </div>
  );
}