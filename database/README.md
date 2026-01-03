# Database Setup Instructions

## Prerequisites
- Supabase account (https://supabase.com)
- PostgreSQL 14+ (provided by Supabase)

## Setup Steps

### 1. Create a Supabase Project
1. Go to https://app.supabase.com
2. Create a new project
3. Note down your project URL and API keys

### 2. Run the Schema
1. In your Supabase project, go to the SQL Editor
2. Copy and paste the entire content of `schema.sql`
3. Click "Run" to execute the schema

### 3. Configure Environment Variables
1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### 4. Verify Setup
The schema includes sample data:
- 2 tenants (Tennis Club Paris, Football Association Lyon)
- 3 users (2 for Tennis Club, 1 for Football Association)
- 3 transactions

## Database Design Principles

### Tenant Isolation
- All main tables include a `tenant_id` foreign key
- Row Level Security (RLS) policies enforce tenant boundaries
- Indexes on `tenant_id` for query performance

### Financial Data Safety
- `amount` uses `NUMERIC(12, 2)` for precision
- Check constraints ensure `amount > 0`
- Type is constrained to `'income'` or `'expense'`

### RBAC Enforcement
- User roles: `'treasurer'` (read/write) or `'viewer'` (read-only)
- Role checks are enforced in backend logic, not just database
- RLS policies provide defense-in-depth

## Important Notes

### Money Storage
We use `NUMERIC(12, 2)` instead of `FLOAT` or `INTEGER` because:
- Avoids floating-point precision errors
- Stores exact decimal values (critical for finance)
- Supports up to 9,999,999,999.99

### Indexes
Strategic indexes on:
- `tenant_id` (most common filter)
- `date` (for time-based queries)
- Composite `(tenant_id, date)` for sorted queries

### Constraints
- Email validation via regex
- Non-empty name/category via `LENGTH(TRIM(...)) > 0`
- Valid roles and types via `CHECK IN (...)`
