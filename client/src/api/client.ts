import { UserSession, Course, Question, TestSubmissionResult, ReportResult, ReportResultsPage, GroupItem, TrainingCenterItem } from '../types';

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('smartsafety_token');
}

export function saveSession(session: UserSession) {
  localStorage.setItem('smartsafety_token', session.token);
  localStorage.setItem('smartsafety_user', JSON.stringify(session));
}

export function getSavedSession(): UserSession | null {
  const userJson = localStorage.getItem('smartsafety_user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem('smartsafety_token');
  localStorage.removeItem('smartsafety_user');
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = `Ошибка сервера (${response.status})`;
    try {
      const errData = await response.json();
      if (errData.error) errorMsg = errData.error;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return response;
}

export const api = {
  // Auth
  async login(login: string, password: string): Promise<UserSession> {
    const res = await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password })
    });
    const data = await res.json();
    saveSession(data);
    return data;
  },

  async setCadetFio(fio: string): Promise<string> {
    const res = await fetchWithAuth('/auth/cadet/fio', {
      method: 'POST',
      body: JSON.stringify({ fio })
    });
    const data = await res.json();
    const current = getSavedSession();
    if (current) {
      current.cadet_fio = data.cadet_fio;
      saveSession(current);
    }
    return data.cadet_fio;
  },

  async checkAuth(): Promise<UserSession | null> {
    const token = getToken();
    if (!token) return null;
    try {
      const res = await fetchWithAuth('/auth/me');
      const data = await res.json();
      const current = getSavedSession();
      const merged = { ...current, ...data, token };
      saveSession(merged);
      return merged;
    } catch {
      clearSession();
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await fetchWithAuth('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      clearSession();
    }
  },

  async getDemoCredentials(): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/demo-credentials`);
    return res.json();
  },

  // Courses
  async getCourses(): Promise<Course[]> {
    const res = await fetchWithAuth('/courses');
    return res.json();
  },

  async getCourseById(id: number): Promise<Course> {
    const res = await fetchWithAuth(`/courses/${id}`);
    return res.json();
  },

  async createCourse(courseData: any): Promise<any> {
    const res = await fetchWithAuth('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData)
    });
    return res.json();
  },

  async deleteCourse(id: number): Promise<any> {
    const res = await fetchWithAuth(`/courses/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Tests
  async getQuestions(courseId: number): Promise<Question[]> {
    const res = await fetchWithAuth(`/tests/for-course/${courseId}`);
    return res.json();
  },

  async submitTest(courseId: number, answers: Record<number, number>, cheatFlags: number): Promise<TestSubmissionResult> {
    const res = await fetchWithAuth('/tests/submit', {
      method: 'POST',
      body: JSON.stringify({
        course_id: courseId,
        answers,
        cheat_flags: cheatFlags
      })
    });
    return res.json();
  },

  async addQuestion(questionData: any): Promise<any> {
    const res = await fetchWithAuth('/tests/questions', {
      method: 'POST',
      body: JSON.stringify(questionData)
    });
    return res.json();
  },

  async deleteQuestion(id: number): Promise<any> {
    const res = await fetchWithAuth(`/tests/questions/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Reports & Analytics (for TC Admin & Super Admin)
  async getReportGroups(): Promise<GroupItem[]> {
    const res = await fetchWithAuth('/reports/groups');
    return res.json();
  },

  async getReportResults(options: {
    groupId?: number;
    searchFio?: string;
    passed?: string;
    scoreFrom?: number;
    scoreTo?: number;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  } = {}): Promise<ReportResultsPage> {
    const params = new URLSearchParams();
    if (options.groupId) params.set('group_id', String(options.groupId));
    if (options.searchFio) params.set('search_fio', options.searchFio);
    if (options.passed !== undefined && options.passed !== '') params.set('passed', options.passed);
    if (options.scoreFrom !== undefined) params.set('score_from', String(options.scoreFrom));
    if (options.scoreTo !== undefined) params.set('score_to', String(options.scoreTo));
    if (options.page) params.set('page', String(options.page));
    if (options.pageSize) params.set('page_size', String(options.pageSize));
    if (options.sortBy) params.set('sort_by', options.sortBy);
    if (options.sortDir) params.set('sort_dir', options.sortDir);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchWithAuth(`/reports/results${query}`);
    return res.json();
  },

  async getResultDetails(id: number): Promise<any> {
    const res = await fetchWithAuth(`/reports/results/${id}/details`);
    return res.json();
  },

  async downloadExcel(groupId?: number): Promise<void> {

    const token = getToken();
    const params = new URLSearchParams();
    if (groupId) params.set('group_id', String(groupId));
    const query = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`${API_BASE}/reports/export-excel${query}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('Не удалось выгрузить Excel отчет');

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Vedomost_SmartSafety_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  },

  // Admin CMS
  async getAdminStats(): Promise<any> {
    const res = await fetchWithAuth('/admin/stats');
    return res.json();
  },

  async getAdminTrainingCenters(): Promise<TrainingCenterItem[]> {
    const res = await fetchWithAuth('/admin/training-centers');
    return res.json();
  },

  async createTrainingCenter(data: any): Promise<any> {
    const res = await fetchWithAuth('/admin/training-centers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getAdminGroups(): Promise<GroupItem[]> {
    const res = await fetchWithAuth('/admin/groups');
    return res.json();
  },

  async createGroup(data: any): Promise<any> {
    const res = await fetchWithAuth('/admin/groups', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateGroupCourses(groupId: number, courseIds: number[]): Promise<any> {
    const res = await fetchWithAuth(`/admin/groups/${groupId}/courses`, {
      method: 'PUT',
      body: JSON.stringify({ course_ids: courseIds })
    });
    return res.json();
  },

  // Public Leads
  async sendDemoRequest(data: { name: string; tcName: string; phone: string; email: string; message?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/contact/demo-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
