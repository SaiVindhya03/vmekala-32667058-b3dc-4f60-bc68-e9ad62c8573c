# Task Management System

Full-stack task management platform with Role-Based Access Control (RBAC), multi-organization support, and audit logging.

## Demo

[▶️ Watch the Demo Video](https://drive.google.com/file/d/1NTEFDozVfBYUzQkxLIe13ddqbakC4M7g/view?usp=sharing)

## Tech Stack

- **Backend**: NestJS, TypeORM, SQLite/PostgreSQL, Passport JWT
- **Frontend**: Angular 21, TailwindCSS, NgRx
- **Build**: Nx Monorepo

## Additional Features

- Light/Dark mode with toggle button
- Shortcut to update the status of the task using drag and drop feature.

## Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Create .env file
# Windows (PowerShell):
Copy-Item .env.example .env
# Linux/Mac:
cp .env.example .env

# Start backend (Terminal 1) - auto-seeds database on first run
npx nx serve api
# API runs on http://localhost:3000/api

# Start frontend (Terminal 2)
npx nx serve dashboard
# Dashboard runs on http://localhost:4200
```

## Test Users

| Email | Password | Role |
|-------|----------|------|
| `user1@techcorp.com` | `password123` | OWNER |
| `user2@techcorp.com` | `password123` | ADMIN |
| `user3@techcorp.com` | `password123` | VIEWER |

## Environment Variables

Create `.env` file from `.env.example`:

```env
JWT_SECRET=dev-secret-12345-change-in-production
JWT_EXPIRATION=24h
DATABASE_URL=sqlite:./database.db
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:4200
```

## Project Structure

```
apps/
  ├── api/              # NestJS backend
  └── dashboard/        # Angular frontend
libs/
  ├── data/             # Shared DTOs & models
  └── auth/             # RBAC guards & decorators
```

## RBAC Roles

| Role | Permissions |
|------|-------------|
| **OWNER** | All permissions |
| **ADMIN** | CREATE, READ, UPDATE, DELETE, VIEW_AUDIT |
| **VIEWER** | READ only |

## API Endpoints

### Authentication
```bash
POST /api/auth/login
Body: { "email": "user1@techcorp.com", "password": "password123" }
```

### Tasks
```bash
GET    /api/tasks              # List all tasks
GET    /api/tasks/:id          # Get task by ID
POST   /api/tasks              # Create task
PUT    /api/tasks/:id          # Update task
DELETE /api/tasks/:id          # Delete task
```

### Audit Logs
```bash
GET /api/audit-logs            # View audit logs (requires permission)
```

### Users
```bash
GET /api/users/profile         # Get current user
GET /api/users/:id             # Get user by ID
```

## Testing

```bash
npx nx test api              # Backend tests
npx nx test dashboard        # Frontend tests
```

## Build

```bash
npx nx build api             # Build backend
npx nx build dashboard       # Build frontend
```

## Troubleshooting

- **CORS errors**: Check `FRONTEND_URL` in `.env` matches your frontend URL
- **401 Unauthorized**: Token expired or invalid - log in again
- **403 Forbidden**: User lacks required permission for action
- **Port in use**: Kill process or change `PORT` in `.env`
- 
