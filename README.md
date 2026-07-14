# Team Status & Project Management System

A full-stack enterprise application for managing teams, projects, and daily status reports with role-based access control.

## 📋 Overview

This system enables organizations to:
- **Managers**: Create projects, manage teams, assign members, track daily status, and generate comprehensive reports
- **Employees**: Submit daily work status, log hours, report blockers, and plan tomorrow's tasks
- **Admins**: Manage companies, departments, teams, users, and system settings

## ✨ Key Features

### For Managers & Admins
- 📊 **Dashboard Analytics**: Real-time metrics on projects, teams, and status submissions
- 👥 **Team Management**: Create and organize teams, assign team leads, manage members
- 🎯 **Project Tracking**: Create projects, assign teams, monitor progress
- 📈 **Comprehensive Reports**: Daily, weekly, monthly reports with PDF/Excel/CSV export
- 🔔 **Smart Notifications**: Automated reminders for pending status submissions
- 🔍 **Advanced Search**: Filter and search across projects, teams, and employees
- 📅 **Timeline & Calendar Views**: Visual representation of tasks and deadlines
- 📝 **Audit Logs**: Track all system changes and user actions

### For Employees
- ✍️ **Daily Status Submission**:
  - Select project and task
  - Describe today's work
  - Set task status (Not Started, In Progress, Completed, Blocked)
  - Log working hours
  - Report blockers
  - Plan tomorrow's tasks
  - Optional file attachments
- 🔔 **Reminders**: Daily 5 PM reminder to submit status
- 📊 **Personal Dashboard**: View your tasks, projects, and performance metrics

### Automated Features
- **Daily Reminder**: 5 PM notification to submit status
- **Weekly Reports**: Auto-generated every Monday at 8 AM
- **Blocked Task Check**: Daily 9 AM notification for blocked tasks
- **Email Notifications**: SMTP-based email system for all alerts

## 🏗️ Architecture

### Tech Stack

#### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Cache**: Redis for sessions and caching
- **Authentication**: JWT (Access + Refresh tokens)
- **Authorization**: Role-Based Access Control (RBAC)
- **Migrations**: Alembic
- **Background Jobs**: APScheduler
- **Email**: SMTP with Jinja2 templates
- **File Storage**: AWS S3 compatible
- **Testing**: pytest with >80% coverage

#### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Forms**: react-hook-form + zod validation
- **HTTP Client**: Axios with auto-refresh interceptor
- **Notifications**: Sonner (toast notifications)
- **Date Handling**: date-fns

#### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **Storage**: AWS S3 or MinIO
- **Email**: SMTP (Gmail, SendGrid, etc.)

### System Architecture

```
┌─────────────────┐
│   Next.js SPA   │ (Port 3000)
│   (Frontend)    │
└────────┬────────┘
         │
    ┌────┴────┐
    │  Nginx  │ (Port 80)
    │  Proxy  │
    └────┬────┘
         │
┌────────┴────────┐
│  FastAPI API    │ (Port 8000)
│   (Backend)     │
└────┬──────┬─────┘
     │      │
     │      └─────────┐
     │                │
┌────┴─────┐   ┌─────┴──────┐   ┌──────────┐
│PostgreSQL│   │   Redis    │   │ AWS S3   │
│  (5432)  │   │   (6379)   │   │ Storage  │
└──────────┘   └────────────┘   └──────────┘
```

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- PostgreSQL 15+ (for local development)
- Redis 7+ (for local development)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configurations
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Local Development Setup

#### Backend Setup

1. **Create virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables**
   ```bash
   export DATABASE_URL="postgresql://user:pass@localhost:5432/teamstatus"
   export REDIS_URL="redis://localhost:6379"
   export SECRET_KEY="your-secret-key"
   # ... other variables from .env.example
   ```

4. **Run migrations**
   ```bash
   alembic upgrade head
   ```

5. **Start development server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

6. **Run tests**
   ```bash
   pytest
   ```

#### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**
   ```bash
   echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 👥 User Roles & Permissions

### Role Hierarchy

1. **Super Admin**
   - Full system access
   - Manage companies, departments, teams, users
   - View all data across all companies
   - Access audit logs
   - System configuration

2. **Company Admin**
   - Manage own company's departments, teams, users
   - Create and assign projects
   - View company-wide reports
   - Cannot access other companies' data

3. **Project Manager**
   - Create and manage projects
   - Assign teams to projects
   - View reports for assigned projects
   - Manage team members

4. **Team Lead**
   - Manage own team members
   - View team reports
   - Assign tasks
   - Monitor team status

5. **Employee**
   - Submit daily status
   - View own tasks and projects
   - Update task status
   - View personal reports

### Permission Matrix

| Feature | Super Admin | Company Admin | Project Manager | Team Lead | Employee |
|---------|-------------|---------------|-----------------|-----------|----------|
| Companies | ✅ | ❌ | ❌ | ❌ | ❌ |
| Departments | ✅ | ✅ | ❌ | ❌ | ❌ |
| Teams | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| Users | ✅ | ✅ | ✅ | 👁️ | ❌ |
| Projects | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| Daily Status | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reports (All) | ✅ | ✅ | 👁️ | 👁️ | ❌ |
| Reports (Own) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Audit Logs | ✅ | ✅ | ❌ | ❌ | ❌ |

✅ Full Access | 👁️ Read Only | ❌ No Access

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/change-password` - Change password
- `GET /api/v1/auth/me` - Get current user

### Users
- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/{id}` - Get user
- `PATCH /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Companies
- `GET /api/v1/companies` - List companies
- `POST /api/v1/companies` - Create company
- `GET /api/v1/companies/{id}` - Get company
- `PATCH /api/v1/companies/{id}` - Update company
- `DELETE /api/v1/companies/{id}` - Delete company

### Departments
- `GET /api/v1/departments` - List departments
- `POST /api/v1/departments` - Create department
- `GET /api/v1/departments/{id}` - Get department
- `PATCH /api/v1/departments/{id}` - Update department
- `DELETE /api/v1/departments/{id}` - Delete department

### Teams
- `GET /api/v1/teams` - List teams
- `POST /api/v1/teams` - Create team
- `GET /api/v1/teams/{id}` - Get team
- `PATCH /api/v1/teams/{id}` - Update team
- `DELETE /api/v1/teams/{id}` - Delete team
- `POST /api/v1/teams/{id}/members` - Add team member
- `DELETE /api/v1/teams/{id}/members/{user_id}` - Remove team member

### Projects
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/{id}` - Get project
- `PATCH /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project
- `POST /api/v1/projects/{id}/assign` - Assign team to project

### Daily Status
- `GET /api/v1/daily-status` - List daily status entries
- `POST /api/v1/daily-status` - Submit daily status
- `GET /api/v1/daily-status/{id}` - Get daily status
- `PATCH /api/v1/daily-status/{id}` - Update daily status (today only)
- `DELETE /api/v1/daily-status/{id}` - Delete daily status
- `GET /api/v1/daily-status/today` - Get today's status
- `GET /api/v1/daily-status/user/{user_id}` - Get user's status history

### Reports
- `GET /api/v1/reports/daily` - Daily status report
- `GET /api/v1/reports/weekly` - Weekly summary report
- `GET /api/v1/reports/monthly` - Monthly summary report
- `GET /api/v1/reports/productivity` - Employee productivity report
- `GET /api/v1/reports/project-progress` - Project progress report
- `GET /api/v1/reports/export` - Export report (PDF/Excel/CSV)

### Notifications
- `GET /api/v1/notifications` - List notifications
- `PATCH /api/v1/notifications/{id}/read` - Mark as read
- `POST /api/v1/notifications/read-all` - Mark all as read
- `DELETE /api/v1/notifications/{id}` - Delete notification

### Audit Logs
- `GET /api/v1/audit-logs` - List audit logs
- `GET /api/v1/audit-logs/{id}` - Get audit log

### File Upload
- `POST /api/v1/upload` - Upload file to S3
- `GET /api/v1/upload/{file_id}` - Get file URL

### Search
- `GET /api/v1/search?q=query` - Global search

Full API documentation available at: http://localhost:8000/docs

## 🗄️ Database Schema

### Core Tables

- **companies** - Company information
- **departments** - Departments within companies
- **teams** - Teams within departments
- **roles** - User roles (seeded data)
- **users** - User accounts and profiles
- **projects** - Project definitions
- **project_teams** - Many-to-many: projects ↔ teams
- **team_members** - Many-to-many: teams ↔ users
- **daily_status** - Daily status submissions
- **notifications** - User notifications
- **audit_logs** - System audit trail

### Key Relationships

```
Company
  ├── Departments
  │     └── Teams
  │           ├── Team Members (Users)
  │           └── Projects
  │                 └── Daily Status
  └── Users
        ├── Role
        ├── Daily Status
        └── Notifications
```

## 🔐 Security

### Authentication
- JWT-based authentication with access and refresh tokens
- Access token expires in 30 minutes
- Refresh token expires in 7 days
- Automatic token refresh via Axios interceptor
- HTTP-only cookies for refresh token (production recommended)

### Authorization
- Role-Based Access Control (RBAC)
- Route-level permission checks
- Data-level scoping (users see only their scope)
- SQL injection protection via SQLAlchemy ORM
- XSS protection via Content Security Policy

### Best Practices
- Passwords hashed with bcrypt
- Environment-based secrets management
- CORS configuration for production
- Rate limiting on authentication endpoints
- Input validation with Pydantic
- Audit logging for sensitive operations

## 📧 Email Templates

Email templates are located in `backend/app/templates/email/`:
- Daily reminder template
- Weekly report template
- Password reset template
- Welcome email template

Templates use Jinja2 for dynamic content.

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest                          # Run all tests
pytest -v                       # Verbose output
pytest --cov=app                # With coverage
pytest tests/test_auth.py       # Specific test file
pytest -k "test_login"          # Specific test pattern
```

### Test Structure
```
backend/tests/
├── conftest.py              # Test fixtures
├── test_auth.py            # Authentication tests
├── test_users.py           # User management tests
├── test_projects.py        # Project tests
├── test_daily_status.py    # Daily status tests
├── test_teams.py           # Team tests
└── test_reports.py         # Report generation tests
```

## 🔄 Background Jobs

Scheduled tasks run via APScheduler:

| Job | Schedule | Description |
|-----|----------|-------------|
| Daily Reminder | Every day at 5 PM | Remind users to submit daily status |
| Weekly Report | Monday at 8 AM | Generate and email weekly summary |
| Blocked Task Check | Every day at 9 AM | Notify managers of blocked tasks |

Configure schedules in `backend/app/tasks/scheduler.py`.

## 📦 Deployment

### Production Deployment with Docker

1. **Configure production environment**
   ```bash
   cp .env.example .env.production
   # Set production values
   ```

2. **Build and deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Setup SSL/TLS (recommended)**
   - Use Let's Encrypt with Certbot
   - Update nginx configuration
   - Enable HTTPS redirects

### Cloud Deployment Options

#### AWS
- **Compute**: ECS/Fargate or EC2
- **Database**: RDS PostgreSQL
- **Cache**: ElastiCache Redis
- **Storage**: S3
- **Email**: SES

#### Azure
- **Compute**: Container Instances or App Service
- **Database**: Azure Database for PostgreSQL
- **Cache**: Azure Cache for Redis
- **Storage**: Blob Storage
- **Email**: SendGrid

#### GCP
- **Compute**: Cloud Run or GKE
- **Database**: Cloud SQL PostgreSQL
- **Cache**: Memorystore for Redis
- **Storage**: Cloud Storage
- **Email**: SendGrid

### Environment Variables

Key environment variables for production:

```env
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379
SECRET_KEY=<strong-random-secret>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# AWS S3
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_S3_BUCKET=<bucket-name>
AWS_REGION=us-east-1

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASSWORD=<app-password>

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Error
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check database credentials in .env
# Verify DATABASE_URL format
```

#### Redis Connection Error
```bash
# Check Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

#### Frontend can't reach backend
```bash
# Check NEXT_PUBLIC_API_URL in frontend/.env.local
# Ensure backend is running on correct port
# Check CORS configuration in backend
```

#### Email not sending
```bash
# Verify SMTP credentials
# Check SMTP_HOST and SMTP_PORT
# Enable "Less secure app access" for Gmail
# Or use App Password for Gmail
```

#### File upload fails
```bash
# Check S3 credentials
# Verify bucket permissions
# Check CORS configuration on S3 bucket
```

## 📝 License

This project is proprietary and confidential.

## 👨‍💻 Development Team

For questions or support, contact the development team.

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Full RBAC implementation
- Daily status management
- Report generation
- Email notifications
- Docker deployment support
- Comprehensive test coverage

---

Built with ❤️ using FastAPI, Next.js, and modern web technologies.
