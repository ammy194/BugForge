export type GlobalRole = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER' | 'REPORTER';

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  global_role: GlobalRole;
  created_at?: string;
}

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
