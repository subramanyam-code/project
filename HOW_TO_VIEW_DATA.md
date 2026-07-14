# How to View User Data - Complete Guide

## 🚀 Quick Start (Automated)

### Option 1: Use Setup Script (Easiest)

```powershell
# Navigate to project folder
cd c:\Users\DELL\Downloads\project

# Run the automated setup script
.\setup.ps1
```

This script will:
- ✅ Check Docker
- ✅ Create .env file
- ✅ Start all services
- ✅ Run database migrations
- ✅ Create admin user
- ✅ Open the application in your browser

**Then login with:**
- Email: `admin@example.com`
- Password: `admin123`

### Option 2: View Existing Data

```powershell
# View all users and data
.\view-users.ps1
```

This shows:
- Current user info
- All users
- Companies
- Departments
- Teams
- Projects

---

## 📝 Manual Setup (Step by Step)

### Step 1: Start Services

```powershell
cd c:\Users\DELL\Downloads\project
docker-compose up -d
```

Wait 30-60 seconds for services to start.

### Step 2: Check Services

```powershell
docker-compose ps
```

All services should show "Up":
- postgres
- redis
- backend
- frontend
- nginx

### Step 3: Run Migrations

```powershell
docker-compose exec backend alembic upgrade head
```

### Step 4: Create Admin User

```powershell
# Create a Python script to seed admin
docker-compose exec backend python << 'EOF'
from app.database.session import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.auth.password import get_password_hash

db = SessionLocal()

# Get super_admin role
role = db.query(Role).filter(Role.name == "super_admin").first()

# Check if admin exists
admin = db.query(User).filter(User.email == "admin@example.com").first()

if not admin:
    admin = User(
        email="admin@example.com",
        hashed_password=get_password_hash("admin123"),
        full_name="System Administrator",
        employee_id="ADMIN001",
        role_id=role.id,
        is_active=True
    )
    db.add(admin)
    db.commit()
    print("Admin created!")
else:
    print("Admin exists!")

db.close()
EOF
```

---

## 🌐 View Data in Frontend (Browser)

### Access the Web Application

1. **Open browser**: http://localhost:3000

2. **Login**:
   - Email: `admin@example.com`
   - Password: `admin123`

3. **View Dashboard**:
   - See system metrics
   - Total users, companies, departments, teams

4. **Navigate to Pages**:

   **Users/Employees** (http://localhost:3000/employees)
   - View all users
   - Search by name/email
   - Filter by role
   - Click user to view/edit details

   **Companies** (http://localhost:3000/companies)
   - View all companies
   - Add new companies
   - Edit company details

   **Departments** (http://localhost:3000/departments)
   - View departments
   - Manage department hierarchy

   **Teams** (http://localhost:3000/teams)
   - View teams
   - See team members
   - Assign team leads

   **Projects** (http://localhost:3000/projects)
   - View projects
   - See project teams
   - Track progress

   **Profile** (http://localhost:3000/profile)
   - View your profile
   - Change password
   - Update details

---

## 🔌 View Data via API

### Using PowerShell

#### 1. Login and Get Token

```powershell
# Login
$loginBody = @{
    email = "admin@example.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

$token = $response.access_token
```

#### 2. Get Current User

```powershell
$currentUser = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/me" `
    -Method GET `
    -Headers @{ "Authorization" = "Bearer $token" }

$currentUser | ConvertTo-Json -Depth 5
```

#### 3. Get All Users

```powershell
$users = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/users" `
    -Method GET `
    -Headers @{ "Authorization" = "Bearer $token" }

$users | ConvertTo-Json -Depth 5
```

#### 4. Get Specific User by ID

```powershell
$user = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/users/1" `
    -Method GET `
    -Headers @{ "Authorization" = "Bearer $token" }

$user | ConvertTo-Json -Depth 5
```

#### 5. Get All Companies

```powershell
$companies = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/companies" `
    -Method GET `
    -Headers @{ "Authorization" = "Bearer $token" }

$companies | ConvertTo-Json -Depth 3
```

#### 6. Get All Departments

```powershell
$departments = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/departments" `
    -Method GET `
    -Headers @{ "Authorization" = "Bearer $token" }

$departments | ConvertTo-Json -Depth 3
```

### Using Swagger UI

1. **Open**: http://localhost:8000/docs

2. **Authorize**:
   - Click "Authorize" button (green lock icon)
   - Login with email/password
   - Or paste your Bearer token

3. **Try Endpoints**:
   - Expand any endpoint (e.g., `GET /api/v1/users`)
   - Click "Try it out"
   - Click "Execute"
   - View response

### Using curl

```bash
# Login
TOKEN=$(curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | jq -r '.access_token')

# Get users
curl -X GET "http://localhost:8000/api/v1/users" \
  -H "Authorization: Bearer $TOKEN" | jq

# Get current user
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 🗄️ View Data in Database

### Using PostgreSQL CLI

```powershell
# Connect to database
docker-compose exec postgres psql -U tspm_user -d tspm_db
```

Inside PostgreSQL:

```sql
-- View all users
SELECT id, email, full_name, employee_id, is_active 
FROM users;

-- View users with roles
SELECT 
    u.id, 
    u.email, 
    u.full_name, 
    r.name as role,
    u.is_active
FROM users u
LEFT JOIN roles r ON u.role_id = r.id;

-- View all roles
SELECT * FROM roles ORDER BY id;

-- View companies
SELECT id, name, email, domain, is_active FROM companies;

-- View departments with companies
SELECT 
    d.id,
    d.name as department,
    c.name as company
FROM departments d
LEFT JOIN companies c ON d.company_id = c.id;

-- View teams with leaders
SELECT 
    t.id,
    t.name as team,
    u.full_name as team_lead
FROM teams t
LEFT JOIN users u ON t.team_lead_id = u.id;

-- View projects
SELECT id, name, description, status, start_date, end_date
FROM projects;

-- View daily status submissions
SELECT 
    ds.id,
    u.full_name as employee,
    p.name as project,
    ds.status,
    ds.hours_worked,
    ds.date
FROM daily_status ds
LEFT JOIN users u ON ds.user_id = u.id
LEFT JOIN projects p ON ds.project_id = p.id
ORDER BY ds.date DESC
LIMIT 10;

-- Count records
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM companies) as total_companies,
    (SELECT COUNT(*) FROM departments) as total_departments,
    (SELECT COUNT(*) FROM teams) as total_teams,
    (SELECT COUNT(*) FROM projects) as total_projects,
    (SELECT COUNT(*) FROM daily_status) as total_status_entries;

-- Exit
\q
```

### Using DBeaver/pgAdmin

1. **Connection Details**:
   - Host: `localhost`
   - Port: `5432`
   - Database: `tspm_db`
   - Username: `tspm_user`
   - Password: `tspm_password`

2. **Connect** and browse tables:
   - `users`
   - `roles`
   - `companies`
   - `departments`
   - `teams`
   - `projects`
   - `daily_status`
   - `notifications`
   - `audit_logs`

---

## 📊 View Dashboard Metrics

### Super Admin Dashboard

```powershell
# Get super admin dashboard
$dashboard = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/reports/dashboard/super-admin" `
    -Method GET `
    -Headers @{ "Authorization" = "Bearer $token" }

$dashboard | ConvertTo-Json
```

Shows:
- Total companies
- Total departments
- Total teams
- Total users
- Today's status submissions
- Pending statuses

### Manager Dashboard

```powershell
$dashboard = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/reports/dashboard/manager" `
    -Method GET `
    -Headers @{ "Authorization" = "Bearer $token" }

$dashboard | ConvertTo-Json
```

Shows:
- Active projects
- Team members
- Today's submissions
- Blocked tasks
- Performance metrics

---

## 🧪 Create Sample Data

### Create Sample Company

```powershell
$company = @{
    name = "Tech Innovators Inc"
    domain = "techinnovators.com"
    email = "info@techinnovators.com"
    phone = "+1-555-1234"
    address = "123 Innovation Drive, Tech City, TC 12345"
    is_active = $true
} | ConvertTo-Json

$companyResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/companies" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ "Authorization" = "Bearer $token" } `
    -Body $company

Write-Host "Created company with ID: $($companyResponse.id)"
```

### Create Sample Employee

First, get role IDs:

```powershell
$roles = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/users/roles" `
    -Method GET `
    -Headers @{ "Authorization" = "Bearer $token" }

$employeeRoleId = ($roles | Where-Object { $_.name -eq "employee" }).id
```

Create employee:

```powershell
$employee = @{
    email = "jane.smith@techinnovators.com"
    password = "password123"
    full_name = "Jane Smith"
    employee_id = "EMP1001"
    role_id = $employeeRoleId
    company_id = $companyResponse.id
    phone = "+1-555-5678"
    is_active = $true
} | ConvertTo-Json

$employeeResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/users" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ "Authorization" = "Bearer $token" } `
    -Body $employee

Write-Host "Created employee with ID: $($employeeResponse.id)"
```

---

## 🔍 Debugging & Troubleshooting

### Check Logs

```powershell
# All logs
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend

# Database only
docker-compose logs postgres
```

### Verify Services

```powershell
# Check all containers
docker-compose ps

# Test backend health
curl http://localhost:8000/health

# Test frontend
curl http://localhost:3000

# Test database connection
docker-compose exec postgres pg_isready -U tspm_user
```

### Common Issues

#### "Cannot connect to backend"

```powershell
# Check backend is running
docker-compose ps backend

# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

#### "Database connection error"

```powershell
# Check PostgreSQL
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U tspm_user -d tspm_db -c "SELECT 1"
```

#### "No data showing"

```powershell
# Check if migrations ran
docker-compose exec backend alembic current

# Re-run migrations
docker-compose exec backend alembic upgrade head

# Create admin user again
.\setup.ps1
```

---

## 📱 Quick Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation (Swagger)**: http://localhost:8000/docs
- **API Documentation (ReDoc)**: http://localhost:8000/redoc

---

## 🎯 Summary

### To View User Data:

1. **Browser** → http://localhost:3000 → Login → Employees page
2. **API** → Run `.\view-users.ps1` script
3. **Swagger** → http://localhost:8000/docs → Try endpoints
4. **Database** → `docker-compose exec postgres psql -U tspm_user -d tspm_db`

### Default Credentials:

- **Email**: admin@example.com
- **Password**: admin123

### Quick Commands:

```powershell
# Start everything
docker-compose up -d

# View data
.\view-users.ps1

# Access database
docker-compose exec postgres psql -U tspm_user -d tspm_db

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

---

**You're all set!** 🎉

Open http://localhost:3000 and start exploring your data!
