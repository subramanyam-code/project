import { api } from "@/lib/axios";
import type {
  Company, Department, Team, TeamDetail, User, UserListItem,
  Project, ProjectDetail, DailyStatus, Notification, AuditLog,
  PaginatedResponse, MessageResponse, Token,
  SuperAdminDashboard, ManagerDashboard, EmployeeDashboard,
} from "@/types";

type P = Record<string, unknown>;

export const authService = {
  register: (first_name: string, last_name: string, email: string, password: string) =>
    api.post<Token>("/auth/register", { first_name, last_name, email, password }).then(r => r.data),
  login: (email: string, password: string) =>
    api.post<Token>("/auth/login", { email, password }).then(r => r.data),
  logout: () => api.post("/auth/logout").catch(() => {}),
  getMe: () => api.get<User>("/auth/me").then(r => r.data),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, new_password: string) =>
    api.post("/auth/reset-password", { token, new_password }),
  changePassword: (current_password: string, new_password: string) =>
    api.post("/auth/change-password", { current_password, new_password }),
};

export const companyService = {
  list: (p?: P) =>
    api.get<PaginatedResponse<Company>>("/companies", { params: p }).then(r => r.data),
  get: (id: string) =>
    api.get<Company>(`/companies/${id}`).then(r => r.data),
  create: (d: P) =>
    api.post<Company>("/companies", d).then(r => r.data),
  update: (id: string, d: P) =>
    api.put<Company>(`/companies/${id}`, d).then(r => r.data),
  delete: (id: string) =>
    api.delete<MessageResponse>(`/companies/${id}`).then(r => r.data),
};

export const departmentService = {
  // company_id is required by backend
  list: (p?: P) =>
    api.get<PaginatedResponse<Department>>("/departments", { params: p }).then(r => r.data),
  get: (id: string) =>
    api.get<Department>(`/departments/${id}`).then(r => r.data),
  create: (d: P) =>
    api.post<Department>("/departments", d).then(r => r.data),
  update: (id: string, d: P) =>
    api.put<Department>(`/departments/${id}`, d).then(r => r.data),
  delete: (id: string) =>
    api.delete<MessageResponse>(`/departments/${id}`).then(r => r.data),
};

export const teamService = {
  // department_id is required by backend
  list: (p?: P) =>
    api.get<PaginatedResponse<Team>>("/teams", { params: p }).then(r => r.data),
  get: (id: string) =>
    api.get<TeamDetail>(`/teams/${id}`).then(r => r.data),
  create: (d: P) =>
    api.post<Team>("/teams", d).then(r => r.data),
  update: (id: string, d: P) =>
    api.put<Team>(`/teams/${id}`, d).then(r => r.data),
  delete: (id: string) =>
    api.delete<MessageResponse>(`/teams/${id}`).then(r => r.data),
  addMembers: (id: string, user_ids: string[]) =>
    api.post<TeamDetail>(`/teams/${id}/members`, { user_ids }).then(r => r.data),
  removeMember: (id: string, uid: string) =>
    api.delete<MessageResponse>(`/teams/${id}/members/${uid}`).then(r => r.data),
  assignLead: (id: string, uid: string) =>
    api.patch<Team>(`/teams/${id}/lead/${uid}`).then(r => r.data),
};

export const userService = {
  list: (p?: P) =>
    api.get<PaginatedResponse<UserListItem>>("/users", { params: p }).then(r => r.data),
  get: (id: string) =>
    api.get<User>(`/users/${id}`).then(r => r.data),
  create: (d: P) =>
    api.post<User>("/users", d).then(r => r.data),
  invite: (d: P) =>
    api.post<User>("/users/invite", d).then(r => r.data),
  update: (id: string, d: P) =>
    api.put<User>(`/users/${id}`, d).then(r => r.data),
  activate: (id: string) =>
    api.patch<User>(`/users/${id}/activate`).then(r => r.data),
  deactivate: (id: string) =>
    api.patch<User>(`/users/${id}/deactivate`).then(r => r.data),
  roles: () =>
    api.get<Array<{ id: string; role_name: string }>>("/users/roles").then(r => r.data),
  uploadAvatar: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api
      .post<User>(`/users/${id}/avatar`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(r => r.data);
  },
};

export const projectService = {
  list: (p?: P) =>
    api.get<PaginatedResponse<Project>>("/projects", { params: p }).then(r => r.data),
  my: () =>
    api.get<Project[]>("/projects/my").then(r => r.data),
  get: (id: string) =>
    api.get<ProjectDetail>(`/projects/${id}`).then(r => r.data),
  create: (d: P) =>
    api.post<ProjectDetail>("/projects", d).then(r => r.data),
  update: (id: string, d: P) =>
    api.put<ProjectDetail>(`/projects/${id}`, d).then(r => r.data),
  delete: (id: string) =>
    api.delete<MessageResponse>(`/projects/${id}`).then(r => r.data),
  addMembers: (id: string, user_ids: string[]) =>
    api.post<ProjectDetail>(`/projects/${id}/members`, { user_ids }).then(r => r.data),
  removeMember: (id: string, uid: string) =>
    api.delete<MessageResponse>(`/projects/${id}/members/${uid}`).then(r => r.data),
};

export const statusService = {
  list: (p?: P) =>
    api.get<PaginatedResponse<DailyStatus>>("/daily-status", { params: p }).then(r => r.data),
  today: () =>
    api.get<DailyStatus | null>("/daily-status/today").then(r => r.data).catch(() => null),
  get: (id: string) =>
    api.get<DailyStatus>(`/daily-status/${id}`).then(r => r.data),
  submit: (d: P) =>
    api.post<DailyStatus>("/daily-status", d).then(r => r.data),
  update: (id: string, d: P) =>
    api.put<DailyStatus>(`/daily-status/${id}`, d).then(r => r.data),
  delete: (id: string) =>
    api.delete<MessageResponse>(`/daily-status/${id}`).then(r => r.data),
};

export const reportService = {
  daily: (p: P) => api.get("/reports/daily", { params: p, responseType: p.format && p.format !== 'json' ? 'blob' : 'json' }).then(r => r.data),
  weekly: (p: P) => api.get("/reports/weekly", { params: p, responseType: p.format && p.format !== 'json' ? 'blob' : 'json' }).then(r => r.data),
  monthly: (p: P) => api.get("/reports/monthly", { params: p, responseType: p.format && p.format !== 'json' ? 'blob' : 'json' }).then(r => r.data),
  custom: (p: P) => api.get("/reports/custom", { params: p, responseType: p.format && p.format !== 'json' ? 'blob' : 'json' }).then(r => r.data),
  productivity: (p: P) => api.get("/reports/productivity", { params: p }).then(r => r.data),
  dashboardSuperAdmin: () =>
    api.get<SuperAdminDashboard>("/reports/dashboard/super-admin").then(r => r.data),
  dashboardManager: () =>
    api.get<ManagerDashboard>("/reports/dashboard/manager").then(r => r.data),
  dashboardEmployee: () =>
    api.get<EmployeeDashboard>("/reports/dashboard/employee").then(r => r.data),
};

export const notificationService = {
  list: (p?: P) =>
    api.get<PaginatedResponse<Notification>>("/notifications", { params: p }).then(r => r.data),
  unreadCount: () =>
    api.get<{ unread_count: number }>("/notifications/unread-count").then(r => r.data),
  markRead: (id: string) =>
    api.patch<Notification>(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () =>
    api.post<MessageResponse>("/notifications/mark-all-read").then(r => r.data),
  delete: (id: string) =>
    api.delete<MessageResponse>(`/notifications/${id}`).then(r => r.data),
};

export const auditService = {
  list: (p?: P) =>
    api.get<PaginatedResponse<AuditLog>>("/audit-logs", { params: p }).then(r => r.data),
};

export const searchService = {
  search: (q: string) =>
    api.get("/search", { params: { q } }).then(r => r.data),
};

// Unified apiService export for components using generic API calls
export const apiService = {
  auth: authService,
  companies: companyService,
  departments: departmentService,
  teams: teamService,
  users: userService,
  projects: projectService,
  status: statusService,
  reports: reportService,
  notifications: notificationService,
  audit: auditService,
  search: searchService,
  // Direct API methods
  get: api.get.bind(api),
  post: api.post.bind(api),
  put: api.put.bind(api),
  patch: api.patch.bind(api),
  delete: api.delete.bind(api),
};
