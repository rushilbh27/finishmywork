# Database Migration Guide

## Overview

This guide covers the migration from SQLite (development) to PostgreSQL (production) for the FinishMyWork platform.

## Key Changes

### 1. Database Provider
- **From**: SQLite (`provider = "sqlite"`)
- **To**: PostgreSQL (`provider = "postgresql"`)

### 2. ID Field Types
- **From**: String IDs with `@default(cuid())`
- **To**: Integer IDs with `@default(autoincrement())`

### 3. Location Field Requirements
- **User.location**: Now required (not optional)
- **Task.location**: Now required (not optional)

## Migration Steps

### 1. Update Environment Variables

Create a `.env.local` file with PostgreSQL connection:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/finishmywork"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Stripe (optional for development)
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 2. Install PostgreSQL

#### macOS (using Homebrew)
```bash
brew install postgresql
brew services start postgresql
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### 3. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE finishmywork;

# Create user (optional)
CREATE USER finishmywork_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE finishmywork TO finishmywork_user;

# Exit
\q
```

### 4. Update Prisma Schema

The schema has been updated to use PostgreSQL. Key changes:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  // ... other fields
  location  String   // Now required
}

model Task {
  id            Int           @id @default(autoincrement())
  // ... other fields
  location      String        // Now required
  paymentStatus PaymentStatus @default(PENDING)
}
```

### 5. Generate Prisma Client

```bash
# Generate new Prisma client
npx prisma generate

# Create and apply migration
npx prisma db push

# Or create a migration file
npx prisma migrate dev --name init
```

### 6. Update Application Code

#### API Routes
Update all API routes to use `Int` instead of `String` for IDs:

```typescript
// Before
const taskId: string = params.id

// After
const taskId: number = parseInt(params.id)
```

#### Type Definitions
Update TypeScript interfaces:

```typescript
interface Task {
  id: number  // Changed from string
  // ... other fields
}

interface User {
  id: number  // Changed from string
  // ... other fields
}
```

### 7. Data Migration (if needed)

If you have existing data in SQLite that needs to be migrated:

1. Export data from SQLite
2. Transform data to match new schema
3. Import into PostgreSQL

Example migration script:

```typescript
// migration-script.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateData() {
  // Your migration logic here
  // Handle location field requirements
  // Convert string IDs to integers
}

migrateData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

## Production Deployment

### 1. Environment Variables

Set these in your production environment:

```env
DATABASE_URL="postgresql://username:password@host:port/database"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-production-secret"
```

### 2. Database Setup

#### Using Vercel Postgres
```bash
# Install Vercel CLI
npm i -g vercel

# Create Postgres database
vercel postgres create finishmywork-db

# Get connection string
vercel env pull .env.local
```

#### Using Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init
railway add postgresql
```

#### Using Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Get connection string from Settings > Database
3. Update `DATABASE_URL` in your environment

### 3. Deploy Application

```bash
# Build and deploy
npm run build
vercel --prod

# Or using other platforms
npm run build
# Deploy to your preferred platform
```

## Verification

### 1. Check Database Connection
```bash
npx prisma db pull
npx prisma generate
```

### 2. Test Application
1. Start development server: `npm run dev`
2. Test user registration with location
3. Test task creation and filtering
4. Verify location-based features work

### 3. Check Data Integrity
```sql
-- Connect to your database
psql -U username -d finishmywork

-- Check tables
\dt

-- Check data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM tasks;
```

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Check PostgreSQL is running
   - Ensure user has proper permissions

2. **Migration Errors**
   - Check for data type mismatches
   - Verify all required fields are provided
   - Handle location field requirements

3. **ID Type Errors**
   - Update all API routes to use `parseInt()`
   - Check TypeScript interfaces
   - Verify Prisma client generation

### Rollback Plan

If issues occur:

1. **Revert to SQLite** (development)
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```

2. **Restore from backup**
   ```bash
   # Restore database from backup
   pg_restore -U username -d finishmywork backup.dump
   ```

## Performance Considerations

### 1. Indexing
Add indexes for better performance:

```sql
-- Add indexes for location-based queries
CREATE INDEX idx_users_location ON users(location);
CREATE INDEX idx_tasks_location ON tasks(location);
CREATE INDEX idx_tasks_status ON tasks(status);
```

### 2. Connection Pooling
Consider using connection pooling for production:

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong passwords
   - Rotate secrets regularly

2. **Database Access**
   - Use least privilege principle
   - Enable SSL connections
   - Monitor access logs

3. **Data Protection**
   - Encrypt sensitive data
   - Regular backups
   - Access controls

This migration ensures FinishMyWork is production-ready with PostgreSQL while maintaining all location-based features.
