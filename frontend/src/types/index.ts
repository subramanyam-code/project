export interface Role {
  id: string;
  role_name: string;
  name?: string; // alias used in some places
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;       // may be returned by backend
  email: string;
  phone?: string;
  job_title?: string;
  employee_id?: string;
  profile_image?: string;
  is_active: boolean;
  is_verified: boolean;
  company_id?: string;
  department_id?: string;
  team_id?: string;
  role_id?: string;
  role?: Role;
  department?: { id: string; department_name: string; name?: string };
  teams?: Array<{ id: string; team_name: string; name?: string }>;
  last_login?: string;
  created_at: string;
}

export interface UserListItem {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  job_title?: string;
  profile_image?: string;
  is_active: boolean;
  role?: Role;
}

export interface Company {
  id: string;
  company_name: string;
  name?: string;            // alias used in modals
  slug?: string;
  description?: string;
  domain?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  company_id: string;
  department_name: string;
  name?: string;            // alias used in modals
  description?: string;
  is_active?: boolean;
  created_at: string;
  company?: { id: string; company_name: string; name?: string };
}

export interface Team {
  id: string;
  department_id: string;
  team_name: string;
  name?: string;            // alias used in modals
  description?: string;
  team_lead_id?: string;
  is_active?: boolean;
  created_at: string;
  department?: { id: string; department_name: string; name?: string };
  team_lead?: UserListItem & { full_name?: string };
  members?: UserListItem[];
}

export interface TeamDetail extends Team {
  member_count: number;
}

export type ProjectStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role_in_project?: string;
  user?: UserListItem;
}

export interface Project {
  id: string;
  company_id?: string;
  project_name: string;
  description?: string;
  manager_id?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date?: string;
  end_date?: string;
  progress_percentage: string;
  created_at: string;
  manager?: UserListItem;
  member_count: number;
}

export interface ProjectDetail extends Project {
  members: ProjectMember[];
}

export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

export interface DailyStatus {
  id: string;
  user_id: string;
  project_id: string;
  task_title: string;
  description?: string;
  status: TaskStatus;
  hours_worked: number;
  blockers?: string;
  tomorrow_plan?: string;
  attachment_url?: string;
  submit_date: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  type?: string;            // alias used in some places
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface MessageResponse {
  message: string;
  success: boolean;
}

export interface SuperAdminDashboard {
  total_companies: number;
  total_employees: number;
  active_users: number;
  total_projects: number;
  total_departments: number;
  today_submissions: number;
}

export interface ManagerDashboard {
  total_projects: number;
  today_submitted: number;
  blocked_tasks: number;
  completed_today: number;
  pending_today: number;
}

export interface EmployeeDashboard {
  total_projects: number;
  today_status_submitted: boolean;
  today_status?: TaskStatus;
  week_hours: number;
  completed_tasks: number;
  pending_tasks: number;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
