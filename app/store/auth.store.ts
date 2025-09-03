import type { User } from "~/types";
import { create } from "zustand";
import api from "~/lib/axios";

type AuthState = {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    isLogoutLoading: boolean;
    isRoleAdmin: boolean;

    setIsAuthenticated: (value: boolean) => void;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setIsRoleAdmin: (value: boolean) => void;

    fetchAuthenticatedUser: () => Promise<void>;
    logout: () => Promise<void>;
};

const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    isLogoutLoading: false,
    isRoleAdmin: false,

    setIsAuthenticated: (value) => set({ isAuthenticated: value }),
    setUser: (user) => set({ user }),
    setLoading: (value) => set({ isLoading: value }),
    setIsRoleAdmin: (value) => set({ isRoleAdmin: value }),

    fetchAuthenticatedUser: async () => {
        set({ isLoading: true });

        try {
            const response = await api.get("/user");

            if (response?.data)
                set({ isAuthenticated: true, user: response.data.data as User, isRoleAdmin: response.data.data?.role === "admin" });
            else set({ isAuthenticated: false, user: null });
        } catch (e) {
            console.log("fetchAuthenticatedUser error", e);
            set({ isAuthenticated: false, user: null });
        } finally {
            set({ isLoading: false });
        }
    },
    logout: async () => {
        set({ isLogoutLoading: true });

        try {
            await api.post("/auth/logout");

            localStorage.removeItem("authToken");

            set({ isAuthenticated: false, user: null });
        } catch (e) {
            console.log("logout error", e);
            set({ isAuthenticated: false, user: null });
        } finally {
            set({ isLogoutLoading: false });
        }
    },
}));

export default useAuthStore;