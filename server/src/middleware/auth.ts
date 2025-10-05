import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth';
import pool from '../config/database';
import { UserRole, WorkspacePermission } from '../types';

interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    workspaceId: string;
    role: UserRole;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret) as JwtPayload;
    
    // Get workspace from query or body
    const workspaceId = req.query.workspaceId as string || req.body.workspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID required' });
    }

    // Verify user has access to workspace
    const [rows] = await pool.query<any[]>(
      `SELECT wm.role FROM workspace_members wm 
       WHERE wm.user_id = ? AND wm.workspace_id = ?`,
      [decoded.userId, workspaceId]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      workspaceId: workspaceId,
      role: rows[0].role as UserRole
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const rolePermissions: Record<UserRole, WorkspacePermission[]> = {
  [UserRole.OWNER]: [
    WorkspacePermission.VIEW_TRANSACTIONS,
    WorkspacePermission.CREATE_TRANSACTIONS,
    WorkspacePermission.EDIT_TRANSACTIONS,
    WorkspacePermission.DELETE_TRANSACTIONS,
    WorkspacePermission.MANAGE_BUDGETS,
    WorkspacePermission.MANAGE_GOALS,
    WorkspacePermission.VIEW_REPORTS,
    WorkspacePermission.MANAGE_MEMBERS,
    WorkspacePermission.MANAGE_WORKSPACE
  ],
  [UserRole.ADMIN]: [
    WorkspacePermission.VIEW_TRANSACTIONS,
    WorkspacePermission.CREATE_TRANSACTIONS,
    WorkspacePermission.EDIT_TRANSACTIONS,
    WorkspacePermission.DELETE_TRANSACTIONS,
    WorkspacePermission.MANAGE_BUDGETS,
    WorkspacePermission.MANAGE_GOALS,
    WorkspacePermission.VIEW_REPORTS,
    WorkspacePermission.MANAGE_MEMBERS
  ],
  [UserRole.EDITOR]: [
    WorkspacePermission.VIEW_TRANSACTIONS,
    WorkspacePermission.CREATE_TRANSACTIONS,
    WorkspacePermission.EDIT_TRANSACTIONS,
    WorkspacePermission.MANAGE_BUDGETS,
    WorkspacePermission.MANAGE_GOALS,
    WorkspacePermission.VIEW_REPORTS
  ],
  [UserRole.VIEWER]: [
    WorkspacePermission.VIEW_TRANSACTIONS,
    WorkspacePermission.VIEW_REPORTS
  ]
};

export const checkPermission = (permission: WorkspacePermission) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userPermissions = rolePermissions[req.user.role];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        role: req.user.role
      });
    }

    next();
  };
};
