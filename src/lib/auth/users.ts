import { AuthUser, UserRole } from '../db/types';

export interface SystemUser extends AuthUser {
  password: string;
}

export const SYSTEM_USERS: SystemUser[] = [
  {
    id: 'user_doctor',
    username: 'doctor@dwargasai.in',
    email: 'doctor@dwargasai.in',
    password: 'doctor123',
    name: 'Dr. Dwaraga Sai',
    role: 'doctor',
    title: 'Chief Medical Officer (Approver)',
    avatar: 'DS'
  },
  {
    id: 'user_manager',
    username: 'manager@dwargasai.in',
    email: 'manager@dwargasai.in',
    password: 'manager123',
    name: 'Operations Manager',
    role: 'manager',
    title: 'Community Operations (Dispatcher)',
    avatar: 'OM'
  }
];

export function authenticateUser(usernameOrEmail: string, passwordAttempt: string): AuthUser | null {
  const cleanInput = (usernameOrEmail || '').trim().toLowerCase();
  const user = SYSTEM_USERS.find(
    u => (u.username.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput) &&
         u.password === passwordAttempt
  );

  if (!user) return null;

  // Return public safe user profile without password
  const { password: _, ...publicUser } = user;
  return publicUser;
}

export function getUserById(id: string): AuthUser | null {
  const user = SYSTEM_USERS.find(u => u.id === id);
  if (!user) return null;
  const { password: _, ...publicUser } = user;
  return publicUser;
}
