import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import LogoLuh from '../assets/teste.jpg';
// Importa as funções da API
import { login as apiLogin, verify2FALogin } from "../services/api";

// --- Componente para o formulário de login principal ---
const LoginForm = ({ onLoginSuccess, on2FARequired }) => {
  const [email, setEmail] = useState("admin@buffet.com");
  const [senha, setSenha] = useState("admin123");
  const [error, setError] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await apiLogin({ email, senha });

      if (data.twoFactorRequired && data.tempToken) {
        on2FARequired(data.tempToken);
      } else if (data.user && data.token) {
        onLoginSuccess(data.user, data.token);
      } else {
        throw new Error("Resposta inválida do servidor ao tentar fazer login.");
      }
    } catch (err) {
      console.error("Erro no login:", err);
      setError(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const errorVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 500, damping: 20 } },
  };

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
      <div className="text-left mb-10">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Aceda à sua conta</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Bem-vindo(a) de volta!</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <label className="label-form">Email</label>
          <Mail className="absolute top-10 left-3 text-gray-400" size={20} />
          <input type="email" className="input-form w-full pl-10 focus:ring-red-500" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="relative">
          <label className="label-form">Senha</label>
          <Lock className="absolute top-10 left-3 text-gray-400" size={20} />
          <input type={mostrarSenha ? "text" : "password"} className="input-form w-full pl-10 pr-10 focus:ring-red-500" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} />
          <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute top-9 right-3 text-gray-500 hover:text-red-600 transition">
            {mostrarSenha ? <EyeOff size={20}/> : <Eye size={20}/>}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center"><input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" /><label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Lembrar-me</label></div>
          <div className="text-sm"><Link to="/recuperar-senha" className="font-medium text-teal-600 hover:text-teal-500">Esqueceu a senha?</Link></div>
        </div>
        {error && (
          <motion.p variants={errorVariants} initial="hidden" animate="visible" className="text-red-500 text-sm text-center font-medium bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
            {error}
          </motion.p>
        )}
        <motion.button type="submit" disabled={isLoading} whileHover={{ scale: isLoading ? 1 : 1.03 }} whileTap={{ scale: isLoading ? 1 : 0.98 }} className="btn-primary w-full py-3 flex justify-center items-center bg-red-500 hover:bg-red-600 disabled:bg-red-400">
          {isLoading ? <Loader2 className="animate-spin" /> : 'Entrar'}
        </motion.button>
      </form>
    </motion.div>
  );
};

// --- Componente para o formulário de verificação 2FA ---
const TwoFactorForm = ({ tempToken, onLoginSuccess }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const data = await verify2FALogin({ tempToken, token: code });
            
            if (data.user && data.token) {
                onLoginSuccess(data.user, data.token);
            } else {
                throw new Error("Resposta inválida do servidor após verificação.");
            }
        } catch(err) {
            console.error("Erro na verificação 2FA:", err);
            setError(err.message || "Código inválido ou expirado.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const errorVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 500, damping: 20 } },
    };

    return (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
            <div className="text-center mb-10">
                <ShieldCheck className="mx-auto text-red-500 mb-4" size={48} />
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Verificação de Dois Fatores</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Insira o código da sua aplicação de autenticação.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                    <label className="label-form text-center block">Código de 6 dígitos</label>
                    <input 
                        type="text" 
                        className="input-form w-full text-center text-3xl tracking-[0.5em] font-mono focus:ring-red-500" 
                        value={code} 
                        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                        maxLength="6"
                        autoFocus
                    />
                </div>
                 {error && (
                    <motion.p variants={errorVariants} initial="hidden" animate="visible" className="text-red-500 text-sm text-center font-medium bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
                        {error}
                    </motion.p>
                )}
                <motion.button type="submit" disabled={isLoading} whileHover={{ scale: isLoading ? 1 : 1.03 }} whileTap={{ scale: isLoading ? 1 : 0.98 }} className="btn-primary w-full py-3 flex justify-center items-center bg-red-500 hover:bg-red-600 disabled:bg-red-400">
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Verificar e Entrar'}
                </motion.button>
            </form>
        </motion.div>
    );
};


// --- Componente Principal da Tela de Login ---
export default function Login() {
  const navigate = useNavigate();
  // Pega a função 'login' diretamente do contexto. É a nossa única fonte da verdade.
  const { login } = useAuth();
  
  const [needs2FA, setNeeds2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');

  /**
   * Esta função é chamada quando a API retorna sucesso (com ou sem 2FA).
   * A sua única responsabilidade agora é passar os dados para o AuthContext.
   */
  const handleLoginSuccess = (user, token) => {
    if (user && token) {
        // A função 'login' do contexto vai:
        // 1. Atualizar o estado do React (currentUser e token)
        // 2. Guardar tudo o que for preciso no localStorage
        login(user, token);
        
        // Após o contexto fazer o seu trabalho, navegamos o utilizador.
        navigate("/");
    } else {
        console.error("Tentativa de login bem-sucedida, mas dados em falta. A voltar ao início.");
        setNeeds2FA(false);
    }
  };
  
  // Esta função de callback define que o fluxo 2FA é necessário.
  const handle2FARequired = (receivedTempToken) => {
    setTempToken(receivedTempToken);
    setNeeds2FA(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Coluna Esquerda: Branding */}
      <div className="hidden md:flex md:w-1/2 lg:w-2/3 items-center justify-center p-12 bg-gradient-to-br from-rose-500 to-red-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center z-0 opacity-20" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511795409834-ef04bbd51725?q=80&w=2070')" }}></div>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} className="z-10 text-white text-center">
          <img src={LogoLuh} alt="Logo Luh Espaços e Eventos" className="w-32 h-32 object-cover rounded-full mx-auto mb-6 shadow-xl" />
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">Luh Espaços & Eventos</h1>
          <p className="mt-4 text-lg text-rose-100 max-w-lg">A plataforma completa para gerir os seus eventos com perfeição.</p>
        </motion.div>
      </div>

      {/* Coluna Direita: Formulário */}
      <div className="w-full md:w-1/2 lg:w-1/3 flex items-center justify-center p-6 md:p-12">
        <AnimatePresence mode="wait">
            <motion.div
                key={needs2FA ? '2fa' : 'login'}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
            >
                {needs2FA ? (
                    <TwoFactorForm tempToken={tempToken} onLoginSuccess={handleLoginSuccess} />
                ) : (
                    <LoginForm onLoginSuccess={handleLoginSuccess} on2FARequired={handle2FARequired} />
                )}
            </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}