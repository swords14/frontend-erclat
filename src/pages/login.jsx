// Caminho do arquivo: src/pages/login.jsx

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, Sparkles } from 'lucide-react';
import { login as apiLogin, verify2FALogin } from '@/services/api';

// --- Componente para o formulário de login principal ---
const LoginForm = ({ onLoginSuccess, on2FARequired }) => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrarMe, setLembrarMe] = useState(false);
  const [error, setError] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const emailSalvo = localStorage.getItem("eclat_saved_email");
    if (emailSalvo) {
      setEmail(emailSalvo);
      setLembrarMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (lembrarMe) {
        localStorage.setItem("eclat_saved_email", email);
      } else {
        localStorage.removeItem("eclat_saved_email");
      }

      const data = await apiLogin({ email, password: senha });

      if (data.twoFactorRequired && data.tempToken) {
        on2FARequired(data.tempToken);
      } else if (data.user && data.token) {
        onLoginSuccess(data.user, data.token);
      } else {
        throw new Error("Resposta inválida do servidor.");
      }
    } catch (err) {
      console.error("Erro no login:", err);
      setError(err.message || "Credenciais inválidas. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }} 
      className="w-full"
    >
      <div className="text-center mb-10">
        <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">Acesso ao Sistema</h2>
        <p className="text-zinc-500 mt-2 text-sm font-light">Insira suas credenciais para continuar</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative group">
          <Mail className="absolute top-3 left-4 text-zinc-500 group-focus-within:text-amber-400 transition-colors duration-300" size={20} strokeWidth={1.5} />
          <input 
            id="email"
            type="email" 
            autoComplete="username"
            required
            className="w-full pl-12 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:bg-zinc-900 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all duration-300" 
            placeholder="seu@email.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
        
        <div className="relative group">
          <Lock className="absolute top-3 left-4 text-zinc-500 group-focus-within:text-amber-400 transition-colors duration-300" size={20} strokeWidth={1.5} />
          <input 
            id="password"
            type={mostrarSenha ? "text" : "password"} 
            autoComplete="current-password"
            required
            className="w-full pl-12 pr-12 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:bg-zinc-900 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all duration-300" 
            placeholder="••••••••" 
            value={senha} 
            onChange={(e) => setSenha(e.target.value)} 
          />
          <button 
            type="button" 
            onClick={() => setMostrarSenha(!mostrarSenha)} 
            className="absolute top-3 right-4 text-zinc-500 hover:text-zinc-300 transition-colors" 
            aria-label="Alternar visibilidade da senha"
          >
            {mostrarSenha ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
          </button>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center">
            <input 
              id="remember-me" 
              type="checkbox" 
              checked={lembrarMe}
              onChange={(e) => setLembrarMe(e.target.checked)}
              className="h-4 w-4 bg-zinc-900 border-zinc-700 rounded text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-950 cursor-pointer transition-colors" 
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-400 cursor-pointer hover:text-zinc-300 transition-colors">
              Lembrar-me
            </label>
          </div>
          <div className="text-sm">
            <Link to="/recuperar-senha" className="font-medium text-amber-500 hover:text-amber-400 transition-colors">
              Recuperar senha
            </Link>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
            <p className="text-red-400 text-sm text-center font-medium bg-red-500/10 border border-red-500/20 p-3 rounded-lg mt-4">
              {error}
            </p>
          </motion.div>
        )}

        <motion.button 
          type="submit" 
          disabled={isLoading} 
          whileHover={{ scale: isLoading ? 1 : 1.02 }} 
          whileTap={{ scale: isLoading ? 1 : 0.98 }} 
          className="w-full py-3.5 mt-6 flex justify-center items-center bg-gradient-to-r from-amber-200 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-zinc-950 rounded-xl font-bold shadow-lg shadow-amber-500/10 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
        >
          {isLoading ? <Loader2 className="animate-spin text-zinc-950" size={24} /> : 'Entrar na Éclat'}
        </motion.button>
      </form>
    </motion.div>
  );
};

// --- Componente para o formulário de verificação 2FA ---
const TwoFactorForm = ({ tempToken, onLoginSuccess, onCancel }) => {
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const inputRefs = useRef([]);

    const handleChange = (element, index) => {
        const value = element.value;
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);
        if (value && index < 5 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').slice(0, 6);
        if (/^\d+$/.test(pastedData)) {
            const pastedArray = pastedData.split('').concat(new Array(6 - pastedData.length).fill(''));
            setOtp(pastedArray.slice(0, 6));
            const focusIndex = Math.min(pastedData.length, 5);
            if (inputRefs.current[focusIndex]) inputRefs.current[focusIndex].focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const code = otp.join("");
        if (code.length < 6) {
            setError("Insira todos os 6 dígitos.");
            return;
        }
        setError("");
        setIsLoading(true);
        try {
            const data = await verify2FALogin({ tempToken, token: code });
            if (data.user && data.token) {
                onLoginSuccess(data.user, data.token);
            } else {
                throw new Error("Resposta inválida.");
            }
        } catch(err) {
            setError(err.message || "Código inválido ou expirado.");
            setOtp(new Array(6).fill(""));
            if (inputRefs.current[0]) inputRefs.current[0].focus();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
            <button 
                onClick={onCancel}
                className="flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-300 mb-8 transition-colors"
                type="button"
            >
                <ArrowLeft size={16} className="mr-2" />
                Voltar
            </button>

            <div className="text-center mb-10">
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                   <ShieldCheck className="text-amber-400" size={32} strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-semibold text-zinc-100">Autenticação</h2>
                <p className="text-zinc-500 mt-2 text-sm font-light">Digite o código de 6 dígitos do seu app autenticador.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex justify-between gap-2">
                    {otp.map((data, index) => (
                        <input
                            key={index}
                            type="text"
                            inputMode="numeric"
                            autoComplete={index === 0 ? "one-time-code" : "off"}
                            className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-light text-zinc-100 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:bg-zinc-900 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all duration-300"
                            value={data}
                            onChange={(e) => handleChange(e.target, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            onPaste={handlePaste}
                            ref={(el) => (inputRefs.current[index] = el)}
                            maxLength={1}
                            autoFocus={index === 0}
                        />
                    ))}
                </div>

                 {error && (
                     <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                     <p className="text-red-400 text-sm text-center font-medium bg-red-500/10 border border-red-500/20 p-3 rounded-lg mt-4">
                       {error}
                     </p>
                   </motion.div>
                )}
                
                <motion.button 
                  type="submit" 
                  disabled={isLoading} 
                  whileHover={{ scale: isLoading ? 1 : 1.02 }} 
                  whileTap={{ scale: isLoading ? 1 : 0.98 }} 
                  className="w-full py-3.5 mt-8 flex justify-center items-center bg-gradient-to-r from-amber-200 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-zinc-950 rounded-xl font-bold shadow-lg shadow-amber-500/10 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
                >
                    {isLoading ? <Loader2 className="animate-spin text-zinc-950" size={24} /> : 'Verificar e Acessar'}
                </motion.button>
            </form>
        </motion.div>
    );
};

// --- Componente Principal da Tela de Login ---
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [needs2FA, setNeeds2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');

  const handleLoginSuccess = (user, token) => {
    if (user && token) {
        login(user, token);
        navigate("/");
    } else {
        setNeeds2FA(false);
    }
  };
  
  const handle2FARequired = (receivedTempToken) => {
    setTempToken(receivedTempToken);
    setNeeds2FA(true);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 overflow-hidden selection:bg-amber-500/30 selection:text-amber-100">
      
      {/* --- Fundo Atmosférico de Luxo --- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950"></div>
        <motion.div 
          animate={{ 
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-amber-600/10 blur-[150px]"
        />
        <motion.div 
          animate={{ 
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[60%] -right-[10%] w-[500px] h-[500px] rounded-full bg-yellow-600/10 blur-[120px]"
        />
      </div>

      {/* --- Container do Card Central --- */}
      <div className="relative z-10 w-full max-w-lg p-6">
        
        {/* Marca ÉCLAT no topo do Card */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col justify-center items-center mb-10"
        >
          <div className="relative mb-4">
            {/* Brilho sutil atrás do ícone */}
            <div className="absolute inset-0 bg-amber-400 blur-xl opacity-20 rounded-full"></div>
            <Sparkles className="text-amber-400 relative z-10" size={42} strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-light text-zinc-100 tracking-[0.3em] uppercase ml-3">
            Éclat
          </h1>
        </motion.div>

        {/* Card Glassmorphism Refinado */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800/80 p-8 sm:p-12 rounded-[2rem] shadow-2xl shadow-black/50 relative overflow-hidden"
        >
          {/* Fio de luz sutil no topo do card */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
          
          <AnimatePresence mode="wait">
            {needs2FA ? (
              <TwoFactorForm 
                key="2fa"
                tempToken={tempToken} 
                onLoginSuccess={handleLoginSuccess} 
                onCancel={() => setNeeds2FA(false)} 
              />
            ) : (
              <LoginForm 
                key="login"
                onLoginSuccess={handleLoginSuccess} 
                on2FARequired={handle2FARequired} 
              />
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Rodapé Minimalista */}
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 1, duration: 1 }}
          className="text-center text-zinc-600 text-xs mt-10 tracking-wider uppercase"
        >
          &copy; {new Date().getFullYear()} Éclat Systems
        </motion.p>
      </div>
    </div>
  );
}