import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Check,
  X,
  Printer,
  ChevronRight,
  HelpCircle,
  Building,
  User
} from 'lucide-react';
import { api } from '../api/client';
import { Course, Question, TestSubmissionResult, UserSession } from '../types';
import { PresentationViewer } from '../components/PresentationViewer';
import { CadetFioModal } from '../components/CadetFioModal';
import { QuestionPagination } from '../components/QuestionPagination';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { m } from '../paraglide/messages.js';

interface CadetPortalProps {
  user: UserSession;
  onUpdateUser: (updated: UserSession) => void;
  onNavigate: (path: string) => void;
}

export const CadetPortal: React.FC<CadetPortalProps> = ({ user, onUpdateUser }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active study state
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<'presentation' | 'text' | 'video' | 'test'>('text');

  // Testing state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [testSubmitting, setTestSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<TestSubmissionResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(1200); // 20 min timer

  // Anti-cheat hook
  const { cheatFlags, lastWarning, clearWarning, resetCheatFlags } = useAntiCheat({
    enabled: !!activeCourse,
    onCheatDetected: (_reason, total) => {
      console.warn(`AntiCheat violation #${total}`);
    }
  });

  // Load assigned courses for this group
  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCourses();
      setCourses(data);
    } catch (err: any) {
      setError(err.message || m.common_error());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.cadet_fio) {
      loadCourses();
    }
  }, [user.cadet_fio]);

  // Handle course select
  const handleSelectCourse = async (courseId: number) => {
    try {
      setLoading(true);
      const fullCourse = await api.getCourseById(courseId);
      setActiveCourse(fullCourse);
      setActiveTab('text');
      setTestResult(null);
      setSelectedAnswers({});
      setCurrentQuestionIndex(0);
      resetCheatFlags();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveCourse = async () => {
    const shouldAbandon = Boolean(activeCourse && activeTab === 'test' && !testResult);
    const courseId = activeCourse?.id;
    setQuestions([]);
    setActiveTab('text');
    if (shouldAbandon && courseId) {
      try {
        await api.abandonTest(courseId);
      } catch {
        api.abandonTestBeacon(courseId);
      }
    }
    setActiveCourse(null);
    setTestResult(null);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    resetCheatFlags();
  };

  // Start test
  const handleStartTest = async (options?: { forceNew?: boolean }) => {
    if (!activeCourse) return;
    if (!options?.forceNew && activeTab === 'test' && !testResult && questions.length > 0) {
      return;
    }
    try {
      setLoading(true);
      const data = await api.startTest(activeCourse.id, { forceNew: options?.forceNew });
      if (data.status === 'voided' && data.result) {
        setQuestions([]);
        setSelectedAnswers({});
        setCurrentQuestionIndex(0);
        setTestResult(data.result);
        setActiveTab('test');
        return;
      }
      const testQs = data.questions || [];
      setQuestions(testQs);
      setSelectedAnswers({});
      setCurrentQuestionIndex(0);
      setTimeRemaining(testQs.length * 180);
      setTestResult(null);
      setActiveTab('test');
      resetCheatFlags();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'test' || testResult || !activeCourse) return;
    const courseId = activeCourse.id;
    const onPageLeave = () => {
      api.abandonTestBeacon(courseId);
    };
    window.addEventListener('pagehide', onPageLeave);
    window.addEventListener('beforeunload', onPageLeave);
    return () => {
      window.removeEventListener('pagehide', onPageLeave);
      window.removeEventListener('beforeunload', onPageLeave);
    };
  }, [activeTab, testResult, activeCourse]);

  // Timer countdown during test
  useEffect(() => {
    if (activeTab !== 'test' || testResult || questions.length === 0) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTab, testResult, questions.length, selectedAnswers]);

  // Submit test
  const handleSubmitTest = async () => {
    if (!activeCourse) return;
    try {
      setTestSubmitting(true);
      const result = await api.submitTest(activeCourse.id, selectedAnswers, cheatFlags);
      setTestResult(result);
    } catch (err: any) {
      setError(err.message || m.common_error());
    } finally {
      setTestSubmitting(false);
    }
  };

  // Format timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const studyTabsLocked = activeTab === 'test' && !testResult;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* 1. Mandatory FIO modal barrier */}
      <CadetFioModal
        isOpen={!user.cadet_fio}
        groupName={user.group_name || user.login}
        enterpriseName={user.enterprise_name}
        onFioSaved={fio => {
          onUpdateUser({ ...user, cadet_fio: fio });
        }}
      />

      {/* 2. Top Cadet Identity Bar */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-white">
                    {user.cadet_fio || m.fio_label()}
                  </span>
                  <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded">
                    {m.header_cadet_fallback({ login: user.login })}
                  </span>
                </div>
                <div className="text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                  <span>{m.cadet_group()} <strong className="text-slate-200">{user.group_name}</strong></span>
                  {user.enterprise_name && (
                    <span>{m.cadet_enterprise()} <strong className="text-slate-200">{user.enterprise_name}</strong></span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-slate-400">
              <Building className="w-4 h-4 text-slate-500" />
              <span>{m.cadet_tc()} <strong className="text-slate-200">{user.tc_name}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Anti-cheat violation alert strip */}
      {activeCourse && (
        <div className="bg-blue-950 text-blue-200 py-2 border-b border-blue-900 text-xs">
          <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center space-x-2 max-w-4xl truncate">
              <ShieldCheck className="w-4 h-4 text-white shrink-0" />
              <span className="truncate">
                {m.cheat_clipboard()}
              </span>
            </div>
            {cheatFlags > 0 ? (
              <span className="bg-red-900/80 text-red-200 px-2 py-0.5 rounded text-xs font-bold border border-red-700 animate-pulse">
                {m.cadet_violations({ n: cheatFlags })}
              </span>
            ) : (
              <span className="text-emerald-400 text-xs">{m.cadet_clean()}</span>
            )}
          </div>
        </div>
      )}

      {/* Warning popup toast for anti-cheat */}
      {lastWarning && (
        <div className="fixed top-20 right-4 z-50 max-w-sm bg-red-900 text-white p-3 rounded-lg shadow-xl border border-red-700 text-xs flex items-start space-x-2 animate-bounce">
          <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{lastWarning}</p>
            <p className="text-[11px] text-red-200 mt-0.5">
              {m.cadet_protocol()}
            </p>
          </div>
          <button onClick={clearWarning} className="text-red-300 hover:text-white p-0.5">
            ✕
          </button>
        </div>
      )}

      {/* 3. Main Workspace Area */}
      <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {!activeCourse ? (
          /* COURSE SELECTION SCREEN */
          <div className="space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {m.cadet_my_courses()}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {m.cadet_group_label()} <b>{user.group_name}</b>
              </p>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                {m.common_loading()}
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
                {error}
              </div>
            ) : courses.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 space-y-2">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-medium text-sm">{m.cadet_no_courses()}</p>
                <p className="text-xs text-slate-400">{m.cadet_ask_curator({ tc: user.tc_name || '' })}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                  <div
                    key={course.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {course.category}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {course.code}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900 leading-snug">
                        {course.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {course.description}
                      </p>

                      <div className="pt-2 flex items-center space-x-4 text-xs text-slate-500 border-t border-slate-100">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{course.duration_hours} {m.common_hours_short()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>{course.question_count || 6} {m.common_questions()}</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                      <button
                        onClick={() => handleSelectCourse(course.id)}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold uppercase tracking-wider transition flex items-center justify-center space-x-2"
                      >
                        <span>{m.cadet_start()}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ACTIVE COURSE WORKSPACE */
          <div className="space-y-6">
            {/* Back button & Course Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <button
                  onClick={handleLeaveCourse}
                  className="text-sm text-blue-600 hover:underline flex items-center space-x-1 mb-1"
                >
                  <span>{m.common_back()}</span>
                </button>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {activeCourse.title}
                </h1>
                <p className="text-xs text-slate-500">
                  {m.cadet_program()} {activeCourse.code} • {activeCourse.duration_hours} {m.common_hours_short()}
                </p>
              </div>

              {/* Quick test jump button */}
              {activeTab !== 'test' && (
                <button
                  onClick={() => handleStartTest()}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold uppercase tracking-wider transition shadow-sm flex items-center space-x-2 self-start sm:self-auto"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{m.cadet_go_test()}</span>
                </button>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto text-xs font-semibold">
              <button
                type="button"
                disabled={studyTabsLocked}
                onClick={() => setActiveTab('text')}
                className={`py-3 px-4 flex items-center space-x-2 border-b-2 transition ${
                  studyTabsLocked
                    ? 'border-transparent text-slate-400 cursor-not-allowed opacity-50'
                    : activeTab === 'text'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{m.cadet_tab_notes()}</span>
              </button>

              <button
                type="button"
                disabled={studyTabsLocked}
                onClick={() => setActiveTab('presentation')}
                className={`py-3 px-4 flex items-center space-x-2 border-b-2 transition ${
                  studyTabsLocked
                    ? 'border-transparent text-slate-400 cursor-not-allowed opacity-50'
                    : activeTab === 'presentation'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>{m.cadet_tab_slides()}</span>
              </button>

              <button
                type="button"
                disabled={studyTabsLocked}
                onClick={() => setActiveTab('video')}
                className={`py-3 px-4 flex items-center space-x-2 border-b-2 transition ${
                  studyTabsLocked
                    ? 'border-transparent text-slate-400 cursor-not-allowed opacity-50'
                    : activeTab === 'video'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Play className="w-4 h-4" />
                <span>{m.cadet_tab_video()}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'test' && !testResult) return;
                  handleStartTest();
                }}
                className={`py-3 px-4 flex items-center space-x-2 border-b-2 transition ${
                  activeTab === 'test'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-emerald-700 hover:text-emerald-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{m.cadet_go_test()}</span>
              </button>
            </div>

            {/* Tab 1: Presentation */}
            {activeTab === 'presentation' && (
              <div className="space-y-4">
                <PresentationViewer
                  slides={activeCourse.slides || []}
                  courseTitle={activeCourse.title}
                />
              </div>
            )}

            {/* Tab 2: Text summary */}
            {activeTab === 'text' && (
              <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4 select-none anti-cheat-protected">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">
                    {m.cadet_tab_notes()}
                  </h3>
                  <span className="text-xs text-slate-400">{m.cadet_copy_protected()}</span>
                </div>
                <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-line text-slate-700">
                  {activeCourse.text_content || m.common_loading()}
                </div>
              </div>
            )}

            {/* Tab 3: Video */}
            {activeTab === 'video' && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  {m.cadet_tab_video()}
                </h3>
                <div className="aspect-video w-full bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center text-white">
                  {activeCourse.video_url ? (
                    <iframe
                      src={activeCourse.video_url}
                      title={m.cadet_tab_video()}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <p className="text-xs text-slate-400">{m.cadet_video_loading()}</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 4: Interactive Test Engine */}
            {activeTab === 'test' && (
              <div className="space-y-6">
                {testResult ? (
                  /* TEST RESULTS & DIGITAL PROTOCOL VIEW */
                  <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden space-y-6 p-6 sm:p-8">
                    {/* Status header */}
                    <div
                      className={`p-6 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        testResult.passed
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                          : 'bg-red-50 border-red-200 text-red-950'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 ${
                            testResult.passed ? 'bg-emerald-600' : 'bg-red-600'
                          }`}
                        >
                          {testResult.passed ? <Check className="w-7 h-7" /> : <X className="w-7 h-7" />}
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider block opacity-75">
                            {m.cadet_score({ score: testResult.score, max: testResult.max_score, pct: testResult.percentage })}
                          </span>
                          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                            {testResult.passed
                              ? m.cadet_passed()
                              : testResult.aborted
                                ? m.cadet_failed()
                                : m.cadet_failed()}
                          </h2>
                          <p className="text-xs mt-0.5">
                            {testResult.passed
                              ? m.cadet_passed()
                              : testResult.remark
                                ? testResult.remark
                                : m.cadet_failed()}
                          </p>
                        </div>
                      </div>

                      <div className="text-right sm:border-l sm:border-emerald-200 sm:pl-6">
                        <div className="text-3xl font-extrabold font-mono">
                          {testResult.score} / {testResult.max_score}
                        </div>
                        <div className="text-xs font-semibold">
                          {m.cadet_score({ score: testResult.score, max: testResult.max_score, pct: testResult.percentage })}
                        </div>
                      </div>
                    </div>

                    {/* Official Digital Protocol Details */}
                    <div className="border border-slate-200 rounded-xl p-6 bg-slate-50/50 space-y-4 text-xs text-slate-700">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="w-4 h-4 text-slate-900" />
                          <span className="font-bold text-slate-900 text-sm">
                            {m.cadet_protocol()}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                          {testResult.protocol_id}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-slate-400 block">{m.cadet_fio_label()}</span>
                          <span className="font-bold text-slate-900">{testResult.cadet_fio}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{m.cadet_tc_label()}</span>
                          <span className="font-semibold text-slate-900">{user.tc_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{m.cadet_group_label()}</span>
                          <span className="font-semibold text-slate-900">{user.group_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{m.cadet_program()}</span>
                          <span className="font-semibold text-slate-900">{testResult.course_title}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{m.cadet_datetime()}</span>
                          <span className="font-mono text-slate-900">
                            {new Date(testResult.completed_at).toLocaleString('ru-RU')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{m.cadet_remarks()}</span>
                          <span className={testResult.remark || testResult.cheat_flags > 0 ? 'text-red-600 font-bold' : 'text-emerald-700'}>
                            {testResult.remark
                              ? testResult.remark
                              : testResult.cheat_flags > 0
                                ? m.cadet_violations({ n: testResult.cheat_flags })
                                : m.cadet_no_remarks()}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-wrap gap-3">
                        <button
                          onClick={() => window.print()}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-sm font-semibold flex items-center space-x-2 transition"
                        >
                          <Printer className="w-4 h-4" />
                          <span>{m.cadet_print()}</span>
                        </button>
                        <button
                          onClick={() => handleStartTest({ forceNew: true })}
                          className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-sm font-semibold flex items-center space-x-2 transition"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>{m.cadet_retry()}</span>
                        </button>
                      </div>
                    </div>

                    {/* Questions review */}
                    {testResult.review && testResult.review.length > 0 && (
                      <div className="space-y-3 pt-4">
                        <h4 className="font-bold text-sm text-slate-900">
                          {m.cadet_review()}:
                        </h4>
                        <div className="space-y-3">
                          {testResult.review.map((item, idx) => (
                            <div
                              key={idx}
                              className={`p-4 rounded-lg border text-sm space-y-2 ${
                                item.is_correct
                                  ? 'bg-emerald-50/50 border-emerald-200'
                                  : 'bg-red-50/50 border-red-200'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-slate-900">
                                  {m.cms_question_n({ n: idx + 1, text: item.text })}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                    item.is_correct
                                      ? 'bg-emerald-200 text-emerald-800'
                                      : 'bg-red-200 text-red-800'
                                  }`}
                                >
                                  {item.is_correct ? m.cadet_correct() : m.cadet_incorrect()}
                                </span>
                              </div>

                              <div className="space-y-1 text-slate-600 pl-2 border-l-2 border-slate-300">
                                {item.options.map((opt, optIdx) => (
                                  <div
                                    key={optIdx}
                                    className={`py-0.5 ${
                                      optIdx === item.correct_option
                                        ? 'text-emerald-700 font-bold'
                                        : optIdx === item.selected_option
                                        ? 'text-red-600 line-through'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {optIdx === item.correct_option ? '✓ ' : optIdx === item.selected_option ? '✗ ' : '• '}
                                    {opt}
                                  </div>
                                ))}
                              </div>

                              {item.explanation && (
                                <p className="text-xs text-slate-500 italic pt-1">
                                  {m.cadet_explanation()} {item.explanation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : questions.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                    {m.common_loading()}
                  </div>
                ) : (
                  /* ACTIVE TEST IN PROGRESS */
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 select-none anti-cheat-protected">
                    {/* Test top bar */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4 text-xs">
                      <div>
                        <span className="text-slate-400 block text-xs">{m.cadet_tested()}</span>
                        <span className="font-bold text-slate-900">{user.cadet_fio}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1.5 text-slate-700 font-mono text-sm font-bold bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
                          <Clock className="w-4 h-4 text-slate-900" />
                          <span>{formatTime(timeRemaining)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{m.cadet_q_of({ current: currentQuestionIndex + 1, total: questions.length })}</span>
                        <span>
                          {Object.keys(selectedAnswers).length} / {questions.length}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full transition-all duration-300"
                          style={{
                            width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Active Question Box */}
                    {questions[currentQuestionIndex] && (
                      <div className="space-y-5 py-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                          {questions[currentQuestionIndex].text}
                        </h3>

                        <div className="space-y-2.5">
                          {questions[currentQuestionIndex].options.map((optionText, optIdx) => {
                            const isSelected = selectedAnswers[questions[currentQuestionIndex].id] === optIdx;
                            return (
                              <div
                                key={optIdx}
                                onClick={() => {
                                  setSelectedAnswers({
                                    ...selectedAnswers,
                                    [questions[currentQuestionIndex].id]: optIdx
                                  });
                                }}
                                className={`p-4 rounded-lg border text-xs sm:text-sm cursor-pointer transition flex items-start space-x-3 ${
                                  isSelected
                                    ? 'bg-blue-50/80 border-blue-600 text-blue-950 font-medium ring-1 ring-blue-600'
                                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? 'border-blue-600 bg-blue-600 text-white'
                                      : 'border-slate-300'
                                  }`}
                                >
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <span className="leading-relaxed">{optionText}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Bottom Navigation Buttons */}
                    <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-5 flex-wrap sm:flex-nowrap">
                      <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="px-4 py-2 border border-slate-300 rounded text-sm font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition shrink-0"
                      >
                        {m.common_back()}
                      </button>

                      <QuestionPagination
                        total={questions.length}
                        currentIndex={currentQuestionIndex}
                        onChange={setCurrentQuestionIndex}
                      />

                      {currentQuestionIndex < questions.length - 1 ? (
                        <button
                          onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold transition flex items-center space-x-1.5 shrink-0"
                        >
                          <span>{m.cadet_next()}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmitTest}
                          disabled={testSubmitting}
                          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white rounded text-sm font-bold uppercase tracking-wider transition shadow-sm flex items-center space-x-2 shrink-0"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{testSubmitting ? m.common_loading() : m.cadet_submit()}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
