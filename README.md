# FinishMyWork

A platform where students can connect with each other to exchange educational help for money. Students can post assignments they need help with, and other students can accept these tasks, complete them, and get paid.

## Features

- **User Authentication**: Secure sign-up and sign-in with NextAuth.js
- **Task Management**: Post tasks, browse available tasks, and manage assignments
- **Secure Payments**: Integrated with Stripe for secure payment processing
- **Real-time Messaging**: Chat system for communication between students
- **Rating System**: Review and rating system to ensure quality and build trust
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (production-ready)
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Real-time**: Socket.io
- **Forms**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd finishmywork
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update the `.env.local` file with your actual values:
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

4. **Set up the database**
   ```bash
   # Install PostgreSQL (if not already installed)
   # macOS: brew install postgresql
   # Ubuntu: sudo apt install postgresql postgresql-contrib
   
   # Create database
   createdb finishmywork
   
   # Generate Prisma client and push schema
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
finishmywork/
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── tasks/             # Task management pages
│   └── globals.css        # Global styles
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
├── prisma/                # Database schema and migrations
└── public/                # Static assets
```

## Key Features Implementation

### Authentication
- User registration and login
- Protected routes
- Session management

### Task Management
- Create, read, update, delete tasks
- Task filtering and search
- Status tracking (Open, In Progress, Completed)

### Payment System
- Stripe integration for secure payments
- Escrow system for payment protection
- Transaction history

### Messaging System
- Real-time chat between users
- Message history
- File sharing capabilities

### Rating System
- 5-star rating system
- Written reviews
- User reputation tracking

## Development

### Database Management
```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma db push --force-reset

# Generate Prisma client
npx prisma generate
```

### Code Quality
```bash
# Run linting
npm run lint

# Type checking
npm run type-check
```

## Database Migration

The application now uses PostgreSQL for production-ready performance. See [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md) for detailed migration instructions.

### Quick Setup for Development

```bash
# Install PostgreSQL
brew install postgresql  # macOS
# or
sudo apt install postgresql postgresql-contrib  # Ubuntu

# Start PostgreSQL
brew services start postgresql  # macOS
# or
sudo systemctl start postgresql  # Ubuntu

# Create database
createdb finishmywork

# Update .env.local with PostgreSQL URL
DATABASE_URL="postgresql://username:password@localhost:5432/finishmywork"
```

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add PostgreSQL database (Vercel Postgres, Railway, or Supabase)
4. Add environment variables in Vercel dashboard
5. Deploy!

### Other Platforms
- Railway
- Heroku
- DigitalOcean App Platform

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you have any questions or need help, please open an issue on GitHub or contact the development team.

---

**FinishMyWork** - Connect, Learn, Earn 🎓
