import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { logado } = useAuth();

  if (!logado) {
    // Se o usuário NÃO estiver logado, ele será redirecionado
    // para a página de login. O 'replace' evita que a página
    // anterior fique no histórico do navegador.
    return <Navigate to="/login" replace />;
  }

  // Se o usuário ESTIVER logado, o componente renderiza o
  // conteúdo que ele deveria ver (o 'children').
  return children;
}