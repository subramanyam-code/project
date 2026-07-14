# Team Status & Project Management System - Setup Script
# This script automates the setup process

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Team Status & PM System Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 1: Copy .env file if it doesn't exist
Write-Host "Step 1: Checking environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Created .env file from template" -ForegroundColor Green
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

Write-Host ""

# Step 2: Start Docker Compose services
Write-Host "Step 2: Starting Docker services..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Gray
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Docker services started" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to start Docker services" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Wait for services to be ready
Write-Host "Step 3: Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
Write-Host "✓ Services should be ready" -ForegroundColor Green

Write-Host ""

# Step 4: Run database migrations
Write-Host "Step 4: Running database migrations..." -ForegroundColor Yellow
docker-compose exec -T backend alembic upgrade head

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database migrations completed" -ForegroundColor Green
} else {
    Write-Host "✗ Database migration failed" -ForegroundColor Red
    Write-Host "Try running manually: docker-compose exec backend alembic upgrade head" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Create admin user
Write-Host "Step 5: Creating admin user..." -ForegroundColor Yellow

$seedScript = @'
from app.database.session import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.auth.password import get_password_hash

db = SessionLocal()

try:
    admin = db.query(User).filter(User.email == "admin@example.com").first()
    
    if not admin:
        super_admin_role = db.query(Role).filter(Role.name == "super_admin").first()
        
        if super_admin_role:
            admin = User(
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                full_name="System Administrator",
                employee_id="ADMIN001",
                role_id=super_admin_role.id,
                is_active=True
            )
            db.add(admin)
            db.commit()
            print("SUCCESS: Admin user created")
        else:
            print("ERROR: super_admin role not found")
    else:
        print("INFO: Admin user already exists")
except Exception as e:
    print(f"ERROR: {str(e)}")
finally:
    db.close()
'@

$seedScript | docker-compose exec -T backend python -c "import sys; exec(sys.stdin.read())"

Write-Host "✓ Admin user setup completed" -ForegroundColor Green

Write-Host ""

# Step 6: Check service health
Write-Host "Step 6: Checking service health..." -ForegroundColor Yellow

try {
    $healthCheck = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 5
    Write-Host "✓ Backend API is healthy" -ForegroundColor Green
} catch {
    Write-Host "⚠ Backend API health check failed (may need more time)" -ForegroundColor Yellow
}

Write-Host ""

# Display results
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Access the application:" -ForegroundColor Yellow
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend:   http://localhost:8000" -ForegroundColor Cyan
Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""

Write-Host "Default Login Credentials:" -ForegroundColor Yellow
Write-Host "  Email:     admin@example.com" -ForegroundColor White
Write-Host "  Password:  admin123" -ForegroundColor White
Write-Host ""

Write-Host "⚠ IMPORTANT: Change the admin password after first login!" -ForegroundColor Red
Write-Host ""

Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "  View logs:         docker-compose logs -f" -ForegroundColor Gray
Write-Host "  Stop services:     docker-compose down" -ForegroundColor Gray
Write-Host "  Restart services:  docker-compose restart" -ForegroundColor Gray
Write-Host "  View containers:   docker-compose ps" -ForegroundColor Gray
Write-Host ""

Write-Host "Press any key to open the frontend in your browser..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://localhost:3000"
