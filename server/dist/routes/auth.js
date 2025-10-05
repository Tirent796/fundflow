"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../config/auth");
const helpers_1 = require("../utils/helpers");
const router = express_1.default.Router();
// Register
router.post('/register', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 8 }),
    (0, express_validator_1.body)('displayName').notEmpty().trim()
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password, displayName } = req.body;
    try {
        // Check if user exists
        const [existingUsers] = await database_1.default.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }
        // Hash password
        const passwordHash = await bcrypt_1.default.hash(password, auth_1.authConfig.bcryptRounds);
        const userId = (0, helpers_1.generateId)('user');
        const workspaceId = (0, helpers_1.generateId)('workspace');
        // Start transaction
        const connection = await database_1.default.getConnection();
        await connection.beginTransaction();
        try {
            // Create user
            await connection.query(`INSERT INTO users (id, email, password_hash, display_name, created_at, updated_at)
           VALUES (?, ?, ?, ?, NOW(), NOW())`, [userId, email, passwordHash, displayName]);
            // Create default workspace
            await connection.query(`INSERT INTO workspaces (id, name, owner_id, created_at, updated_at)
           VALUES (?, ?, ?, NOW(), NOW())`, [workspaceId, `${displayName}'s Workspace`, userId]);
            // Add user as workspace owner
            await connection.query(`INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
           VALUES (?, ?, ?, 'owner', NOW())`, [(0, helpers_1.generateId)('member'), workspaceId, userId]);
            await connection.commit();
            connection.release();
            // Generate JWT
            const token = jsonwebtoken_1.default.sign({ userId, email }, auth_1.authConfig.jwtSecret, { expiresIn: auth_1.authConfig.jwtExpiresIn });
            res.status(201).json({
                token,
                user: {
                    id: userId,
                    email,
                    displayName,
                    defaultWorkspace: workspaceId
                }
            });
        }
        catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
// Login
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty()
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
        const [users] = await database_1.default.query('SELECT id, email, password_hash, display_name FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = users[0];
        const validPassword = await bcrypt_1.default.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Get default workspace
        const [workspaces] = await database_1.default.query(`SELECT w.id FROM workspaces w
         JOIN workspace_members wm ON w.id = wm.workspace_id
         WHERE wm.user_id = ? AND wm.role = 'owner'
         LIMIT 1`, [user.id]);
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, auth_1.authConfig.jwtSecret, { expiresIn: auth_1.authConfig.jwtExpiresIn });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
                defaultWorkspace: workspaces[0]?.id
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
exports.default = router;
