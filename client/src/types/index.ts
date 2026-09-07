export type UserRole = 'cadet' | 'tc_admin' | 'super_admin';

export interface UserSession {
  token: string;
  role: UserRole;
  login: string;
  full_name: string;
  tc_id?: number;
  tc_name?: string;
  group_id?: number;
  group_name?: string;
  group_code?: string;
  enterprise_name?: string;
  cadet_fio?: string | null;
}

export interface CourseSlide {
  id: number;
  title: string;
  subtitle?: string;
  content: string[];
  law_reference?: string;
  warning?: string;
}

export interface Course {
  id: number;
  title: string;
  category: string;
  code: string;
  description: string;
  duration_hours: number;
  slides?: CourseSlide[];
  text_content?: string;
  video_url?: string;
  question_count?: number;
}

export interface Question {
  id: number;
  course_id: number;
  text: string;
  options: string[];
  correct_option_index?: number; // Only present for super_admin
  explanation?: string;
}

export interface TestSubmissionResult {
  protocol_id: string;
  cadet_fio: string;
  course_title: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  cheat_flags: number;
  completed_at: string;
  remark?: string | null;
  aborted?: boolean;
  review?: {
    question_id: number;
    text: string;
    options: string[];
    selected_option?: number;
    correct_option: number;
    is_correct: boolean;
    explanation?: string;
  }[];
}

export interface ReportResult {
  id: number;
  protocol_id: string;
  cadet_fio: string;
  group_id: number;
  course_id: number;
  tc_id: number;
  score: number;
  max_score: number;
  percentage: number;
  passed: number;
  cheat_flags: number;
  completed_at: string;
  remark?: string | null;
  group_name: string;
  group_code: string;
  course_title: string;
  tc_name: string;
  enterprise_name?: string;
}

export interface ReportResultsStats {
  total: number;
  passedCount: number;
  uniqueEnterprises: number;
  uniqueCount: number;
  repeatCount: number;
  uniquePassed: number;
  repeatPassed: number;
}

export interface ReportResultsPage {
  items: ReportResult[];
  total: number;
  page: number;
  pageSize: number;
  stats: ReportResultsStats;
}

export interface GroupItem {
  id: number;
  name: string;
  group_code: string;
  login: string;
  password?: string;
  tc_id: number;
  tc_name?: string;
  enterprise_name?: string;
  active: number;
  created_at: string;
  course_ids?: number[];
  tests_completed_count?: number;
}

export interface TrainingCenterItem {
  id: number;
  name: string;
  bin: string;
  city: string;
  contact_phone: string;
  contact_email: string;
  groups_count?: number;
  certified_count?: number;
}
