# Deployment Guide

Complete guide for deploying Team Status & Project Management System to various environments.

---

## 📋 Pre-Deployment Checklist

Before deploying to any environment:

### Security
- [ ] Change default admin password
- [ ] Generate strong SECRET_KEY (32+ random characters)
- [ ] Review and update CORS settings
- [ ] Configure proper firewall rules
- [ ] Set up SSL/TLS certificates
- [ ] Enable HTTPS redirects
- [ ] Review environment variables for sensitive data
- [ ] Disable debug mode in production
- [ ] Set up rate limiting

### Database
- [ ] Set up production database (PostgreSQL)
- [ ] Configure database backups
- [ ] Set up database monitoring
- [ ] Configure connection pooling
- [ ] Create database indexes
- [ ] Test database connection from app

### Infrastructure
- [ ] Set up Redis for caching
- [ ] Configure S3 or cloud storage
- [ ] Set up SMTP email service
- [ ] Configure monitoring and logging
- [ ] Set up health check endpoints
- [ ] Configure auto-scaling (if applicable)

### Code
- [ ] Run all tests and ensure they pass
- [ ] Build frontend for production
- [ ] Run database migrations
- [ ] Seed initial data (roles)
- [ ] Review and optimize queries

---

## 🐳 Docker Deployment (Recommended)

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    restart: always
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://redis:6379
      SECRET_KEY: ${SECRET_KEY}
      ENVIRONMENT: production
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_S3_BUCKET: ${AWS_S3_BUCKET}
      AWS_REGION: ${AWS_REGION}
    depends_on:
      - postgres
      - redis
    restart: always
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    restart: always
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro  # SSL certificates
    depends_on:
      - backend
      - frontend
    restart: always
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

### Deploy

```bash
# Create production .env file
cp .env.example .env.production

# Edit with production values
nano .env.production

# Start services
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## ☁️ AWS Deployment

### Option 1: AWS ECS (Fargate)

#### 1. Push Docker Images to ECR

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Create ECR repositories
aws ecr create-repository --repository-name tspm-backend
aws ecr create-repository --repository-name tspm-frontend
aws ecr create-repository --repository-name tspm-nginx

# Build and push backend
cd backend
docker build -t tspm-backend .
docker tag tspm-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/tspm-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/tspm-backend:latest

# Build and push frontend
cd ../frontend
docker build -t tspm-frontend .
docker tag tspm-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/tspm-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/tspm-frontend:latest

# Push nginx
docker tag nginx:alpine <account-id>.dkr.ecr.us-east-1.amazonaws.com/tspm-nginx:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/tspm-nginx:latest
```

#### 2. Set Up RDS PostgreSQL

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier tspm-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password <strong-password> \
  --allocated-storage 20 \
  --vpc-security-group-ids <security-group-id> \
  --db-subnet-group-name <subnet-group>
```

#### 3. Set Up ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id tspm-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --security-group-ids <security-group-id>
```

#### 4. Create ECS Task Definition

Create `task-definition.json`:

```json
{
  "family": "tspm",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/tspm-backend:latest",
      "portMappings": [{"containerPort": 8000}],
      "environment": [
        {"name": "DATABASE_URL", "value": "postgresql://..."},
        {"name": "REDIS_URL", "value": "redis://..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/tspm",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "backend"
        }
      }
    },
    {
      "name": "frontend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/tspm-frontend:latest",
      "portMappings": [{"containerPort": 3000}],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/tspm",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "frontend"
        }
      }
    }
  ]
}
```

#### 5. Create ECS Service with ALB

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name tspm-alb \
  --subnets <subnet-1> <subnet-2> \
  --security-groups <security-group>

# Create target groups
aws elbv2 create-target-group \
  --name tspm-backend-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id <vpc-id> \
  --target-type ip

# Create ECS service
aws ecs create-service \
  --cluster tspm-cluster \
  --service-name tspm-service \
  --task-definition tspm \
  --desired-count 2 \
  --launch-type FARGATE \
  --load-balancers targetGroupArn=<tg-arn>,containerName=backend,containerPort=8000
```

### Option 2: AWS EC2

```bash
# Launch EC2 instance (Amazon Linux 2)
# SSH into instance

# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository or upload files
git clone <repository-url>
cd project

# Configure environment
cp .env.example .env
nano .env  # Edit with production values

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose exec backend alembic upgrade head

# Set up Nginx with SSL (Let's Encrypt)
sudo yum install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

---

## 🔵 Azure Deployment

### Option 1: Azure Container Instances

```bash
# Create resource group
az group create --name tspm-rg --location eastus

# Create Azure Container Registry
az acr create --resource-group tspm-rg --name tspmacr --sku Basic

# Login to ACR
az acr login --name tspmacr

# Build and push images
docker build -t tspmacr.azurecr.io/backend:latest ./backend
docker push tspmacr.azurecr.io/backend:latest

docker build -t tspmacr.azurecr.io/frontend:latest ./frontend
docker push tspmacr.azurecr.io/frontend:latest

# Create Azure Database for PostgreSQL
az postgres server create \
  --resource-group tspm-rg \
  --name tspm-db-server \
  --location eastus \
  --admin-user tspmadmin \
  --admin-password <strong-password> \
  --sku-name B_Gen5_1

# Create Azure Cache for Redis
az redis create \
  --name tspm-redis \
  --resource-group tspm-rg \
  --location eastus \
  --sku Basic \
  --vm-size c0

# Deploy container instances
az container create \
  --resource-group tspm-rg \
  --name tspm-backend \
  --image tspmacr.azurecr.io/backend:latest \
  --registry-login-server tspmacr.azurecr.io \
  --ports 8000 \
  --environment-variables DATABASE_URL=<connection-string>
```

### Option 2: Azure App Service

```bash
# Create App Service Plan
az appservice plan create \
  --name tspm-plan \
  --resource-group tspm-rg \
  --sku B1 \
  --is-linux

# Create web apps
az webapp create \
  --resource-group tspm-rg \
  --plan tspm-plan \
  --name tspm-backend-app \
  --deployment-container-image-name tspmacr.azurecr.io/backend:latest

az webapp create \
  --resource-group tspm-rg \
  --plan tspm-plan \
  --name tspm-frontend-app \
  --deployment-container-image-name tspmacr.azurecr.io/frontend:latest

# Configure environment variables
az webapp config appsettings set \
  --resource-group tspm-rg \
  --name tspm-backend-app \
  --settings DATABASE_URL=<connection-string>
```

---

## 🔴 GCP Deployment

### Option 1: Cloud Run

```bash
# Enable APIs
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com

# Build and push to Container Registry
docker build -t gcr.io/<project-id>/backend:latest ./backend
docker push gcr.io/<project-id>/backend:latest

docker build -t gcr.io/<project-id>/frontend:latest ./frontend
docker push gcr.io/<project-id>/frontend:latest

# Create Cloud SQL instance
gcloud sql instances create tspm-db \
  --database-version=POSTGRES_15 \
  --cpu=1 \
  --memory=3840MB \
  --region=us-central1

# Create database
gcloud sql databases create tspm --instance=tspm-db

# Create Cloud Memorystore for Redis
gcloud redis instances create tspm-redis \
  --size=1 \
  --region=us-central1

# Deploy to Cloud Run
gcloud run deploy tspm-backend \
  --image gcr.io/<project-id>/backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=<connection-string>

gcloud run deploy tspm-frontend \
  --image gcr.io/<project-id>/frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 🌐 DigitalOcean Deployment

### Using App Platform

```bash
# Install doctl
snap install doctl

# Authenticate
doctl auth init

# Create app spec (app.yaml)
cat > app.yaml <<EOF
name: tspm
services:
  - name: backend
    github:
      repo: <your-repo>
      branch: main
      deploy_on_push: true
    dockerfile_path: backend/Dockerfile
    http_port: 8000
    instance_count: 1
    instance_size_slug: basic-xxs
    env_vars:
      - key: DATABASE_URL
        value: \${db.DATABASE_URL}
  - name: frontend
    github:
      repo: <your-repo>
      branch: main
      deploy_on_push: true
    dockerfile_path: frontend/Dockerfile
    http_port: 3000
    instance_count: 1
    instance_size_slug: basic-xxs
databases:
  - name: db
    engine: PG
    version: "15"
    size: db-s-1vcpu-1gb
EOF

# Create app
doctl apps create --spec app.yaml
```

---

## 🔐 SSL/TLS Configuration

### Using Let's Encrypt with Nginx

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (crontab)
sudo crontab -e
# Add: 0 0 1 * * certbot renew --quiet
```

### Nginx SSL Configuration

Update `nginx/nginx.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📊 Monitoring & Logging

### Set Up Application Monitoring

#### Sentry (Error Tracking)

```python
# backend/app/main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    environment=os.getenv("ENVIRONMENT", "production"),
)
```

#### Prometheus + Grafana

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push backend
        run: |
          docker build -t ${{ steps.login-ecr.outputs.registry }}/backend:latest ./backend
          docker push ${{ steps.login-ecr.outputs.registry }}/backend:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster tspm-cluster --service tspm-service --force-new-deployment
```

---

## 🔙 Backup Strategy

### Database Backups

```bash
# Automated PostgreSQL backups
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="tspm_db"
DB_USER="tspm_user"

# Create backup
pg_dump -U $DB_USER -d $DB_NAME -F c -f $BACKUP_DIR/tspm_db_$DATE.dump

# Upload to S3
aws s3 cp $BACKUP_DIR/tspm_db_$DATE.dump s3://tspm-backups/db/

# Keep only last 7 days locally
find $BACKUP_DIR -name "*.dump" -mtime +7 -delete

# Schedule with cron
# 0 2 * * * /path/to/backup.sh
```

### File Storage Backups

```bash
# S3 bucket versioning
aws s3api put-bucket-versioning \
  --bucket tspm-files \
  --versioning-configuration Status=Enabled

# S3 lifecycle policy for old versions
aws s3api put-bucket-lifecycle-configuration \
  --bucket tspm-files \
  --lifecycle-configuration file://lifecycle.json
```

---

## 📈 Scaling

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 3
    
  frontend:
    deploy:
      replicas: 2

  nginx:
    deploy:
      replicas: 1
```

```bash
docker-compose -f docker-compose.scale.yml up -d --scale backend=3 --scale frontend=2
```

### Load Balancer Configuration

```nginx
upstream backend {
    least_conn;
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

upstream frontend {
    server frontend1:3000;
    server frontend2:3000;
}
```

---

## ✅ Post-Deployment Verification

```bash
# Health checks
curl https://yourdomain.com/api/v1/health
curl https://yourdomain.com

# Database connection
docker-compose exec backend python -c "from app.database import engine; engine.connect()"

# Redis connection
docker-compose exec redis redis-cli ping

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Monitor resources
docker stats

# Test email
curl -X POST https://yourdomain.com/api/v1/test-email

# Test file upload
# Upload a file through the UI

# Check background jobs
docker-compose exec backend python -c "from app.tasks.scheduler import scheduler; print(scheduler.get_jobs())"
```

---

## 🆘 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check database is running
docker-compose ps postgres

# Check connection string
echo $DATABASE_URL

# Test connection
docker-compose exec backend python -c "from sqlalchemy import create_engine; engine = create_engine('$DATABASE_URL'); engine.connect()"
```

#### 2. Redis Connection Failed
```bash
# Check Redis
docker-compose ps redis
docker-compose exec redis redis-cli ping
```

#### 3. Email Not Sending
```bash
# Test SMTP connection
docker-compose exec backend python -c "
import smtplib
smtp = smtplib.SMTP('smtp.gmail.com', 587)
smtp.starttls()
smtp.login('email', 'password')
print('SMTP OK')
"
```

#### 4. File Upload Fails
```bash
# Check S3 credentials
aws s3 ls s3://your-bucket

# Check bucket permissions
aws s3api get-bucket-policy --bucket your-bucket
```

---

## 📞 Support

For deployment issues:
1. Check logs: `docker-compose logs`
2. Review documentation
3. Contact DevOps team
4. Open support ticket

---

**Deployment Guide Complete** 🚀
