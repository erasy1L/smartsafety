export type UserRole = 'cadet' | 'tc_admin' | 'company_admin' | 'super_admin';

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
  enterprise_id?: number;
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
  owner_tc_id?: number | null;
  owner_tc_name?: string | null;
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
  enterprise_id?: number;
  enterprise_name?: string;
  active: number;
  created_at: string;
  course_ids?: number[];
  tests_completed_count?: number;
}

export interface BillingTariff {
  period: 'monthly' | 'annual';
  title: string;
  duration: string;
  amount: number;
  vat: number;
  note: string;
}

export interface BillingSubscription {
  tc_id: number;
  tc_name: string;
  tc_bin: string;
  tc_city: string;
  tc_email?: string;
  tc_phone?: string;
  contract_number: string;
  plan: 'monthly' | 'annual';
  plan_label: string;
  valid_from: string;
  valid_until: string;
  valid_from_label: string;
  valid_until_label: string;
  days_remaining: number;
  status: 'active' | 'expiring' | 'expired';
  status_label: string;
  auto_renew: boolean;
  monthly_amount: number;
  annual_amount: number;
  current_amount: number;
  current_vat: number;
}

export interface BillingDocument {
  id: number;
  tc_id: number;
  doc_number: string;
  kind: string;
  period: string;
  amount: number;
  vat_amount: number;
  period_from: string;
  period_to: string;
  issued_at: string;
  due_at: string;
  paid_at?: string | null;
  status: string;
  description: string;
  period_label: string;
  status_label: string;
  issued_at_label: string;
  due_at_label: string;
  paid_at_label?: string | null;
  period_from_label: string;
  period_to_label: string;
}

export interface BillingProvider {
  legal_name: string;
  bin: string;
  address: string;
  bank: string;
  bik: string;
  iik: string;
  kbe: string;
  knp: string;
  phone: string;
  email: string;
}

export interface BillingPayload {
  provider: BillingProvider;
  tariffs: {
    monthly: BillingTariff;
    annual: BillingTariff;
  };
  subscription: BillingSubscription;
  documents: BillingDocument[];
  message?: string;
}

export interface BillingOverviewItem {
  tc_id: number;
  tc_name: string;
  tc_bin: string;
  tc_city: string;
  contract_number: string;
  plan: string;
  plan_label: string;
  valid_until: string;
  valid_until_label: string;
  days_remaining: number;
  status: string;
  status_label: string;
  auto_renew: boolean;
  current_amount: number;
}

export interface SuperAdminUser {
  id: number;
  login: string;
  full_name: string;
  created_at: string;
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
  subscription_plan?: string | null;
  subscription_valid_until?: string | null;
  subscription_auto_renew?: number | null;
  contract_number?: string | null;
  plan_label?: string | null;
  valid_until_label?: string | null;
  subscription_status_label?: string | null;
  days_remaining?: number | null;
  active?: number;
}
