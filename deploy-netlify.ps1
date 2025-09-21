# Netlify Deployment Script for ArtisAI (PowerShell)
# This script helps prepare and deploy your project to Netlify

Write-Host "🚀 ArtisAI Netlify Deployment Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Write-Host "⚠️  Warning: .env.production not found." -ForegroundColor Yellow
    Write-Host "   Please create it with your environment variables before deploying." -ForegroundColor Yellow
    Write-Host "   See NETLIFY_DEPLOYMENT_GUIDE.md for details." -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm install

# Run type check
Write-Host "🔍 Running type check..." -ForegroundColor Blue
npm run typecheck

# Build the project
Write-Host "🏗️  Building project for Netlify..." -ForegroundColor Blue
npm run build:netlify

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Push your code to Git repository" -ForegroundColor White
    Write-Host "2. Connect your repository to Netlify" -ForegroundColor White
    Write-Host "3. Set environment variables in Netlify dashboard" -ForegroundColor White
    Write-Host "4. Deploy!" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 For detailed instructions, see NETLIFY_DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
} else {
    Write-Host "❌ Build failed. Please check the errors above." -ForegroundColor Red
    exit 1
}



