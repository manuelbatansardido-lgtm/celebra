# 🚀 Quick Install Script for Celebra

Write-Host "================================" -ForegroundColor Cyan
Write-Host "   Celebra Social Media Setup   " -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "✓ .env.local file found" -ForegroundColor Green
} else {
    Write-Host "⚠ .env.local file not found" -ForegroundColor Yellow
    Write-Host "Creating .env.local from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env.local
    Write-Host "✓ .env.local created!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠ IMPORTANT: Edit .env.local and add your credentials!" -ForegroundColor Red
    Write-Host ""
    Write-Host "You need to add:" -ForegroundColor Yellow
    Write-Host "  1. Firebase configuration" -ForegroundColor White
    Write-Host "  2. Gemini API key" -ForegroundColor White
    Write-Host ""
    Write-Host "See QUICKSTART.md for detailed instructions." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   Setup Complete!              " -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Configure .env.local with your credentials" -ForegroundColor White
Write-Host "  2. Deploy Firestore rules: firebase deploy --only firestore:rules" -ForegroundColor White
Write-Host "  3. Run development server: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📖 Read QUICKSTART.md for detailed setup instructions" -ForegroundColor Cyan
Write-Host ""
