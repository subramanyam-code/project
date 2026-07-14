# Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Prerequisites
- Docker and Docker Compose installed
- That's it! Docker handles everything else.

### Step 1: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings (or use defaults for development)
# Minimum required: Update SMTP settings if you want email notifications
```

### Step 2: Start the Application

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend, Nginx)
docker-compose up -d

# Wait 30 seconds for services to initialize
```

### Step 3: Initialize Database

```bash
# Run database migrations and seed initial data
docker-compose exec backend alembic upgrade head
```

### Step 4: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Step 5: Login

**Default Super Admin Account** (created by migration seed):
- Email: `admin@example.com`
- Password: `admin123`

⚠️ **IMPORTANT**: Change this password immediately in production!

---

## 🎯 What to Do Next

### 1. Create Your First Company
1. Login as super admin
2. Navigate to "Companies" → Click "Add Company"
3. Fill in company details

### 2. Create Departments
1. Go to "Departments" → Click "Add Department"
2. Select the company you created
3. Add department name and description

### 3. Create Teams
1. Go to "Teams" → Click "Add Team"
2. Select department
3. Assign a team lead

### 4. Add Users/Employees
1. Go to "Employees" → Click "Add Employee"
2. Fill in user details
3. Assign role, department, and teams
4. User will receive welcome email (if SMTP configured)

### 5. Create Projects
1. Go to "Projects" → Click "Add Project"
2. Assign teams to the project
3. Set start and end dates

### 6. Submit Daily Status (as Employee)
1. Login as an employee
2. Go to "Daily Status"
3. Fill in today's work details:
   - Select project
   - Enter task title and description
   - Set status (In Progress, Completed, Blocked)
   - Log hours worked
   - Add blockers if any
   - Plan tomorrow's tasks

### 7. View Reports (as Manager/Admin)
1. Go to "Reports"
2. Select report type:
   - Daily Status Report
   - Weekly Summary
   - Monthly Report
   - Productivity Report
3. Filter by date range, project, team, or user
4. Export as PDF, Excel, or CSV

---

## 📱 Application Structure

```
Login → Dashboard (role-based)
  │
  ├─ Super Admin Dashboard
  │   ├─ Total Companies, Departments, Teams, Users
  │   ├─ System-wide Status Overview
  │   └─ Recent Activity
  │
  ├─ Manager Dashboard (Company Admin, Project Manager, Team Lead)
  │   ├─ Active Projects & Teams
  │   ├─ Today's Status Submissions
  │   ├─ Pending Statuses
  │   ├─ Blocked Tasks
  │   └─ Team Performance Metrics
  │
  └─ Employee Dashboard
      ├─ Your Projects & Tasks
      ├─ Today's Status (submit/edit)
      ├─ Your Recent Activity
      └─ Personal Performance
```

---

## 🔐 User Roles & What They Can Do

### Super Admin (Full System Access)
- ✅ Manage Companies
- ✅ Manage All Departments, Teams, Users
- ✅ View All Data Across All Companies
- ✅ Access Audit Logs
- ✅ System Configuration

### Company Admin (Company-Level)
- ✅ Manage Own Company's Departments
- ✅ Manage Own Company's Teams
- ✅ Manage Own Company's Users
- ✅ Create & Manage Projects
- ✅ View Company Reports
- ❌ Cannot Access Other Companies' Data

### Project Manager
- ✅ Create & Manage Projects
- ✅ Assign Teams to Projects
- ✅ View Reports for Assigned Projects
- ✅ Manage Team Members in Projects
- ❌ Cannot Manage Departments/Companies

### Team Lead
- ✅ Manage Own Team Members
- ✅ View Team Reports
- ✅ Assign Tasks to Team
- ✅ Monitor Team Daily Status
- ❌ Cannot Create Projects (only view assigned)

### Employee
- ✅ Submit Daily Status
- ✅ View Own Tasks & Projects
- ✅ Update Own Task Status
- ✅ View Personal Reports
- ❌ Cannot Manage Other Users

---

## 🧪 Test the System

### Test Scenario 1: Complete Daily Status Flow
1. **As Admin**: Create a project and assign a team
2. **As Team Lead**: Assign task to team member
3. **As Employee**: Submit daily status at 5 PM
4. **System**: Sends reminder email if not submitted
5. **As Manager**: View daily report next morning

### Test Scenario 2: Blocked Task Alert
1. **As Employee**: Submit status with "Blocked" status and add blocker description
2. **System**: Sends notification to team lead and project manager
3. **As Manager**: View blocked tasks and take action

### Test Scenario 3: Weekly Report Generation
1. Wait for Monday 8 AM (or manually trigger)
2. **System**: Generates weekly summary report
3. **System**: Emails report to all managers
4. **As Manager**: Download report as PDF/Excel

---

## 🛠️ Development Mode

If you want to develop or customize:

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Run Tests
```bash
# Backend tests
cd backend
pytest

# With coverage
pytest --cov=app
```

---

## 📧 Email Configuration

For email notifications to work, configure SMTP in `.env`:

### Gmail Example
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Not your Gmail password!
SMTP_FROM=your-email@gmail.com
```

**Note**: For Gmail, you need to:
1. Enable 2-factor authentication
2. Generate an "App Password"
3. Use that app password in `SMTP_PASSWORD`

### SendGrid Example
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=verified-sender@yourdomain.com
```

---

## 🔄 Scheduled Jobs

The system runs these automated tasks:

| Job | Schedule | Action |
|-----|----------|--------|
| Daily Reminder | 5:00 PM daily | Reminds employees to submit status |
| Weekly Report | Monday 8:00 AM | Generates and emails weekly summary |
| Blocked Task Check | 9:00 AM daily | Notifies managers of blocked tasks |

You can customize schedules in `backend/app/tasks/scheduler.py`.

---

## 🐛 Troubleshooting

### Services Won't Start
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs frontend

# Restart services
docker-compose restart
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Connect to database
docker-compose exec postgres psql -U tspm_user -d tspm_db
```

### Can't Login
- Check if migrations ran: `docker-compose exec backend alembic current`
- Check if default admin user exists in database
- Try resetting password via "Forgot Password"

### Frontend Can't Connect to Backend
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
- Should be `http://localhost:8000/api/v1` for development
- Check backend is running: `curl http://localhost:8000/health`

### Emails Not Sending
- Verify SMTP credentials in `.env`
- Check SMTP logs: `docker-compose logs backend | grep SMTP`
- Test SMTP connection manually

---

## 📚 Learn More

- Full Documentation: See [README.md](./README.md)
- API Documentation: http://localhost:8000/docs
- Frontend Code: `frontend/src/`
- Backend Code: `backend/app/`

---

## 🚨 Production Deployment Checklist

Before deploying to production:

- [ ] Change default admin password
- [ ] Set strong `SECRET_KEY` in `.env`
- [ ] Configure production database (not SQLite)
- [ ] Set up SSL/TLS certificates
- [ ] Configure production SMTP provider
- [ ] Set up S3 or cloud storage for file uploads
- [ ] Enable database backups
- [ ] Configure monitoring and logging
- [ ] Review and update CORS settings
- [ ] Enable rate limiting
- [ ] Set up proper firewall rules

---

## 💡 Tips & Best Practices

1. **Regular Status Submission**: Encourage team to submit status before 5 PM daily
2. **Clear Blocker Description**: When blocked, describe the issue clearly for faster resolution
3. **Accurate Hour Logging**: Log actual hours worked for accurate productivity reports
4. **Tomorrow's Plan**: Helps managers allocate resources effectively
5. **Weekly Reviews**: Managers should review weekly reports every Monday
6. **Performance Metrics**: Use productivity reports for 1-on-1s and reviews

---

## 🆘 Need Help?

- Check [README.md](./README.md) for detailed documentation
- Review API docs at http://localhost:8000/docs
- Check application logs: `docker-compose logs -f`
- Contact development team

---

**Happy Status Tracking! 🎉**
