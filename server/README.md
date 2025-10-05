# Budget Management API

Node.js + Express + MySQL backend with multi-user collaboration and role-based permissions.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Create MySQL database:
```sql
CREATE DATABASE budget_system;
```

4. Run migrations:
```bash
mysql -u root -p budget_system < scripts/migrate.sql
```

5. Start development server:
```bash
npm run dev
```

## Role-Based Permissions

### Roles

- **Owner**: Full control including workspace management
- **Admin**: All permissions except workspace deletion
- **Editor**: Can create/edit transactions, budgets, and goals
- **Viewer**: Read-only access to transactions and reports

### Permission Matrix

| Permission | Owner | Admin | Editor | Viewer |
|-----------|-------|-------|--------|--------|
| View Transactions | ✅ | ✅ | ✅ | ✅ |
| Create Transactions | ✅ | ✅ | ✅ | ❌ |
| Edit Transactions | ✅ | ✅ | ✅ | ❌ |
| Delete Transactions | ✅ | ✅ | ❌ | ❌ |
| Manage Budgets | ✅ | ✅ | ✅ | ❌ |
| Manage Goals | ✅ | ✅ | ✅ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ✅ |
| Manage Members | ✅ | ✅ | ❌ | ❌ |
| Manage Workspace | ✅ | ❌ | ❌ | ❌ |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Workspaces
- `GET /api/workspaces` - List user workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id/members` - List workspace members
- `POST /api/workspaces/:id/members` - Invite member
- `PATCH /api/workspaces/:id/members/:memberId` - Update member role
- `DELETE /api/workspaces/:id/members/:memberId` - Remove member

### Transactions
- `GET /api/transactions?workspaceId=xxx` - List transactions
- `POST /api/transactions` - Create transaction
- `PATCH /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Budgets
- `GET /api/budgets?workspaceId=xxx` - List budgets
- `POST /api/budgets` - Create budget
- `DELETE /api/budgets/:id` - Delete budget

### Goals
- `GET /api/goals?workspaceId=xxx` - List goals
- `POST /api/goals` - Create goal
- `POST /api/goals/:id/contribute` - Add contribution
- `DELETE /api/goals/:id` - Delete goal

## Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Database Schema

See `scripts/migrate.sql` for complete MySQL schema.
