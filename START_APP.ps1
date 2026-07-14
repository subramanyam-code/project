# Simple Start Script - Run Backend in Docker, Frontend Locally

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Application" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✓ Docker is running`n" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop.`n" -ForegroundColor Red
    exit 1
}

# Start backend services only (Postgres, Redis, Backend)
Write-Host "Starting backend services..." -ForegroundColor Yellow
docker-compose up -d postgres redis backend

Write-Host "Waiting for services to start...`n" -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Run migrations
Write-Host "Setting up database..." -ForegroundColor Yellow
docker-compose exec -T backend alembic upgrade head
Write-Host "✓ Database ready`n" -ForegroundColor Green

# Create admin user
Write-Host "Creating admin user..." -ForegroundColor Yellow
$createAdmin = @"
from app.database.session import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.auth.password import get_password_hash

db = SessionLocal()
role = db.query(Role).filter(Role.name == 'super_admin').first()

if role:
    existing = db.query(User).filter(User.email == 'admin@example.com').first()
    if not existing:
        admin = User(
            email='admin@example.com',
            hashed_password=get_password_hash('admin123'),
            full_name='Admin User',
            employee_id='ADMIN001',
            role_id=role.id,
            is_active=True
        )
        db.add(admin)
        db.commit()
        print('SUCCESS')
    else:
        print('EXISTS')
else:
    print('ERROR')
    
db.close()
"@

$result = $createAdmin | docker-compose exec -T backend python
if ($result -match "SUCCESS|EXISTS") {
    Write-Host "✓ Admin user ready`n" -ForegroundColor Green
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Backend Services Running!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs:    http://localhost:8000/docs`n" -ForegroundColor Cyan

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Now Starting Frontend..." -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Node.js is installed
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js version: $nodeVersion`n" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed!`n" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/`n" -ForegroundColor Yellow
    Write-Host "Backend is running. After installing Node.js, run this script again.`n" -ForegroundColor Yellow
    exit 1
}

# Install frontend dependencies
Write-Host "Installing frontend dependencies (one-time, may take 2-3 minutes)..." -ForegroundColor Yellow
Set-Location frontend

if (-not (Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n✗ npm install failed. Trying with --legacy-peer-deps...`n" -ForegroundColor Yellow
        npm install --legacy-peer-deps
    }
}

Write-Host "`n✓ Frontend dependencies installed`n" -ForegroundColor Green

# Create .env.local for frontend
Write-Host "Configuring frontend..." -ForegroundColor Yellow
"NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" | Out-File -FilePath ".env.local" -Encoding utf8
Write-Host "✓ Frontend configured`n" -ForegroundColor Green

# Start frontend
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Frontend Server..." -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Frontend will be available at: http://localhost:3000`n" -ForegroundColor Cyan
Write-Host "Login Credentials:" -ForegroundColor Yellow
Write-Host "  Email:    admin@example.com" -ForegroundColor White
Write-Host "  Password: admin123`n" -ForegroundColor White

Write-Host "Press Ctrl+C to stop the frontend server`n" -ForegroundColor Gray

# Start frontend dev server
npm run dev
