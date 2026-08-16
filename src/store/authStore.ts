import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  discord_id: string;
  ic_name: string;
  ic_phone?: string;
  avatar_url?: string;
  position_id: string | null;
  role: string;
  position?: {
    id: string;
    name: string;
    rank: number;
    oc_rate: number;
  };
}

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
