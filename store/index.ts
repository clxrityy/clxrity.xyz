import { convertSession } from "@/utils/convertSession";
import { Current, Purchase, User } from "@/utils/types";
import { create } from "zustand";

export interface UserState {
    user: User;
    getUser: () => void;
    setUserState: (user: User) => void;
    purchase: (purchase: Purchase) => void;
}



export const useUserStore = create<UserState>((set, get) => ({
    user: {
        username: '',
        id: '',
        avatar: '',
        email: '',
    },
    getUser: async () => {
        const response = await fetch('/api/session');
        const user = await convertSession(response, 'user') as User;
        set({ user });
    },
    setUserState: (user) => set({ user }),
    purchase: (purchase) => {
        
    },
}))