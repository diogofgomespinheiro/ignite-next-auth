import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from 'react';
import Router from 'next/router';
import { parseCookies } from 'nookies';

import { api } from '../services/api';
import { setAuthCookies, destroyAuthCookies } from '../utils/auth';

type User = {
  email: string;
  permissions: string[];
  roles: string[];
};

type SignInCredentials = {
  email: string;
  password: string;
};

interface AuthContextData {
  signIn(credentials: SignInCredentials): Promise<void>;
  user?: User;
  isAuthenticated: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function useAuth() {
  const context = useContext(AuthContext);

  if (typeof context === 'undefined' || context === undefined) {
    throw new Error(`useAuth must be used within a AuthProvider`);
  }

  return context;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const isAuthenticated = Boolean(user);

  useEffect(() => {
    const { 'nextauth.token': token } = parseCookies();

    if (token) {
      api
        .get('/me')
        .then((response) => {
          const { email, permissions, roles } = response.data;
          setUser({ email, permissions, roles });
        })
        .catch(() => {
          destroyAuthCookies();
          Router.push('/');
        });
    }
  }, []);

  async function signIn(credentials: SignInCredentials) {
    try {
      const response = await api.post('sessions', credentials);
      const { token, refreshToken, permissions, roles } = response.data;

      setAuthCookies(token, refreshToken);
      setUser({
        email: credentials.email,
        permissions,
        roles,
      });

      api.defaults.headers['Authorization'] = `Bearer ${token}`;
      Router.push('/dashboard');
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  );
}
