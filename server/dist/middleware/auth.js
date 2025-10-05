"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../config/auth");
const database_1 = __importDefault(require("../config/database"));
const types_1 = require("../types");
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, auth_1.authConfig.jwtSecret);
        // Get workspace from query or body
        const workspaceId = req.query.workspaceId || req.body.workspaceId;
        if (!workspaceId) {
            return res.status(400).json({ error: 'Workspace ID required' });
        }
        // Verify user has access to workspace
        const [rows] = await database_1.default.query(`SELECT wm.role FROM workspace_members wm 
       WHERE wm.user_id = ? AND wm.workspace_id = ?`, [decoded.userId, workspaceId]);
        if (rows.length === 0) {
            return res.status(403).json({ error: 'Access denied to this workspace' });
        }
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            workspaceId: workspaceId,
            role: rows[0].role
        };
        next();
    }
    catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};
exports.authenticateToken = authenticateToken;
const rolePermissions = {
    [types_1.UserRole.OWNER]: [
        types_1.WorkspacePermission.VIEW_TRANSACTIONS,
        types_1.WorkspacePermission.CREATE_TRANSACTIONS,
        types_1.WorkspacePermission.EDIT_TRANSACTIONS,
        types_1.WorkspacePermission.DELETE_TRANSACTIONS,
        types_1.WorkspacePermission.MANAGE_BUDGETS,
        types_1.WorkspacePermission.MANAGE_GOALS,
        types_1.WorkspacePermission.VIEW_REPORTS,
        types_1.WorkspacePermission.MANAGE_MEMBERS,
        types_1.WorkspacePermission.MANAGE_WORKSPACE
    ],
    [types_1.UserRole.ADMIN]: [
        types_1.WorkspacePermission.VIEW_TRANSACTIONS,
        types_1.WorkspacePermission.CREATE_TRANSACTIONS,
        types_1.WorkspacePermission.EDIT_TRANSACTIONS,
        types_1.WorkspacePermission.DELETE_TRANSACTIONS,
        types_1.WorkspacePermission.MANAGE_BUDGETS,
        types_1.WorkspacePermission.MANAGE_GOALS,
        types_1.WorkspacePermission.VIEW_REPORTS,
        types_1.WorkspacePermission.MANAGE_MEMBERS
    ],
    [types_1.UserRole.EDITOR]: [
        types_1.WorkspacePermission.VIEW_TRANSACTIONS,
        types_1.WorkspacePermission.CREATE_TRANSACTIONS,
        types_1.WorkspacePermission.EDIT_TRANSACTIONS,
        types_1.WorkspacePermission.MANAGE_BUDGETS,
        types_1.WorkspacePermission.MANAGE_GOALS,
        types_1.WorkspacePermission.VIEW_REPORTS
    ],
    [types_1.UserRole.VIEWER]: [
        types_1.WorkspacePermission.VIEW_TRANSACTIONS,
        types_1.WorkspacePermission.VIEW_REPORTS
    ]
};
const checkPermission = (permission) => {
    return (req, res, next) => {
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
exports.checkPermission = checkPermission;
