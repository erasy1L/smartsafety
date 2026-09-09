export type UserRole = 'cadet' | 'tc_admin' | 'company_admin' | 'super_admin';

export interface TrainingCenter {
  id: number;
  name: string;
  bin: string;
  city: string;
  contact_phone: string;
  contact_email: string;
  created_at: string;
}

export interface Enterprise {
  id: number;
  name: string;
  tc_id: number;
  industry: string;
  created_at: string;
}

export interface Group {
  id: number;
  name: string;
  group_code: string;
  login: string;
  password?: string;
  tc_id: number;
  enterprise_id?: number;
  active: number;
  created_at: string;
  tc_name?: string;
  enterprise_name?: string;
  course_ids?: number[];
}

export interface CourseSlide {
  id: number;
  title: string;
  subtitle?: string;
  content: string[];
  law_reference?: string;
  warning?: string;
  icon?: string;
}

export interface Course {
  id: number;
  title: string;
  category: string;
  code: string;
  description: string;
  duration_hours: number;
  slides_json: string; // JSON Array of CourseSlide
  text_content: string;
  video_url: string;
  owner_tc_id?: number | null;
  owner_tc_name?: string | null;
  created_at: string;
  question_count?: number;
}

export interface Question {
  id: number;
  course_id: number;
  text: string;
  options: string[]; // JSON array in DB
  correct_option_index: number; // Stored server-side only!
  explanation?: string;
}

// Question object returned to cadets (without the answer!)
export interface CadetQuestion {
  id: number;
  course_id: number;
  text: string;
  options: string[];
}

export interface TestResult {
  id: number;
  protocol_id: string;
  cadet_fio: string;
  group_id: number;
  course_id: number;
  tc_id: number;
  score: number;
  max_score: number;
  percentage: number;
  passed: number; // 1 or 0
  cheat_flags: number;
  completed_at: string;
  group_name?: string;
  course_title?: string;
  tc_name?: string;
}

export interface AuthSession {
  token: string;
  role: UserRole;
  user_id?: number;
  login: string;
  full_name: string;
  tc_id?: number;
  tc_name?: string;
  group_id?: number;
  group_name?: string;
  enterprise_id?: number;
  enterprise_name?: string;
  cadet_fio?: string; // Captured after first step
}
