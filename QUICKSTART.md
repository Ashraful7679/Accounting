# Quick Start Guide

## Prerequisites
- Node.js 18 or higher
- npm or yarn

## Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed

# Start backend server
npm run dev
```

Backend will run on: **http://localhost:5000**

### 2. Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start frontend server
npm run dev
```

Frontend will run on: **http://localhost:3000**

### 3. Login

Open http://localhost:3000 in your browser and login with:

- **Email**: admin@accounting.com
- **Password**: admin123

## What's Included

✅ **Backend (Fastify)**
- 30+ database models (Prisma)
- Authentication with JWT
- Chart of Accounts module
- Invoices module with auto-posting
- Double-entry accounting logic
- PDF & Excel generation
- Audit logging

✅ **Frontend (Next.js)**
- Login page
- Dashboard with sidebar navigation
- Chart of Accounts page
- Invoices page
- React Query for data fetching
- Tailwind CSS styling

## Next Steps

To add more modules, follow the established pattern:
1. Create schema, repository, service, controller, routes (backend)
2. Create page with React Query (frontend)
3. Register routes in server.ts

See the full README.md for detailed documentation.
