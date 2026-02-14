import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getMyProfile } from '../services/api'; 

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken')); 
  const [loading, setLoading] = useState(true);

  // A lógica deste useEffect está correta e não precisa mudar.
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const userProfile = await getMyProfile();
          setCurrentUser(userProfile);
          localStorage.setItem('authUser', JSON.stringify(userProfile));
        } catch (error) {
          console.error("Falha na autenticação com token existente:", error);
          logout();
        }
      }
      setLoading(false);
    };
    
    initializeAuth();
  }, [token]);


  const login = useCallback((userData, userToken) => {
    localStorage.setItem('authToken', userToken);
    localStorage.setItem('authUser', JSON.stringify(userData));
    setToken(userToken); 
    setCurrentUser(userData); 
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setCurrentUser(null);
  }, []);
  
  const updateCurrentUser = useCallback((newUserData) => {
    setCurrentUser(newUserData);
    localStorage.setItem('authUser', JSON.stringify(newUserData));
  }, []);

  // O 'value' do provider não muda
  const value = { 
    logado: !!currentUser,
    currentUser, 
    token,
    login, 
    logout,
    updateCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};