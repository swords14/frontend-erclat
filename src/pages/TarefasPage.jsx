// Caminho: frontend/src/pages/TarefasPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlusCircle, X, Edit, Trash2, Filter, Search, ClipboardCheck, Loader2 } from 'lucide-react';
import { 
    getTasks, createTask, getAllUsers as getUsers, getAllClients as getClients,
    updateTask, deleteTask 
} from '@/services/api'; 
import toast from 'react-hot-toast';

// --- COMPONENTES AUXILIARES DE UI ---

const StatusBadge = ({ status }) => {
    const statusStyles = {
        'Pendente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        'Em Andamento': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        'Concluída': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

const PriorityBadge = ({ priority }) => {
    const priorityStyles = {
        'Baixa': 'text-gray-500 dark:text-gray-400',
        'Normal': 'text-green-600 dark:text-green-400',
        'Alta': 'text-orange-500 dark:text-orange-400',
        'Crítica': 'text-red-600 dark:text-red-400 font-bold',
    };
    return <span className={`${priorityStyles[priority] || ''}`}>{priority}</span>;
};

const TaskForm = ({ onClose, onTaskSaved, users, clients, taskToEdit }) => {
  const [activeTab, setActiveTab] = useState('principal');
  const [formData, setFormData] = useState({
    title: taskToEdit?.title || '',
    description: taskToEdit?.description || '',
    status: taskToEdit?.status || 'Pendente',
    priority: taskToEdit?.priority || 'Normal',
    dueDate: taskToEdit?.dueDate ? new Date(taskToEdit.dueDate).toISOString().split('T')[0] : '',
    // CORRIGIDO: Tipos de dados de assignedToId e clientId agora são Number
    assignedToId: taskToEdit?.assignedToId || null,
    clientId: taskToEdit?.clientId || null,
    tags: taskToEdit?.tags?.join(', ') || '',
    subTasks: taskToEdit?.subTasks || [],
  });
  const [newSubtaskText, setNewSubtaskText] = useState('');

  const handleChange = (e) => {
      const { name, value, type } = e.target;
      setFormData(prev => ({ 
          ...prev, 
          [name]: (name === 'assignedToId' || name === 'clientId') ? (value ? Number(value) : null) : value
      }));
  };

  const handleSubtaskChange = (index, field, value) => {
    const updatedSubtasks = [...formData.subTasks];
    updatedSubtasks[index] = { ...updatedSubtasks[index], [field]: value };
    setFormData(prev => ({ ...prev, subTasks: updatedSubtasks }));
  };

  const handleAddSubtask = () => {
    if (newSubtaskText.trim() === '') return;
    const newSubtask = { text: newSubtaskText, isDone: false }; // Adiciona isDone
    setFormData(prev => ({ ...prev, subTasks: [...prev.subTasks, newSubtask] }));
    setNewSubtaskText('');
  };
  
  const handleRemoveSubtask = (index) => {
    const updatedSubtasks = formData.subTasks.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, subTasks: updatedSubtasks }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.assignedToId) return toast.error('Título e Responsável são obrigatórios.');
    
    const dataToSend = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    };
    
    try {
      if (taskToEdit) {
        await updateTask(taskToEdit.id, dataToSend);
        toast.success('Tarefa atualizada com sucesso!');
      } else {
        await createTask(dataToSend);
        toast.success('Tarefa criada com sucesso!');
      }
      onTaskSaved();
      onClose();
    } catch (error) {
      toast.error(`Falha ao salvar a tarefa: ${error.message}`);
    }
  };

  const tabs = [
    { id: 'principal', label: 'Principal' },
    { id: 'contexto', label: 'Contexto' },
    { id: 'checklist', label: 'Checklist' },
  ];

  return (
    <form onSubmit={handleSubmit}>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="py-5 space-y-4 min-h-[250px]">
        {activeTab === 'principal' && (
          <>
            <div><label className="label-form">Título</label><input type="text" name="title" value={formData.title} onChange={handleChange} required className="input-form w-full" /></div>
            <div><label className="label-form">Responsável</label><select name="assignedToId" value={formData.assignedToId || ''} onChange={handleChange} required className="input-form w-full"><option value="">Selecione</option>{users.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label-form">Prioridade</label><select name="priority" value={formData.priority} onChange={handleChange} className="input-form w-full"><option>Baixa</option><option>Normal</option><option>Alta</option><option>Crítica</option></select></div>
              <div><label className="label-form">Vencimento</label><input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="input-form w-full" /></div>
            </div>
            <div><label className="label-form">Status</label><select name="status" value={formData.status} onChange={handleChange} className="input-form w-full"><option>Pendente</option><option>Em Andamento</option><option>Concluída</option></select></div>
          </>
        )}
        {activeTab === 'contexto' && (
          <>
            <div><label className="label-form">Descrição</label><textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="input-form w-full"></textarea></div>
            <div><label className="label-form">Cliente (Opcional)</label><select name="clientId" value={formData.clientId || ''} onChange={handleChange} className="input-form w-full"><option value="">Nenhum</option>{clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
            <div><label className="label-form">Tags (separadas por vírgula)</label><input type="text" name="tags" value={formData.tags} onChange={handleChange} className="input-form w-full" placeholder="financeiro, decoração, urgente" /></div>
          </>
        )}
        {activeTab === 'checklist' && (
          <div>
            <label className="label-form">Checklist de Sub-tarefas</label>
            <div className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-2">
              {formData.subTasks.map((sub, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input type="checkbox" checked={sub.isDone} onChange={e => handleSubtaskChange(index, 'isDone', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/>
                  {/* CORRIGIDO: Desabilita o input se a sub-tarefa estiver concluída */}
                  <input type="text" value={sub.text} onChange={e => handleSubtaskChange(index, 'text', e.target.value)} disabled={sub.isDone} className={`input-form flex-grow ${sub.isDone ? 'line-through text-gray-500' : ''}`} />
                  <button type="button" onClick={() => handleRemoveSubtask(index)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <input type="text" value={newSubtaskText} onChange={e => setNewSubtaskText(e.target.value)} placeholder="Adicionar sub-tarefa..." className="input-form flex-grow" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())} />
              <button type="button" onClick={handleAddSubtask} className="btn-secondary">Adicionar</button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">{taskToEdit ? 'Salvar Alterações' : 'Criar Tarefa'}</button></div>
    </form>
  );
};


// --- COMPONENTE DA PÁGINA PRINCIPAL ---
export default function TarefasPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksData, usersData, clientsData] = await Promise.all([
        getTasks({ searchTerm, statusFilter }), // Passa os filtros para a API
        getUsers(),
        getClients()
      ]);
      setTasks(tasksData);
      setUsers(usersData);
      setClients(clientsData);
    } catch (error) {
      toast.error("Erro ao carregar dados da página.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]); // Adiciona os filtros como dependências

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleOpenModal = (task = null) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTaskToEdit(null);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        await deleteTask(taskId);
        toast.success('Tarefa excluída com sucesso!');
        fetchAllData();
      } catch (error) {
        toast.error(`Falha ao excluir a tarefa: ${error.message}`);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gerenciador de Tarefas</h1>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <PlusCircle size={20} />
          Nova Tarefa
        </button>
      </div>

      <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-grow w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-form w-full pl-10"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={20} className="text-gray-500" />
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-form w-full"
          >
            <option>Todos</option>
            <option>Pendente</option>
            <option>Em Andamento</option>
            <option>Concluída</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500"><Loader2 className="animate-spin inline-block mr-2" /> Carregando tarefas...</div>
      ) : tasks.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsável</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {tasks.map(task => (
                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={task.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{task.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm"><PriorityBadge priority={task.priority} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{task.assignedTo?.nome || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-4">
                    <button onClick={() => handleOpenModal(task)} className="text-gray-400 hover:text-indigo-600" title="Editar Tarefa"><Edit size={18} /></button>
                    <button onClick={() => handleDeleteTask(task.id)} className="text-gray-400 hover:text-red-600" title="Excluir Tarefa"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <ClipboardCheck className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Nenhuma Tarefa Encontrada</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Você ainda não tem tarefas. Que tal criar a primeira?</p>
          <div className="mt-6">
            <button
              onClick={() => handleOpenModal()}
              type="button"
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <PlusCircle size={20} />
              Criar Primeira Tarefa
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4 transition-opacity duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl z-50 relative transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
            <div className="flex justify-between items-center mb-2">
               <h2 className="text-xl font-bold text-gray-900 dark:text-white">{taskToEdit ? 'Editar Tarefa' : 'Criar Nova Tarefa'}</h2>
                <button onClick={handleCloseModal} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <TaskForm 
              onClose={handleCloseModal} 
              onTaskSaved={fetchAllData}
              users={users}
              clients={clients}
              taskToEdit={taskToEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Adicione estas animações no seu arquivo CSS principal, como `index.css`
/*
@keyframes fade-in-scale {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
.animate-fade-in-scale {
  animation: fade-in-scale 0.2s ease-out forwards;
}
*/