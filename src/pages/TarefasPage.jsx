import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X as IconX, Edit, Trash2, Filter, Search, ClipboardCheck, Loader2, ListTodo, MessageSquare, CheckSquare, Calendar, User, Tag, Sparkles } from 'lucide-react';
import { 
    getTasks, createTask, getAllUsers as getUsers, getAllClients as getClients,
    updateTask, deleteTask 
} from '@/services/api'; 
import toast from 'react-hot-toast';

const inputPremiumClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-gray-700 font-medium";
const labelPremiumClass = "block text-sm font-bold text-gray-700 mb-1.5 ml-1";

const StatusBadge = ({ status }) => {
    const config = {
        'Pendente': 'bg-amber-50 text-amber-700 border-amber-200',
        'Em Andamento': 'bg-sky-50 text-sky-700 border-sky-200',
        'Concluída': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    }[status] || 'bg-gray-50 text-gray-700 border-gray-200';
    return <span className={`px-3 py-1 text-xs font-bold rounded-full border shadow-sm tracking-wide ${config}`}>{status}</span>;
};

const PriorityBadge = ({ priority }) => {
    const config = {
        'Baixa': 'text-gray-600 bg-gray-100',
        'Normal': 'text-emerald-700 bg-emerald-100',
        'Alta': 'text-orange-700 bg-orange-100',
        'Crítica': 'text-rose-700 bg-rose-100',
    }[priority] || 'text-gray-600 bg-gray-100';
    return <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${config}`}>{priority}</span>;
};


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
        getTasks({ searchTerm, statusFilter }), 
        getUsers(),
        getClients()
      ]);
      setTasks(tasksData);
      setUsers(usersData);
      setClients(clientsData);
    } catch (error) {
      toast.error("Erro ao carregar os dados das tarefas.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]); 

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
    if (window.confirm('Tem certeza que deseja excluir esta tarefa de forma permanente?')) {
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
    <div className="flex flex-col gap-8 p-4 md:p-8 min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-light text-gray-800 tracking-wide flex items-center gap-3">
                Gerenciador de <span className="font-bold text-amber-600">Tarefas</span>
                <ListTodo className="text-amber-400" size={24} />
            </h1>
            <p className="mt-1 text-gray-500 font-medium">Acompanhe as atividades e a produtividade da equipe.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all duration-300">
            <Plus size={20} /> Nova Tarefa
        </button>
      </header>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar pelo título da tarefa..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-gray-700 font-medium"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
          <Filter size={18} className="text-gray-400" />
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-transparent border-none outline-none font-medium text-gray-700 w-full"
          >
            <option>Todos os Status</option>
            <option>Pendente</option>
            <option>Em Andamento</option>
            <option>Concluída</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12 bg-white rounded-[2rem] border border-gray-200 shadow-sm">
            <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Buscando tarefas...</p>
        </div> 
      ) : tasks.length > 0 ? (
        <div className="bg-white rounded-[2rem] border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-b border-gray-200">
                <tr>
                  <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500">Status</th>
                  <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500">Detalhes da Tarefa</th>
                  <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 hidden sm:table-cell">Responsável</th>
                  <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 hidden md:table-cell">Vencimento</th>
                  <th className="p-5 text-xs uppercase tracking-wider font-bold text-gray-500 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map(task => (
                  <tr key={task.id} className="hover:bg-amber-50/30 transition-colors group">
                    <td className="p-5 whitespace-nowrap"><StatusBadge status={task.status} /></td>
                    <td className="p-5">
                        <p className="font-bold text-gray-900 leading-tight">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <PriorityBadge priority={task.priority} />
                            {task.tags && task.tags.length > 0 && (
                                <span className="text-xs text-gray-400 font-medium flex items-center gap-1"><Tag size={10}/> {task.tags[0]} {task.tags.length > 1 && `+${task.tags.length - 1}`}</span>
                            )}
                        </div>
                    </td>
                    <td className="p-5 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                {task.assignedTo?.nome ? task.assignedTo.nome.charAt(0).toUpperCase() : '?'}
                            </div>
                            <span className="font-medium text-gray-700 text-sm">{task.assignedTo?.nome || 'Não Atribuído'}</span>
                        </div>
                    </td>
                    <td className="p-5 hidden md:table-cell font-medium text-gray-600 text-sm">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '—'}
                    </td>
                    <td className="p-5 text-center">
                        <div className="flex justify-center items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(task)} className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Editar Tarefa"><Edit size={18} strokeWidth={2}/></button>
                            <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Excluir Tarefa"><Trash2 size={18} strokeWidth={2}/></button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 px-6 bg-white rounded-[2rem] shadow-sm border border-gray-200 flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
            <ClipboardCheck size={40} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Nenhuma Tarefa Encontrada</h3>
          <p className="mt-2 text-gray-500 font-medium max-w-sm">Você está com tudo em dia. Aproveite para criar uma nova atividade para a equipe.</p>
          <button onClick={() => handleOpenModal()} className="mt-8 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all">
            <Plus size={20} /> Criar Primeira Tarefa
          </button>
        </div>
      )}

      <ModalTarefa 
        aberto={isModalOpen} 
        aoFechar={handleCloseModal} 
        onTaskSaved={fetchAllData} 
        users={users} 
        clients={clients} 
        taskToEdit={taskToEdit} 
      />
    </div>
  );
}


const ModalTabs = ({ tabs, activeTab, setActiveTab }) => (
    <div className="border-b border-gray-200 bg-white">
        <nav className="flex space-x-2 overflow-x-auto px-8 custom-scrollbar">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-4 text-sm font-bold border-b-2 transition-all duration-200 outline-none whitespace-nowrap
                        ${activeTab === tab.id
                            ? 'border-amber-500 text-amber-600'
                            : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200'
                        }
                    `}
                >
                    <tab.icon size={18} /> {tab.label}
                </button>
            ))}
        </nav>
    </div>
);

function ModalTarefa({ aberto, aoFechar, onTaskSaved, users, clients, taskToEdit }) {
  const initialState = {
    title: '',
    description: '',
    status: 'Pendente',
    priority: 'Normal',
    dueDate: '',
    assignedToId: null,
    clientId: null,
    tags: '',
    subTasks: [],
  };

  const [formData, setFormData] = useState(initialState);
  const [activeTab, setActiveTab] = useState('principal');
  const [newSubtaskText, setNewSubtaskText] = useState('');

  useEffect(() => {
    if (aberto) {
        if (taskToEdit) {
            setFormData({
                title: taskToEdit.title || '',
                description: taskToEdit.description || '',
                status: taskToEdit.status || 'Pendente',
                priority: taskToEdit.priority || 'Normal',
                dueDate: taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().split('T')[0] : '',
                assignedToId: taskToEdit.assignedToId || null,
                clientId: taskToEdit.clientId || null,
                tags: taskToEdit.tags?.join(', ') || '',
                subTasks: taskToEdit.subTasks || [],
            });
        } else {
            setFormData(initialState);
        }
        setActiveTab('principal');
        setNewSubtaskText('');
    }
  }, [aberto, taskToEdit]);

  const handleChange = (e) => {
      const { name, value } = e.target;
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
    const newSubtask = { text: newSubtaskText, isDone: false };
    setFormData(prev => ({ ...prev, subTasks: [...prev.subTasks, newSubtask] }));
    setNewSubtaskText('');
  };
  
  const handleRemoveSubtask = (index) => {
    const updatedSubtasks = formData.subTasks.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, subTasks: updatedSubtasks }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.assignedToId) return toast.error('O Título e o Responsável são campos obrigatórios.');
    
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
      aoFechar();
    } catch (error) {
      toast.error(`Falha ao salvar a tarefa: ${error.message}`);
    }
  };

  const tabs = [
    { id: 'principal', label: 'Dados Principais', icon: ListTodo },
    { id: 'contexto', label: 'Contexto e Detalhes', icon: MessageSquare },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare },
  ];

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="p-6 md:p-8 flex justify-between items-center border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    {taskToEdit ? <Edit className="text-amber-500" /> : <Sparkles className="text-amber-500" />}
                    {taskToEdit ? 'Editar Tarefa' : 'Criar Nova Tarefa'}
                </h2>
                <button onClick={aoFechar} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"><IconX size={24}/></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-grow overflow-hidden flex flex-col">
              <ModalTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
              
              <div className="p-8 space-y-6 overflow-y-auto flex-grow bg-white custom-scrollbar min-h-[350px]">
                {activeTab === 'principal' && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div>
                        <label className={labelPremiumClass}>Título da Tarefa*</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} required className={inputPremiumClass} placeholder="Ex: Preparar documentação do evento" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelPremiumClass}>Responsável*</label>
                            <select name="assignedToId" value={formData.assignedToId || ''} onChange={handleChange} required className={inputPremiumClass}>
                                <option value="">Atribuir a um membro...</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelPremiumClass}>Status Atual</label>
                            <select name="status" value={formData.status} onChange={handleChange} className={inputPremiumClass}>
                                <option value="Pendente">Pendente</option>
                                <option value="Em Andamento">Em Andamento</option>
                                <option value="Concluída">Concluída</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelPremiumClass}>Nível de Prioridade</label>
                            <select name="priority" value={formData.priority} onChange={handleChange} className={inputPremiumClass}>
                                <option value="Baixa">Baixa</option>
                                <option value="Normal">Normal</option>
                                <option value="Alta">Alta</option>
                                <option value="Crítica">Crítica (Urgente)</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelPremiumClass}>Prazo de Conclusão</label>
                            <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className={inputPremiumClass} />
                        </div>
                    </div>
                  </motion.div>
                )}
                
                {activeTab === 'contexto' && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div>
                        <label className={labelPremiumClass}>Descrição / Orientação</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className={`${inputPremiumClass} resize-none`} placeholder="Detalhe as instruções necessárias para concluir esta tarefa..."></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelPremiumClass}>Vincular Cliente (Opcional)</label>
                            <select name="clientId" value={formData.clientId || ''} onChange={handleChange} className={inputPremiumClass}>
                                <option value="">Nenhum cliente vinculado</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelPremiumClass}>Tags e Categorias</label>
                            <input type="text" name="tags" value={formData.tags} onChange={handleChange} className={inputPremiumClass} placeholder="Ex: Financeiro, Montagem, Reunião" />
                        </div>
                    </div>
                  </motion.div>
                )}
                
                {activeTab === 'checklist' && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <label className={labelPremiumClass}>Etapas e Sub-tarefas</label>
                    <div className="flex gap-3 mt-2 mb-6">
                      <input type="text" value={newSubtaskText} onChange={e => setNewSubtaskText(e.target.value)} placeholder="Descreva uma etapa..." className={inputPremiumClass} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())} />
                      <button type="button" onClick={handleAddSubtask} className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold transition-colors">Adicionar</button>
                    </div>
                    
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {formData.subTasks.length === 0 && <p className="text-gray-400 font-medium text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">Nenhuma sub-tarefa adicionada ainda.</p>}
                      {formData.subTasks.map((sub, index) => (
                        <div key={index} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${sub.isDone ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-gray-200'}`}>
                          <input 
                            type="checkbox" 
                            checked={sub.isDone} 
                            onChange={e => handleSubtaskChange(index, 'isDone', e.target.checked)} 
                            className="h-5 w-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                          />
                          <input 
                            type="text" 
                            value={sub.text} 
                            onChange={e => handleSubtaskChange(index, 'text', e.target.value)} 
                            disabled={sub.isDone} 
                            className={`flex-grow bg-transparent border-none outline-none font-medium ${sub.isDone ? 'line-through text-emerald-600 opacity-60' : 'text-gray-700'}`} 
                          />
                          <button type="button" onClick={() => handleRemoveSubtask(index)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={18}/></button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="p-6 md:p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end items-center mt-auto flex-shrink-0 rounded-b-[2rem] gap-4">
                <button type="button" onClick={aoFechar} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="px-8 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all">
                    {taskToEdit ? 'Atualizar Tarefa' : 'Salvar Tarefa'}
                </button>
              </div>
            </form>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}