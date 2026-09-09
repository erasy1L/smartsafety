import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldAlert,
  BookOpen,
  Building2,
  Users,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Layers,
  HelpCircle,
  Copy,
  Check,
  BarChart3,
  Video,
  FileText,
} from "lucide-react";
import { api } from "../api/client";
import { m } from "../paraglide/messages.js";
import { BillingSection } from "../components/BillingSection";
import {
  BillingOverviewItem,
  Course,
  GroupItem,
  Question,
  SuperAdminUser,
  TrainingCenterItem,
  UserSession,
} from "../types";

interface SuperAdminPortalProps {
  user: UserSession;
  onNavigate: (path: string) => void;
}

function CmsCourseCard({
  course,
  ownerLabel,
  onOpenQuestions,
  onDelete,
}: {
  course: Course;
  ownerLabel?: string;
  onOpenQuestions: (course: Course) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
            {course.category}
          </span>
          <span className="text-xs text-slate-400 font-mono">{course.code}</span>
        </div>

        <h3 className="font-bold text-sm text-slate-900 leading-snug">
          {course.title}
        </h3>

        {ownerLabel ? (
          <p className="text-xs text-slate-500">{ownerLabel}</p>
        ) : null}

        <p className="text-xs text-slate-600 line-clamp-2">{course.description}</p>

        <div className="pt-2 text-xs text-slate-500 flex items-center space-x-3">
          <span>{course.duration_hours} {m.common_hours_short()}</span>
          <span>•</span>
          <span className="font-semibold text-blue-700">
            {m.cms_questions_bank({ count: course.question_count || 0 })}
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onOpenQuestions(course)}
          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-sm font-medium flex items-center space-x-1.5 transition"
        >
          <HelpCircle className="w-3.5 h-3.5 text-white" />
          <span>{m.cms_questions_bank({ count: course.question_count || 0 })}</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(course.id)}
          title={m.cms_delete_course()}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<
    "courses" | "tcs" | "groups" | "billing" | "admins"
  >("courses");
  const [courses, setCourses] = useState<Course[]>([]);
  const [tcs, setTcs] = useState<TrainingCenterItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected course for question management
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseQuestions, setCourseQuestions] = useState<Question[]>([]);

  // New course modal state
  const [newCourseOpen, setNewCourseOpen] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: "",
    category: "Охрана труда",
    code: "",
    description: "",
    duration_hours: 40,
    video_url: "",
    text_content: "",
  });

  // New question form state
  const [newQuestionOpen, setNewQuestionOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    text: "",
    opt0: "",
    opt1: "",
    opt2: "",
    opt3: "",
    correctIndex: 0,
    explanation: "",
  });

  // New TC form state
  const [newTcOpen, setNewTcOpen] = useState(false);
  const [tcForm, setTcForm] = useState({
    name: "",
    bin: "",
    city: "г. Алматы",
    contact_phone: "+7 (7",
    contact_email: "",
    admin_login: "",
    admin_password: "",
    admin_name: "",
    plan: "annual" as "monthly" | "annual",
  });

  // New Group form state
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: "",
    group_code: "",
    login: "",
    password: "",
    tc_id: 1,
    course_ids: [] as number[],
  });

  const [copiedMemo, setCopiedMemo] = useState<number | null>(null);
  const [billingOverview, setBillingOverview] = useState<BillingOverviewItem[]>(
    [],
  );
  const [billingTcId, setBillingTcId] = useState<number | null>(null);
  const [selectedTcId, setSelectedTcId] = useState<number | null>(null);
  const [superAdmins, setSuperAdmins] = useState<SuperAdminUser[]>([]);
  const [newAdminOpen, setNewAdminOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({
    login: "",
    password: "",
    full_name: "",
  });

  const platformCourses = useMemo(
    () => courses.filter((c) => !c.owner_tc_id),
    [courses]
  );
  const tcOwnedCourses = useMemo(
    () => courses.filter((c) => Boolean(c.owner_tc_id)),
    [courses]
  );
  const tcNameById = useMemo(() => {
    const map = new Map<number, string>();
    tcs.forEach((tc) => map.set(tc.id, tc.name));
    return map;
  }, [tcs]);

  // Load CMS data
  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [coursesData, tcsData, groupsData, statsData, adminsData] =
        await Promise.all([
          api.getCourses(),
          api.getAdminTrainingCenters(),
          api.getAdminGroups(),
          api.getAdminStats(),
          api.getSuperAdmins(),
        ]);
      setCourses(coursesData);
      setTcs(tcsData);
      setGroups(groupsData);
      setStats(statsData);
      setSuperAdmins(adminsData);

      if (groupsData.length > 0 && !groupForm.tc_id) {
        setGroupForm((prev) => ({ ...prev, tc_id: tcsData[0]?.id || 1 }));
      }
    } catch (err: any) {
      setError(err.message || m.cms_loading());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Manage Course Questions
  const handleOpenQuestions = async (course: Course) => {
    setSelectedCourse(course);
    try {
      const qs = await api.getQuestions(course.id);
      setCourseQuestions(qs);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Add Question
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      const options = [
        questionForm.opt0,
        questionForm.opt1,
        questionForm.opt2,
        questionForm.opt3,
      ].filter(Boolean);
      await api.addQuestion({
        course_id: selectedCourse.id,
        text: questionForm.text,
        options,
        correct_option_index: questionForm.correctIndex,
        explanation: questionForm.explanation,
      });
      setNewQuestionOpen(false);
      setQuestionForm({
        text: "",
        opt0: "",
        opt1: "",
        opt2: "",
        opt3: "",
        correctIndex: 0,
        explanation: "",
      });
      handleOpenQuestions(selectedCourse);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (qId: number) => {
    if (!confirm(m.common_delete())) return;
    try {
      await api.deleteQuestion(qId);
      if (selectedCourse) handleOpenQuestions(selectedCourse);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Create Course
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCourse({
        ...courseForm,
        slides: [
          {
            id: 1,
            title: `Вводная часть: ${courseForm.title}`,
            subtitle: "Нормативные основы Республики Казахстан",
            content: [
              "Изучение положений законодательства РК",
              "Инструкция по безопасному выполнению работ",
            ],
            law_reference: "Трудовой кодекс РК ст. 79",
          },
        ],
      });
      setNewCourseOpen(false);
      setCourseForm({
        title: "",
        category: "Охрана труда",
        code: "",
        description: "",
        duration_hours: 40,
        video_url: "",
        text_content: "",
      });
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Course
  const handleDeleteCourse = async (courseId: number) => {
    if (
      !confirm(m.cms_delete_course())
    )
      return;
    try {
      await api.deleteCourse(courseId);
      if (selectedCourse?.id === courseId) setSelectedCourse(null);
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Create Training Center
  const handleCreateTc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTrainingCenter(tcForm);
      setNewTcOpen(false);
      setTcForm({
        name: "",
        bin: "",
        city: "г. Алматы",
        contact_phone: "+7 (7",
        contact_email: "",
        admin_login: "",
        admin_password: "",
        admin_name: "",
        plan: "annual",
      });
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleTcActive = async (tc: TrainingCenterItem, nextActive: boolean) => {
    const previous = tcs;
    setTcs((list) =>
      list.map((row) =>
        row.id === tc.id ? { ...row, active: nextActive ? 1 : 0 } : row
      )
    );
    try {
      await api.setTrainingCenterActive(tc.id, nextActive);
    } catch (err: any) {
      setTcs(previous);
      alert(err.message);
    }
  };

  // Create Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createGroup(groupForm);
      setNewGroupOpen(false);
      setGroupForm({
        name: "",
        group_code: "",
        login: "",
        password: "",
        tc_id: tcs[0]?.id || 1,
        course_ids: [],
      });
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSuperAdmin(adminForm);
      setNewAdminOpen(false);
      setAdminForm({ login: "", password: "", full_name: "" });
      const adminsData = await api.getSuperAdmins();
      setSuperAdmins(adminsData);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSuperAdmin = async (admin: SuperAdminUser) => {
    if (admin.login === user.login) {
      alert(m.common_error());
      return;
    }
    if (
      !confirm(
        `${m.common_delete()} ${admin.full_name} (${admin.login})?`,
      )
    ) {
      return;
    }
    try {
      await api.deleteSuperAdmin(admin.id);
      setSuperAdmins(await api.getSuperAdmins());
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Toggle group course assignment
  const handleToggleCourseForGroup = async (
    groupId: number,
    courseId: number,
    currentCourseIds: number[] = [],
  ) => {
    const nextIds = currentCourseIds.includes(courseId)
      ? currentCourseIds.filter((id) => id !== courseId)
      : [...currentCourseIds, courseId];

    try {
      await api.updateGroupCourses(groupId, nextIds);
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, course_ids: nextIds } : g)),
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Copy Memo for enterprise curator
  const copyCadetMemo = (group: GroupItem) => {
    const text =
      `${m.fio_title()}\n` +
      `${m.cadet_group_label()} ${group.name}\n` +
      `${window.location.origin}\n` +
      `${m.common_login()}: ${group.login}\n` +
      `${m.common_password()}: ${group.password || "123"}\n` +
      `${m.fio_trace()}`;
    navigator.clipboard.writeText(text);
    setCopiedMemo(group.id);
    setTimeout(() => setCopiedMemo(null), 2500);
  };

  const selectedTc = tcs.find((tc) => tc.id === selectedTcId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Super Admin Top Banner */}
      <div className="bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-900/40">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-bold text-lg text-white tracking-tight">
                    {m.header_super_title()}
                  </h1>
                  <span className="text-[11px] uppercase font-bold tracking-wider bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                    {m.login_level4()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {m.header_super_sub()}
                </p>
              </div>
            </div>

            {stats && (
              <div className="flex items-center space-x-4 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    {m.sa_col_tc()}:
                  </span>
                  <span className="text-amber-400 font-bold">
                    {stats.total_training_centers}
                  </span>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-slate-400 block text-[11px]">
                    {m.sa_col_groups()}:
                  </span>
                  <span className="text-blue-400 font-bold">
                    {stats.total_groups}
                  </span>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-slate-400 block text-[11px]">
                    {m.cms_tab_courses()}:
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {stats.total_courses}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-wrap border-b border-slate-200 space-x-2 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => {
              setActiveTab("courses");
              setSelectedCourse(null);
            }}
            className={`py-3 px-4 flex items-center space-x-2 border-b-2 transition ${
              activeTab === "courses"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{m.cms_tab_courses()}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("tcs");
              setSelectedCourse(null);
              setSelectedTcId(null);
            }}
            className={`py-3 px-4 flex items-center space-x-2 border-b-2 transition ${
              activeTab === "tcs"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{m.cms_tab_tcs({ count: tcs.length })}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("groups");
              setSelectedCourse(null);
            }}
            className={`py-3 px-4 flex items-center space-x-2 border-b-2 transition ${
              activeTab === "groups"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{m.cms_tab_groups({ count: groups.length })}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("billing");
              setSelectedCourse(null);
              setBillingTcId(null);
              api
                .getBilling()
                .then((payload) => {
                  setBillingOverview(payload.overview || []);
                })
                .catch((err) => setError(err.message));
            }}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === "billing"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>{m.cms_tab_billing()}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("admins");
              setSelectedCourse(null);
            }}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === "admins"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>{m.cms_tab_admins({ count: superAdmins.length })}</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            {m.cms_loading()}
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
            {error}
          </div>
        ) : (
          <>
            {/* TAB 1: COURSES & QUESTIONS CMS */}
            {activeTab === "courses" && (
              <div className="space-y-6">
                {!selectedCourse ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          {m.cms_platform_title()}
                        </h2>
                        <p className="text-xs text-slate-500">
                          {m.cms_platform_sub()}
                        </p>
                      </div>

                      <button
                        onClick={() => setNewCourseOpen(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center space-x-2 shadow-sm transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{m.cms_create_course()}</span>
                      </button>
                    </div>

                    {platformCourses.length === 0 ? (
                      <div className="px-5 py-8 text-sm text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                        {m.cms_platform_empty()}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {platformCourses.map((c) => (
                          <CmsCourseCard
                            key={c.id}
                            course={c}
                            onOpenQuestions={handleOpenQuestions}
                            onDelete={handleDeleteCourse}
                          />
                        ))}
                      </div>
                    )}

                    <div className="pt-2">
                      <div
                        className="border-t border-slate-200"
                        role="separator"
                      />
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        {m.cms_tc_title()}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {m.cms_tc_sub()}
                      </p>
                    </div>

                    {tcOwnedCourses.length === 0 ? (
                      <div className="px-5 py-8 text-sm text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                        {m.cms_tc_empty()}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {tcOwnedCourses.map((c) => (
                          <CmsCourseCard
                            key={c.id}
                            course={c}
                            ownerLabel={
                              c.owner_tc_name ||
                              (c.owner_tc_id
                                ? tcNameById.get(c.owner_tc_id)
                                : undefined) ||
                              m.header_tc_fallback()
                            }
                            onOpenQuestions={handleOpenQuestions}
                            onDelete={handleDeleteCourse}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  /* COURSE QUESTIONS EDITOR VIEW */
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                      <div>
                        <button
                          onClick={() => setSelectedCourse(null)}
                          className="text-sm text-blue-600 hover:underline mb-1 block"
                        >
                          {m.cms_back_courses()}
                        </button>
                        <h2 className="text-lg font-bold text-slate-900">
                          {m.cms_bank_title({ title: selectedCourse.title })}
                        </h2>
                        <p className="text-xs text-slate-500">
                          {m.cms_bank_meta({ code: selectedCourse.code, count: courseQuestions.length })}
                          {selectedCourse.owner_tc_id
                            ? ` • ${
                                selectedCourse.owner_tc_name ||
                                tcNameById.get(selectedCourse.owner_tc_id) ||
                                m.cms_bank_tc()
                              }`
                            : ` • ${m.cms_bank_platform()}`}
                        </p>
                      </div>

                      <button
                        onClick={() => setNewQuestionOpen(true)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold flex items-center space-x-2 transition self-start sm:self-auto"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{m.cms_add_question()}</span>
                      </button>
                    </div>

                    {/* Question List */}
                    <div className="space-y-4">
                      {courseQuestions.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          {m.cms_no_questions()}
                        </div>
                      ) : (
                        courseQuestions.map((q, idx) => (
                          <div
                            key={q.id}
                            className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-slate-900">
                                {m.cms_question_n({ n: idx + 1, text: q.text })}
                              </span>
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                                title={m.common_delete()}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                              {q.options.map((opt, optIdx) => (
                                <div
                                  key={optIdx}
                                  className={`p-2 rounded border ${
                                    optIdx === q.correct_option_index
                                      ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                                      : "bg-white border-slate-200 text-slate-600"
                                  }`}
                                >
                                  {optIdx === q.correct_option_index
                                    ? "✓ "
                                    : "• "}
                                  {opt}
                                  {optIdx === q.correct_option_index && (
                                    <span className="text-[11px] text-emerald-700 font-bold ml-1">
                                      {m.cms_correct()}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>

                            {q.explanation && (
                              <p className="text-xs text-slate-500 italic">
                                {m.cadet_explanation()} {q.explanation}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TRAINING CENTERS MANAGEMENT */}
            {activeTab === "tcs" && (
              <div className="space-y-6">
                {selectedTcId ? (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTcId(null);
                        loadAll();
                      }}
                      className="text-sm text-slate-700 hover:text-slate-900 underline underline-offset-2"
                    >
                      {m.sa_back_registry()}
                    </button>
                    {selectedTc && (
                      <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
                        <h2 className="text-base font-semibold text-slate-900">
                          {selectedTc.name}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          {m.common_bin()} {selectedTc.bin} · {selectedTc.city}
                          {selectedTc.contract_number
                            ? ` · ${selectedTc.contract_number}`
                            : ""}
                        </p>
                      </div>
                    )}
                    <BillingSection tcId={selectedTcId} />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          {m.sa_tcs_title()}
                        </h2>
                        <p className="text-xs text-slate-500">
                          {m.sa_tcs_sub()}
                        </p>
                      </div>

                      <button
                        onClick={() => setNewTcOpen(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center space-x-2 transition shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{m.sa_connect_tc()}</span>
                      </button>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      {tcs.length === 0 ? (
                        <div className="px-5 py-8 text-sm text-slate-500">
                          {m.sa_tcs_empty()}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead>
                              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                                <th className="px-4 py-3 font-semibold w-24">
                                  {m.sa_col_enabled()}
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  {m.sa_col_tc()}
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  {m.sa_col_city()}
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  {m.sa_col_plan()}
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  {m.sa_col_until()}
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  {m.sa_col_status()}
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  {m.sa_col_groups()}
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  {m.sa_col_protocols()}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {tcs.map((tc) => (
                                <tr
                                  key={tc.id}
                                  tabIndex={0}
                                  onClick={() => setSelectedTcId(tc.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      setSelectedTcId(tc.id);
                                    }
                                  }}
                                  className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${
                                    tc.active === 0 ? "opacity-55 bg-slate-50" : ""
                                  }`}
                                >
                                  <td
                                    className="px-4 py-3"
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 accent-blue-700 cursor-pointer"
                                      checked={tc.active !== 0}
                                      onChange={(e) => {
                                        void handleToggleTcActive(
                                          tc,
                                          e.target.checked
                                        );
                                      }}
                                      aria-label={
                                        tc.active !== 0
                                          ? m.sa_disable_tc({ name: tc.name })
                                          : m.sa_enable_tc({ name: tc.name })
                                      }
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="font-medium text-slate-900">
                                      {tc.name}
                                    </div>
                                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                                      {m.common_bin()} {tc.bin}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-700">
                                    {tc.city}
                                  </td>
                                  <td className="px-4 py-3">
                                    {tc.plan_label || m.sa_no_plan()}
                                  </td>
                                  <td className="px-4 py-3">
                                    {tc.valid_until_label ? (
                                      <span>
                                        {tc.valid_until_label}
                                        <span className="text-slate-500">
                                          {" "}
                                          {m.sa_inclusive()}
                                        </span>
                                      </span>
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {tc.subscription_status_label ||
                                      m.sa_no_contract()}
                                  </td>
                                  <td className="px-4 py-3">
                                    {tc.groups_count || 0}
                                  </td>
                                  <td className="px-4 py-3">
                                    {tc.certified_count || 0}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 3: GROUPS & ACCESS MATRIX */}
            {activeTab === "groups" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {m.sa_groups_title()}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {m.sa_groups_sub()}
                    </p>
                  </div>

                  <button
                    onClick={() => setNewGroupOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center space-x-2 transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{m.sa_create_group()}</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              {group.group_code}
                            </span>
                            <h3 className="font-bold text-sm text-slate-900">
                              {group.name}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {m.cadet_tc()} {group.tc_name}{" "}
                            {group.enterprise_name
                              ? `• ${m.cadet_enterprise()} ${group.enterprise_name}`
                              : ""}
                          </p>
                        </div>

                        {/* Cadet Memo Copy Button */}
                        <button
                          onClick={() => copyCadetMemo(group)}
                          className={`px-3 py-2 rounded text-sm font-semibold flex items-center space-x-1.5 transition self-start sm:self-auto ${
                            copiedMemo === group.id
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          {copiedMemo === group.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>{m.copied()}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>{m.copy()}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Credentials Display */}
                      <div className="bg-slate-50 p-3 rounded text-xs text-slate-700 flex flex-wrap gap-x-6 gap-y-1 font-mono">
                        <div>
                          {m.common_login()}:{" "}
                          <strong className="text-slate-900">
                            {group.login}
                          </strong>
                        </div>
                        <div>
                          {m.common_password()}:{" "}
                          <strong className="text-slate-900">
                            {group.password || "123"}
                          </strong>
                        </div>
                      </div>

                      {/* Course Access Matrix Checkboxes */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                          {m.sa_groups_title()}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {courses.map((course) => {
                            const isAssigned = (
                              group.course_ids || []
                            ).includes(course.id);
                            return (
                              <div
                                key={course.id}
                                onClick={() =>
                                  handleToggleCourseForGroup(
                                    group.id,
                                    course.id,
                                    group.course_ids,
                                  )
                                }
                                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center space-x-2 ${
                                  isAssigned
                                    ? "bg-blue-50 border-blue-500 text-blue-950 font-semibold"
                                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isAssigned}
                                  readOnly
                                  className="w-3.5 h-3.5 accent-blue-600 rounded"
                                />
                                <span className="truncate">{course.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="space-y-5 pb-8">
                {billingTcId ? (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => {
                        setBillingTcId(null);
                        api
                          .getBilling()
                          .then((payload) => {
                            setBillingOverview(payload.overview || []);
                          })
                          .catch((err) => setError(err.message));
                      }}
                      className="text-sm text-slate-700 hover:text-slate-900 underline underline-offset-2"
                    >
                      {m.sa_back_registry()}
                    </button>
                    <BillingSection tcId={billingTcId} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        {m.sa_billing_title()}
                      </h2>
                      <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                        {m.sa_billing_sub()}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      {billingOverview.length === 0 ? (
                        <div className="px-5 py-8 text-sm text-slate-500">
                          {m.sa_billing_empty()}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead>
                              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                                <th className="px-4 py-3 font-semibold">
                                  {m.sa_col_tc()}
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  {m.sa_col_plan()}
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  {m.billing_tariff()}
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  {m.sa_col_until()}
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  {m.sa_col_status()}
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  {m.sa_col_status()}
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  {m.billing_period()}
                                </th>
                                <th className="px-4 py-3 font-semibold"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {billingOverview.map((row) => (
                                <tr
                                  key={row.tc_id}
                                  className="border-b border-slate-100"
                                >
                                  <td className="px-4 py-3">
                                    <div className="font-medium text-slate-900">
                                      {row.tc_name}
                                    </div>
                                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                                      {m.common_bin()} {row.tc_bin}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 font-mono text-xs">
                                    {row.contract_number}
                                  </td>
                                  <td className="px-4 py-3">
                                    {row.plan_label}
                                  </td>
                                  <td className="px-4 py-3">
                                    {row.valid_until_label}
                                  </td>
                                  <td className="px-4 py-3">
                                    {row.days_remaining < 0
                                      ? m.billing_expired_ago({
                                          n: Math.abs(row.days_remaining),
                                          days: m.day_many(),
                                        })
                                      : m.billing_days_left({
                                          n: row.days_remaining,
                                          days: m.day_many(),
                                        })}
                                  </td>
                                  <td className="px-4 py-3">
                                    {row.status_label}
                                  </td>
                                  <td className="px-4 py-3">
                                    {row.auto_renew ? m.common_yes() : m.common_no()}
                                  </td>
                                  <td className="px-4 py-3">
                                    <button
                                      type="button"
                                      onClick={() => setBillingTcId(row.tc_id)}
                                      className="text-sm font-medium text-slate-800 underline underline-offset-2"
                                    >
                                      {m.tc_more()}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "admins" && (
              <div className="space-y-6 pb-8">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {m.sa_admins_title()}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {m.header_super_sub()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewAdminOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center space-x-2 transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{m.sa_create_admin()}</span>
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {superAdmins.length === 0 ? (
                    <div className="px-5 py-8 text-sm text-slate-500">
                      {m.common_no()}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                            <th className="px-4 py-3 font-semibold">{m.fio_label()}</th>
                            <th className="px-4 py-3 font-semibold">{m.common_login()}</th>
                            <th className="px-4 py-3 font-semibold">{m.cadet_datetime()}</th>
                            <th className="px-4 py-3 font-semibold"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {superAdmins.map((admin) => (
                            <tr
                              key={admin.id}
                              className="border-b border-slate-100"
                            >
                              <td className="px-4 py-3 font-medium text-slate-900">
                                {admin.full_name}
                                {admin.login === user.login && (
                                  <span className="ml-2 text-[11px] font-semibold text-slate-500">
                                    {m.common_yes()}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs">
                                {admin.login}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {new Date(admin.created_at).toLocaleString(
                                  "ru-RU",
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {admin.login === user.login ? (
                                  <span className="text-xs text-slate-400">
                                    —
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteSuperAdmin(admin)
                                    }
                                    className="text-sm font-medium text-red-700 hover:underline"
                                  >
                                    {m.common_delete()}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL: CREATE COURSE */}
      {newCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              {m.cms_create_course()}
            </h3>
            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">
                  {m.cms_create_course()}
                </label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, title: e.target.value })
                  }
                  placeholder={m.fio_ph()}
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">
                    {m.common_bin()}:
                  </label>
                  <input
                    type="text"
                    required
                    value={courseForm.code}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, code: e.target.value })
                    }
                    placeholder="EB-1000-KZ"
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">
                    {m.billing_tariff()}:
                  </label>
                  <select
                    value={courseForm.category}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1 bg-white"
                  >
                    <option value="Охрана труда">{m.cat_ohs()}</option>
                    <option value="Промышленная безопасность">
                      {m.cat_ind()}
                    </option>
                    <option value="Пожарная безопасность">
                      {m.cat_fire()}
                    </option>
                    <option value="Электробезопасность">
                      {m.cat_electro()}
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">
                  {m.cms_platform_sub()}
                </label>
                <textarea
                  rows={2}
                  value={courseForm.description}
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewCourseOpen(false)}
                  className="px-4 py-2 border rounded text-slate-700"
                >
                  {m.common_cancel()}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded font-semibold"
                >
                  {m.cms_create_course()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD QUESTION */}
      {newQuestionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              {m.cms_add_question()}
            </h3>
            <form onSubmit={handleAddQuestion} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">
                  {m.cms_add_question()}
                </label>
                <textarea
                  required
                  rows={2}
                  value={questionForm.text}
                  onChange={(e) =>
                    setQuestionForm({ ...questionForm, text: e.target.value })
                  }
                  placeholder={m.cms_add_question()}
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">
                  {m.cms_correct()}
                </label>
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correctIdx"
                      checked={questionForm.correctIndex === idx}
                      onChange={() =>
                        setQuestionForm({ ...questionForm, correctIndex: idx })
                      }
                      className="accent-emerald-600"
                    />
                    <input
                      type="text"
                      required={idx < 2}
                      value={(questionForm as any)[`opt${idx}`]}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          [`opt${idx}`]: e.target.value,
                        })
                      }
                      placeholder={`${idx + 1}`}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-slate-700">
                  {m.cadet_explanation()}
                </label>
                <input
                  type="text"
                  value={questionForm.explanation}
                  onChange={(e) =>
                    setQuestionForm({
                      ...questionForm,
                      explanation: e.target.value,
                    })
                  }
                  placeholder="Например: Согласно ст. 182 Трудового кодекса РК..."
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewQuestionOpen(false)}
                  className="px-4 py-2 border rounded text-slate-700"
                >
                  {m.common_cancel()}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded font-semibold"
                >
                  {m.common_save()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE TRAINING CENTER */}
      {newTcOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-slate-900">
              {m.sa_modal_tc()}
            </h3>
            <form onSubmit={handleCreateTc} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">
                  {m.sa_tc_name()}
                </label>
                <input
                  type="text"
                  required
                  value={tcForm.name}
                  onChange={(e) =>
                    setTcForm({ ...tcForm, name: e.target.value })
                  }
                  placeholder="ТОО «Учебный Центр Алатау»"
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">
                    {m.sa_tc_bin()}
                  </label>
                  <input
                    type="text"
                    required
                    value={tcForm.bin}
                    onChange={(e) =>
                      setTcForm({ ...tcForm, bin: e.target.value })
                    }
                    placeholder="12 цифр"
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">
                    {m.sa_tc_city()}
                  </label>
                  <input
                    type="text"
                    required
                    value={tcForm.city}
                    onChange={(e) =>
                      setTcForm({ ...tcForm, city: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 font-bold text-slate-900">
                {m.sa_tc_director()}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">
                    {m.sa_tc_login()}
                  </label>
                  <input
                    type="text"
                    required
                    value={tcForm.admin_login}
                    onChange={(e) =>
                      setTcForm({ ...tcForm, admin_login: e.target.value })
                    }
                    placeholder="admin_alatau"
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">
                    {m.sa_tc_password()}
                  </label>
                  <input
                    type="text"
                    required
                    value={tcForm.admin_password}
                    onChange={(e) =>
                      setTcForm({ ...tcForm, admin_password: e.target.value })
                    }
                    placeholder="alatau2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">
                  {m.sa_tc_fio()}
                </label>
                <input
                  type="text"
                  value={tcForm.admin_name}
                  onChange={(e) =>
                    setTcForm({ ...tcForm, admin_name: e.target.value })
                  }
                  placeholder="Жумабаев Канат Серикович"
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                />
              </div>

              <fieldset className="pt-2 border-t border-slate-100 space-y-2">
                <legend className="font-bold text-slate-900">
                  {m.sa_plan_legend()}
                </legend>
                <p className="text-slate-500">
                  {m.sa_plan_hint()}
                </p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="tc-billing-plan"
                    className="mt-0.5 accent-slate-800"
                    checked={tcForm.plan === "monthly"}
                    onChange={() => setTcForm({ ...tcForm, plan: "monthly" })}
                  />
                  <span>
                    <span className="font-semibold text-slate-900">
                      {m.sa_plan_monthly()}
                    </span>
                    <span className="block text-slate-500 mt-0.5">
                      {m.sa_plan_monthly_sub()}
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="tc-billing-plan"
                    className="mt-0.5 accent-slate-800"
                    checked={tcForm.plan === "annual"}
                    onChange={() => setTcForm({ ...tcForm, plan: "annual" })}
                  />
                  <span>
                    <span className="font-semibold text-slate-900">
                      {m.sa_plan_annual()}
                    </span>
                    <span className="block text-slate-500 mt-0.5">
                      {m.sa_plan_annual_sub()}
                    </span>
                  </span>
                </label>
              </fieldset>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewTcOpen(false)}
                  className="px-4 py-2 border rounded text-slate-700"
                >
                  {m.common_cancel()}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded font-semibold"
                >
                  {m.sa_register_tc()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE GROUP */}
      {newGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              {m.sa_create_group()}
            </h3>
            <form onSubmit={handleCreateGroup} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">
                  {m.cadet_group_label()}
                </label>
                <input
                  type="text"
                  required
                  value={groupForm.name}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, name: e.target.value })
                  }
                  placeholder="Группа БиОТ-502 (АО КазСтрой)"
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">
                    {m.cadet_group()}
                  </label>
                  <input
                    type="text"
                    required
                    value={groupForm.group_code}
                    onChange={(e) =>
                      setGroupForm({ ...groupForm, group_code: e.target.value })
                    }
                    placeholder="BIOT-502"
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">
                    {m.sa_col_tc()}
                  </label>
                  <select
                    value={groupForm.tc_id}
                    onChange={(e) =>
                      setGroupForm({
                        ...groupForm,
                        tc_id: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1 bg-white"
                  >
                    {tcs.map((tc) => (
                      <option key={tc.id} value={tc.id}>
                        {tc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">
                    {m.common_login()}
                  </label>
                  <input
                    type="text"
                    required
                    value={groupForm.login}
                    onChange={(e) =>
                      setGroupForm({ ...groupForm, login: e.target.value })
                    }
                    placeholder="kursant_502"
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">
                    {m.common_password()}
                  </label>
                  <input
                    type="text"
                    required
                    value={groupForm.password}
                    onChange={(e) =>
                      setGroupForm({ ...groupForm, password: e.target.value })
                    }
                    placeholder="pass502"
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewGroupOpen(false)}
                  className="px-4 py-2 border rounded text-slate-700"
                >
                  {m.common_cancel()}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded font-semibold"
                >
                  {m.sa_create_group()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {newAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              {m.sa_create_admin()}
            </h3>
            <p className="text-xs text-slate-500">
              {m.login_password()}
            </p>
            <form
              onSubmit={handleCreateSuperAdmin}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700">
                  {m.fio_label()}
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={adminForm.full_name}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, full_name: e.target.value })
                  }
                  placeholder="Нурланов Серик Кайратович"
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700">
                  {m.common_login()}
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={adminForm.login}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, login: e.target.value })
                  }
                  placeholder="superadmin2"
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700">
                  {m.common_password()}
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={adminForm.password}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, password: e.target.value })
                  }
                  placeholder={m.common_password()}
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1 font-mono"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewAdminOpen(false)}
                  className="px-4 py-2 border rounded text-slate-700"
                >
                  {m.common_cancel()}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded font-semibold"
                >
                  {m.sa_create_admin()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
