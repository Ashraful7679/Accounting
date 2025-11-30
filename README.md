# Cloud-Based Accounting Software

A full-stack cloud-based accounting software built with TypeScript, Next.js, Fastify, and SQLite.

## 🚀 Features

### Core Accounting
- **Double-Entry Bookkeeping** - Automatic journal entries with Dr = Cr validation
- **Chart of Accounts** - Hierarchical account structure with 5 account types
- **Journal & Ledger** - Complete transaction tracking and ledger management
- **Trial Balance** - Automated trial balance calculation
- **Year-End Closing** - Automated fiscal year closing with retained earnings

### Sales Module
- **Invoices** - Create, edit, and manage sales invoices
- **Auto-Posting** - Automatic journal entries for invoices
- **Tax Calculation** - Automatic tax calculation based on tax codes
- **Payment Tracking** - Record and track customer payments
- **Credit Notes** - Handle sales returns and adjustments
- **PDF Generation** - Generate professional invoice PDFs

### Purchase Module
- **Bills** - Manage vendor bills and expenses
- **Auto-Posting** - Automatic journal entries for purchases
- **Payment Management** - Track vendor payments
- **Debit Notes** - Handle purchase returns

### Banking & Inventory
- **Bank Accounts** - Manage multiple bank accounts
- **Bank Reconciliation** - Reconcile bank statements
- **Stock Management** - Track inventory levels
- **Stock Movements** - Record stock in/out transactions

### Reports
- **Profit & Loss Statement**
- **Balance Sheet**
- **Cash Flow Statement**
- **AR Aging Report**
- **AP Aging Report**
- **Tax Reports**
- **Excel Export** - Export all reports to Excel

### Security & Audit
- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access** - Admin, Accountant, and User roles
- **Audit Trail** - Complete audit log of all transactions
- **Fiscal Year Locking** - Prevent backdated entries in locked periods

## 📁 Project Structure

```
accounting/
├── backend/                 # Fastify API Server
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema (30+ models)
│   │   └── seed.ts         # Database seeding
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── modules/        # Feature modules
│   │   │   ├── auth/       # Authentication
│   │   │   ├── accounts/   # Chart of Accounts
│   │   │   ├── invoices/   # Sales Invoices
│   │   │   └── ...
│   │   ├── utils/          # Utilities
│   │   │   ├── accounting.ts  # Double-entry logic
│   │   │   ├── pdf.ts         # PDF generation
│   │   │   └── excel.ts       # Excel export
│   │   └── server.ts       # Fastify server
│   └── package.json
│
└── frontend/               # Next.js Application
    ├── src/
    │   ├── app/           # Next.js 15 App Router
    │   │   ├── dashboard/ # Dashboard pages
    │   │   ├── login/     # Authentication
    │   │   └── layout.tsx
    │   ├── components/    # React components
    │   ├── lib/          # Utilities & API client
    │   └── types/        # TypeScript types
    └── package.json
```

## 🛠️ Tech Stack

### Backend
- **Fastify** - High-performance Node.js framework
- **Prisma ORM** - Type-safe database access
- **SQLite** - Lightweight database (PostgreSQL-ready)
- **Zod** - Schema validation
- **JWT** - Authentication
- **Puppeteer** - PDF generation
- **SheetJS** - Excel export
- **bcryptjs** - Password hashing
- **date-fns** - Date manipulation

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **ShadCN UI** - Component library
- **React Query** - Data fetching & caching
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **Recharts** - Data visualization

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and update the values as needed.

4. **Generate Prisma client**
   ```bash
   npm run prisma:generate
   ```

5. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

6. **Seed the database**
   ```bash
   npm run prisma:seed
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

   Server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   Application will run on `http://localhost:3000`

## 🔑 Default Credentials

After seeding the database, use these credentials to login:

- **Email:** admin@accounting.com
- **Password:** admin123

## 📊 Database Schema

The system includes 30+ models organized into:

- **Authentication** - User, Role, UserRole
- **Chart of Accounts** - AccountType, Account
- **Journal & Ledger** - JournalEntry, JournalEntryLine, Ledger
- **Sales** - Customer, Product, Invoice, InvoiceItem, PaymentReceived, CreditNote
- **Purchases** - Vendor, Bill, BillItem, PaymentMade, DebitNote
- **Banking** - BankAccount, BankTransaction, Reconciliation
- **Inventory** - StockItem, StockMovement
- **Taxation** - TaxCode, TaxRate
- **Utilities** - AuditLog, Settings, FiscalYear

## 🔄 Accounting Logic

### Double-Entry Bookkeeping

Every transaction creates balanced journal entries:

**Sales Invoice:**
```
Dr. Accounts Receivable    $1,000
    Cr. Sales Revenue              $870
    Cr. Tax Payable                $130
```

**Purchase Bill:**
```
Dr. Expense                 $500
Dr. Tax Paid                $75
    Cr. Accounts Payable           $575
```

**Payment Received:**
```
Dr. Bank Account           $1,000
    Cr. Accounts Receivable        $1,000
```

### Validation Rules

- Total debits must equal total credits
- Minimum 2 lines per journal entry
- No backdated entries in locked fiscal years
- Account type validation

## 📈 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Accounts
- `GET /api/accounts` - List accounts
- `GET /api/accounts/:id` - Get account
- `POST /api/accounts` - Create account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account
- `GET /api/accounts/tree` - Get account tree

### Invoices
- `GET /api/invoices` - List invoices
- `GET /api/invoices/:id` - Get invoice
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `POST /api/invoices/:id/post` - Post to accounts
- `GET /api/invoices/:id/pdf` - Download PDF

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 Development Scripts

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run prisma:studio # Open Prisma Studio
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Request rate limiting
- SQL injection prevention (Prisma)
- XSS protection
- CORS configuration
- Audit logging

## 🚀 Deployment

### Database Migration to PostgreSQL

1. Update `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/accounting"
   ```

3. Run migrations:
   ```bash
   npm run prisma:migrate
   ```

## 📖 Additional Documentation

- [API Documentation](./docs/api.md)
- [Database Schema](./docs/schema.md)
- [Accounting Logic](./docs/accounting.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with Fastify, Next.js, and Prisma
- UI components from ShadCN UI
- Icons from Lucide React

---

**Note:** This is a complete accounting software system with production-ready features. For production deployment, ensure proper security measures, backup strategies, and compliance with accounting standards in your jurisdiction.
