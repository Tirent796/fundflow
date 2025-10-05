export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

export enum WorkspacePermission {
  VIEW_TRANSACTIONS = 'view_transactions',
  CREATE_TRANSACTIONS = 'create_transactions',
  EDIT_TRANSACTIONS = 'edit_transactions',
  DELETE_TRANSACTIONS = 'delete_transactions',
  MANAGE_BUDGETS = 'manage_budgets',
  MANAGE_GOALS = 'manage_goals',
  VIEW_REPORTS = 'view_reports',
  MANAGE_MEMBERS = 'manage_members',
  MANAGE_WORKSPACE = 'manage_workspace'
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: UserRole;
  joined_at: Date;
}

export interface Transaction {
  id: string;
  workspace_id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Budget {
  id: string;
  workspace_id: string;
  user_id: string;
  category: string;
  amount: number;
  period: 'monthly' | 'yearly';
  start_date: Date;
  end_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Goal {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    workspaceId: string;
    role: UserRole;
  };
}
