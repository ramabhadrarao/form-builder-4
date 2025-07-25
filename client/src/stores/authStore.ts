import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions?: Array<{
    resource: string;
    actions: string[];
  }>;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      token: null,
      refreshToken: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          
          const response = await api.post('/auth/login', { email, password });
          const { user, tokens } = response.data.data;

          // Set authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;

          set({
            user,
            isAuthenticated: true,
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isLoading: false,
          });

          toast.success('Login successful!');
        } catch (error: any) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'Login failed';
          toast.error(message);
          throw error;
        }
      },

      register: async (userData: any) => {
        try {
          set({ isLoading: true });
          
          const response = await api.post('/auth/register', userData);
          const { user, tokens } = response.data.data;

          // Set authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;

          set({
            user,
            isAuthenticated: true,
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isLoading: false,
          });

          toast.success('Registration successful!');
        } catch (error: any) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'Registration failed';
          toast.error(message);
          throw error;
        }
      },

      logout: () => {
        const { refreshToken } = get();
        
        // Call logout API
        if (refreshToken) {
          api.post('/auth/logout', { refreshToken }).catch(() => {
            // Ignore logout API errors
          });
        }

        // Clear authorization header
        delete api.defaults.headers.common['Authorization'];

        set({
          user: null,
          isAuthenticated: false,
          token: null,
          refreshToken: null,
          isLoading: false,
        });

        toast.success('Logged out successfully');
      },

      refreshAuth: async () => {
        try {
          const { refreshToken } = get();
          
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await api.post('/auth/refresh-token', { refreshToken });
          const { tokens } = response.data.data;

          // Set authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;

          set({
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });

          return tokens.accessToken;
        } catch (error) {
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      updateProfile: async (data: Partial<User>) => {
        try {
          const response = await api.put('/auth/profile', data);
          const { user } = response.data.data;

          set({ user });
          toast.success('Profile updated successfully');
        } catch (error: any) {
          const message = error.response?.data?.message || 'Profile update failed';
          toast.error(message);
          throw error;
        }
      },

      initializeAuth: () => {
        const { token, refreshToken } = get();
        
        if (token) {
          // Set authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verify token by getting profile
          api.get('/auth/profile')
            .then((response) => {
              const { user } = response.data.data;
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
              });
            })
            .catch(() => {
              // Token is invalid, try to refresh
              if (refreshToken) {
                get().refreshAuth()
                  .then(() => {
                    // Get profile after refresh
                    return api.get('/auth/profile');
                  })
                  .then((response) => {
                    const { user } = response.data.data;
                    set({
                      user,
                      isAuthenticated: true,
                      isLoading: false,
                    });
                  })
                  .catch(() => {
                    // Both token and refresh failed
                    get().logout();
                  });
              } else {
                get().logout();
              }
            });
        } else {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);

// Setup axios interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await useAuthStore.getState().refreshAuth();
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, user will be logged out by refreshAuth
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);