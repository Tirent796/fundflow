import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';
import { authenticateToken, checkPermission, AuthRequest } from '../middleware/auth';
import { WorkspacePermission, UserRole } from '../types';
import { generateId } from '../utils/helpers';

const router = express.Router();

// Get user's workspaces
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [workspaces] = await pool.query<any[]>(
      `SELECT w.*, wm.role, 
        (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) as member_count
       FROM workspaces w
       JOIN workspace_members wm ON w.id = wm.workspace_id
       WHERE wm.user_id = ?
       ORDER BY w.created_at DESC`,
      [req.user!.id]
    );

    res.json({ workspaces });
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

// Create workspace
router.post(
  '/',
  authenticateToken,
  [body('name').notEmpty().trim()],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;
    const workspaceId = generateId('workspace');

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query(
        `INSERT INTO workspaces (id, name, owner_id, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())`,
        [workspaceId, name, req.user!.id]
      );

      await connection.query(
        `INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
         VALUES (?, ?, ?, 'owner', NOW())`,
        [generateId('member'), workspaceId, req.user!.id]
      );

      await connection.commit();
      connection.release();

      res.status(201).json({ workspaceId, name });
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error('Create workspace error:', error);
      res.status(500).json({ error: 'Failed to create workspace' });
    }
  }
);

// Get workspace members
router.get(
  '/:workspaceId/members',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const [members] = await pool.query<any[]>(
        `SELECT wm.id, wm.role, wm.joined_at, u.id as user_id, u.email, u.display_name
         FROM workspace_members wm
         JOIN users u ON wm.user_id = u.id
         WHERE wm.workspace_id = ?
         ORDER BY wm.joined_at ASC`,
        [req.params.workspaceId]
      );

      res.json({ members });
    } catch (error) {
      console.error('Get members error:', error);
      res.status(500).json({ error: 'Failed to fetch members' });
    }
  }
);

// Invite member to workspace
router.post(
  '/:workspaceId/members',
  authenticateToken,
  checkPermission(WorkspacePermission.MANAGE_MEMBERS),
  [
    body('email').isEmail().normalizeEmail(),
    body('role').isIn(['admin', 'editor', 'viewer'])
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, role } = req.body;
    const { workspaceId } = req.params;

    try {
      // Find user by email
      const [users] = await pool.query<any[]>(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userId = users[0].id;

      // Check if already a member
      const [existingMembers] = await pool.query<any[]>(
        'SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
        [workspaceId, userId]
      );

      if (existingMembers.length > 0) {
        return res.status(409).json({ error: 'User is already a member' });
      }

      // Add member
      const memberId = generateId('member');
      await pool.query(
        `INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [memberId, workspaceId, userId, role]
      );

      res.status(201).json({ 
        message: 'Member added successfully',
        memberId,
        email,
        role 
      });
    } catch (error) {
      console.error('Invite member error:', error);
      res.status(500).json({ error: 'Failed to add member' });
    }
  }
);

// Update member role
router.patch(
  '/:workspaceId/members/:memberId',
  authenticateToken,
  checkPermission(WorkspacePermission.MANAGE_MEMBERS),
  [body('role').isIn(['admin', 'editor', 'viewer'])],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role } = req.body;
    const { workspaceId, memberId } = req.params;

    try {
      // Don't allow changing owner role
      const [members] = await pool.query<any[]>(
        'SELECT role FROM workspace_members WHERE id = ? AND workspace_id = ?',
        [memberId, workspaceId]
      );

      if (members.length === 0) {
        return res.status(404).json({ error: 'Member not found' });
      }

      if (members[0].role === 'owner') {
        return res.status(403).json({ error: 'Cannot change owner role' });
      }

      await pool.query(
        'UPDATE workspace_members SET role = ? WHERE id = ? AND workspace_id = ?',
        [role, memberId, workspaceId]
      );

      res.json({ message: 'Role updated successfully', role });
    } catch (error) {
      console.error('Update role error:', error);
      res.status(500).json({ error: 'Failed to update role' });
    }
  }
);

// Remove member
router.delete(
  '/:workspaceId/members/:memberId',
  authenticateToken,
  checkPermission(WorkspacePermission.MANAGE_MEMBERS),
  async (req: AuthRequest, res) => {
    const { workspaceId, memberId } = req.params;

    try {
      // Don't allow removing owner
      const [members] = await pool.query<any[]>(
        'SELECT role FROM workspace_members WHERE id = ? AND workspace_id = ?',
        [memberId, workspaceId]
      );

      if (members.length === 0) {
        return res.status(404).json({ error: 'Member not found' });
      }

      if (members[0].role === 'owner') {
        return res.status(403).json({ error: 'Cannot remove workspace owner' });
      }

      await pool.query(
        'DELETE FROM workspace_members WHERE id = ? AND workspace_id = ?',
        [memberId, workspaceId]
      );

      res.json({ message: 'Member removed successfully' });
    } catch (error) {
      console.error('Remove member error:', error);
      res.status(500).json({ error: 'Failed to remove member' });
    }
  }
);

export default router;
