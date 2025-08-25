import { useState, useEffect } from 'react';

interface AuthCredentials {
  username: string;
  password: string;
}

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState<AuthCredentials>({
    username: 'admin',
    password: 'admin'
  });

  // Load credentials from localStorage on mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem('admin-credentials');
    if (savedCredentials) {
      try {
        setCredentials(JSON.parse(savedCredentials));
      } catch (error) {
        console.error('Error loading credentials:', error);
      }
    }

    // Check if user was previously authenticated
    const authStatus = localStorage.getItem('admin-authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Save credentials to localStorage when changed
  const updateCredentials = (newCredentials: AuthCredentials) => {
    setCredentials(newCredentials);
    localStorage.setItem('admin-credentials', JSON.stringify(newCredentials));
  };

  const login = (username: string, password: string): boolean => {
    if (username === credentials.username && password === credentials.password) {
      setIsAuthenticated(true);
      localStorage.setItem('admin-authenticated', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin-authenticated');
  };

  const changePassword = (currentPassword: string, newPassword: string): boolean => {
    if (currentPassword === credentials.password) {
      const newCredentials = { ...credentials, password: newPassword };
      updateCredentials(newCredentials);
      return true;
    }
    return false;
  };

  return {
    isAuthenticated,
    login,
    logout,
    changePassword,
    currentUsername: credentials.username
  };
};