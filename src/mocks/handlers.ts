import { http, HttpResponse } from 'msw';

import type {
  Task,
  Project,
  User,
  ProjectMember,
  Notification,
  SearchResult,
  DeadlineTask,
  DeadlineResponse,
} from '@/utils/types';

const mockUsers: User[] = [
  { id: 'u1', name: 'John Doe', email: 'test@example.com', created_at: '2024-01-01T00:00:00Z' },
  { id: 'u2', name: 'Jane Smith', email: 'jane@example.com', created_at: '2024-01-02T00:00:00Z' },
  { id: 'u3', name: 'Alex Kumar', email: 'alex@example.com', created_at: '2024-01-03T00:00:00Z' },
];

// Store user credentials for authentication (email -> password)
const userCredentials: Map<string, string> = new Map([
  ['test@example.com', 'password123'],
  ['jane@example.com', 'password123'],
  ['alex@example.com', 'password123'],
]);

const mockProjects: Project[] = [
  {
    id: 'p1',
    name: 'Website Redesign',
    description: 'Overhaul the corporate website with a modern look and feel.',
    owner_id: 'u1',
    created_at: '2024-03-01T10:00:00Z',
  },
  {
    id: 'p2',
    name: 'Mobile App',
    description: 'Develop a cross-platform mobile application for iOS and Android.',
    owner_id: 'u1',
    created_at: '2024-03-05T12:00:00Z',
  },
  {
    id: 'p3',
    name: 'Marketing Campaign',
    description: 'Q2 marketing strategy and execution plan.',
    owner_id: 'u2',
    created_at: '2024-03-10T09:00:00Z',
  },
];

const mockMembers: ProjectMember[] = [
  {
    user_id: 'u1',
    project_id: 'p1',
    user: mockUsers[0],
    role: 'owner',
    joined_at: '2024-03-01T10:00:00Z',
  },
  {
    user_id: 'u2',
    project_id: 'p1',
    user: mockUsers[1],
    role: 'member',
    joined_at: '2024-03-02T10:00:00Z',
  },
  {
    user_id: 'u1',
    project_id: 'p2',
    user: mockUsers[0],
    role: 'owner',
    joined_at: '2024-03-05T12:00:00Z',
  },
  {
    user_id: 'u3',
    project_id: 'p2',
    user: mockUsers[2],
    role: 'member',
    joined_at: '2024-03-06T12:00:00Z',
  },
  {
    user_id: 'u2',
    project_id: 'p3',
    user: mockUsers[1],
    role: 'owner',
    joined_at: '2024-03-10T09:00:00Z',
  },
  {
    user_id: 'u1',
    project_id: 'p3',
    user: mockUsers[0],
    role: 'member',
    joined_at: '2024-03-11T09:00:00Z',
  },
];

const mockTasks: Task[] = [
  {
    id: 't1',
    title: 'Design Homepage',
    description: 'Create wireframes and final designs for the new homepage.',
    status: 'done',
    priority: 'high',
    project_id: 'p1',
    assignee_id: 'u1',
    due_date: '2024-04-15',
    created_at: '2024-03-02T10:00:00Z',
    updated_at: '2024-03-15T10:00:00Z',
  },
  {
    id: 't2',
    title: 'Implement Navigation',
    description: 'Build the responsive navigation component with dropdown menus.',
    status: 'in_progress',
    priority: 'medium',
    project_id: 'p1',
    assignee_id: 'u2',
    due_date: '2024-04-20',
    created_at: '2024-03-03T10:00:00Z',
    updated_at: '2024-03-16T10:00:00Z',
  },
  {
    id: 't3',
    title: 'SEO Optimization',
    description: 'Optimize meta tags, page structure and sitemap for search engines.',
    status: 'todo',
    priority: 'low',
    project_id: 'p1',
    assignee_id: 'u1',
    due_date: '2024-04-25',
    created_at: '2024-03-04T10:00:00Z',
    updated_at: '2024-03-04T10:00:00Z',
  },
  {
    id: 't4',
    title: 'Write Unit Tests',
    description: 'Cover all critical components and utility functions.',
    status: 'todo',
    priority: 'medium',
    project_id: 'p1',
    assignee_id: 'u2',
    due_date: '2024-04-28',
    created_at: '2024-03-05T10:00:00Z',
    updated_at: '2024-03-05T10:00:00Z',
  },
  {
    id: 't5',
    title: 'Setup React Native',
    description: 'Initialize the project with required dependencies and navigation.',
    status: 'done',
    priority: 'high',
    project_id: 'p2',
    assignee_id: 'u3',
    due_date: '2024-04-10',
    created_at: '2024-03-06T10:00:00Z',
    updated_at: '2024-03-20T10:00:00Z',
  },
  {
    id: 't6',
    title: 'API Integration',
    description: 'Connect the mobile app to all backend API endpoints.',
    status: 'in_progress',
    priority: 'high',
    project_id: 'p2',
    assignee_id: 'u1',
    due_date: '2024-04-18',
    created_at: '2024-03-07T10:00:00Z',
    updated_at: '2024-03-21T10:00:00Z',
  },
  {
    id: 't7',
    title: 'Write Campaign Brief',
    description: 'Document campaign objectives, target audience, and KPIs.',
    status: 'todo',
    priority: 'medium',
    project_id: 'p3',
    assignee_id: 'u2',
    due_date: '2024-04-12',
    created_at: '2024-03-11T10:00:00Z',
    updated_at: '2024-03-11T10:00:00Z',
  },
  {
    id: 't8',
    title: 'Social Media Assets',
    description: 'Design all required assets for Instagram, X, and LinkedIn.',
    status: 'in_progress',
    priority: 'low',
    project_id: 'p3',
    assignee_id: 'u1',
    due_date: '2024-04-22',
    created_at: '2024-03-12T10:00:00Z',
    updated_at: '2024-03-18T10:00:00Z',
  },
];

const mockNotifications: Notification[] = [
  {
    id: 'n1',
    title: 'Task assigned to you',
    message: 'Jane Smith assigned "Implement Navigation" to you.',
    read: false,
    type: 'task_assigned',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    link: '/projects/p1',
  },
  {
    id: 'n2',
    title: 'Deadline approaching',
    message: '"API Integration" is due in 2 days.',
    read: false,
    type: 'deadline',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    link: '/projects/p2',
  },
  {
    id: 'n3',
    title: 'Project invite',
    message: 'You were added to "Marketing Campaign".',
    read: true,
    type: 'project_invite',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    link: '/projects/p3',
  },
];

function uuid(): string {
  return Math.random().toString(36).slice(2, 11);
}

function now(): string {
  return new Date().toISOString();
}

function getAuthUser(request: Request): User | null {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;

  // Extract userId from token format "Bearer mock-jwt-{userId}"
  const token = auth.slice(7);
  const match = token.match(/^mock-jwt-(.+)$/);
  if (!match) return null;

  const userId = match[1];
  return mockUsers.find((u) => u.id === userId) ?? null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const handlers = [
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string };

    const user = mockUsers.find((u) => u.email === email);
    if (!user) {
      return new HttpResponse(JSON.stringify({ message: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate password
    const storedPassword = userCredentials.get(email);
    if (storedPassword !== password) {
      return new HttpResponse(JSON.stringify({ message: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return HttpResponse.json({ token: `mock-jwt-${user.id}`, user });
  }),

  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const { email, name, password } = (await request.json()) as {
      email: string;
      name: string;
      password: string;
    };
    if (mockUsers.find((u) => u.email === email)) {
      return new HttpResponse(JSON.stringify({ message: 'Email already in use' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const newUser: User = { id: uuid(), email, name, created_at: now() };
    mockUsers.push(newUser);
    // Store the user's password
    userCredentials.set(email, password);
    return HttpResponse.json({ token: `mock-jwt-${newUser.id}`, user: newUser }, { status: 201 });
  }),

  http.patch(`${API_BASE}/auth/profile`, async ({ request }) => {
    const user = getAuthUser(request);
    if (!user) return new HttpResponse(JSON.stringify({ error: 'unauthorized' }), { status: 401 });

    const data = (await request.json()) as {
      name?: string;
      current_password?: string;
      new_password?: string;
    };

    if (data.current_password && data.current_password !== 'password123') {
      return new HttpResponse(JSON.stringify({ message: 'Current password is incorrect' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const idx = mockUsers.findIndex((u) => u.id === user.id);
    if (idx !== -1 && data.name) {
      mockUsers[idx] = { ...mockUsers[idx], name: data.name };
    }

    return HttpResponse.json(mockUsers[idx] ?? user);
  }),

  http.get(`${API_BASE}/stats`, ({ request }) => {
    const user = getAuthUser(request);
    if (!user) return new HttpResponse(JSON.stringify({ error: 'unauthorized' }), { status: 401 });

    const userTasks = mockTasks.filter((t) => {
      const member = mockMembers.find(
        (m) => m.user_id === user.id && m.project_id === t.project_id
      );
      return !!member;
    });

    return HttpResponse.json({
      total: userTasks.length,
      done: userTasks.filter((t) => t.status === 'done').length,
      in_progress: userTasks.filter((t) => t.status === 'in_progress').length,
      high_priority: userTasks.filter((t) => t.priority === 'high' && t.status !== 'done').length,
    });
  }),

  http.get(`${API_BASE}/projects`, ({ request }) => {
    const user = getAuthUser(request);
    if (!user) return new HttpResponse(JSON.stringify({ error: 'unauthorized' }), { status: 401 });

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') ?? '1', 10);
    const limit = parseInt(url.searchParams.get('limit') ?? '9', 10);
    const offset = (page - 1) * limit;

    // Filter projects to only those where the user is a member
    const userProjectIds = mockMembers
      .filter((m) => m.user_id === user.id)
      .map((m) => m.project_id);

    const userProjects = mockProjects.filter((p) => userProjectIds.includes(p.id));

    const total = userProjects.length;
    const projects = userProjects.slice(offset, offset + limit);

    return HttpResponse.json({ projects, total, page, limit, has_more: offset + limit < total });
  }),

  http.post(`${API_BASE}/projects`, async ({ request }) => {
    const user = getAuthUser(request);
    if (!user) return new HttpResponse(JSON.stringify({ error: 'unauthorized' }), { status: 401 });

    const data = (await request.json()) as { name: string; description?: string };
    const project: Project = {
      id: `p${uuid()}`,
      name: data.name,
      description: data.description,
      owner_id: user.id,
      created_at: now(),
    };
    mockProjects.push(project);
    mockMembers.push({
      user_id: user.id,
      project_id: project.id,
      user,
      role: 'owner',
      joined_at: now(),
    });
    return HttpResponse.json(project, { status: 201 });
  }),

  http.get(`${API_BASE}/projects/:id`, ({ request, params }) => {
    const user = getAuthUser(request);
    if (!user) return new HttpResponse(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    const project = mockProjects.find((p) => p.id === params.id);
    if (!project) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(project);
  }),

  http.patch(`${API_BASE}/projects/:id`, async ({ request, params }) => {
    const user = getAuthUser(request);
    if (!user) return new HttpResponse(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    const data = (await request.json()) as Partial<Project>;
    const idx = mockProjects.findIndex((p) => p.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    mockProjects[idx] = { ...mockProjects[idx], ...data };
    return HttpResponse.json(mockProjects[idx]);
  }),

  http.delete(`${API_BASE}/projects/:id`, ({ request, params }) => {
    const user = getAuthUser(request);
    if (!user) return new HttpResponse(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    const idx = mockProjects.findIndex((p) => p.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    mockProjects.splice(idx, 1);
    // Cascade delete tasks and members.
    mockTasks
      .map((t, i) => (t.project_id === params.id ? i : -1))
      .filter((i) => i >= 0)
      .reverse()
      .forEach((i) => mockTasks.splice(i, 1));
    mockMembers
      .map((m, i) => (m.project_id === params.id ? i : -1))
      .filter((i) => i >= 0)
      .reverse()
      .forEach((i) => mockMembers.splice(i, 1));
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_BASE}/projects/:id/members`, ({ request, params }) => {
    const user = getAuthUser(request);
    if (!user) return new HttpResponse(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    return HttpResponse.json(mockMembers.filter((m) => m.project_id === params.id));
  }),

  http.post(`${API_BASE}/projects/:id/members`, async ({ request, params }) => {
    const user = getAuthUser(request);
    if (!user) return new HttpResponse(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    const { user_id } = (await request.json()) as { user_id: string };
    const targetUser = mockUsers.find((u) => u.id === user_id);
    if (!targetUser)
      return new HttpResponse(JSON.stringify({ error: 'User not found' }), { status: 404 });
    if (mockMembers.find((m) => m.project_id === params.id && m.user_id === user_id)) {
      return new HttpResponse(JSON.stringify({ error: 'Already a member' }), { status: 409 });
    }
    const member: ProjectMember = {
      user_id,
      project_id: params.id as string,
      user: targetUser,
      role: 'member',
      joined_at: now(),
    };
    mockMembers.push(member);
    return HttpResponse.json(member, { status: 201 });
  }),

  http.delete(`${API_BASE}/projects/:id/members/:userId`, ({ request, params }) => {
    const user = getAuthUser(request);
    if (!user) return new HttpResponse(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    const member = mockMembers.find(
      (m) => m.project_id === params.id && m.user_id === params.userId
    );
    if (member?.role === 'owner') {
      return new HttpResponse(JSON.stringify({ error: 'Cannot remove the project owner' }), {
        status: 403,
      });
    }
    const idx = mockMembers.findIndex(
      (m) => m.project_id === params.id && m.user_id === params.userId
    );
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    mockMembers.splice(idx, 1);

    // Unassign all tasks in this project that were assigned to the removed member
    mockTasks.forEach((t) => {
      if (t.project_id === params.id && t.assignee_id === params.userId) {
        t.assignee_id = undefined;
        t.updated_at = now();
      }
    });

    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_BASE}/projects/:id/tasks`, ({ request, params }) => {
    const user = getAuthUser(request);
    if (!user) return new HttpResponse(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status');
    let tasks = mockTasks.filter((t) => t.project_id === params.id);
    if (statusFilter) tasks = tasks.filter((t) => t.status === statusFilter);
    return HttpResponse.json(tasks);
  }),

  http.post(`${API_BASE}/projects/:id/tasks`, async ({ request, params }) => {
    const user = getAuthUser(request);
    if (!user) return new HttpResponse(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    const data = (await request.json()) as Omit<
      Task,
      'id' | 'project_id' | 'created_at' | 'updated_at'
    >;
    const task: Task = {
      id: `t${uuid()}`,
      project_id: params.id as string,
      created_at: now(),
      updated_at: now(),
      ...data,
      // Normalize empty string assignee_id to undefined
      assignee_id: data.assignee_id || undefined,
    };
    mockTasks.push(task);
    return HttpResponse.json(task, { status: 201 });
  }),

  http.patch(`${API_BASE}/tasks/:id`, async ({ request, params }) => {
    const user = getAuthUser(request);
    if (!user) return new HttpResponse(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    const data = (await request.json()) as Partial<Task>;
    const idx = mockTasks.findIndex((t) => t.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    // Normalize empty string assignee_id to undefined
    if ('assignee_id' in data && !data.assignee_id) {
      data.assignee_id = undefined;
    }
    mockTasks[idx] = { ...mockTasks[idx], ...data, updated_at: now() };
    return HttpResponse.json(mockTasks[idx]);
  }),

  http.delete(`${API_BASE}/tasks/:id`, ({ request, params }) => {
    const user = getAuthUser(request);
    if (!user) return new HttpResponse(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    const idx = mockTasks.findIndex((t) => t.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    mockTasks.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_BASE}/deadlines`, ({ request }) => {
    const user = getAuthUser(request);
    if (!user) return new HttpResponse(JSON.stringify({ error: 'unauthorized' }), { status: 401 });

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') ?? '5', 10);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

    const upcoming = mockTasks
      .filter((t): t is Task & { due_date: string } => !!t.due_date && t.status !== 'done')
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

    const total = upcoming.length;
    const slice = upcoming.slice(offset, offset + limit);

    const tasks: DeadlineTask[] = slice.map((t) => ({
      ...t,
      project_name: mockProjects.find((p) => p.id === t.project_id)?.name ?? 'Unknown',
      assignee: t.assignee_id ? mockUsers.find((u) => u.id === t.assignee_id) : undefined,
    }));

    return HttpResponse.json({
      tasks,
      total,
      has_more: offset + limit < total,
    } satisfies DeadlineResponse);
  }),

  http.get(`${API_BASE}/users`, ({ request }) => {
    const user = getAuthUser(request);
    if (!user) return new HttpResponse(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    return HttpResponse.json(mockUsers);
  }),

  http.get(`${API_BASE}/search`, ({ request }) => {
    const user = getAuthUser(request);
    if (!user) return new HttpResponse(JSON.stringify({ error: 'unauthorized' }), { status: 401 });

    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').toLowerCase().trim();
    if (!q) return HttpResponse.json({ projects: [], tasks: [] } satisfies SearchResult);

    const projects = mockProjects.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)
    );
    const tasks = mockTasks
      .filter(
        (t) => t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q)
      )
      .map((t) => ({
        ...t,
        project_name: mockProjects.find((p) => p.id === t.project_id)?.name ?? 'Unknown',
      }));

    return HttpResponse.json({ projects, tasks } satisfies SearchResult);
  }),

  http.get(`${API_BASE}/notifications`, ({ request }) => {
    const user = getAuthUser(request);
    if (!user) return new HttpResponse(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    return HttpResponse.json(mockNotifications);
  }),

  http.patch(`${API_BASE}/notifications/:id/read`, ({ params }) => {
    const notif = mockNotifications.find((n) => n.id === params.id);
    if (notif) notif.read = true;
    return HttpResponse.json(notif ?? null);
  }),

  http.post(`${API_BASE}/notifications/read-all`, () => {
    mockNotifications.forEach((n) => (n.read = true));
    return HttpResponse.json({ ok: true });
  }),
];
