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
// Get budgets
router.get('/', auth_1.authenticateToken, (0, auth_1.checkPermission)(types_1.WorkspacePermission.MANAGE_BUDGETS), async (req, res) => {
    const { workspaceId } = req.user;
    try {
        const [budgets] = await database_1.default.query(`SELECT b.*, u.display_name as user_name,
         (SELECT COALESCE(SUM(amount), 0) FROM transactions 
          WHERE workspace_id = b.workspace_id 
          AND category = b.category 
          AND type = 'expense'
          AND date BETWEEN b.start_date AND b.end_date) as spent
         FROM budgets b
         LEFT JOIN users u ON b.user_id = u.id
         WHERE b.workspace_id = ?
         ORDER BY b.created_at DESC`, [workspaceId]);
        res.json({ budgets });
    }
    catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({ error: 'Failed to fetch budgets' });
    }
});
// Create budget
router.post('/', auth_1.authenticateToken, (0, auth_1.checkPermission)(types_1.WorkspacePermission.MANAGE_BUDGETS), [
    (0, express_validator_1.body)('category').notEmpty().trim(),
    (0, express_validator_1.body)('amount').isFloat({ min: 0.01 }),
    (0, express_validator_1.body)('period').isIn(['monthly', 'yearly']),
    (0, express_validator_1.body)('startDate').isISO8601(),
    (0, express_validator_1.body)('endDate').isISO8601()
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { category, amount, period, startDate, endDate } = req.body;
    const { workspaceId, id: userId } = req.user;
    const budgetId = (0, helpers_1.generateId)('budget');
    try {
        await database_1.default.query(`INSERT INTO budgets 
         (id, workspace_id, user_id, category, amount, period, start_date, end_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`, [budgetId, workspaceId, userId, category, amount, period, startDate, endDate]);
        res.status(201).json({
            id: budgetId,
            category,
            amount,
            period,
            startDate,
            endDate
        });
    }
    catch (error) {
        console.error('Create budget error:', error);
        res.status(500).json({ error: 'Failed to create budget' });
    }
});
// Delete budget
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.checkPermission)(types_1.WorkspacePermission.MANAGE_BUDGETS), async (req, res) => {
    const { id } = req.params;
    const { workspaceId } = req.user;
    try {
        const [result] = await database_1.default.query('DELETE FROM budgets WHERE id = ? AND workspace_id = ?', [id, workspaceId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Budget not found' });
        }
        res.json({ message: 'Budget deleted successfully' });
    }
    catch (error) {
        console.error('Delete budget error:', error);
        res.status(500).json({ error: 'Failed to delete budget' });
    }
});
exports.default = router;
