import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stage, Layer } from 'react-konva';
import { getLayoutById, createLayout, updateLayout } from '../services/api';
import ObjectLibrary from '../components/LayoutEditor/ObjectLibrary';
import PropertiesPanel from '../components/LayoutEditor/PropertiesPanel';
import useMeasure from 'react-use-measure';

// --- Seus assets personalizados ---
import Bar from '../components/LayoutEditor/assets/Bar';
import BarGif from '../components/LayoutEditor/assets/BarGif';
import Mesa4 from '../components/LayoutEditor/assets/Mesa4';
import Mesa8 from '../components/LayoutEditor/assets/Mesa8';
import Planta from '../components/LayoutEditor/assets/Planta';
import Planta2 from '../components/LayoutEditor/assets/Planta2';
import Piscina from '../components/LayoutEditor/assets/Piscina';

// Componente Asset, responsável por renderizar o tipo correto
const Asset = ({ assetProps, isSelected, onSelect, onChange }) => {
  const assetRef = useRef();

  const commonProps = {
    ...assetProps,
    onClick: onSelect,
    onTap: onSelect,
    ref: assetRef,
    draggable: true,
    stroke: isSelected ? '#007BFF' : (assetProps.stroke || '#333'),
    strokeWidth: isSelected ? 3.5 : 0,
    shadowColor: isSelected ? '#007BFF' : 'black',
    shadowBlur: isSelected ? 10 : 5,
    shadowOpacity: isSelected ? 0.8 : 0.3,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    onDragEnd: (e) => {
      onChange({ ...assetProps, x: e.target.x(), y: e.target.y() });
    },
  };

  switch (assetProps.type) {
    case 'bar': return <Bar {...commonProps} />;
    case 'bargif': return <BarGif {...commonProps} />;
    case 'mesa4': return <Mesa4 {...commonProps} />;
    case 'mesa8': return <Mesa8 {...commonProps} />;
    case 'planta': return <Planta {...commonProps} />;
    case 'planta2': return <Planta2 {...commonProps} />;
    case 'piscina': return <Piscina {...commonProps} />;
    default: return null;
  }
};

// Componente de Notificação Simples
const Notification = ({ message }) => {
  if (!message) return null;
  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg z-50 animate-pulse">
      {message}
    </div>
  );
};

export default function LayoutEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const stageRef = useRef();
  const [mainRef, bounds] = useMeasure();

  const [name, setName] = useState('');
  const [objects, setObjects] = useState([]);
  const [selectedId, selectShape] = useState(null);
  const [notification, setNotification] = useState('');

  // Estados para zoom e pan
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isNew && id) {
      getLayoutById(id).then(data => {
        setName(data.name);
        setObjects(JSON.parse(data.layoutJson));
      }).catch(err => {
        console.error("Falha ao carregar layout:", err);
        navigate('/'); // Redireciona se o layout não for encontrado
      });
    }
  }, [id, isNew, navigate]);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleSave = async () => {
    const payload = {
      name: name || 'Layout Sem Título',
      layoutJson: JSON.stringify(objects),
    };
    try {
      if (isNew) {
        await createLayout(payload);
      } else {
        await updateLayout(id, payload);
      }
      showNotification('Layout salvo com sucesso!');
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      console.error('Falha ao salvar o layout:', error);
      showNotification('Erro ao salvar. Tente novamente.');
    }
  };

  const checkDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    stageRef.current.setPointersPositions(e);
    const position = stageRef.current.getPointerPosition();
    const data = JSON.parse(e.dataTransfer.getData('application/json'));

    const newAsset = {
      id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: data.type,
      x: (position.x - stagePos.x) / stageScale,
      y: (position.y - stagePos.y) / stageScale,
      rotation: 0,
      label: data.label || `Novo ${data.type}`
    };
    setObjects([...objects, newAsset]);
  };
  
  const updateObject = (updatedProps) => {
    const index = objects.findIndex(o => o.id === updatedProps.id);
    if(index !== -1) {
      const newObjects = [...objects];
      newObjects[index] = updatedProps;
      setObjects(newObjects);
    }
  };
  
  const handleDelete = (idToDelete) => {
    setObjects(objects.filter(obj => obj.id !== idToDelete));
    selectShape(null);
  };

  const handleDuplicate = (idToDuplicate) => {
    const original = objects.find(obj => obj.id === idToDuplicate);
    if(original) {
      const newAsset = {
        ...original,
        id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        x: original.x + 20,
        y: original.y + 20,
      };
      setObjects([...objects, newAsset]);
      selectShape(newAsset.id);
    }
  };

  const handleExport = () => {
    const uri = stageRef.current.toDataURL({
      mimeType: "image/png",
      quality: 1,
      pixelRatio: 2
    });
    const link = document.createElement('a');
    link.download = `${name || 'layout'}.png`;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const selectedObject = objects.find(o => o.id === selectedId);

  return (
    <div className="h-screen w-full flex flex-col bg-gray-200 dark:bg-gray-900 overflow-hidden">
       <Notification message={notification} />
      <header className="p-3 px-4 bg-white dark:bg-gray-800 shadow-md z-10 flex items-center gap-4 flex-shrink-0">
        <div className="flex-grow">
          <input 
            type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do Layout" 
            className="font-bold text-lg p-2 bg-transparent focus:bg-gray-100 dark:focus:bg-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 w-full dark:text-white" 
          />
        </div>
        <button onClick={handleExport} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">Exportar PNG</button>
        <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">Salvar</button>
      </header>

      <div className="flex-grow flex border-t border-gray-200 dark:border-gray-700">
        <aside className="w-64 bg-white dark:bg-gray-800 p-4 overflow-y-auto border-r flex-shrink-0">
          <h2 className="text-sm font-bold mb-4 text-gray-800 dark:text-gray-200 uppercase tracking-wider">Biblioteca</h2>
          <ObjectLibrary />
        </aside>

        <main ref={mainRef} className="flex-grow grid-background" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
          <Stage 
            ref={stageRef} 
            width={bounds.width} 
            height={bounds.height} 
            onMouseDown={checkDeselect} 
            onTouchStart={checkDeselect}
            onWheel={handleWheel}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePos.x}
            y={stagePos.y}
            draggable
            onDragEnd={(e) => {
              setStagePos(e.target.position());
            }}
          >
            <Layer>
              {objects.map((obj) => (
                <Asset
                  key={obj.id}
                  assetProps={obj}
                  isSelected={obj.id === selectedId}
                  onSelect={() => selectShape(obj.id)}
                  onChange={(newAttrs) => updateObject(newAttrs)}
                />
              ))}
            </Layer>
          </Stage>
        </main>

        <aside className="w-64 bg-white dark:bg-gray-800 p-4 overflow-y-auto border-l flex-shrink-0">
          <h2 className="text-sm font-bold mb-4 text-gray-800 dark:text-gray-200 uppercase tracking-wider">Propriedades</h2>
          <PropertiesPanel 
             selectedObject={selectedObject} 
             onUpdate={updateObject}
             onDelete={handleDelete}
             onDuplicate={handleDuplicate}
          />
        </aside>
      </div>
    </div>
  );
}