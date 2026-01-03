# Finance & Accounting Module for Tenants

> **PFE Technical Screening Assignment**  
> A minimal finance module demonstrating secure backend architecture, tenant isolation, and RBAC enforcement.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.3-blue.svg)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Security Model](#security-model)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Design Decisions](#design-decisions)
- [Limitations](#limitations)

---

## 🎯 Overview

This project implements a **minimal finance and accounting module** for multi-tenant organizations (clubs, associations). It focuses on:

- ✅ **Data modeling** with proper SQL types
- ✅ **Backend security** with tenant isolation and RBAC
- ✅ **Financial calculations** with precision
- ✅ **Code clarity** and explicit logic

**What this project is NOT:**
- ❌ A production-ready accounting system
- ❌ A feature-complete financial application
- ❌ Implementing VAT, invoicing, or complex reports

---

## 🚀 Core Features

### 1. Transaction Management
- Create income/expense records
- Categorize transactions
- Optional document attachments
- Date-based tracking

### 2. Financial Summary
- Total Income
- Total Expense
- Balance (Income - Expense)
- Transaction count

### 3. Security
- **Tenant Isolation**: Users can only access their tenant's data
- **RBAC**: Role-based permissions (Treasurer vs Viewer)
- **Backend Enforcement**: All checks on server-side

### 4. Roles
| Role | Permissions |
|------|-------------|
| **Treasurer** | Create + Read transactions |
| **Viewer** | Read transactions only |

---

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth
- **Validation**: Zod
- **Testing**: Jest

---

## 🏗 Architecture

### High-Level Architecture

```
┌─────────────┐
│   Client    │  React UI (minimal)
└──────┬──────┘
       │ HTTP
       ↓
┌─────────────┐
│  API Routes │  Next.js API (app/api/)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Business  │  lib/auth.ts, lib/rbac.ts, lib/finance.ts
│    Logic    │  • Authentication
└──────┬──────┘  • Authorization
       │         • Validation
       ↓
┌─────────────┐
│  PostgreSQL │  Supabase Database
│   + RLS     │  • Tenant isolation at DB level
└─────────────┘  • Row Level Security policies
```

### Module Responsibilities

#### 1. **lib/auth.ts** - Authentication
- Retrieve authenticated user from database
- Verify tenant ownership
- Extract user context

#### 2. **lib/rbac.ts** - Authorization
- Check user permissions
- Enforce role-based access
- Explicit permission errors

#### 3. **lib/finance.ts** - Business Logic
- Create transactions with validation
- Retrieve filtered transactions
- Compute financial summaries

#### 4. **API Routes** - HTTP Layer
- Parse requests
- Call business logic
- Format responses
- Handle errors

---

## 🔒 Security Model

### 1. Tenant Isolation

**Every operation enforces tenant boundaries:**

```typescript
// Example: Creating a transaction
export async function createTransaction(user: User, tenantId: string, data: any) {
  // Check 1: Verify user belongs to this tenant
  verifyTenantOwnership(user, tenantId);
  
  // Check 2: Verify user has permission
  requireWritePermission(user);
  
  // Check 3: Insert with tenant_id foreign key
  await db.insert({ ...data, tenant_id: tenantId });
}
```

### 2. Defense in Depth

Security is enforced at **multiple layers**:

1. **Database**: Row Level Security (RLS) policies
2. **Backend Logic**: Explicit tenant/permission checks
3. **API Routes**: Request validation and error handling

### 3. RBAC Flow

```
Request → Extract userId → Get User from DB → Check Role → Check Tenant → Execute
```

**Critical Rules:**
- ✅ All checks happen on backend
- ✅ User context includes `tenant_id` and `role`
- ✅ No client-provided `tenantId` is trusted without verification

---

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd finance-accounting-module
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Database

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Go to **SQL Editor**
4. Copy and paste content from `database/schema.sql`
5. Run the SQL script

This creates:
- Tables: `tenants`, `users`, `transactions`, `documents`
- Indexes for performance
- RLS policies for security
- Sample data (2 tenants, 3 users, 3 transactions)

### 4. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Run Tests

```bash
npm test
```

Or for CI:

```bash
npm run test:ci
```

---

## 📡 API Documentation

### Authentication

All API requests require an `Authorization` header:

```
Authorization: Bearer {userId}
```

**Note**: In production, this would be a JWT token. For this assignment, we use userId directly.

### Endpoints

#### 1. Create Transaction

```http
POST /api/transactions
Content-Type: application/json
Authorization: Bearer {userId}

{
  "tenantId": "uuid",
  "type": "income" | "expense",
  "amount": 100.50,
  "category": "Membership Fees",
  "description": "Optional description",
  "date": "2026-01-03"  // Optional, defaults to today
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "type": "income",
    "amount": 100.50,
    "category": "Membership Fees",
    "description": "Optional description",
    "date": "2026-01-03",
    "created_by": "uuid",
    "created_at": "2026-01-03T10:00:00Z"
  },
  "message": "Transaction created successfully"
}
```

**Errors**:
- `401 Unauthorized`: Missing/invalid auth
- `403 Forbidden`: Cross-tenant access or insufficient permissions
- `400 Bad Request`: Validation error

---

#### 2. List Transactions

```http
GET /api/transactions?tenantId={uuid}
Authorization: Bearer {userId}
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "type": "income",
      "amount": 500.00,
      "category": "Membership Fees",
      "description": "Annual renewal",
      "date": "2026-01-01"
    }
  ],
  "count": 1
}
```

---

#### 3. Get Financial Summary

```http
GET /api/summary?tenantId={uuid}
Authorization: Bearer {userId}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "totalIncome": 500.00,
    "totalExpense": 150.50,
    "balance": 349.50,
    "transactionCount": 2
  }
}
```

---

## 🧪 Testing

### Test Coverage

The project includes comprehensive tests for:

#### 1. Tenant Isolation (`__tests__/tenant-isolation.test.ts`)
- ✅ User from Tenant A cannot read Tenant B transactions
- ✅ User from Tenant A cannot create transactions for Tenant B
- ✅ User from Tenant A cannot access Tenant B summary
- ✅ User can access their own tenant data

#### 2. RBAC (`__tests__/rbac.test.ts`)
- ✅ Viewer cannot create transactions (no write permission)
- ✅ Treasurer can create transactions (has write permission)
- ✅ Both roles can read transactions
- ✅ Invalid roles are rejected

#### 3. Financial Calculations (`__tests__/financial-calculations.test.ts`)
- ✅ Correct balance: Income - Expense
- ✅ Sum multiple income transactions
- ✅ Sum multiple expense transactions
- ✅ Handle empty tenant (zero balance)
- ✅ Round amounts to 2 decimal places
- ✅ Handle negative balance
- ✅ Handle large amounts

### Running Tests

```bash
# Watch mode (development)
npm test

# CI mode (run once)
npm run test:ci
```

### Sample Output

```
PASS  __tests__/tenant-isolation.test.ts
PASS  __tests__/rbac.test.ts
PASS  __tests__/financial-calculations.test.ts

Test Suites: 3 passed, 3 total
Tests:       15 passed, 15 total
```

---

## 📁 Project Structure

```
finance-accounting-module/
├── app/
│   ├── api/
│   │   ├── transactions/route.ts    # POST/GET transactions
│   │   └── summary/route.ts         # GET financial summary
│   ├── page.tsx                     # Main UI (React)
│   ├── layout.tsx                   # Root layout
│   └── globals.css                  # Styles
├── lib/
│   ├── supabase.ts                  # Supabase client
│   ├── auth.ts                      # Authentication logic
│   ├── rbac.ts                      # RBAC enforcement
│   └── finance.ts                   # Business logic
├── database/
│   ├── schema.sql                   # PostgreSQL schema
│   └── README.md                    # Database docs
├── __tests__/
│   ├── tenant-isolation.test.ts     # Security tests
│   ├── rbac.test.ts                 # Permission tests
│   └── financial-calculations.test.ts # Calculation tests
├── package.json
├── tsconfig.json
├── jest.config.js
├── next.config.js
└── README.md                        # This file
```

---

## 💡 Design Decisions

### 1. Why NUMERIC for Money?

```sql
amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0)
```

**Reasoning**:
- ✅ Exact decimal precision (no floating-point errors)
- ✅ Supports up to 9,999,999,999.99
- ✅ Standard for financial data
- ❌ Avoid FLOAT/DOUBLE (precision loss)
- ❌ Avoid INTEGER (no cents/fractional amounts)

### 2. Backend-Only Security

All security checks happen in **backend logic**, not frontend:

**Why?**
- Frontend can be manipulated by users
- Backend is the only trusted layer
- Defense in depth with DB RLS

### 3. Explicit Error Messages

```typescript
throw new Error(`Access denied: User belongs to tenant ${user.tenant_id}, attempted access to tenant ${tenantId}`);
```

**Why?**
- Makes debugging easier
- Shows exact reason for failure
- Demonstrates reasoning to evaluators

### 4. Zod for Validation

```typescript
export const TransactionInputSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive().finite(),
  // ...
});
```

**Why?**
- Type-safe validation
- Clear error messages
- Composable schemas

---

## ⚠️ Limitations

This is a **screening assignment**, not a production system. Known limitations:

### Not Implemented (By Design)
- ❌ VAT/Tax calculations
- ❌ Multi-currency support
- ❌ Invoicing
- ❌ PDF/Excel exports
- ❌ Advanced reports
- ❌ Real-time JWT authentication (simplified for demo)

### Simplifications
- User ID passed in header (production would use JWT)
- No password management (handled by Supabase Auth in production)
- Minimal UI styling
- No pagination (would be needed for large datasets)

---

## 🎓 What This Project Demonstrates

### Technical Skills
✅ PostgreSQL schema design with proper constraints  
✅ TypeScript for type safety  
✅ Next.js API routes  
✅ Zod validation  
✅ Jest testing  

### Security Skills
✅ Tenant isolation at multiple layers  
✅ RBAC enforcement  
✅ Defense in depth  
✅ Explicit permission checks  

### Software Engineering
✅ Clear code structure  
✅ Separation of concerns  
✅ Comprehensive documentation  
✅ Test coverage for critical paths  

---

## 📧 Contact

**Youssef Fawel**  
Email: youssef.fawel@et.esiea.fr  
Phone: +33746495170  

---

## 📝 License

This project is created for educational purposes as part of a technical screening assignment.

---

**Built with clarity, security, and best practices in mind. 🚀**
