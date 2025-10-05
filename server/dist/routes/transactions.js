"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const types_1 = require("../types");
const helpers_1 = require("../utils/helpers");
const router = express_1.default.Router();
// Get transactions
router.get('/', auth_1.authenticateToken, (0, auth_1.checkPermission)(types_1.WorkspacePermission.VIEW_TRANSACTIONS), async (req, res) => {
    const { workspaceId } = req.user;
    const { startDate, endDate, type, category } = req.query;
    try {
        let query = `
        SELECT t.*, u.display_name as user_name
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.workspace_id = ?
      `;
        const params = [workspaceId];
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
        const [transactions] = await database_1.default.query(query, params);
        res.json({ transactions });
    }
    catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});
// Create transaction
router.post('/', auth_1.authenticateToken, (0, auth_1.checkPermission)(types_1.WorkspacePermission.CREATE_TRANSACTIONS), [
    (0, express_validator_1.body)('type').isIn(['income', 'expense']),
    (0, express_validator_1.body)('amount').isFloat({ min: 0.01 }),
    (0, express_validator_1.body)('category').notEmpty().trim(),
    (0, express_validator_1.body)('description').optional().trim(),
    (0, express_validator_1.body)('date').isISO8601()
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { type, amount, category, description, date } = req.body;
    const { workspaceId, id: userId } = req.user;
    const transactionId = (0, helpers_1.generateId)('txn');
    try {
        await database_1.default.query(`INSERT INTO transactions 
         (id, workspace_id, user_id, type, amount, category, description, date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`, [transactionId, workspaceId, userId, type, amount, category, description || '', date]);
        res.status(201).json({
            id: transactionId,
            type,
            amount,
            category,
            description,
            date
        });
    }
    catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});
// Update transaction
router.patch('/:id', auth_1.authenticateToken, (0, auth_1.checkPermission)(types_1.WorkspacePermission.EDIT_TRANSACTIONS), async (req, res) => {
    const { id } = req.params;
    const { workspaceId } = req.user;
    const updates = req.body;
    try {
        // Verify transaction belongs to workspace
        const [transactions] = await database_1.default.query('SELECT id FROM transactions WHERE id = ? AND workspace_id = ?', [id, workspaceId]);
        if (transactions.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        const allowedFields = ['type', 'amount', 'category', 'description', 'date'];
        const setClauses = [];
        const values = [];
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
        await database_1.default.query(`UPDATE transactions SET ${setClauses.join(', ')} WHERE id = ? AND workspace_id = ?`, values);
        res.json({ message: 'Transaction updated successfully' });
    }
    catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});
// Delete transaction
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.checkPermission)(types_1.WorkspacePermission.DELETE_TRANSACTIONS), async (req, res) => {
    const { id } = req.params;
    const { workspaceId } = req.user;
    try {
        const [result] = await database_1.default.query('DELETE FROM transactions WHERE id = ? AND workspace_id = ?', [id, workspaceId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json({ message: 'Transaction deleted successfully' });
    }
    catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});
exports.default = router;
