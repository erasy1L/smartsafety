import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  HelpCircle,
  Info,
  Plus,
  Trash2,
  Lock,
} from "lucide-react";
import { api } from "../api/client";
import { m } from "../paraglide/messages.js";
import { Course, GroupItem, Question, UserSession } from "../types";

const CATEGORIES = [
  "Охрана труда",
  "Промышленная безопасность",
  "Пожарная безопасность",
  "Электробезопасность",
];

type SlideDraft = {
  title: string;
  subtitle: string;
  contentText: string;
  law_reference: string;
  warning: string;
};

type CourseFormState = {
  title: string;
  category: string;
  code: string;
  description: string;
  duration_hours: number;
  video_url: string;
  text_content: string;
  slides: SlideDraft[];
  group_ids: number[];
};

const emptySlide = (): SlideDraft => ({
  title: "",
  subtitle: "Нормативные основы Республики Казахстан",
  contentText: "",
  law_reference: "Трудовой кодекс РК ст. 79, 181, 182",
  warning: "",
});

const emptyCourseForm = (): CourseFormState => ({
  title: "",
  category: "Охрана труда",
  code: "",
  description: "",
  duration_hours: 40,
  video_url: "",
  text_content: "",
  slides: [emptySlide()],
  group_ids: [],
});

function slidesToPayload(slides: SlideDraft[]) {
  return slides
    .filter((slide) => slide.title.trim() || slide.contentText.trim())
    .map((slide, index) => ({
      id: index + 1,
      title: slide.title.trim() || `${m.cadet_tab_slides()} ${index + 1}`,
      subtitle: slide.subtitle.trim(),
      content: slide.contentText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      law_reference: slide.law_reference.trim(),
      warning: slide.warning.trim(),
    }));
}

function FormatRules() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            {m.tccms_format({ code: "SmartSafety" })}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {m.tccms_own_sub()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-1.5">
          <p className="font-bold text-slate-800">{m.tccms_own_title()}</p>
          <ul className="text-slate-600 space-y-1 list-disc pl-4">
            <li>{m.tccms_format({ code: "BIOT-KZ-2026" })}</li>
            <li>{m.tccms_own_sub()}</li>
            <li>{m.cadet_tab_notes()}</li>
            <li>{m.cadet_tab_video()}</li>
          </ul>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-1.5">
          <p className="font-bold text-slate-800">{m.cadet_tab_slides()}</p>
          <ul className="text-slate-600 space-y-1 list-disc pl-4">
            <li>{m.cadet_tab_slides()}</li>
            <li>{m.cadet_tab_notes()}</li>
            <li>{m.cadet_explanation()}</li>
            <li>{m.cms_add_question()}</li>
          </ul>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-1.5">
          <p className="font-bold text-slate-800">{m.cms_add_question()}</p>
          <ul className="text-slate-600 space-y-1 list-disc pl-4">
            <li>{m.cadet_program()}</li>
            <li>{m.tccms_format({ code: "BIOT" })}</li>
            <li>{m.cadet_explanation()}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

interface TcCourseCmsProps {
  user: UserSession;
  onCatalogChanged?: () => void;
}

export const TcCourseCms: React.FC<TcCourseCmsProps> = ({
  user,
  onCatalogChanged,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseQuestions, setCourseQuestions] = useState<Question[]>([]);
  const [newCourseOpen, setNewCourseOpen] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);
  const [courseForm, setCourseForm] = useState<CourseFormState>(emptyCourseForm());

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

  const ownCourses = useMemo(
    () => courses.filter((c) => c.owner_tc_id === user.tc_id),
    [courses, user.tc_id],
  );
  const platformCourses = useMemo(
    () => courses.filter((c) => !c.owner_tc_id),
    [courses],
  );

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [coursesData, groupsData] = await Promise.all([
        api.getCourses(),
        api.getReportGroups(),
      ]);
      setCourses(coursesData);
      setGroups(groupsData);
    } catch (err: any) {
      setError(err.message || m.tccms_error());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const refreshCatalog = () => {
    loadAll();
    onCatalogChanged?.();
  };

  const handleOpenQuestions = async (course: Course) => {
    setSelectedCourse(course);
    try {
      const qs = await api.getQuestions(course.id);
      setCourseQuestions(qs);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCourse(true);
    try {
      await api.createCourse({
        title: courseForm.title,
        category: courseForm.category,
        code: courseForm.code.trim(),
        description: courseForm.description,
        duration_hours: Number(courseForm.duration_hours) || 40,
        video_url: courseForm.video_url,
        text_content: courseForm.text_content,
        slides: slidesToPayload(courseForm.slides),
        group_ids: courseForm.group_ids,
      });
      setNewCourseOpen(false);
      setCourseForm(emptyCourseForm());
      refreshCatalog();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm(m.tccms_delete())) {
      return;
    }
    try {
      await api.deleteCourse(id);
      if (selectedCourse?.id === id) {
        setSelectedCourse(null);
      }
      refreshCatalog();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleGroup = async (course: Course, groupId: number) => {
    const current = groups
      .filter((g) => g.course_ids?.includes(course.id))
      .map((g) => g.id);
    const next = current.includes(groupId)
      ? current.filter((id) => id !== groupId)
      : [...current, groupId];
    try {
      await api.assignCourseGroups(course.id, next);
      refreshCatalog();
    } catch (err: any) {
      alert(err.message);
    }
  };

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
      refreshCatalog();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteQuestion = async (qId: number) => {
    if (!confirm(m.common_delete())) return;
    try {
      await api.deleteQuestion(qId);
      if (selectedCourse) handleOpenQuestions(selectedCourse);
      refreshCatalog();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        {m.tccms_loading()}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
        {error}
      </div>
    );
  }

  if (selectedCourse) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <button
              onClick={() => setSelectedCourse(null)}
              className="text-sm text-blue-600 hover:underline mb-1 block"
            >
              {m.tccms_back()}
            </button>
            <h2 className="text-lg font-bold text-slate-900">
              {m.cms_bank_title({ title: selectedCourse.title })}
            </h2>
            <p className="text-xs text-slate-500">
              {m.tccms_format({ code: selectedCourse.code })}
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
                      {optIdx === q.correct_option_index ? "✓ " : "• "}
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

        {newQuestionOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
              <h3 className="font-bold text-base text-slate-900">
                {m.cms_add_question()}
              </h3>
              <p className="text-xs text-slate-500">
                {m.tccms_format({ code: selectedCourse.code })}
              </p>
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
                    required
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
                    className="px-4 py-2 bg-emerald-700 text-white rounded font-semibold"
                  >
                    {m.common_save()}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FormatRules />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">{m.tccms_own_title()}</h2>
          <p className="text-xs text-slate-500">
            {m.tccms_own_sub()}
          </p>
        </div>
        <button
          onClick={() => {
            setCourseForm(emptyCourseForm());
            setNewCourseOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center space-x-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>{m.tccms_add()}</span>
        </button>
      </div>

      {ownCourses.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-xl border border-dashed border-slate-200">
          {m.tccms_empty()}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ownCourses.map((c) => (
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
                <h3 className="font-bold text-sm text-slate-900 leading-snug">{c.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2">{c.description}</p>
                <div className="pt-2 text-xs text-slate-500 flex items-center space-x-3">
                  <span>{c.duration_hours} {m.common_hours_short()}</span>
                  <span>•</span>
                  <span className="font-semibold text-blue-700">
                    {m.cms_questions_bank({ count: c.question_count || 0 })}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {m.tccms_assign()}
                </p>
                {groups.length === 0 ? (
                  <p className="text-xs text-slate-400">{m.tccms_no_groups()}</p>
                ) : (
                  <div className="space-y-1.5 max-h-28 overflow-y-auto">
                    {groups.map((g) => (
                      <label
                        key={g.id}
                        className="flex items-start gap-2 text-xs text-slate-700"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 accent-blue-600"
                          checked={Boolean(g.course_ids?.includes(c.id))}
                          onChange={() => handleToggleGroup(c, g.id)}
                        />
                        <span>
                          {g.name}
                          {g.enterprise_name ? (
                            <span className="text-slate-400"> · {g.enterprise_name}</span>
                          ) : null}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleOpenQuestions(c)}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-sm font-medium flex items-center space-x-1.5 transition"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{m.tccms_questions()}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(c.id)}
                    title={m.tccms_delete()}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {platformCourses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-600">
            <Lock className="w-4 h-4" />
            <h3 className="text-sm font-bold">{m.tccms_catalog()}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformCourses.map((c) => (
              <div
                key={c.id}
                className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {c.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{c.code}</span>
                </div>
                <h4 className="font-semibold text-sm text-slate-800">{c.title}</h4>
                <p className="text-xs text-slate-500">
                  {c.duration_hours} {m.common_hours_short()} • {m.cms_questions_bank({ count: c.question_count || 0 })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {newCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 my-8">
            <div className="flex items-start gap-2">
              <BookOpen className="w-5 h-5 text-blue-700 mt-0.5" />
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {m.tccms_add()}
                </h3>
                <p className="text-xs text-slate-500">
                  {m.tccms_own_sub()}
                </p>
              </div>
            </div>
            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">{m.cms_create_course()}</label>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">{m.common_bin()}</label>
                  <input
                    type="text"
                    required
                    value={courseForm.code}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, code: e.target.value })
                    }
                    placeholder="BIOT-KZ-2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">{m.billing_tariff()}</label>
                  <select
                    value={courseForm.category}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1 bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === "Охрана труда"
                          ? m.cat_ohs()
                          : cat === "Промышленная безопасность"
                            ? m.cat_ind()
                            : cat === "Пожарная безопасность"
                              ? m.cat_fire()
                              : m.cat_electro()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">{m.common_hours_short()}</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={courseForm.duration_hours}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        duration_hours: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700">{m.cms_platform_sub()}</label>
                <textarea
                  rows={2}
                  value={courseForm.description}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700">
                  {m.cadet_tab_notes()}
                </label>
                <textarea
                  rows={4}
                  value={courseForm.text_content}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, text_content: e.target.value })
                  }
                  placeholder={"## 1. Общие положения\nСогласно ст. 182 ТК РК работодатель обязан..."}
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700">
                  {m.cadet_tab_video()}
                </label>
                <input
                  type="text"
                  value={courseForm.video_url}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, video_url: e.target.value })
                  }
                  placeholder="https://"
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                />
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">{m.cadet_tab_slides()}</label>
                  <button
                    type="button"
                    onClick={() =>
                      setCourseForm({
                        ...courseForm,
                        slides: [...courseForm.slides, emptySlide()],
                      })
                    }
                    className="text-blue-700 font-semibold hover:underline"
                  >
                    + {m.cadet_tab_slides()}
                  </button>
                </div>
                {courseForm.slides.map((slide, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">{m.cadet_tab_slides()} {idx + 1}</span>
                      {courseForm.slides.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setCourseForm({
                              ...courseForm,
                              slides: courseForm.slides.filter((_, i) => i !== idx),
                            })
                          }
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={slide.title}
                      onChange={(e) => {
                        const slides = [...courseForm.slides];
                        slides[idx] = { ...slide, title: e.target.value };
                        setCourseForm({ ...courseForm, slides });
                      }}
                      placeholder={m.cadet_tab_slides()}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
                    />
                    <input
                      type="text"
                      value={slide.subtitle}
                      onChange={(e) => {
                        const slides = [...courseForm.slides];
                        slides[idx] = { ...slide, subtitle: e.target.value };
                        setCourseForm({ ...courseForm, slides });
                      }}
                      placeholder={m.cadet_tab_notes()}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
                    />
                    <textarea
                      required
                      rows={3}
                      value={slide.contentText}
                      onChange={(e) => {
                        const slides = [...courseForm.slides];
                        slides[idx] = { ...slide, contentText: e.target.value };
                        setCourseForm({ ...courseForm, slides });
                      }}
                      placeholder={"Тезис 1\nТезис 2\nТезис 3"}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
                    />
                    <input
                      type="text"
                      value={slide.law_reference}
                      onChange={(e) => {
                        const slides = [...courseForm.slides];
                        slides[idx] = { ...slide, law_reference: e.target.value };
                        setCourseForm({ ...courseForm, slides });
                      }}
                      placeholder="Трудовой кодекс РК ст. 79, 182"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
                    />
                    <input
                      type="text"
                      value={slide.warning}
                      onChange={(e) => {
                        const slides = [...courseForm.slides];
                        slides[idx] = { ...slide, warning: e.target.value };
                        setCourseForm({ ...courseForm, slides });
                      }}
                      placeholder={m.common_no()}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>
                ))}
              </div>

              {groups.length > 0 && (
                <div className="space-y-2">
                  <label className="block font-semibold text-slate-700">
                    {m.tccms_assign()}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {groups.map((g) => (
                      <label key={g.id} className="flex items-start gap-2 text-slate-700">
                        <input
                          type="checkbox"
                          className="mt-0.5 accent-blue-600"
                          checked={courseForm.group_ids.includes(g.id)}
                          onChange={() => {
                            const next = courseForm.group_ids.includes(g.id)
                              ? courseForm.group_ids.filter((id) => id !== g.id)
                              : [...courseForm.group_ids, g.id];
                            setCourseForm({ ...courseForm, group_ids: next });
                          }}
                        />
                        <span>{g.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

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
                  disabled={savingCourse}
                  className="px-4 py-2 bg-blue-600 text-white rounded font-semibold disabled:opacity-60"
                >
                  {savingCourse ? m.common_loading() : m.cms_create_course()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
