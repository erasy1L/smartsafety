import { UserSession, Course, Question, TestSubmissionResult, ReportResult, ReportResultsPage, GroupItem, TrainingCenterItem, BillingPayload, BillingOverviewItem, SuperAdminUser } from '../types';

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

  async updateCourse(id: number, courseData: any): Promise<any> {
    const res = await fetchWithAuth(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData)
    });
    return res.json();
  },

  async assignCourseGroups(courseId: number, groupIds: number[]): Promise<any> {
    const res = await fetchWithAuth(`/courses/${courseId}/groups`, {
      method: 'PUT',
      body: JSON.stringify({ group_ids: groupIds })
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

  async startTest(courseId: number, options?: { forceNew?: boolean }): Promise<{
    status: 'started' | 'voided';
    questions?: Question[];
    result?: TestSubmissionResult;
  }> {
    const res = await fetchWithAuth('/tests/start', {
      method: 'POST',
      body: JSON.stringify({
        course_id: courseId,
        force_new: Boolean(options?.forceNew)
      })
    });
    return res.json();
  },

  async abandonTest(courseId: number): Promise<{ status: string; result?: TestSubmissionResult }> {
    const res = await fetchWithAuth('/tests/abandon', {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId })
    });
    return res.json();
  },

  abandonTestBeacon(courseId: number) {
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE}/tests/abandon`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ course_id: courseId }),
      keepalive: true
    }).catch(() => {});
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
    enterpriseId?: number;
    courseId?: number;
    dateFrom?: string;
    dateTo?: string;
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
    if (options.enterpriseId) params.set('enterprise_id', String(options.enterpriseId));
    if (options.courseId) params.set('course_id', String(options.courseId));
    if (options.dateFrom) params.set('date_from', options.dateFrom);
    if (options.dateTo) params.set('date_to', options.dateTo);
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

  async downloadExcel(filters: {
    groupId?: number;
    enterpriseId?: number;
    courseId?: number;
    dateFrom?: string;
    dateTo?: string;
    searchFio?: string;
    passed?: string;
    scoreFrom?: number;
    scoreTo?: number;
  } = {}): Promise<void> {

    const token = getToken();
    const params = new URLSearchParams();
    if (filters.groupId) params.set('group_id', String(filters.groupId));
    if (filters.enterpriseId) params.set('enterprise_id', String(filters.enterpriseId));
    if (filters.courseId) params.set('course_id', String(filters.courseId));
    if (filters.dateFrom) params.set('date_from', filters.dateFrom);
    if (filters.dateTo) params.set('date_to', filters.dateTo);
    if (filters.searchFio) params.set('search_fio', filters.searchFio);
    if (filters.passed !== undefined && filters.passed !== '') params.set('passed', filters.passed);
    if (filters.scoreFrom !== undefined) params.set('score_from', String(filters.scoreFrom));
    if (filters.scoreTo !== undefined) params.set('score_to', String(filters.scoreTo));
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
    const period =
      filters.dateFrom || filters.dateTo
        ? `${filters.dateFrom || 'start'}_${filters.dateTo || 'end'}`
        : new Date().toISOString().slice(0, 10);
    a.download = `Vedomost_SmartSafety_${period}.xlsx`;
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

  async setTrainingCenterActive(id: number, active: boolean): Promise<any> {
    const res = await fetchWithAuth(`/admin/training-centers/${id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ active })
    });
    return res.json();
  },

  async getSuperAdmins(): Promise<SuperAdminUser[]> {
    const res = await fetchWithAuth('/admin/super-admins');
    return res.json();
  },

  async createSuperAdmin(data: { login: string; password: string; full_name: string }): Promise<any> {
    const res = await fetchWithAuth('/admin/super-admins', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteSuperAdmin(id: number): Promise<any> {
    const res = await fetchWithAuth(`/admin/super-admins/${id}`, {
      method: 'DELETE'
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

  async getManagedGroups(): Promise<GroupItem[]> {
    const res = await fetchWithAuth('/groups');
    return res.json();
  },

  async getManagedEnterprises(): Promise<{ id: number; name: string; industry: string }[]> {
    const res = await fetchWithAuth('/groups/enterprises');
    return res.json();
  },

  async createManagedGroup(data: any): Promise<any> {
    const res = await fetchWithAuth('/groups', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateManagedGroupCourses(groupId: number, courseIds: number[]): Promise<any> {
    const res = await fetchWithAuth(`/groups/${groupId}/courses`, {
      method: 'PUT',
      body: JSON.stringify({ course_ids: courseIds })
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

  async getBilling(tcId?: number): Promise<BillingPayload & { overview?: BillingOverviewItem[] }> {
    const query = tcId ? `?tc_id=${tcId}` : '';
    const res = await fetchWithAuth(`/billing${query}`);
    return res.json();
  },

  async previewBillingExtension(period: 'monthly' | 'annual', tcId?: number): Promise<{
    period: string;
    period_from: string;
    period_to: string;
    amount: number;
    vat: number;
    period_from_label: string;
    period_to_label: string;
  }> {
    const params = new URLSearchParams({ period });
    if (tcId) params.set('tc_id', String(tcId));
    const res = await fetchWithAuth(`/billing/preview?${params.toString()}`);
    return res.json();
  },

  async extendBilling(period: 'monthly' | 'annual', tcId?: number): Promise<BillingPayload> {
    const res = await fetchWithAuth('/billing/extend', {
      method: 'POST',
      body: JSON.stringify({ period, tc_id: tcId })
    });
    return res.json();
  },

  async setBillingAutoRenew(enabled: boolean, tcId?: number): Promise<BillingPayload> {
    const res = await fetchWithAuth('/billing/auto-renew', {
      method: 'PATCH',
      body: JSON.stringify({ enabled, tc_id: tcId })
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
