import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';
import { authenticateToken, checkPermission, AuthRequest } from '../middleware/auth';
import { WorkspacePermission } from '../types';
import { generateId } from '../utils/helpers';

const router = express.Router();

// Get goals
router.get(
  '/',
  authenticateToken,
  checkPermission(WorkspacePermission.MANAGE_GOALS),
  async (req: AuthRequest, res) => {
    const { workspaceId } = req.user!;

    try {
      const [goals] = await pool.query<any[]>(
        `SELECT g.*, u.display_name as user_name
         FROM goals g
         LEFT JOIN users u ON g.user_id = u.id
         WHERE g.workspace_id = ?
         ORDER BY g.deadline ASC`,
        [workspaceId]
      );

      res.json({ goals });
    } catch (error) {
      console.error('Get goals error:', error);
      res.status(500).json({ error: 'Failed to fetch goals' });
    }
  }
);

// Create goal
router.post(
  '/',
  authenticateToken,
  checkPermission(WorkspacePermission.MANAGE_GOALS),
  [
    body('name').notEmpty().trim(),
    body('targetAmount').isFloat({ min: 0.01 }),
    body('deadline').isISO8601()
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, targetAmount, deadline } = req.body;
    const { workspaceId, id: userId } = req.user!;
    const goalId = generateId('goal');

    try {
      await pool.query(
        `INSERT INTO goals 
         (id, workspace_id, user_id, name, target_amount, current_amount, deadline, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, NOW(), NOW())`,
        [goalId, workspaceId, userId, name, targetAmount, deadline]
      );

      res.status(201).json({ 
        id: goalId,
        name,
        targetAmount,
        currentAmount: 0,
        deadline
      });
    } catch (error) {
      console.error('Create goal error:', error);
      res.status(500).json({ error: 'Failed to create goal' });
    }
  }
);

// Contribute to goal
router.post(
  '/:id/contribute',
  authenticateToken,
  checkPermission(WorkspacePermission.MANAGE_GOALS),
  [body('amount').isFloat({ min: 0.01 })],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { amount } = req.body;
    const { workspaceId } = req.user!;

    try {
      const [goals] = await pool.query<any[]>(
        'SELECT current_amount FROM goals WHERE id = ? AND workspace_id = ?',
        [id, workspaceId]
      );

      if (goals.length === 0) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      await pool.query(
        'UPDATE goals SET current_amount = current_amount + ?, updated_at = NOW() WHERE id = ?',
        [amount, id]
      );

      res.json({ 
        message: 'Contribution added successfully',
        amount,
        newTotal: goals[0].current_amount + amount
      });
    } catch (error) {
      console.error('Contribute to goal error:', error);
      res.status(500).json({ error: 'Failed to add contribution' });
    }
  }
);

// Delete goal
router.delete(
  '/:id',
  authenticateToken,
  checkPermission(WorkspacePermission.MANAGE_GOALS),
  async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { workspaceId } = req.user!;

    try {
      const [result] = await pool.query<any>(
        'DELETE FROM goals WHERE id = ? AND workspace_id = ?',
        [id, workspaceId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
      console.error('Delete goal error:', error);
      res.status(500).json({ error: 'Failed to delete goal' });
    }
  }
);

export default router;
