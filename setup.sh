#!/bin/bash

# Setup script for Chùa Chính Phước Website

echo "🙏 Chùa Chính Phước Website Setup"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✓ Node.js version: $(node -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✓ Dependencies installed!"
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created. Please update database credentials."
fi

echo ""
echo "🏗️  Building TypeScript..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your database credentials"
echo "2. Create MySQL database: mysql -u root -p < database.sql"
echo "3. Start the server: npm run dev"
echo ""
echo "Access the website at: http://localhost:3001"
