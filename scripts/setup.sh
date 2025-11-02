#!/bin/bash

echo "🚀 Setting up FinishMyWork..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f .env.local ]; then
    echo "📝 Creating environment file..."
    cp env.example .env.local
    echo "⚠️  Please update .env.local with your actual values"
fi

# Generate Prisma client
echo "🗄️  Setting up database..."
npx prisma generate

# Push database schema
npx prisma db push

echo "✅ Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "Don't forget to:"
echo "  1. Update .env.local with your actual values"
echo "  2. Set up Stripe keys for payment processing"
echo "  3. Configure your database URL"
