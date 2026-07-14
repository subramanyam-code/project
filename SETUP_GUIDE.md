# Setup Guide - View User Data

Follow these steps to start the application and view user data.

## Step 1: Start the Application

```powershell
# Navigate to project directory
cd c:\Users\DELL\Downloads\project

# Copy environment file (if not already done)
cp .env.example .env

# Start all services (PostgreSQL, Redis, Backend, Frontend, Nginx)
docker-compose up -d
```

Wait 30-60 seconds for all services to start.

## Step 2: Check Services are Running

```powershell
# Check all services are up
docker-compose ps
```

You should see all services as "Up":
- postgres
- redis  
- backend
- frontend
- nginx

## Step 3: Run Database Migrations

```powershell
# Run migrations to create tables and seed initial data
docker-compose exec backend alembic upgrade head
```

This creates:
- All database tables
- 5 default roles (super_admin, company_admin, project_manager, team_lead, employee)

## Step 4: Create Initial Admin User

You have two options:

### Option A: Use the Seeded Admin (Recommended for Testing)

Create a migration to seed an admin user:

```powershell
# Connect to backend container
docker-compose exec backend bash

# Inside container, create seed script
cat > /app/seed_admin.py << 'EOF'
from app.database.session import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.auth.password import get_password_hash

db = SessionLocal()

# Check if admin exists
admin = db.query(User).filter(User.email == "admin@example.com").first()

if not admin:
    # Get super_admin role
    super_admin_role = db.query(Role).filter(Role.name == "super_admin").first()
    
    # Create admin user
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
    print("✅ Admin user created successfully!")
    print("Email: admin@example.com")
    print("Password: admin123")
else:
    print("ℹ️  Admin user already exists")

db.close()
EOF

# Run the seed script
python seed_admin.py

# Exit container
exit
```

### Option B: Register via API

```powershell
# Create admin user via API
curl -X POST http://localhost:8000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "admin@example.com",
    "password": "admin123",
    "full_name": "Admin User",
    "employee_id": "EMP001"
  }'
```

## Step 5: Access the Application

Open your browser and navigate to:

**Frontend:** http://localhost:3000

**Login Credentials:**
- Email: `admin@example.com`
- Password: `admin123`

## Step 6: View User Data

### In Frontend (Web UI)

1. **Login** at http://localhost:3000
2. **Dashboard** - You'll see role-based dashboard with metrics
3. **Navigate to Users/Employees** page:
   - Click "Employees" in sidebar
   - View list of all users
   - Search and filter users
   - Click on a user to view details

### In Backend (API)

#### View API Documentation
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

#### Test API Endpoints

```powershell
# 1. Login to get access token
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"admin123"}'

$token = $response.access_token

# 2. Get current user info
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/me" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $token" }

# 3. Get all users
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/users" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $token" }

# 4. Get specific user by ID
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/users/1" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $token" }
```

### In Database (Direct)

```powershell
# Connect to PostgreSQL
docker-compose exec postgres psql -U tspm_user -d tspm_db

# Inside PostgreSQL, run queries:
```

```sql
-- View all users
SELECT id, email, full_name, employee_id, is_active FROM users;

-- View users with their roles
SELECT 
    u.id, 
    u.email, 
    u.full_name, 
    r.name as role 
FROM users u 
LEFT JOIN roles r ON u.role_id = r.id;

-- View all roles
SELECT * FROM roles;

-- View companies
SELECT * FROM companies;

-- View departments
SELECT * FROM departments;

-- View teams
SELECT * FROM teams;

-- Exit PostgreSQL
\q
```

## Step 7: Create Sample Data

### Create Sample Company

```powershell
# Using PowerShell with saved token from Step 6

# Create a company
$companyResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/companies" `
  -Method POST `
  -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body '{
    "name": "Acme Corporation",
    "domain": "acme.com",
    "email": "info@acme.com",
    "phone": "+1-555-0100",
    "address": "123 Business St, Tech City",
    "is_active": true
  }'

$companyId = $companyResponse.id
```

### Create Sample Department

```powershell
$deptResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/departments" `
  -Method POST `
  -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body "{
    `"name`": `"Engineering`",
    `"description`": `"Software Development Team`",
    `"company_id`": $companyId,
    `"is_active`": true
  }"

$deptId = $deptResponse.id
```

### Create Sample Employee

First, get the employee role ID:

```powershell
$roles = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/users/roles" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $token" }

$employeeRole = $roles | Where-Object { $_.name -eq "employee" }
$employeeRoleId = $employeeRole.id
```

Create employee:

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/users" `
  -Method POST `
  -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body "{
    `"email`": `"john.doe@acme.com`",
    `"password`": `"password123`",
    `"full_name`": `"John Doe`",
    `"employee_id`": `"EMP002`",
    `"role_id`": $employeeRoleId,
    `"company_id`": $companyId,
    `"department_id`": $deptId,
    `"phone`": `"+1-555-0101`",
    `"is_active`": true
  }"
```

## Step 8: View Data in Frontend

Now refresh the frontend:

1. Go to **Dashboard** - See user count metrics
2. Go to **Companies** - See Acme Corporation
3. Go to **Departments** - See Engineering department
4. Go to **Employees** - See Admin and John Doe
5. Click on **John Doe** to view/edit details

## Troubleshooting

### Services Not Starting

```powershell
# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Restart services
docker-compose restart

# Stop and start fresh
docker-compose down
docker-compose up -d
```

### Database Connection Issues

```powershell
# Check if PostgreSQL is running
docker-compose ps postgres

# Check database exists
docker-compose exec postgres psql -U tspm_user -l
```

### Frontend Can't Connect to Backend

```powershell
# Check backend is running
curl http://localhost:8000/health

# Check backend logs
docker-compose logs backend

# Verify NEXT_PUBLIC_API_URL in frontend
docker-compose exec frontend printenv | grep NEXT_PUBLIC_API_URL
```

### Permission Denied Errors

```powershell
# Check if running as admin or with proper permissions
# Try stopping and starting Docker Desktop
```

## Quick Commands Reference

```powershell
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend

# Restart a service
docker-compose restart backend

# Execute command in container
docker-compose exec backend python

# Access database
docker-compose exec postgres psql -U tspm_user -d tspm_db

# Run migrations
docker-compose exec backend alembic upgrade head

# Check running containers
docker-compose ps

# Remove all containers and volumes (CAUTION: Deletes data!)
docker-compose down -v
```

## Next Steps

Once you have users and data:

1. **Test Login** with different roles
2. **Create Teams** and assign members
3. **Create Projects** and assign teams
4. **Submit Daily Status** as an employee
5. **View Reports** as a manager
6. **Check Notifications**
7. **View Audit Logs** as admin

## Support

- API Documentation: http://localhost:8000/docs
- Check logs: `docker-compose logs -f`
- Database: `docker-compose exec postgres psql -U tspm_user -d tspm_db`

---

**Your application is now running!** 🎉

Access it at: http://localhost:3000
