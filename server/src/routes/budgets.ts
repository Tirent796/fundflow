import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';
import { authenticateToken, checkPermission, AuthRequest } from '../middleware/auth';
import { WorkspacePermission } from '../types';
import { generateId } from '../utils/helpers';

const router = express.Router();

// Get budgets
router.get(
  '/',
  authenticateToken,
  checkPermission(WorkspacePermission.MANAGE_BUDGETS),
  async (req: AuthRequest, res) => {
    const { workspaceId } = req.user!;

    try {
      const [budgets] = await pool.query<any[]>(
        `SELECT b.*, u.display_name as user_name,
         (SELECT COALESCE(SUM(amount), 0) FROM transactions 
          WHERE workspace_id = b.workspace_id 
          AND category = b.category 
          AND type = 'expense'
          AND date BETWEEN b.start_date AND b.end_date) as spent
         FROM budgets b
         LEFT JOIN users u ON b.user_id = u.id
         WHERE b.workspace_id = ?
         ORDER BY b.created_at DESC`,
        [workspaceId]
      );

      res.json({ budgets });
    } catch (error) {
      console.error('Get budgets error:', error);
      res.status(500).json({ error: 'Failed to fetch budgets' });
    }
  }
);

// Create budget
router.post(
  '/',
  authenticateToken,
  checkPermission(WorkspacePermission.MANAGE_BUDGETS),
  [
    body('category').notEmpty().trim(),
    body('amount').isFloat({ min: 0.01 }),
    body('period').isIn(['monthly', 'yearly']),
    body('startDate').isISO8601(),
    body('endDate').isISO8601()
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, amount, period, startDate, endDate } = req.body;
    const { workspaceId, id: userId } = req.user!;
    const budgetId = generateId('budget');

    try {
      await pool.query(
        `INSERT INTO budgets 
         (id, workspace_id, user_id, category, amount, period, start_date, end_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [budgetId, workspaceId, userId, category, amount, period, startDate, endDate]
      );

      res.status(201).json({ 
        id: budgetId,
        category,
        amount,
        period,
        startDate,
        endDate
      });
    } catch (error) {
      console.error('Create budget error:', error);
      res.status(500).json({ error: 'Failed to create budget' });
    }
  }
);

// Delete budget
router.delete(
  '/:id',
  authenticateToken,
  checkPermission(WorkspacePermission.MANAGE_BUDGETS),
  async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { workspaceId } = req.user!;

    try {
      const [result] = await pool.query<any>(
        'DELETE FROM budgets WHERE id = ? AND workspace_id = ?',
        [id, workspaceId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      res.json({ message: 'Budget deleted successfully' });
    } catch (error) {
      console.error('Delete budget error:', error);
      res.status(500).json({ error: 'Failed to delete budget' });
    }
  }
);

export default router;
