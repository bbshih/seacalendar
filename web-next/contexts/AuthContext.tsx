'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  discordId?: string;
  username: string;
  email?: string;
  displayName?: string;
  avatar?: string;
  requireDiscordLink?: boolean;
  discordLinkDeadline?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginDiscord: (returnTo?: string) => void;
  loginGoogle: (returnTo?: string) => void;
  loginLocal: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount (cookies sent automatically)
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loginDiscord = (returnTo?: string) => {
    const state = returnTo || window.location.pathname;
    fetch(`/api/auth/discord/url?state=${encodeURIComponent(state)}`)
      .then((res) => res.json())
      .then((data) => {
        console.log('Discord API response:', data);
        console.log('authUrl:', data.data?.authUrl);
        if (data.data?.authUrl) {
          window.location.href = data.data.authUrl;
        } else {
          console.error('No authUrl in response:', data);
        }
      })
      .catch((error) => {
        console.error('Discord login error:', error);
      });
  };

  const loginGoogle = (returnTo?: string) => {
    const state = returnTo || window.location.pathname;
    fetch(`/api/auth/google/url?state=${encodeURIComponent(state)}`)
      .then((res) => res.json())
      .then((data) => {
        window.location.href = data.data.authUrl;
      });
  };

  const loginLocal = async (username: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Login failed');
    }

    const data = await response.json();
    setUser(data.data.user);
  };

  const register = async (username: string, password: string, email?: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password, email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Registration failed');
    }

    const data = await response.json();
    setUser(data.data.user);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        loginDiscord,
        loginGoogle,
        loginLocal,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
