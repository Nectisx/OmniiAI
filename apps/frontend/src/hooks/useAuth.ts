/**
 * Hook useAuth — gestion de l'authentification
 */
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/services/api.service';
import type { RegisterPayload, LoginPayload } from '@omniai/types';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, logout: logoutStore, setAuth } = useAuthStore();

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      queryClient.clear();
      router.push('/chat');
    },
  });

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      queryClient.clear();
      router.push('/chat');
    },
  });

  const logout = () => {
    logoutStore();
    queryClient.clear();
    router.push('/auth/login');
  };

  return {
    user,
    isAuthenticated,
    register: registerMutation.mutateAsync,
    login: loginMutation.mutateAsync,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}

/** Hook pour protéger les pages — redirige si non connecté */
export function useRequireAuth() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  if (typeof window !== 'undefined' && !isAuthenticated) {
    router.replace('/auth/login');
  }

  return { user, isAuthenticated };
}
