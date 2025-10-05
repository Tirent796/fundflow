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
// Get goals
router.get('/', auth_1.authenticateToken, (0, auth_1.checkPermission)(types_1.WorkspacePermission.MANAGE_GOALS), async (req, res) => {
    const { workspaceId } = req.user;
    try {
        const [goals] = await database_1.default.query(`SELECT g.*, u.display_name as user_name
         FROM goals g
         LEFT JOIN users u ON g.user_id = u.id
         WHERE g.workspace_id = ?
         ORDER BY g.deadline ASC`, [workspaceId]);
        res.json({ goals });
    }
    catch (error) {
        console.error('Get goals error:', error);
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
});
// Create goal
router.post('/', auth_1.authenticateToken, (0, auth_1.checkPermission)(types_1.WorkspacePermission.MANAGE_GOALS), [
    (0, express_validator_1.body)('name').notEmpty().trim(),
    (0, express_validator_1.body)('targetAmount').isFloat({ min: 0.01 }),
    (0, express_validator_1.body)('deadline').isISO8601()
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, targetAmount, deadline } = req.body;
    const { workspaceId, id: userId } = req.user;
    const goalId = (0, helpers_1.generateId)('goal');
    try {
        await database_1.default.query(`INSERT INTO goals 
         (id, workspace_id, user_id, name, target_amount, current_amount, deadline, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, NOW(), NOW())`, [goalId, workspaceId, userId, name, targetAmount, deadline]);
        res.status(201).json({
            id: goalId,
            name,
            targetAmount,
            currentAmount: 0,
            deadline
        });
    }
    catch (error) {
        console.error('Create goal error:', error);
        res.status(500).json({ error: 'Failed to create goal' });
    }
});
// Contribute to goal
router.post('/:id/contribute', auth_1.authenticateToken, (0, auth_1.checkPermission)(types_1.WorkspacePermission.MANAGE_GOALS), [(0, express_validator_1.body)('amount').isFloat({ min: 0.01 })], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    const { amount } = req.body;
    const { workspaceId } = req.user;
    try {
        const [goals] = await database_1.default.query('SELECT current_amount FROM goals WHERE id = ? AND workspace_id = ?', [id, workspaceId]);
        if (goals.length === 0) {
            return res.status(404).json({ error: 'Goal not found' });
        }
        await database_1.default.query('UPDATE goals SET current_amount = current_amount + ?, updated_at = NOW() WHERE id = ?', [amount, id]);
        res.json({
            message: 'Contribution added successfully',
            amount,
            newTotal: goals[0].current_amount + amount
        });
    }
    catch (error) {
        console.error('Contribute to goal error:', error);
        res.status(500).json({ error: 'Failed to add contribution' });
    }
});
// Delete goal
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.checkPermission)(types_1.WorkspacePermission.MANAGE_GOALS), async (req, res) => {
    const { id } = req.params;
    const { workspaceId } = req.user;
    try {
        const [result] = await database_1.default.query('DELETE FROM goals WHERE id = ? AND workspace_id = ?', [id, workspaceId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Goal not found' });
        }
        res.json({ message: 'Goal deleted successfully' });
    }
    catch (error) {
        console.error('Delete goal error:', error);
        res.status(500).json({ error: 'Failed to delete goal' });
    }
});
exports.default = router;
