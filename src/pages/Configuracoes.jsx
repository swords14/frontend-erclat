// FILE: src/pages/Configuracoes.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Palette, Shield, Building, Upload, Users, Plus, X as IconX, CheckSquare, Square, FileText, Puzzle, Bell, Trash2, Edit, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// Todas as importações da API necessárias para todas as abas.
import { 
    getMyProfile, updateMyProfile, uploadAvatar,
    getCompanyData, updateCompanyData,
    getAllUsers, createUser, updateUser, deleteUser,
    getAllRoles, createRole, updateRole,
    getAllPermissions,
    getAllTemplates, createTemplate, updateTemplate, deleteTemplate,
    changePassword, generate2FASecret, enable2FA, disable2FA,
    getActivityLog
} from '../services/api';


// #region Componentes de UI Reutilizáveis
const DarkModeToggle = () => {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
    const toggle = () => {
        document.documentElement.classList.toggle('dark');
        setIsDark(prev => !prev);
    }
    return <button onClick={toggle} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium">{isDark ? 'Tema Claro' : 'Tema Escuro'}</button>;
};

const SettingsCard = ({ title, description, children }) => (
    <div className="border dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h3>
            {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
        <div className="p-4 sm:p-6">
            {children}
        </div>
    </div>
);
// #endregion


// #region Modais (Idealmente em /src/components/modals/)

function ModalTemplate({ aberto, aoFechar, aoSalvar, template }) {
    const [formData, setFormData] = useState({ nome: '', tipo: 'Contrato', conteudo: '' });
    const isEditing = !!template;
    useEffect(() => {
        if (aberto) {
            if (isEditing) {
                setFormData({
                    nome: template.nome,
                    tipo: template.tipo,
                    conteudo: template.conteudo,
                });
            } else {
                setFormData({ nome: '', tipo: 'Contrato', conteudo: '' });
            }
        }
    }, [aberto, template, isEditing]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        aoSalvar(formData);
    };
    if(!aberto) return null;
    return (<AnimatePresence>{aberto && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{isEditing ? 'Editar Modelo' : 'Criar Novo Modelo'}</h2>
                <button onClick={aoFechar} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><IconX size={22}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label-form">Nome do Modelo</label>
                        <input type="text" name="nome" value={formData.nome} onChange={handleChange} required className="input-form w-full" placeholder="Ex: Contrato Padrão de Casamento"/>
                    </div>
                    <div>
                        <label className="label-form">Tipo de Modelo</label>
                        <select name="tipo" value={formData.tipo} onChange={handleChange} className="input-form w-full">
                            <option>Contrato</option>
                            <option>Orçamento</option>
                            <option>Email</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="label-form">Conteúdo do Modelo</label>
                    <textarea name="conteudo" value={formData.conteudo} onChange={handleChange} required className="input-form w-full min-h-[300px] font-mono text-sm" placeholder='Escreva o seu modelo. Use variáveis como {{cliente.nome}}, {{evento.valorTotal}}, {{empresa.nomeFantasia}}, etc.' />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={aoFechar} className="btn-secondary">Cancelar</button>
                    <button type="submit" className="btn-primary">Salvar Modelo</button>
                </div>
            </form>
        </motion.div></motion.div>)}</AnimatePresence>
    );
}

function ModalMembro({ aberto, aoFechar, aoSalvar, funcoes, membro }) {
    const [formData, setFormData] = useState({ nome: '', email: '', password: '', roleId: '' });
    const isEditing = !!membro;
    useEffect(() => {
        if (aberto) {
            if (isEditing) {
                setFormData({
                    nome: membro.nome,
                    email: membro.email,
                    password: '',
                    roleId: membro.role?.id || '',
                });
            } else {
                setFormData({
                    nome: '', email: '', password: '',
                    roleId: funcoes.length > 0 ? funcoes[0].id : ''
                });
            }
        }
    }, [aberto, membro, isEditing, funcoes]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSave = { ...formData, roleId: Number(formData.roleId) };
        if (isEditing && !dataToSave.password) {
            delete dataToSave.password;
        }
        aoSalvar(dataToSave);
    };
    if(!aberto) return null;
    return (<AnimatePresence>{aberto && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold">{isEditing ? 'Editar Membro' : 'Criar Novo Membro'}</h2><button onClick={aoFechar} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><IconX size={22}/></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="label-form">Nome Completo</label><input type="text" name="nome" value={formData.nome} onChange={handleChange} required className="input-form w-full"/></div>
                <div><label className="label-form">Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-form w-full"/></div>
                <div><label className="label-form">Senha</label><input type="password" name="password" value={formData.password} onChange={handleChange} required={!isEditing} className="input-form w-full" placeholder={isEditing ? 'Deixe em branco para não alterar' : ''}/></div>
                <div><label className="label-form">Função</label><select name="roleId" value={formData.roleId} onChange={handleChange} className="input-form w-full">{funcoes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
                <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={aoFechar} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Salvar</button></div>
            </form>
        </motion.div></motion.div>)}</AnimatePresence>
    );
}

function ModalFuncao({ aberto, aoFechar, aoSalvar, funcao, todasAsPermissoes }) {
    const [name, setName] = useState('');
    const [permissions, setPermissions] = useState([]);
    useEffect(() => {
        if(funcao) {
            setName(funcao.name);
            setPermissions(funcao.permissions.map(p => p.id));
        } else {
            setName('');
            setPermissions([]);
        }
    }, [funcao, aberto]);
    const handleTogglePermissao = (permissaoId) => {
        setPermissions(prev => prev.includes(permissaoId) ? prev.filter(p => p !== permissaoId) : [...prev, permissaoId]);
    };
    const handleSubmit = (e) => { e.preventDefault(); aoSalvar({ name, permissions }); };
    const permissoesAgrupadas = useMemo(() => {
        if (!todasAsPermissoes) return {};
        return todasAsPermissoes.reduce((acc, p) => {
            const grupo = p.subject || 'Geral';
            acc[grupo] = acc[grupo] || [];
            acc[grupo].push(p);
            return acc;
        }, {});
    }, [todasAsPermissoes]);
    if(!aberto) return null;
    return (<AnimatePresence>{aberto && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold">{funcao ? "Editar Função" : "Criar Nova Função"}</h2><button onClick={aoFechar} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><IconX size={22}/></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="label-form">Nome da Função</label><input type="text" value={name} onChange={e => setName(e.target.value)} required className="input-form w-full" placeholder="Ex: Gerente de Vendas"/></div>
                <div><label className="label-form">Permissões</label>
                    <div className="space-y-3 mt-2 max-h-60 overflow-y-auto pr-2">
                        {Object.entries(permissoesAgrupadas).map(([grupo, listaPermissoes]) => (
                            <div key={grupo}><h4 className="font-semibold mb-1 capitalize">{grupo}</h4>
                                {listaPermissoes.map(p => (
                                    <label key={p.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer">
                                        <input type="checkbox" checked={permissions.includes(p.id)} onChange={() => handleTogglePermissao(p.id)} className="hidden" />
                                        {permissions.includes(p.id) ? <CheckSquare className="text-indigo-600" size={20}/> : <Square className="text-gray-400" size={20}/>}
                                        <span>{p.action}</span>
                                    </label>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={aoFechar} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Salvar</button></div>
            </form>
        </motion.div></motion.div>)}</AnimatePresence>
    );
}
// #endregion


// #region Componentes de Conteúdo das Abas (Idealmente em /src/components/configuracoes/)

// FILE: src/components/configuracoes/PerfilContent.jsx
const PerfilContent = () => {
    const { currentUser, updateCurrentUser } = useAuth();
    const [user, setUser] = useState(currentUser);
    const [isLoading, setIsLoading] = useState(!currentUser);
    const fileInputRef = useRef(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    useEffect(() => {
        if (!currentUser) {
            const fetchUserData = async () => {
                setIsLoading(true);
                try {
                    const data = await getMyProfile();
                    setUser(data);
                    updateCurrentUser(data);
                } catch (error) {
                    toast.error(`Erro ao buscar perfil: ${error.message}`);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchUserData();
        } else {
            setUser(currentUser);
        }
    }, [currentUser, updateCurrentUser]);

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Por favor, selecione um ficheiro de imagem válido.");
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);

        const formData = new FormData();
        formData.append('avatar', file);

        toast.loading("A enviar nova foto...");
        try {
            const updatedProfile = await uploadAvatar(formData);
            toast.dismiss();
            toast.success("Foto de perfil atualizada!");
            updateCurrentUser(updatedProfile);
            setUser(updatedProfile);
        } catch (error) {
            toast.dismiss();
            toast.error(error.message || "Não foi possível atualizar a foto.");
        } finally {
            setAvatarPreview(null);
            URL.revokeObjectURL(previewUrl);
        }
    };

    const handleSave = async () => {
        const toastId = toast.loading("A salvar alterações...");
        try {
            const updatedUser = await updateMyProfile({ nome: user.nome, email: user.email });
            setUser(updatedUser);
            updateCurrentUser(updatedUser);
            toast.success("Perfil atualizado com sucesso!", { id: toastId });
        } catch (error) {
            toast.error(`Erro ao atualizar perfil: ${error.message}`, { id: toastId });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };

    if (isLoading) return <div>Carregando perfil...</div>;
    if (!user) return <div>Não foi possível carregar os dados do perfil.</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Perfil Público</h2>
            <div className="flex items-center gap-6">
                <img 
                    src={avatarPreview || user.avatarUrl || `https://ui-avatars.com/api/?name=${user.nome}&background=random`} 
                    alt="Avatar" 
                    className="w-24 h-24 rounded-full object-cover bg-gray-200"
                />
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/gif" />
                <button onClick={handleAvatarClick} className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    <Upload size={16}/> Mudar Foto
                </button>
            </div>
            <div>
                <label className="label-form">Nome</label>
                <input type="text" name="nome" value={user.nome || ''} onChange={handleChange} className="input-form w-full max-w-sm" />
            </div>
            <div>
                <label className="label-form">Email</label>
                <input type="email" name="email" value={user.email || ''} onChange={handleChange} className="input-form w-full max-w-sm" />
            </div>
            <button onClick={handleSave} className="btn-primary">Salvar Alterações</button>
        </div>
    );
};


// FILE: src/components/configuracoes/SegurancaContent.jsx
const SegurancaContent = () => {
    const { currentUser, updateCurrentUser } = useAuth();
    const [passwordData, setPasswordData] = useState({ senhaAtual: '', novaSenha: '', confirmacaoNovaSenha: '' });
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [is2FAEnabled, setIs2FAEnabled] = useState(currentUser?.isTwoFactorEnabled || false);
    const [is2FALoading, setIs2FALoading] = useState(false);
    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
    const [qrCodeData, setQrCodeData] = useState({ url: '', secret: '' });
    const [verificationToken, setVerificationToken] = useState('');
    const [activityLogs, setActivityLogs] = useState([]);
    const [isLogsLoading, setIsLogsLoading] = useState(true);

    useEffect(() => {
        setIs2FAEnabled(currentUser?.isTwoFactorEnabled || false);
    }, [currentUser]);

    useEffect(() => {
        const fetchLogs = async () => {
            setIsLogsLoading(true);
            try {
                const logsResponse = await getActivityLog();
                setActivityLogs(logsResponse.data || []);
            } catch (error) {
                toast.error(`Erro ao buscar log de atividades: ${error.message}`);
            } finally {
                setIsLogsLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({...prev, [name]: value}));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.novaSenha !== passwordData.confirmacaoNovaSenha) {
            toast.error("As novas senhas não coincidem.");
            return;
        }
        setIsPasswordLoading(true);
        try {
            await changePassword({ senhaAtual: passwordData.senhaAtual, novaSenha: passwordData.novaSenha });
            toast.success("Senha alterada com sucesso!");
            setPasswordData({ senhaAtual: '', novaSenha: '', confirmacaoNovaSenha: '' });
        } catch(error) {
            toast.error(error.message || "Erro ao alterar a senha.");
        } finally {
            setIsPasswordLoading(false);
        }
    };
    
    const handleToggle2FA = async () => {
        setIs2FALoading(true);
        if (is2FAEnabled) {
             if (window.confirm("Tem certeza que deseja desativar a autenticação de dois fatores?")) {
                try {
                    await disable2FA();
                    toast.success("2FA desativado com sucesso.");
                    const freshProfile = await getMyProfile();
                    updateCurrentUser(freshProfile);
                } catch(error) {
                    toast.error(error.message || "Erro ao desativar o 2FA.");
                }
            }
        } else {
            try {
                const { qrCodeUrl, secret } = await generate2FASecret();
                setQrCodeData({ url: qrCodeUrl, secret: secret });
                setIs2FAModalOpen(true);
            } catch(error) {
                toast.error(error.message || "Erro ao gerar QR Code para 2FA.");
            }
        }
        setIs2FALoading(false);
    };

    const handleVerify2FA = async (e) => {
        e.preventDefault();
        const toastId = toast.loading("Verificando código...");
        try {
            await enable2FA({ token: verificationToken });
            toast.success("2FA ativado com sucesso!", { id: toastId });
            const freshProfile = await getMyProfile();
            updateCurrentUser(freshProfile);
            setIs2FAModalOpen(false);
            setVerificationToken('');
        } catch (error) {
            toast.error(error.message || "Código de verificação inválido.", { id: toastId });
        }
    };

    return (
    <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Segurança da Conta</h2>
        
        <SettingsCard title="Alterar Senha">
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-sm">
                <div><label className="label-form">Senha Atual</label><input type="password" name="senhaAtual" value={passwordData.senhaAtual} onChange={handlePasswordChange} className="input-form w-full" required /></div>
                <div><label className="label-form">Nova Senha</label><input type="password" name="novaSenha" value={passwordData.novaSenha} onChange={handlePasswordChange} className="input-form w-full" required /></div>
                <div><label className="label-form">Confirmar Nova Senha</label><input type="password" name="confirmacaoNovaSenha" value={passwordData.confirmacaoNovaSenha} onChange={handlePasswordChange} className="input-form w-full" required /></div>
                <button type="submit" className="btn-primary" disabled={isPasswordLoading}>
                    {isPasswordLoading ? <Loader2 className="animate-spin" /> : 'Alterar Senha'}
                </button>
            </form>
        </SettingsCard>
        
        <SettingsCard 
            title="Autenticação de Dois Fatores (2FA)"
            description="Adicione uma camada extra de segurança. Ao fazer login, precisará de fornecer um código do seu aplicativo autenticador."
        >
            <button onClick={handleToggle2FA} className={is2FAEnabled ? "btn-danger" : "btn-secondary"} disabled={is2FALoading}>
                {is2FALoading ? <Loader2 className="animate-spin" /> : (is2FAEnabled ? 'Desativar 2FA' : 'Ativar 2FA')}
            </button>
        </SettingsCard>
        
        <SettingsCard title="Log de Atividade Recente">
            {isLogsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="animate-spin" size={16}/>A carregar atividades...</div>
            ) : (
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 max-h-60 overflow-y-auto pr-2">
                    {activityLogs.length > 0 ? activityLogs.map(log => (
                        <li key={log.id} className="flex flex-wrap justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                            <div>
                                <span className="font-medium capitalize text-gray-800 dark:text-gray-200">{log.action.replace(/_/g, ' ').toLowerCase()}</span>
                                {log.details?.ip && <span className="text-xs text-gray-500 ml-2">({log.details.ip})</span>}
                            </div>
                            <span className="text-xs">{new Date(log.createdAt).toLocaleString('pt-PT')}</span>
                        </li>
                    )) : <p>Nenhuma atividade recente encontrada.</p>}
                </ul>
            )}
        </SettingsCard>
        
        <AnimatePresence>
            {is2FAModalOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
                        <h2 className="text-xl font-bold mb-2">Ativar Autenticação de Dois Fatores</h2>
                        <p className="text-sm text-gray-500 mb-4">Escaneie o QR Code ou insira o código manualmente na sua aplicação de autenticação.</p>
                        
                        {qrCodeData.url ? <img src={qrCodeData.url} alt="QR Code para 2FA" className="mx-auto my-4 border-4 border-white dark:border-gray-700 rounded-lg"/> : <Loader2 className="animate-spin mx-auto my-4 h-10 w-10" />}
                        
                        {qrCodeData.secret && (
                            <div className="my-4 text-left">
                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Ou insira este código manualmente</label>
                                <div className="mt-1 select-all p-2 bg-gray-100 dark:bg-gray-900 rounded-md font-mono text-center tracking-widest text-sm">
                                    {qrCodeData.secret}
                                </div>
                            </div>
                        )}
                        
                        <p className="text-sm text-gray-500 my-4">Depois, insira o código de 6 dígitos gerado pela aplicação para verificar.</p>
                        <form onSubmit={handleVerify2FA} className="flex flex-col items-center gap-4">
                           <input 
                                type="text" 
                                value={verificationToken} 
                                onChange={(e) => setVerificationToken(e.target.value.replace(/[^0-9]/g, ''))}
                                className="input-form w-40 text-center tracking-[0.5em] text-2xl" 
                                maxLength="6" 
                                required 
                                inputMode="numeric"
                                autoComplete="one-time-code"
                            />
                           <div className="flex gap-4">
                             <button type="button" onClick={() => setIs2FAModalOpen(false)} className="btn-secondary">Cancelar</button>
                             <button type="submit" className="btn-primary">Verificar e Ativar</button>
                           </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
    );
};


// FILE: src/components/configuracoes/EmpresaContent.jsx
const EmpresaContent = () => {
    const [formData, setFormData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchCompanyData = async () => {
            try {
                setIsLoading(true);
                const data = await getCompanyData();
                setFormData(data);
            } catch (error) {
                toast.error(`Erro ao buscar dados da empresa: ${error.message}`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCompanyData();
    }, []);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const updatedData = await updateCompanyData(formData);
            setFormData(updatedData);
            toast.success("Informações da empresa salvas com sucesso!");
        } catch (error) {
            toast.error(`Erro ao salvar: ${error.message}`);
        }
    };
    if (isLoading) return <div>Carregando dados da empresa...</div>;
    if (!formData) return <div>Não foi possível carregar os dados. Tente novamente.</div>;
    return (
        <form onSubmit={handleSave} className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold">Informações da Empresa</h2>
                <div className="flex items-center gap-6 mt-6"><img src={formData.logoUrl || 'https://placehold.co/150x150/EFEFEF/AAAAAA?text=Logo'} alt="Logo" className="w-24 h-24 rounded-lg bg-gray-200 object-cover"/><button type="button" className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"><Upload size={16}/> Mudar Logo</button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div><label className="label-form">Razão Social</label><input type="text" name="razaoSocial" value={formData.razaoSocial || ''} onChange={handleChange} className="input-form w-full" /></div>
                    <div><label className="label-form">Nome Fantasia</label><input type="text" name="nomeFantasia" value={formData.nomeFantasia || ''} onChange={handleChange} className="input-form w-full" /></div>
                    <div><label className="label-form">CNPJ</label><input type="text" name="cnpj" value={formData.cnpj || ''} onChange={handleChange} className="input-form w-full" placeholder="00.000.000/0001-00"/></div>
                </div>
            </div>
             <div className="border-t dark:border-gray-700 pt-6">
                <h3 className="text-xl font-semibold">Endereço e Contato</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="md:col-span-2"><label className="label-form">Endereço</label><input type="text" name="endereco" value={formData.endereco || ''} onChange={handleChange} className="input-form w-full" /></div>
                    <div><label className="label-form">CEP</label><input type="text" name="cep" value={formData.cep || ''} onChange={handleChange} className="input-form w-full" /></div>
                    <div><label className="label-form">Cidade</label><input type="text" name="cidade" value={formData.cidade || ''} onChange={handleChange} className="input-form w-full" /></div>
                    <div><label className="label-form">Estado</label><input type="text" name="estado" value={formData.estado || ''} onChange={handleChange} className="input-form w-full" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div><label className="label-form">Telefone Comercial</label><input type="tel" name="telefone" value={formData.telefone || ''} onChange={handleChange} className="input-form w-full" /></div>
                    <div><label className="label-form">Email Comercial</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="input-form w-full" /></div>
                </div>
            </div>
            <div className="border-t dark:border-gray-700 pt-6">
                <h3 className="text-xl font-semibold">Dados Bancários para Recebimento</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div><label className="label-form">Banco</label><input type="text" name="banco" value={formData.banco || ''} onChange={handleChange} className="input-form w-full" /></div>
                    <div><label className="label-form">Agência</label><input type="text" name="agencia" value={formData.agencia || ''} onChange={handleChange} className="input-form w-full" /></div>
                    <div><label className="label-form">Conta Corrente</label><input type="text" name="conta" value={formData.conta || ''} onChange={handleChange} className="input-form w-full" /></div>
                </div>
                <div className="mt-4"><label className="label-form">Chave PIX</label><input type="text" name="chavePix" value={formData.chavePix || ''} onChange={handleChange} className="input-form w-full max-w-sm" /></div>
            </div>
            <div className="border-t dark:border-gray-700 pt-6">
                <h3 className="text-xl font-semibold">Configurações Fiscais</h3>
                <div className="mt-4">
                    <label className="label-form">Regime Tributário</label>
                    <select name="regimeTributario" value={formData.regimeTributario || 'Simples Nacional'} onChange={handleChange} className="input-form w-full max-w-sm"><option>Simples Nacional</option><option>Lucro Presumido</option><option>Lucro Real</option></select>
                </div>
            </div>
            <div className="flex justify-end pt-4"><button type="submit" className="btn-primary">Salvar Informações da Empresa</button></div>
        </form>
    );
};


// FILE: src/components/configuracoes/EquipeContent.jsx
const MembrosView = ({ equipe, funcoes, onDataChange }) => {
    const { currentUser } = useAuth();
    const [modalAberto, setModalAberto] = useState(false);
    const [membroEditando, setMembroEditando] = useState(null);
    
    const handleNovoMembro = () => { setMembroEditando(null); setModalAberto(true); };
    const handleEditarMembro = (membro) => { setMembroEditando(membro); setModalAberto(true); };
    
    const handleSalvarMembro = async (dados) => {
        try {
            if (membroEditando) {
                await updateUser(membroEditando.id, dados);
                toast.success(`Utilizador "${dados.nome}" atualizado!`);
            } else {
                await createUser(dados);
                toast.success(`Utilizador "${dados.nome}" criado com sucesso!`);
            }
            onDataChange();
            setModalAberto(false);
        } catch (error) {
            toast.error(`Erro ao salvar utilizador: ${error.message}`);
        }
    };
    
    const handleRemoverMembro = async (membroId) => {
        if (window.confirm("Tem certeza que deseja remover este membro da equipa?")) {
            try {
                await deleteUser(membroId);
                toast.success("Membro removido.");
                onDataChange();
            } catch (error) {
                toast.error(`Erro ao remover: ${error.message}`);
            }
        }
    };

    return (
        <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold">Membros da Equipa</h3>
                    <p className="text-sm text-gray-500">Adicione, visualize e gira os membros da sua equipa.</p>
                </div>
                <button onClick={handleNovoMembro} className="btn-primary flex items-center gap-2"><Plus size={18}/>Novo Membro</button>
            </div>
            <div className="divide-y dark:divide-gray-700">
                {equipe.map(membro => (
                    <div key={membro.id} className="flex justify-between items-center py-3">
                        <div className="flex items-center gap-4">
                            <img src={membro.avatarUrl || `https://ui-avatars.com/api/?name=${membro.nome}&background=random`} alt={membro.nome} className="w-10 h-10 rounded-full object-cover"/>
                            <div><p className="font-semibold">{membro.nome}</p><p className="text-sm text-gray-500">{membro.email}</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">{membro.role?.name || 'Sem função'}</span>
                            <button onClick={() => handleEditarMembro(membro)} className="p-2 text-gray-400 hover:text-indigo-600" aria-label="Editar"><Edit size={16} /></button>
                            <button 
                                onClick={() => handleRemoverMembro(membro.id)} 
                                className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed" 
                                aria-label="Remover"
                                disabled={membro.id === currentUser.id} // Impede auto-exclusão
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <ModalMembro aberto={modalAberto} aoFechar={() => setModalAberto(false)} aoSalvar={handleSalvarMembro} funcoes={funcoes} membro={membroEditando} />
        </div>
    );
};

const FuncoesView = ({ funcoes, todasAsPermissoes, onDataChange }) => {
    const [modalAberto, setModalAberto] = useState(false);
    const [funcaoEditando, setFuncaoEditando] = useState(null);

    const handleNovaFuncao = () => { setFuncaoEditando(null); setModalAberto(true); };
    const handleEditarFuncao = (funcao) => { setFuncaoEditando(funcao); setModalAberto(true); };
    
    const handleSalvarFuncao = async (dados) => {
        try {
            if (funcaoEditando) {
                await updateRole(funcaoEditando.id, dados);
                toast.success(`Função "${dados.name}" atualizada!`);
            } else {
                await createRole(dados);
                toast.success(`Função "${dados.name}" criada!`);
            }
            onDataChange();
            setModalAberto(false);
        } catch (error) {
            toast.error(`Erro ao salvar função: ${error.message}`);
        }
    }
    return (
        <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center"><h3 className="text-xl font-bold">Funções e Permissões</h3><button onClick={handleNovaFuncao} className="btn-primary flex items-center gap-2"><Plus size={18}/>Nova Função</button></div>
            <p className="text-sm text-gray-500">Crie e edite as funções para definir o que cada membro pode fazer.</p>
            {funcoes.map(funcao => (
                <div key={funcao.id} className="flex justify-between items-center p-4 border dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => handleEditarFuncao(funcao)}>
                    <div><p className="font-semibold text-indigo-600 dark:text-indigo-400">{funcao.name}</p><p className="text-sm text-gray-500">{funcao.permissions.length} de {todasAsPermissoes.length} permissões ativas</p></div>
                </div>
            ))}
            <ModalFuncao aberto={modalAberto} aoFechar={() => setModalAberto(false)} aoSalvar={handleSalvarFuncao} funcao={funcaoEditando} todasAsPermissoes={todasAsPermissoes} />
        </div>
    );
}

const EquipeContent = () => {
    const [subAba, setSubAba] = useState('membros');
    const [equipe, setEquipe] = useState([]);
    const [funcoes, setFuncoes] = useState([]);
    const [permissoes, setPermissoes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [usersData, rolesData, permissionsData] = await Promise.all([
                getAllUsers(), getAllRoles(), getAllPermissions(),
            ]);
            setEquipe(usersData);
            setFuncoes(rolesData);
            setPermissoes(permissionsData);
        } catch (error) {
            toast.error(`Erro ao carregar dados da equipa: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => { fetchData(); }, []);
    
    if (isLoading) return <div>Carregando dados da equipa...</div>;
    
    return (
        <div className="space-y-6">
            <div className="flex items-center border-b dark:border-gray-700">
                <button onClick={() => setSubAba('membros')} className={`px-4 py-2 font-semibold transition ${subAba === 'membros' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-white' : 'text-gray-500'}`}>Membros</button>
                <button onClick={() => setSubAba('funcoes')} className={`px-4 py-2 font-semibold transition ${subAba === 'funcoes' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-white' : 'text-gray-500'}`}>Funções e Permissões</button>
            </div>
            {subAba === 'membros' ? 
                <MembrosView equipe={equipe} funcoes={funcoes} onDataChange={fetchData} /> : 
                <FuncoesView funcoes={funcoes} todasAsPermissoes={permissoes} onDataChange={fetchData} />
            }
        </div>
    );
}


// FILE: src/components/configuracoes/ModelosContent.jsx
const ModelosContent = () => {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    const [templateEditando, setTemplateEditando] = useState(null);
    
    const fetchData = async () => {
        try {
            setIsLoading(true);
            const data = await getAllTemplates();
            setTemplates(data);
        } catch (error) {
            toast.error(`Erro ao buscar modelos: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleNovoModelo = () => {
        setTemplateEditando(null);
        setModalAberto(true);
    };

    const handleEditarModelo = (template) => {
        setTemplateEditando(template);
        setModalAberto(true);
    };

    const handleSalvarModelo = async (dados) => {
        try {
            if (templateEditando) {
                await updateTemplate(templateEditando.id, dados);
                toast.success(`Modelo "${dados.nome}" atualizado!`);
            } else {
                await createTemplate(dados);
                toast.success(`Modelo "${dados.nome}" criado!`);
            }
            fetchData();
            setModalAberto(false);
        } catch (error) {
            toast.error(`Erro ao salvar modelo: ${error.message}`);
        }
    };

    const handleExcluirModelo = async (templateId) => {
        if (window.confirm("Tem certeza que deseja excluir este modelo? Esta ação não pode ser desfeita.")) {
            try {
                await deleteTemplate(templateId);
                toast.success("Modelo excluído com sucesso.");
                fetchData();
            } catch (error) {
                toast.error(`Erro ao excluir: ${error.message}`);
            }
        }
    };

    if (isLoading) return <div>A carregar modelos...</div>;
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Modelos de Documentos</h2>
                <button onClick={handleNovoModelo} className="btn-primary flex items-center gap-2"><Plus size={18}/>Novo Modelo</button>
            </div>
            <p className="text-sm text-gray-500">Crie ou edite modelos para os seus orçamentos, contratos e e-mails.</p>
            <div className="space-y-3">
                {templates.length > 0 ? templates.map(template => (
                    <div key={template.id} className="border dark:border-gray-700 rounded-lg p-4 flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-indigo-600 dark:text-indigo-400">{template.nome}</h3>
                            <p className="text-xs text-gray-500">Tipo: {template.tipo} | Última atualização: {new Date(template.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <button onClick={() => handleEditarModelo(template)} className="p-2 text-gray-400 hover:text-indigo-600" aria-label="Editar"><Edit size={16} /></button>
                             <button onClick={() => handleExcluirModelo(template.id)} className="p-2 text-gray-400 hover:text-red-600" aria-label="Excluir"><Trash2 size={16} /></button>
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-gray-500 py-8">Nenhum modelo encontrado. Clique em "Novo Modelo" para começar.</p>
                )}
            </div>
            <ModalTemplate 
                aberto={modalAberto} 
                aoFechar={() => setModalAberto(false)} 
                aoSalvar={handleSalvarModelo} 
                template={templateEditando} 
            />
        </div>
    );
};


// FILE: src/components/configuracoes/NotificacoesContent.jsx
const NotificacoesContent = () => {
    const [notificacoes, setNotificacoes] = useState({ novo_orcamento: { app: true, email: true }, pagamento_recebido: { app: true, email: false }, tarefa_vencendo: { app: true, email: true }});
    const handleToggle = (evento, tipo) => setNotificacoes(p => ({ ...p, [evento]: { ...p[evento], [tipo]: !p[evento][tipo] } }));
    const NotificationSetting = ({ id, label, config }) => (
        <div className="grid grid-cols-3 items-center py-4 border-b dark:border-gray-700 last:border-none">
            <span className="col-span-1 font-medium">{label}</span>
            <div className="col-span-1 flex justify-center"><input type="checkbox" className="toggle-switch" checked={config.app} onChange={() => handleToggle(id, 'app')} /></div>
            <div className="col-span-1 flex justify-center"><input type="checkbox" className="toggle-switch" checked={config.email} onChange={() => handleToggle(id, 'email')} /></div>
        </div>
    );
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Configurar Notificações</h2>
            <p className="text-sm text-gray-500">Escolha como você e sua equipa serão notificados sobre atividades importantes.</p>
            <div className="border dark:border-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-3 font-semibold text-sm text-gray-500 text-center mb-2 px-2"><span className="text-left">Evento do Sistema</span><span>Na App</span><span>Por E-mail</span></div>
                <NotificationSetting id="novo_orcamento" label="Novo orçamento solicitado" config={notificacoes.novo_orcamento} />
                <NotificationSetting id="pagamento_recebido" label="Pagamento recebido" config={notificacoes.pagamento_recebido} />
                <NotificationSetting id="tarefa_vencendo" label="Tarefa próxima do vencimento" config={notificacoes.tarefa_vencendo} />
            </div>
             <div className="flex justify-end pt-4 mt-4"><button className="btn-primary">Salvar Notificações</button></div>
        </div>
    );
};


// FILE: src/components/configuracoes/IntegracoesContent.jsx
const IntegracoesContent = () => {
    const IntegrationCard = ({ name, description, logo, connected = false }) => (
        <div className="border dark:border-gray-700 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-4"><img src={logo} alt={name} className="w-12 h-12"/><div><h3 className="font-semibold">{name}</h3><p className="text-sm text-gray-500">{description}</p></div></div>
            {connected ? <button className="btn-secondary bg-green-100 text-green-800 border-green-200">Conectado</button> : <button className="btn-primary">Conectar</button>}
        </div>
    );
    return(
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Integrações</h2>
            <p className="text-sm text-gray-500">Conecte seu sistema com outras ferramentas para automatizar tarefas e centralizar informações.</p>
            <div className="space-y-4">
                <IntegrationCard name="Google Agenda" description="Sincronize os seus eventos e prazos." logo="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" />
                <IntegrationCard name="Stripe" description="Processe pagamentos online." logo="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" connected={true} />
                <IntegrationCard name="Bling!" description="Sincronize com o seu ERP de contabilidade." logo="https://s3.amazonaws.com/market.bling.com.br/themes/1/logo.png" />
            </div>
        </div>
    );
};


// FILE: src/components/configuracoes/PersonalizacaoContent.jsx
const PersonalizacaoContent = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold">Aparência e Personalização</h2>
        <div className="space-y-2">
            <h3 className="font-semibold">Tema da Aplicação</h3>
            <p className="text-sm text-gray-500">Mude entre o tema claro e escuro.</p>
            <DarkModeToggle />
        </div>
    </div>
);
// #endregion


// #region Componente Principal

// FILE: src/pages/Configuracoes.jsx (continuação)
export default function Configuracoes() {
  const [abaAtiva, setAbaAtiva] = useState('perfil');

  const abas = [
    { id: 'perfil', nome: 'Meu Perfil', icon: User, component: PerfilContent },
    { id: 'equipe', nome: 'Equipa e Funções', icon: Users, component: EquipeContent },
    { id: 'empresa', nome: 'Dados da Empresa', icon: Building, component: EmpresaContent },
    { id: 'personalizacao', nome: 'Personalização', icon: Palette, component: PersonalizacaoContent },
    { id: 'modelos', nome: 'Modelos de Documentos', icon: FileText, component: ModelosContent },
    { id: 'notificacoes', nome: 'Notificações', icon: Bell, component: NotificacoesContent },
    { id: 'integracoes', nome: 'Integrações', icon: Puzzle, component: IntegracoesContent },
    { id: 'seguranca', nome: 'Segurança', icon: Shield, component: SegurancaContent },
  ];

  const AbaComponente = useMemo(() => {
    const abaAtual = abas.find(aba => aba.id === abaAtiva);
    return abaAtual?.component || (() => <div>Componente não encontrado.</div>);
  }, [abaAtiva]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100">Configurações</h1>
      <div className="flex flex-col md:flex-row gap-10">
        <aside className="w-full md:w-1/4 lg:w-1/5">
          <nav className="flex flex-col gap-1">
            {abas.map((aba) => (
              <button 
                key={aba.id} 
                onClick={() => setAbaAtiva(aba.id)} 
                className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all text-sm font-medium ${
                  abaAtiva === aba.id 
                  ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/60 text-gray-600 dark:text-gray-300'
                }`}
              >
                <aba.icon size={20} />
                <span>{aba.nome}</span>
              </button>
            ))}
          </nav>
        </aside>
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div 
              key={abaAtiva} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg min-h-[400px] border border-gray-200 dark:border-gray-700">
                <AbaComponente />
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
// #endregion