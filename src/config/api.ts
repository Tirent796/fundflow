// API Configuration
// Set USE_NODE_API to true to use Node.js + MySQL backend
// Set to false to use Blink SDK (default)

export const USE_NODE_API = false; // Change to true when Node.js backend is deployed

// Node.js API base URL (update this after deploying backend)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Storage keys
export const AUTH_TOKEN_KEY = 'budget_auth_token';
export const WORKSPACE_ID_KEY = 'budget_workspace_id';
