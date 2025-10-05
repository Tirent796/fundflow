import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';
import { authConfig } from '../config/auth';
import { generateId } from '../utils/helpers';
import { Request, Response } from 'express';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET ?? "dev_secret";

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('displayName').notEmpty().trim()
  ],
  async (req: Request, res: Response) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, displayName } = req.body;

    try {
      // Check if user exists
      const [existingUsers] = await pool.query<any[]>(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, authConfig.bcryptRounds);
      const userId = generateId('user');
      const workspaceId = generateId('workspace');

      // Start transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Create user
        await connection.query(
          `INSERT INTO users (id, email, password_hash, display_name, created_at, updated_at)
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [userId, email, passwordHash, displayName]
        );

        // Create default workspace
        await connection.query(
          `INSERT INTO workspaces (id, name, owner_id, created_at, updated_at)
           VALUES (?, ?, ?, NOW(), NOW())`,
          [workspaceId, `${displayName}'s Workspace`, userId]
        );

        // Add user as workspace owner
        await connection.query(
          `INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
           VALUES (?, ?, ?, 'owner', NOW())`,
          [generateId('member'), workspaceId, userId]
        );

        await connection.commit();
        connection.release();

        // Generate JWT
       const token = jwt.sign(
        { id: String(userId) }, // Fixed: Explicitly cast to string
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
       );


        res.status(201).json({
          token,
          user: {
            id: userId,
            email,
            displayName,
            defaultWorkspace: workspaceId
          }
        });
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const [users] = await pool.query<any[]>(
        'SELECT id, email, password_hash, display_name FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Get default workspace
      const [workspaces] = await pool.query<any[]>(
        `SELECT w.id FROM workspaces w
         JOIN workspace_members wm ON w.id = wm.workspace_id
         WHERE wm.user_id = ? AND wm.role = 'owner'
         LIMIT 1`,
        [user.id]
      );

      const token = jwt.sign(
  { userId: user.id, email: user.email }, // object payload
  JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          defaultWorkspace: workspaces[0]?.id
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

export default router;
