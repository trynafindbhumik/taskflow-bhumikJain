export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  project_id: string;
  assignee_id?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ProjectMember {
  user_id: string;
  project_id: string;
  user: User;
  role: 'owner' | 'member';
  joined_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: 'task_assigned' | 'task_updated' | 'project_invite' | 'deadline';
  created_at: string;
  link?: string;
}

export interface SearchResult {
  projects: Project[];
  tasks: (Task & { project_name: string })[];
}

export interface DeadlineTask extends Task {
  project_name: string;
  assignee?: User;
}

export interface DeadlineResponse {
  tasks: DeadlineTask[];
  total: number;
  has_more: boolean;
}
