import React from 'react';
import { Image as ImageIcon, Video } from 'lucide-react'; // Ícones para os assets

const DraggableObject = ({ type, icon: Icon, label }) => {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type, label }));
      }}
      className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-300 cursor-grab transition-colors text-left"
      title={`Arrastar para adicionar ${label}`}
    >
      <Icon className="h-8 w-8 flex-shrink-0" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
};

export default function ObjectLibrary() {
  return (
    <div className="flex flex-col space-y-3">
      <DraggableObject 
        type="bar"
        icon={ImageIcon} 
        label="Bar (Balcão)" 
      />
       <DraggableObject 
        type="bargif"
        icon={Video} 
        label="Bar Animado" 
      />
      <DraggableObject 
        type="mesa4" 
        icon={ImageIcon} 
        label="Mesa (4 Lugares)" 
      />
      <DraggableObject 
        type="mesa8" 
        icon={ImageIcon} 
        label="Mesa (8 Lugares)" 
      />
       <DraggableObject 
        type="planta" 
        icon={ImageIcon} 
        label="Planta 1" 
      />
       <DraggableObject 
        type="planta2" 
        icon={ImageIcon} 
        label="Planta 2" 
      />
       <DraggableObject 
        type="piscina" 
        icon={ImageIcon} 
        label="Piscina" 
      />
    </div>
  );
}