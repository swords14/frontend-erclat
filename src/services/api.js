// Caminho do arquivo: src/services/api.js

const API_URL = import.meta.env.VITE_API_URL;

const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Ocorreu um erro na resposta da API.' }));
    const errorMessage = errorData.message || `Erro ${response.status}`;
    throw new Error(errorMessage);
  }
  if (response.status === 204) return null;
  return response.json();a
};

const fetchWithAuth = (url, options = {}) => {
  const token = localStorage.getItem('authToken'); 
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${API_URL}${url}`, { ...options, headers }).then(handleApiResponse);
};

const fetchPublic = (url, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  return fetch(`${API_URL}${url}`, { ...options, headers }).then(handleApiResponse);
};

// --- AUTENTICAÇÃO, PERFIL E EMPRESA ---
export const login = (credentials) => fetchPublic('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const verify2FALogin = (data) => fetchPublic('/auth/login/verify-2fa', { method: 'POST', body: JSON.stringify({ tempToken: data.tempToken, token: data.token }) });
export const getMyProfile = () => fetchWithAuth('/auth/me');
export const updateMyProfile = (data) => fetchWithAuth('/users/me', { method: 'PUT', body: JSON.stringify(data) });
export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  const token = localStorage.getItem('authToken');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_URL}/users/me/avatar`, {
    method: 'POST',
    headers: headers,
    body: formData,
  });
  return handleApiResponse(response);
};
export const getCompanyData = () => fetchWithAuth('/company');
export const updateCompanyData = (data) => fetchWithAuth('/company', { method: 'PUT', body: JSON.stringify(data) });

// --- EQUIPA, FUNÇÕES E PERMISSÕES ---
export const getAllUsers = () => fetchWithAuth('/users');
export const createUser = (data) => fetchWithAuth('/auth/register', { method: 'POST', body: JSON.stringify(data) });
export const updateUser = (userId, data) => fetchWithAuth(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteUser = (userId) => fetchWithAuth(`/users/${userId}`, { method: 'DELETE' });
export const getAllRoles = () => fetchWithAuth('/roles');
export const createRole = (data) => fetchWithAuth('/roles', { method: 'POST', body: JSON.stringify(data) });
export const updateRole = (roleId, data) => fetchWithAuth(`/roles/${roleId}`, { method: 'PUT', body: JSON.stringify(data) });
export const getAllPermissions = () => fetchWithAuth('/permissions');


// --- MODELOS DE DOCUMENTOS ---
export const getAllTemplates = () => fetchWithAuth('/templates');
export const createTemplate = (data) => fetchWithAuth('/templates', { method: 'POST', body: JSON.stringify(data) });
export const updateTemplate = (templateId, data) => fetchWithAuth(`/templates/${templateId}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTemplate = (templateId) => fetchWithAuth(`/templates/${templateId}`, { method: 'DELETE' });


// --- ORÇAMENTOS E FUNIL DE VENDAS ---
export const getAllBudgets = () => fetchWithAuth('/budgets');
export const getBudgetById = (budgetId) => fetchWithAuth(`/budgets/${budgetId}`);
export const createBudget = (data) => fetchWithAuth('/budgets', { method: 'POST', body: JSON.stringify(data) });
export const updateBudget = (budgetId, data) => fetchWithAuth(`/budgets/${budgetId}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteBudget = (budgetId) => fetchWithAuth(`/budgets/${budgetId}`, { method: 'DELETE' });
export const getFunnelData = (filters) => {
    const query = new URLSearchParams(filters).toString();
    return fetchWithAuth(`/funnel?${query}`);
};
export const updateBudgetStatus = (budgetId, newStatus) => fetchWithAuth(`/budgets/${budgetId}/status`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });


// --- EVENTOS ---
export const createEventFromBudget = (budgetId) => fetchWithAuth('/events/from-budget', { method: 'POST', body: JSON.stringify({ budgetId }) });
export const getEvents = () => fetchWithAuth('/events');
export const createEvent = (data) => fetchWithAuth('/events', { method: 'POST', body: JSON.stringify(data) });
export const updateEvent = (eventId, data) => fetchWithAuth(`/events/${eventId}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEvent = (eventId) => fetchWithAuth(`/events/${eventId}`, { method: 'DELETE' });
export const finalizeEvent = (eventId) => fetchWithAuth(`/events/${eventId}/finalize`, { method: 'PATCH' });


// --- CONTRATOS ---
export const getContracts = () => fetchWithAuth('/contracts');
export const getContractById = (contractId) => fetchWithAuth(`/contracts/${contractId}`);
export const createContract = (data) => fetchWithAuth('/contracts', { method: 'POST', body: JSON.stringify(data) });
export const createContractFromBudget = (budgetId) => fetchWithAuth('/contracts/from-budget', { method: 'POST', body: JSON.stringify({ budgetId }) });
export const updateContract = (contractId, data) => fetchWithAuth(`/contracts/${contractId}`, { method: 'PUT', body: JSON.stringify(data) });
export const updateContractStatus = (contractId, status) => fetchWithAuth(`/contracts/${contractId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const deleteContract = (contractId) => fetchWithAuth(`/contracts/${contractId}`, { method: 'DELETE' });


// --- FEEDBACK ---
export const getEventsForFeedback = () => fetchWithAuth('/feedback');
export const createFeedbackRecord = (eventId) => fetchWithAuth('/feedback/record', { method: 'POST', body: JSON.stringify({ eventId }) });
export const getFeedbackById = (feedbackId) => fetchPublic(`/feedback/${feedbackId}`);
export const submitFeedback = (feedbackId, data) => fetchPublic(`/feedback/submit/${feedbackId}`, { method: 'POST', body: JSON.stringify(data) });


// --- DASHBOARD ---
export const getDashboardData = (periodo) => fetchWithAuth(`/dashboard?periodo=${periodo}`);
export const saveUserDashboardLayout = (layout) => fetchWithAuth('/dashboard/layout', { method: 'PUT', body: JSON.stringify({ layout }) });


// --- TRANSAÇÕES (FINANCEIRO) ---
export const getTransactions = (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return fetchWithAuth(`/transactions?${query}`);
};
export const getTransactionById = (transactionId) => fetchWithAuth(`/transactions/${transactionId}`);
export const getTransactionCategories = () => fetchWithAuth(`/transactions/categories`);
export const createTransaction = (data) => fetchWithAuth('/transactions', { method: 'POST', body: JSON.stringify(data) });
export const updateTransaction = (transactionId, data) => fetchWithAuth(`/transactions/${transactionId}`, { method: 'PUT', body: JSON.stringify(data) });
export const updateTransactionStatus = (transactionId, status) => fetchWithAuth(`/transactions/${transactionId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const deleteTransaction = (transactionId) => fetchWithAuth(`/transactions/${transactionId}`, { method: 'DELETE' });


// --- FORNECEDORES ---
export const getAllSuppliers = (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return fetchWithAuth(`/suppliers?${query}`);
};
export const getSupplierCategories = () => fetchWithAuth('/suppliers/categories');
export const createSupplier = (data) => fetchWithAuth('/suppliers', { method: 'POST', body: JSON.stringify(data) });
export const updateSupplier = (supplierId, data) => fetchWithAuth(`/suppliers/${supplierId}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSupplier = (supplierId) => fetchWithAuth(`/suppliers/${supplierId}`, { method: 'DELETE' });


// --- ESTOQUE (INVENTORY) ---
// As funções abaixo estavam faltando. Verifique se os endpoints (ex: '/inventory') estão corretos.
export const getInventoryItems = () => fetchWithAuth('/inventory');

export const getInventoryCategories = () => fetchWithAuth('/inventory/categories');

// Função para criar item, agora com suporte a upload de imagem
export const createInventoryItem = (itemData, imageFile) => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(itemData)); // Envia os dados do item como uma string JSON
    if (imageFile) {
        formData.append('image', imageFile); // Adiciona o arquivo de imagem
    }
    
    // Para FormData, não definimos 'Content-Type', o browser faz isso
    const token = localStorage.getItem('authToken');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${API_URL}/inventory`, {
        method: 'POST',
        headers: headers,
        body: formData,
    }).then(handleApiResponse);
};

// Função para atualizar item, agora com suporte a upload de imagem
export const updateInventoryItem = (itemId, itemData, imageFile) => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(itemData));
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    const token = localStorage.getItem('authToken');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${API_URL}/inventory/${itemId}`, {
        method: 'PUT',
        headers: headers,
        body: formData,
    }).then(handleApiResponse);
};

export const deleteInventoryItem = (itemId) => fetchWithAuth(`/inventory/${itemId}`, { method: 'DELETE' });


// --- DADOS DE SUPORTE (PARA MODAIS, ETC.) ---
export const getAllClients = () => fetchWithAuth('/clients');
export const createClient = (data) => fetchWithAuth('/clients', { method: 'POST', body: JSON.stringify(data) });
export const updateClient = (clientId, data) => fetchWithAuth(`/clients/${clientId}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteClient = (clientId) => fetchWithAuth(`/clients/${clientId}`, { method: 'DELETE' });
export const getItemsForBudget = () => fetchWithAuth('/inventory/for-budget');


// --- SEGURANÇA ---
export const changePassword = (passwordData) => fetchWithAuth('/seguranca/alterar-senha', { method: 'POST', body: JSON.stringify(passwordData) });
export const generate2FASecret = () => fetchWithAuth('/seguranca/2fa/gerar', { method: 'POST' });
export const enable2FA = (data) => fetchWithAuth('/seguranca/2fa/ativar', { method: 'POST', body: JSON.stringify(data) });
export const disable2FA = () => fetchWithAuth('/seguranca/2fa/desativar', { method: 'POST' });
export const getActivityLog = () => fetchWithAuth('/seguranca/logs-de-atividade');


// --- STUDIO DE LAYOUTS ---
export const getLayouts = () => fetchWithAuth('/layouts');
export const getLayoutById = (id) => fetchWithAuth(`/layouts/${id}`);
export const createLayout = (data) => fetchWithAuth('/layouts', { method: 'POST', body: JSON.stringify(data) });
export const updateLayout = (id, data) => fetchWithAuth(`/layouts/${id}`, { method: 'PUT', body: JSON.stringify(data) });


// --- TAREFAS ---
export const getTasks = (filters = {}) => {
  const query = new URLSearchParams(filters).toString();
  return fetchWithAuth(`/tasks?${query}`);
};
export const getTaskById = (taskId) => fetchWithAuth(`/tasks/${taskId}`);
export const createTask = (taskData) => fetchWithAuth('/tasks', { method: 'POST', body: JSON.stringify(taskData) });
export const updateTask = (taskId, taskData) => fetchWithAuth(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(taskData) });
export const deleteTask = (taskId) => fetchWithAuth(`/tasks/${taskId}`, { method: 'DELETE' });