#!/bin/bash

# Netlify Deployment Script for ArtisAI
# This script helps prepare and deploy your project to Netlify

echo "🚀 ArtisAI Netlify Deployment Script"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  Warning: .env.production not found."
    echo "   Please create it with your environment variables before deploying."
    echo "   See NETLIFY_DEPLOYMENT_GUIDE.md for details."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run type check
echo "🔍 Running type check..."
npm run typecheck

# Build the project
echo "🏗️  Building project for Netlify..."
npm run build:netlify

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Push your code to Git repository"
    echo "2. Connect your repository to Netlify"
    echo "3. Set environment variables in Netlify dashboard"
    echo "4. Deploy!"
    echo ""
    echo "📖 For detailed instructions, see NETLIFY_DEPLOYMENT_GUIDE.md"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
