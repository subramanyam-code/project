# View Users Script - Quick way to see user data

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  View Users & Data" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Login
Write-Host "Logging in as admin..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@example.com"
        password = "admin123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody

    $token = $loginResponse.access_token
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "✗ Login failed. Is the application running?" -ForegroundColor Red
    Write-Host "Run 'docker-compose up -d' first" -ForegroundColor Yellow
    exit 1
}

# Get current user info
Write-Host "Current User Info:" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $currentUser = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/me" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $token" }

    Write-Host "  Name:        $($currentUser.full_name)" -ForegroundColor White
    Write-Host "  Email:       $($currentUser.email)" -ForegroundColor White
    Write-Host "  Role:        $($currentUser.role.name)" -ForegroundColor White
    Write-Host "  Employee ID: $($currentUser.employee_id)" -ForegroundColor White
    Write-Host "  Active:      $($currentUser.is_active)" -ForegroundColor White
} catch {
    Write-Host "  Error fetching current user" -ForegroundColor Red
}
Write-Host ""

# Get all users
Write-Host "All Users in System:" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $users = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/users" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $token" }

    if ($users.items) {
        $userList = $users.items
    } else {
        $userList = $users
    }

    if ($userList.Count -gt 0) {
        foreach ($user in $userList) {
            Write-Host ""
            Write-Host "  User ID: $($user.id)" -ForegroundColor Cyan
            Write-Host "  Name:        $($user.full_name)" -ForegroundColor White
            Write-Host "  Email:       $($user.email)" -ForegroundColor White
            Write-Host "  Role:        $($user.role.name)" -ForegroundColor White
            Write-Host "  Employee ID: $($user.employee_id)" -ForegroundColor White
            Write-Host "  Department:  $($user.department.name ?? 'Not assigned')" -ForegroundColor White
            Write-Host "  Active:      $($user.is_active)" -ForegroundColor White
            Write-Host "  --------" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "  Total Users: $($userList.Count)" -ForegroundColor Green
    } else {
        Write-Host "  No users found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Error fetching users: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Get companies
Write-Host "Companies:" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $companies = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/companies" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $token" }

    $companyList = if ($companies.items) { $companies.items } else { $companies }

    if ($companyList -and $companyList.Count -gt 0) {
        foreach ($company in $companyList) {
            Write-Host "  - $($company.name) ($($company.email))" -ForegroundColor White
        }
        Write-Host "  Total: $($companyList.Count)" -ForegroundColor Green
    } else {
        Write-Host "  No companies found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Error fetching companies" -ForegroundColor Red
}
Write-Host ""

# Get departments
Write-Host "Departments:" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $departments = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/departments" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $token" }

    $deptList = if ($departments.items) { $departments.items } else { $departments }

    if ($deptList -and $deptList.Count -gt 0) {
        foreach ($dept in $deptList) {
            Write-Host "  - $($dept.name) [$($dept.company.name ?? 'No company')]" -ForegroundColor White
        }
        Write-Host "  Total: $($deptList.Count)" -ForegroundColor Green
    } else {
        Write-Host "  No departments found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Error fetching departments" -ForegroundColor Red
}
Write-Host ""

# Get teams
Write-Host "Teams:" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $teams = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/teams" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $token" }

    $teamList = if ($teams.items) { $teams.items } else { $teams }

    if ($teamList -and $teamList.Count -gt 0) {
        foreach ($team in $teamList) {
            Write-Host "  - $($team.name) [Lead: $($team.team_lead.full_name ?? 'Not assigned')]" -ForegroundColor White
        }
        Write-Host "  Total: $($teamList.Count)" -ForegroundColor Green
    } else {
        Write-Host "  No teams found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Error fetching teams" -ForegroundColor Red
}
Write-Host ""

# Get projects
Write-Host "Projects:" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $projects = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/projects" `
        -Method GET `
        -Headers @{ "Authorization" = "Bearer $token" }

    $projectList = if ($projects.items) { $projects.items } else { $projects }

    if ($projectList -and $projectList.Count -gt 0) {
        foreach ($project in $projectList) {
            Write-Host "  - $($project.name) [$($project.status)]" -ForegroundColor White
        }
        Write-Host "  Total: $($projectList.Count)" -ForegroundColor Green
    } else {
        Write-Host "  No projects found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Error fetching projects" -ForegroundColor Red
}
Write-Host ""

# Database view
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Direct Database View" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view database directly, run:" -ForegroundColor Yellow
Write-Host "  docker-compose exec postgres psql -U tspm_user -d tspm_db" -ForegroundColor Cyan
Write-Host ""
Write-Host "Then run SQL queries like:" -ForegroundColor Yellow
Write-Host "  SELECT * FROM users;" -ForegroundColor Gray
Write-Host "  SELECT * FROM roles;" -ForegroundColor Gray
Write-Host "  SELECT * FROM companies;" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "To view in browser, open:" -ForegroundColor Yellow
Write-Host "  http://localhost:3000" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
