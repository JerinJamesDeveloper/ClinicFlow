import type { User } from '../types/api.types';

const ADMIN_ALIASES = new Set(['admin', 'clinic_admin', 'super_admin']);

export const isDevAdmin = (user: User | null | undefined): boolean => {
  return Boolean(import.meta.env.DEV && user?.role === 'admin');
};

export const roleMatches = (requiredRole: string, userRole: string): boolean => {
  if (requiredRole === 'admin') return ADMIN_ALIASES.has(userRole);
  return requiredRole === userRole;
};

export const userHasAnyRole = (roles: string[], user: User | null | undefined): boolean => {
  if (!user) return false;
  if (isDevAdmin(user)) return true;
  return roles.some((role) => roleMatches(role, user.role));
};

