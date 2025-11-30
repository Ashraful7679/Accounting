# Backend API - Accounting Software

RESTful API built with Fastify and Prisma ORM.

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Start development server
npm run dev
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:seed` - Seed database with sample data

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

## Architecture

The backend follows clean architecture principles:

- **Routes** - Define API endpoints
- **Controllers** - Handle HTTP requests/responses
- **Services** - Business logic
- **Repositories** - Database operations
- **Schemas** - Zod validation schemas
- **Middleware** - Authentication, validation, error handling
- **Utils** - Accounting logic, PDF/Excel generation

## Key Features

- ✅ JWT Authentication
- ✅ Role-based access control
- ✅ Double-entry bookkeeping
- ✅ Auto-posting journal entries
- ✅ PDF generation (Puppeteer)
- ✅ Excel export (SheetJS)
- ✅ Audit logging
- ✅ Error handling
- ✅ Request validation (Zod)

## Default Credentials

- Email: admin@accounting.com
- Password: admin123
