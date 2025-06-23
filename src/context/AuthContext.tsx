import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '../config/api';

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, fullName: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      console.log('Initializing auth with token:', storedToken); // Debug log
      
      if (storedToken) {
        try {
          // Set auth header for the profile request
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          const response = await apiClient.get('/users/profile');
          setUser(response.data);
          setToken(storedToken);
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('token');
          delete apiClient.defaults.headers.common['Authorization'];
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      
      const response = await apiClient.post('/users/login', {
        username,
        password
      });
      const { token, user } = response.data;
      console.log('Login response token:', token); // Debug log
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Set auth header for future requests
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setToken(token);
      setUser(user);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Provide more specific error messages
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.error || 'Invalid username or password');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (!error.response) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error(error.response.data?.error || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, fullName: string, password: string, role = 'BORROWER') => {
    // Input validation
    if (!username || !fullName || !password) {
      throw new Error('All fields are required');
    }
    
    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    if (fullName.length < 2) {
      throw new Error('Full name must be at least 2 characters long');
    }
    
    // Validate role
    const validRoles = ['BORROWER', 'ADMIN', 'CASHIER', 'ACCOUNTANT'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role specified');
    }

    try {
      setLoading(true);
      
      console.log('Registration URL:', `${apiClient.defaults.baseURL}users/register`);
      console.log('Registration data:', { username, fullName, password, role });
      
      const response = await apiClient.post('/users/register', {
        username,
        fullName,
        password,
        role
      });
      
      const { token, user } = response.data;
      console.log('Register response token:', token); // Debug log
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Set auth header for future requests
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setToken(token);
      setUser(user);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Provide more specific error messages
      if (error.response?.status === 409) {
        throw new Error('Username already exists. Please choose a different username.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.error || 'Invalid registration data');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (!error.response) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error(error.response.data?.error || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('Logging out, removing token:', localStorage.getItem('token')); // Debug log
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 