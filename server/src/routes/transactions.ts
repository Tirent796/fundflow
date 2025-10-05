import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';
import { authenticateToken, checkPermission, AuthRequest } from '../middleware/auth';
import { WorkspacePermission } from '../types';
import { generateId } from '../utils/helpers';

const router = express.Router();

// Get transactions
router.get(
  '/',
  authenticateToken,
  checkPermission(WorkspacePermission.VIEW_TRANSACTIONS),
  async (req: AuthRequest, res) => {
    const { workspaceId } = req.user!;
    const { startDate, endDate, type, category } = req.query;

    try {
      let query = `
        SELECT t.*, u.display_name as user_name
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.workspace_id = ?
      `;
      const params: any[] = [workspaceId];

      if (startDate) {
        query += ' AND t.date >= ?';
        params.push(startDate);
      }
      if (endDate) {
        query += ' AND t.date <= ?';
        params.push(endDate);
      }
      if (type) {
        query += ' AND t.type = ?';
        params.push(type);
      }
      if (category) {
        query += ' AND t.category = ?';
        params.push(category);
      }

      query += ' ORDER BY t.date DESC, t.created_at DESC';

      const [transactions] = await pool.query<any[]>(query, params);
      res.json({ transactions });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }
);

// Create transaction
router.post(
  '/',
  authenticateToken,
  checkPermission(WorkspacePermission.CREATE_TRANSACTIONS),
  [
    body('type').isIn(['income', 'expense']),
    body('amount').isFloat({ min: 0.01 }),
    body('category').notEmpty().trim(),
    body('description').optional().trim(),
    body('date').isISO8601()
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, amount, category, description, date } = req.body;
    const { workspaceId, id: userId } = req.user!;
    const transactionId = generateId('txn');

    try {
      await pool.query(
        `INSERT INTO transactions 
         (id, workspace_id, user_id, type, amount, category, description, date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [transactionId, workspaceId, userId, type, amount, category, description || '', date]
      );

      res.status(201).json({ 
        id: transactionId,
        type,
        amount,
        category,
        description,
        date
      });
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  }
);

// Update transaction
router.patch(
  '/:id',
  authenticateToken,
  checkPermission(WorkspacePermission.EDIT_TRANSACTIONS),
  async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { workspaceId } = req.user!;
    const updates = req.body;

    try {
      // Verify transaction belongs to workspace
      const [transactions] = await pool.query<any[]>(
        'SELECT id FROM transactions WHERE id = ? AND workspace_id = ?',
        [id, workspaceId]
      );

      if (transactions.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const allowedFields = ['type', 'amount', 'category', 'description', 'date'];
      const setClauses: string[] = [];
      const values: any[] = [];

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          setClauses.push(`${key} = ?`);
          values.push(updates[key]);
        }
      });

      if (setClauses.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      setClauses.push('updated_at = NOW()');
      values.push(id, workspaceId);

      await pool.query(
        `UPDATE transactions SET ${setClauses.join(', ')} WHERE id = ? AND workspace_id = ?`,
        values
      );

      res.json({ message: 'Transaction updated successfully' });
    } catch (error) {
      console.error('Update transaction error:', error);
      res.status(500).json({ error: 'Failed to update transaction' });
    }
  }
);

// Delete transaction
router.delete(
  '/:id',
  authenticateToken,
  checkPermission(WorkspacePermission.DELETE_TRANSACTIONS),
  async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { workspaceId } = req.user!;

    try {
      const [result] = await pool.query<any>(
        'DELETE FROM transactions WHERE id = ? AND workspace_id = ?',
        [id, workspaceId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
      console.error('Delete transaction error:', error);
      res.status(500).json({ error: 'Failed to delete transaction' });
    }
  }
);

export default router;
