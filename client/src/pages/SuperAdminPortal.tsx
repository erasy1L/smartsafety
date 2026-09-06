import React, { useState, useEffect } from 'react';
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
  FileText
} from 'lucide-react';
import { api } from '../api/client';
import { Course, GroupItem, Question, TrainingCenterItem, UserSession } from '../types';

interface SuperAdminPortalProps {
  user: UserSession;
  onNavigate: (path: string) => void;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'courses' | 'tcs' | 'groups' | 'stats'>('courses');
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
    title: '',
    category: 'Охрана труда',
    code: '',
    description: '',
    duration_hours: 40,
    video_url: '',
    text_content: ''
  });

  // New question form state
  const [newQuestionOpen, setNewQuestionOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    text: '',
    opt0: '',
    opt1: '',
    opt2: '',
    opt3: '',
    correctIndex: 0,
    explanation: ''
  });

  // New TC form state
  const [newTcOpen, setNewTcOpen] = useState(false);
  const [tcForm, setTcForm] = useState({
    name: '',
    bin: '',
    city: 'г. Алматы',
    contact_phone: '+7 (7',
    contact_email: '',
    admin_login: '',
    admin_password: '',
    admin_name: ''
  });

  // New Group form state
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: '',
    group_code: '',
    login: '',
    password: '',
    tc_id: 1,
    course_ids: [] as number[]
  });

  const [copiedMemo, setCopiedMemo] = useState<number | null>(null);

  // Load CMS data
  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [coursesData, tcsData, groupsData, statsData] = await Promise.all([
        api.getCourses(),
        api.getAdminTrainingCenters(),
        api.getAdminGroups(),
        api.getAdminStats()
      ]);
      setCourses(coursesData);
      setTcs(tcsData);
      setGroups(groupsData);
      setStats(statsData);

      if (groupsData.length > 0 && !groupForm.tc_id) {
        setGroupForm(prev => ({ ...prev, tc_id: tcsData[0]?.id || 1 }));
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки CMS данных');
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
      const options = [questionForm.opt0, questionForm.opt1, questionForm.opt2, questionForm.opt3].filter(Boolean);
      await api.addQuestion({
        course_id: selectedCourse.id,
        text: questionForm.text,
        options,
        correct_option_index: questionForm.correctIndex,
        explanation: questionForm.explanation
      });
      setNewQuestionOpen(false);
      setQuestionForm({ text: '', opt0: '', opt1: '', opt2: '', opt3: '', correctIndex: 0, explanation: '' });
      handleOpenQuestions(selectedCourse);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (qId: number) => {
    if (!confirm('Удалить этот вопрос из теста?')) return;
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
            content: ["Изучение положений законодательства РК", "Инструкция по безопасному выполнению работ"],
            law_reference: "Трудовой кодекс РК ст. 79"
          }
        ]
      });
      setNewCourseOpen(false);
      setCourseForm({ title: '', category: 'Охрана труда', code: '', description: '', duration_hours: 40, video_url: '', text_content: '' });
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Course
  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm('Вы действительно хотите удалить этот курс и все связанные вопросы?')) return;
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
        name: '',
        bin: '',
        city: 'г. Алматы',
        contact_phone: '+7 (7',
        contact_email: '',
        admin_login: '',
        admin_password: '',
        admin_name: ''
      });
      loadAll();
    } catch (err: any) {
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
        name: '',
        group_code: '',
        login: '',
        password: '',
        tc_id: tcs[0]?.id || 1,
        course_ids: []
      });
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Toggle group course assignment
  const handleToggleCourseForGroup = async (groupId: number, courseId: number, currentCourseIds: number[] = []) => {
    const nextIds = currentCourseIds.includes(courseId)
      ? currentCourseIds.filter(id => id !== courseId)
      : [...currentCourseIds, courseId];

    try {
      await api.updateGroupCourses(groupId, nextIds);
      setGroups(prev =>
        prev.map(g => (g.id === groupId ? { ...g, course_ids: nextIds } : g))
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Copy Memo for enterprise curator
  const copyCadetMemo = (group: GroupItem) => {
    const text = `📋 Памятка курсанта SmartSafety РК\n` +
      `Учебная группа: ${group.name}\n` +
      `Ссылка для входа: ${window.location.origin}\n` +
      `Логин группы: ${group.login}\n` +
      `Пароль: ${group.password || '123'}\n` +
      `Важно: При первом входе система запросит ваше полное ФИО для оформления официального протокола.`;
    navigator.clipboard.writeText(text);
    setCopiedMemo(group.id);
    setTimeout(() => setCopiedMemo(null), 2500);
  };

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
                    Панель управления CMS SmartSafety
                  </h1>
                  <span className="text-[11px] uppercase font-bold tracking-wider bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                    Уровень 3: Супер-Администратор
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Полный доступ к управлению контентом курсов, тестов, учебных центров и генерации доступов
                </p>
              </div>
            </div>

            {stats && (
              <div className="flex items-center space-x-4 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[11px]">Всего УЦ:</span>
                  <span className="text-amber-400 font-bold">{stats.total_training_centers}</span>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-slate-400 block text-[11px]">Групп:</span>
                  <span className="text-blue-400 font-bold">{stats.total_groups}</span>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-slate-400 block text-[11px]">Курсов:</span>
                  <span className="text-emerald-400 font-bold">{stats.total_courses}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex border-b border-slate-200 space-x-2 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => {
              setActiveTab('courses');
              setSelectedCourse(null);
            }}
            className={`py-3 px-4 flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'courses'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Курсы и вопросы тестов (CMS)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('tcs');
              setSelectedCourse(null);
            }}
            className={`py-3 px-4 flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'tcs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>2. Учебные Центры ({tcs.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('groups');
              setSelectedCourse(null);
            }}
            className={`py-3 px-4 flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'groups'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>3. Группы и матрица доступов ({groups.length})</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            Загрузка данных управления...
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
            {error}
          </div>
        ) : (
          <>
            {/* TAB 1: COURSES & QUESTIONS CMS */}
            {activeTab === 'courses' && (
              <div className="space-y-6">
                {!selectedCourse ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          Учебные программы и контрольные тесты
                        </h2>
                        <p className="text-xs text-slate-500">
                          Редактирование слайдов, лекций, вопросов и правильных ответов
                        </p>
                      </div>

                      <button
                        onClick={() => setNewCourseOpen(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center space-x-2 shadow-sm transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Создать новый курс</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {courses.map(c => (
                        <div
                          key={c.id}
                          className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                {c.category}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">{c.code}</span>
                            </div>

                            <h3 className="font-bold text-sm text-slate-900 leading-snug">
                              {c.title}
                            </h3>

                            <p className="text-xs text-slate-600 line-clamp-2">
                              {c.description}
                            </p>

                            <div className="pt-2 text-xs text-slate-500 flex items-center space-x-3">
                              <span>Объем: {c.duration_hours} ч.</span>
                              <span>•</span>
                              <span className="font-semibold text-blue-700">
                                {c.question_count || 0} вопросов в тесте
                              </span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <button
                              onClick={() => handleOpenQuestions(c)}
                              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-sm font-medium flex items-center space-x-1.5 transition"
                            >
                              <HelpCircle className="w-3.5 h-3.5 text-white" />
                              <span>Банк вопросов ({c.question_count || 0})</span>
                            </button>

                            <button
                              onClick={() => handleDeleteCourse(c.id)}
                              title="Удалить курс"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
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
                          ← Назад ко всем курсам
                        </button>
                        <h2 className="text-lg font-bold text-slate-900">
                          Банк вопросов: {selectedCourse.title}
                        </h2>
                        <p className="text-xs text-slate-500">
                          Код курса: {selectedCourse.code} • Всего вопросов: {courseQuestions.length}
                        </p>
                      </div>

                      <button
                        onClick={() => setNewQuestionOpen(true)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold flex items-center space-x-2 transition self-start sm:self-auto"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Добавить экзаменационный вопрос</span>
                      </button>
                    </div>

                    {/* Question List */}
                    <div className="space-y-4">
                      {courseQuestions.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          В этом курсе еще нет вопросов. Нажмите «Добавить экзаменационный вопрос».
                        </div>
                      ) : (
                        courseQuestions.map((q, idx) => (
                          <div
                            key={q.id}
                            className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-slate-900">
                                Вопрос #{idx + 1}: {q.text}
                              </span>
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                                title="Удалить вопрос"
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
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                      : 'bg-white border-slate-200 text-slate-600'
                                  }`}
                                >
                                  {optIdx === q.correct_option_index ? '✓ ' : '• '}
                                  {opt}
                                  {optIdx === q.correct_option_index && (
                                    <span className="text-[11px] text-emerald-700 font-bold ml-1">
                                      (Правильный ответ)
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>

                            {q.explanation && (
                              <p className="text-xs text-slate-500 italic">
                                Обоснование: {q.explanation}
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
            {activeTab === 'tcs' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Аккредитованные Учебные Центры Казахстана
                    </h2>
                    <p className="text-xs text-slate-500">
                      Подключение новых партнеров и генерация аккаунтов руководства УЦ
                    </p>
                  </div>

                  <button
                    onClick={() => setNewTcOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center space-x-2 transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Подключить новый УЦ</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {tcs.map(tc => (
                    <div
                      key={tc.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            БИН: {tc.bin}
                          </span>
                          <h3 className="font-bold text-base text-slate-900 mt-0.5">
                            {tc.name}
                          </h3>
                        </div>
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {tc.city}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <div>Тел: <strong className="text-slate-800">{tc.contact_phone}</strong></div>
                        <div>Email: <strong className="text-slate-800">{tc.contact_email}</strong></div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                        <span>Групп: <strong className="text-slate-800">{tc.groups_count || 0}</strong></span>
                        <span>Выдано протоколов: <strong className="text-emerald-700">{tc.certified_count || 0}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: GROUPS & ACCESS MATRIX */}
            {activeTab === 'groups' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Учебные группы и матрица доступов
                    </h2>
                    <p className="text-xs text-slate-500">
                      Курсант видит ТОЛЬКО отмеченные для его группы курсы. Здесь же копируются данные для входа.
                    </p>
                  </div>

                  <button
                    onClick={() => setNewGroupOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center space-x-2 transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Создать учебную группу</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {groups.map(group => (
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
                            УЦ: {group.tc_name} {group.enterprise_name ? `• Заказчик: ${group.enterprise_name}` : ''}
                          </p>
                        </div>

                        {/* Cadet Memo Copy Button */}
                        <button
                          onClick={() => copyCadetMemo(group)}
                          className={`px-3 py-2 rounded text-sm font-semibold flex items-center space-x-1.5 transition self-start sm:self-auto ${
                            copiedMemo === group.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {copiedMemo === group.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Памятка скопирована!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Скопировать доступ для курсантов</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Credentials Display */}
                      <div className="bg-slate-50 p-3 rounded text-xs text-slate-700 flex flex-wrap gap-x-6 gap-y-1 font-mono">
                        <div>Логин группы: <strong className="text-slate-900">{group.login}</strong></div>
                        <div>Пароль: <strong className="text-slate-900">{group.password || '123'}</strong></div>
                      </div>

                      {/* Course Access Matrix Checkboxes */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                          Матрица доступа: выберите курсы, открытые данной группе:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {courses.map(course => {
                            const isAssigned = (group.course_ids || []).includes(course.id);
                            return (
                              <div
                                key={course.id}
                                onClick={() =>
                                  handleToggleCourseForGroup(group.id, course.id, group.course_ids)
                                }
                                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center space-x-2 ${
                                  isAssigned
                                    ? 'bg-blue-50 border-blue-500 text-blue-950 font-semibold'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
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
          </>
        )}
      </div>

      {/* MODAL: CREATE COURSE */}
      {newCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Создание нового учебного курса</h3>
            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Название курса:</label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                  placeholder="Например: Электробезопасность до и выше 1000В"
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Код курса:</label>
                  <input
                    type="text"
                    required
                    value={courseForm.code}
                    onChange={e => setCourseForm({ ...courseForm, code: e.target.value })}
                    placeholder="EB-1000-KZ"
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Категория:</label>
                  <select
                    value={courseForm.category}
                    onChange={e => setCourseForm({ ...courseForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1 bg-white"
                  >
                    <option value="Охрана труда">Охрана труда</option>
                    <option value="Промышленная безопасность">Промышленная безопасность</option>
                    <option value="Пожарная безопасность">Пожарная безопасность</option>
                    <option value="Электробезопасность">Электробезопасность</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Краткое описание:</label>
                <textarea
                  rows={2}
                  value={courseForm.description}
                  onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewCourseOpen(false)}
                  className="px-4 py-2 border rounded text-slate-700"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded font-semibold"
                >
                  Создать курс
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
              Добавление экзаменационного вопроса
            </h3>
            <form onSubmit={handleAddQuestion} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Текст вопроса:</label>
                <textarea
                  required
                  rows={2}
                  value={questionForm.text}
                  onChange={e => setQuestionForm({ ...questionForm, text: e.target.value })}
                  placeholder="Сформулируйте вопрос теста..."
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">
                  Варианты ответов (отметьте правильный переключателем):
                </label>
                {[0, 1, 2, 3].map(idx => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correctIdx"
                      checked={questionForm.correctIndex === idx}
                      onChange={() => setQuestionForm({ ...questionForm, correctIndex: idx })}
                      className="accent-emerald-600"
                    />
                    <input
                      type="text"
                      required={idx < 2}
                      value={(questionForm as any)[`opt${idx}`]}
                      onChange={e =>
                        setQuestionForm({ ...questionForm, [`opt${idx}`]: e.target.value })
                      }
                      placeholder={`Вариант ${idx + 1}`}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-slate-700">
                  Нормативное обоснование правильного ответа (статья ТК РК / закон):
                </label>
                <input
                  type="text"
                  value={questionForm.explanation}
                  onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })}
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
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded font-semibold"
                >
                  Сохранить вопрос
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE TRAINING CENTER */}
      {newTcOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              Подключение Учебного Центра и создание аккаунта
            </h3>
            <form onSubmit={handleCreateTc} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Наименование УЦ:</label>
                <input
                  type="text"
                  required
                  value={tcForm.name}
                  onChange={e => setTcForm({ ...tcForm, name: e.target.value })}
                  placeholder="ТОО «Учебный Центр Алатау»"
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">БИН:</label>
                  <input
                    type="text"
                    required
                    value={tcForm.bin}
                    onChange={e => setTcForm({ ...tcForm, bin: e.target.value })}
                    placeholder="12 цифр"
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Город:</label>
                  <input
                    type="text"
                    required
                    value={tcForm.city}
                    onChange={e => setTcForm({ ...tcForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 font-bold text-slate-900">
                Данные входа директора УЦ:
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Логин директора:</label>
                  <input
                    type="text"
                    required
                    value={tcForm.admin_login}
                    onChange={e => setTcForm({ ...tcForm, admin_login: e.target.value })}
                    placeholder="admin_alatau"
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Пароль:</label>
                  <input
                    type="text"
                    required
                    value={tcForm.admin_password}
                    onChange={e => setTcForm({ ...tcForm, admin_password: e.target.value })}
                    placeholder="alatau2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">ФИО Директора:</label>
                <input
                  type="text"
                  value={tcForm.admin_name}
                  onChange={e => setTcForm({ ...tcForm, admin_name: e.target.value })}
                  placeholder="Жумабаев Канат Серикович"
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewTcOpen(false)}
                  className="px-4 py-2 border rounded text-slate-700"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded font-semibold"
                >
                  Зарегистрировать УЦ
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
              Создание новой учебной группы
            </h3>
            <form onSubmit={handleCreateGroup} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Название группы:</label>
                <input
                  type="text"
                  required
                  value={groupForm.name}
                  onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="Группа БиОТ-502 (АО КазСтрой)"
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Код группы:</label>
                  <input
                    type="text"
                    required
                    value={groupForm.group_code}
                    onChange={e => setGroupForm({ ...groupForm, group_code: e.target.value })}
                    placeholder="BIOT-502"
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Учебный Центр:</label>
                  <select
                    value={groupForm.tc_id}
                    onChange={e => setGroupForm({ ...groupForm, tc_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1 bg-white"
                  >
                    {tcs.map(tc => (
                      <option key={tc.id} value={tc.id}>
                        {tc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Логин для группы:</label>
                  <input
                    type="text"
                    required
                    value={groupForm.login}
                    onChange={e => setGroupForm({ ...groupForm, login: e.target.value })}
                    placeholder="kursant_502"
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Пароль:</label>
                  <input
                    type="text"
                    required
                    value={groupForm.password}
                    onChange={e => setGroupForm({ ...groupForm, password: e.target.value })}
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
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded font-semibold"
                >
                  Создать группу
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
