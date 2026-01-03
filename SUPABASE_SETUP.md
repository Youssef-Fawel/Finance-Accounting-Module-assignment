# 🔑 GET YOUR SUPABASE API KEYS

**You need to get your actual API keys to make the app work!**

## Step-by-Step Instructions:

### 1. Go to your Supabase Dashboard
Open this URL in your browser:
```
https://app.supabase.com/project/akopxhawuhnzgwmuzbsi/settings/api
```

### 2. Copy Your API Keys
You'll see two keys on that page:
- **anon (public)** - Copy this key
- **service_role (secret)** - Copy this key

### 3. Update .env.local File
Replace the placeholder values in `.env.local` with your actual keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://akopxhawuhnzgwmuzbsi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...PASTE_YOUR_REAL_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...PASTE_YOUR_REAL_SERVICE_KEY_HERE
```

### 4. Run the Database Schema
Go to: https://app.supabase.com/project/akopxhawuhnzgwmuzbsi/sql/new

Paste the entire content of `database/schema.sql` and click "Run"

### 5. Restart the Dev Server
```bash
npm run dev
```

Then open http://localhost:3000

---

## Quick Test
Once set up, you should be able to:
1. See the Finance & Accounting Module interface
2. Add a transaction (income or expense)
3. See it appear in the list
4. See the totals update correctly

If you see errors about missing env variables, double-check that you copied the keys correctly!
