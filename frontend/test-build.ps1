# Test Build Script for Windows PowerShell
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Frontend Build for Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "Step 1: Checking for syntax errors..." -ForegroundColor Green
npm run lint

Write-Host ""
Write-Host "Step 2: Running type check..." -ForegroundColor Green
npx tsc --noEmit

Write-Host ""
Write-Host "Step 3: Attempting production build..." -ForegroundColor Green
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your frontend is ready to deploy to Netlify!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Deploy your backend first (Render/Railway/Fly.io)" -ForegroundColor White
    Write-Host "2. Get your backend URL" -ForegroundColor White
    Write-Host "3. Go to netlify.com and import your project" -ForegroundColor White
    Write-Host "4. Set NEXT_PUBLIC_API_URL to your backend URL" -ForegroundColor White
    Write-Host "5. Deploy!" -ForegroundColor White
    Write-Host ""
    Write-Host "See DEPLOYMENT_CHECKLIST.md for detailed steps" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ BUILD FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the errors above before deploying." -ForegroundColor Yellow
    Write-Host "Common issues:" -ForegroundColor Cyan
    Write-Host "- TypeScript type errors" -ForegroundColor White
    Write-Host "- Missing imports" -ForegroundColor White
    Write-Host "- Missing environment variables" -ForegroundColor White
    Write-Host ""
    Write-Host "Need help? Check the error messages above." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
