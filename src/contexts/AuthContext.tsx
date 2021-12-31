import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from 'react';
import Router from 'next/router';
import { parseCookies } from 'nookies';

import { api } from '../services/apiClient';
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
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
  user?: User;
  isAuthenticated: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);
let authChannel: BroadcastChannel;

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
    authChannel = new BroadcastChannel('auth');

    authChannel.onmessage = (message) => {
      switch (message.data) {
        case 'signOut':
          Router.push('/');
          break;
        case 'signIn':
          Router.push('dashboard');
          break;
        default:
          break;
      }
    };
  }, []);

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

      setAuthCookies({ token, refreshToken });
      setUser({
        email: credentials.email,
        permissions,
        roles,
      });

      api.defaults.headers['Authorization'] = `Bearer ${token}`;
      authChannel.postMessage('signIn');
      Router.push('/dashboard');
    } catch (err) {
      console.log(err);
    }
  }

  function signOut() {
    destroyAuthCookies();
    authChannel.postMessage('signOut');
    Router.push('/');
  }

  return (
    <AuthContext.Provider value={{ signIn, signOut, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  );
}
