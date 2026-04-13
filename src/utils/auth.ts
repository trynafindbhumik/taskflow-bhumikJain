import Cookies from 'js-cookie';

import type { User } from '@/utils/types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const auth = {
  setToken: (token: string) => {
    Cookies.set(TOKEN_KEY, token, { expires: 7, secure: true, sameSite: 'strict' });
  },
  getToken: () => {
    return Cookies.get(TOKEN_KEY);
  },
  setUser: (user: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  getUser: (): User | null => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },
  logout: () => {
    Cookies.remove(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isAuthenticated: () => {
    return !!Cookies.get(TOKEN_KEY);
  },
};
