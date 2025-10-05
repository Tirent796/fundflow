// Unified API Layer - switches between Blink SDK and Node.js API
import { blink } from './blink';
import { nodeApi } from './nodeApi';
import { USE_NODE_API } from '../config/api';

// This module provides a unified interface that works with both backends
// Switch backends by changing USE_NODE_API in config/api.ts

export const api = {
  // Auth
  isUsingNodeApi: () => USE_NODE_API,
  
  getAuthToken: () => USE_NODE_API ? nodeApi.getToken() : null,
  
  setWorkspace: (workspaceId: string) => {
    if (USE_NODE_API) {
      nodeApi.setWorkspaceId(workspaceId);
    }
  },

  // Transactions
  getTransactions: async (filters?: any) => {
    if (USE_NODE_API) {
      const response = await nodeApi.getTransactions(filters);
      return response.transactions;
    } else {
      return await blink.db.transactions.list({
        where: filters,
        orderBy: { date: 'desc' }
      });
    }
  },

  createTransaction: async (data: any) => {
    if (USE_NODE_API) {
      return await nodeApi.createTransaction(data);
    } else {
      return await blink.db.transactions.create(data);
    }
  },

  updateTransaction: async (id: string, data: any) => {
    if (USE_NODE_API) {
      return await nodeApi.updateTransaction(id, data);
    } else {
      return await blink.db.transactions.update(id, data);
    }
  },

  deleteTransaction: async (id: string) => {
    if (USE_NODE_API) {
      return await nodeApi.deleteTransaction(id);
    } else {
      return await blink.db.transactions.delete(id);
    }
  },

  // Budgets
  getBudgets: async () => {
    if (USE_NODE_API) {
      const response = await nodeApi.getBudgets();
      return response.budgets;
    } else {
      return await blink.db.budgets.list({
        orderBy: { createdAt: 'desc' }
      });
    }
  },

  createBudget: async (data: any) => {
    if (USE_NODE_API) {
      return await nodeApi.createBudget(data);
    } else {
      return await blink.db.budgets.create(data);
    }
  },

  deleteBudget: async (id: string) => {
    if (USE_NODE_API) {
      return await nodeApi.deleteBudget(id);
    } else {
      return await blink.db.budgets.delete(id);
    }
  },

  // Goals
  getGoals: async () => {
    if (USE_NODE_API) {
      const response = await nodeApi.getGoals();
      return response.goals;
    } else {
      return await blink.db.goals.list({
        orderBy: { deadline: 'asc' }
      });
    }
  },

  createGoal: async (data: any) => {
    if (USE_NODE_API) {
      return await nodeApi.createGoal(data);
    } else {
      return await blink.db.goals.create(data);
    }
  },

  contributeToGoal: async (id: string, amount: number) => {
    if (USE_NODE_API) {
      return await nodeApi.contributeToGoal(id, amount);
    } else {
      const goal = await blink.db.goals.list({ where: { id } });
      if (goal.length === 0) throw new Error('Goal not found');
      return await blink.db.goals.update(id, {
        currentAmount: goal[0].currentAmount + amount
      });
    }
  },

  deleteGoal: async (id: string) => {
    if (USE_NODE_API) {
      return await nodeApi.deleteGoal(id);
    } else {
      return await blink.db.goals.delete(id);
    }
  },

  // Workspaces (Node.js API only)
  getWorkspaces: async () => {
    if (!USE_NODE_API) {
      throw new Error('Workspaces are only available with Node.js API');
    }
    const response = await nodeApi.getWorkspaces();
    return response.workspaces;
  },

  createWorkspace: async (name: string) => {
    if (!USE_NODE_API) {
      throw new Error('Workspaces are only available with Node.js API');
    }
    return await nodeApi.createWorkspace(name);
  },

  getWorkspaceMembers: async (workspaceId: string) => {
    if (!USE_NODE_API) {
      throw new Error('Workspace members are only available with Node.js API');
    }
    const response = await nodeApi.getWorkspaceMembers(workspaceId);
    return response.members;
  },

  inviteMember: async (workspaceId: string, email: string, role: string) => {
    if (!USE_NODE_API) {
      throw new Error('Member invitations are only available with Node.js API');
    }
    return await nodeApi.inviteMember(workspaceId, email, role);
  },

  updateMemberRole: async (workspaceId: string, memberId: string, role: string) => {
    if (!USE_NODE_API) {
      throw new Error('Member role updates are only available with Node.js API');
    }
    return await nodeApi.updateMemberRole(workspaceId, memberId, role);
  },

  removeMember: async (workspaceId: string, memberId: string) => {
    if (!USE_NODE_API) {
      throw new Error('Member removal is only available with Node.js API');
    }
    return await nodeApi.removeMember(workspaceId, memberId);
  }
};
