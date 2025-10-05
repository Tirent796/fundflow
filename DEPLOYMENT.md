# Budget Management System - Deployment Guide

## Architecture

This application uses:
- **Frontend**: React + Vite (deployed on Blink)
- **Backend**: Node.js + Express + MySQL (requires separate hosting)

## Backend Deployment

### Prerequisites
- MySQL 8.0+ database
- Node.js 18+ hosting (e.g., Railway, Render, DigitalOcean)

### Steps

1. **Set up MySQL Database**
   ```bash
   # Create database
   CREATE DATABASE budget_system;
   
   # Run migrations
   mysql -u your_user -p budget_system < server/scripts/migrate.sql
   ```

2. **Configure Environment Variables**
   Set these on your hosting platform:
   ```
   DB_HOST=your-mysql-host
   DB_PORT=3306
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_NAME=budget_system
   JWT_SECRET=generate-a-secure-random-string
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://minimal-budget-management-system-2cc4wxqd.sites.blink.new
   ```

3. **Deploy Backend**
   
   **Option A: Railway**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   cd server
   railway init
   railway up
   ```
   
   **Option B: Render**
   - Connect GitHub repo
   - Set build command: `cd server && npm install && npm run build`
   - Set start command: `cd server && npm start`
   - Add environment variables
   
   **Option C: DigitalOcean App Platform**
   - Connect GitHub repo
   - Select Node.js
   - Set build command: `cd server && npm install && npm run build`
   - Set run command: `cd server && npm start`

4. **Update Frontend API URL**
   After backend is deployed, update frontend to connect:
   ```typescript
   // src/config/api.ts
   export const API_BASE_URL = 'https://your-backend-url.com/api'
   ```

## Frontend Deployment

Already deployed on Blink at:
https://minimal-budget-management-system-2cc4wxqd.sites.blink.new

To update after backend connection:
1. Update API_BASE_URL in frontend
2. Blink will auto-deploy on save

## Database Backups

Set up automated backups for MySQL:

```bash
# Daily backup script
mysqldump -u user -p budget_system > backup_$(date +%Y%m%d).sql
```

## Monitoring

- Backend logs: Check hosting platform logs
- Database: Use MySQL monitoring tools
- Frontend: Use Blink analytics

## Security Checklist

- ✅ JWT_SECRET is strong and unique
- ✅ Database credentials are secure
- ✅ CORS is configured for your frontend domain
- ✅ Rate limiting is enabled (100 req/15min)
- ✅ Helmet.js security headers are active
- ✅ SQL injection protection via parameterized queries
- ✅ Password hashing with bcrypt (10 rounds)

## Quick Start (Local Development)

```bash
# Terminal 1 - Backend
cd server
npm install
cp .env.example .env
# Edit .env with your local MySQL credentials
mysql -u root -p budget_system < scripts/migrate.sql
npm run dev

# Terminal 2 - Frontend
npm install
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:3001

## API Documentation

See `server/README.md` for complete API reference.
