import React, { useEffect, useState } from "react";
import { Check, Copy, Plus } from "lucide-react";
import { api } from "../api/client";
import { m } from "../paraglide/messages.js";
import { Course, GroupItem, UserSession } from "../types";

interface TcGroupAccessProps {
  user: UserSession;
  onChanged?: () => void;
}

const emptyForm = () => ({
  name: "",
  group_code: "",
  login: "",
  password: "",
  enterprise_id: "" as number | "",
  new_enterprise_name: "",
  course_ids: [] as number[],
});

export const TcGroupAccess: React.FC<TcGroupAccessProps> = ({ user, onChanged }) => {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enterprises, setEnterprises] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [copiedMemo, setCopiedMemo] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [groupsData, coursesData, enterprisesData] = await Promise.all([
        api.getManagedGroups(),
        api.getCourses(),
        api.getManagedEnterprises(),
      ]);
      setGroups(groupsData);
      setCourses(coursesData);
      setEnterprises(enterprisesData);
    } catch (err: any) {
      setError(err.message || m.common_error());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const copyCadetMemo = (group: GroupItem) => {
    const text =
      `${m.fio_title()}\n` +
      `${m.cadet_group_label()} ${group.name}\n` +
      `${window.location.origin}\n` +
      `${m.common_login()}: ${group.login}\n` +
      `${m.common_password()}: ${group.password || ""}\n` +
      `${m.fio_trace()}`;
    navigator.clipboard.writeText(text);
    setCopiedMemo(group.id);
    setTimeout(() => setCopiedMemo(null), 2500);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createManagedGroup({
        name: form.name,
        group_code: form.group_code,
        login: form.login,
        password: form.password,
        enterprise_id: form.enterprise_id === "" ? undefined : form.enterprise_id,
        new_enterprise_name: form.new_enterprise_name.trim() || undefined,
        course_ids: form.course_ids,
      });
      setNewOpen(false);
      setForm(emptyForm());
      await loadAll();
      onChanged?.();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCourse = async (
    groupId: number,
    courseId: number,
    current: number[] = [],
  ) => {
    const nextIds = current.includes(courseId)
      ? current.filter((id) => id !== courseId)
      : [...current, courseId];
    try {
      await api.updateManagedGroupCourses(groupId, nextIds);
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, course_ids: nextIds } : g)),
      );
      onChanged?.();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleFormCourse = (courseId: number) => {
    setForm((prev) => ({
      ...prev,
      course_ids: prev.course_ids.includes(courseId)
        ? prev.course_ids.filter((id) => id !== courseId)
        : [...prev.course_ids, courseId],
    }));
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 text-sm">
        {m.common_loading()}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {m.sa_groups_title()}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {m.sa_groups_sub()} {user.tc_name ? `${user.tc_name}.` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm(emptyForm());
            setNewOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center space-x-2 shadow-sm transition self-start"
        >
          <Plus className="w-4 h-4" />
          <span>{m.sa_create_group()}</span>
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-xl border border-dashed border-slate-200">
          {m.sa_groups_sub()}
        </div>
      ) : (
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
                    <h3 className="font-bold text-sm text-slate-900">{group.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {group.enterprise_name
                      ? `${m.cadet_enterprise()} ${group.enterprise_name}`
                      : m.common_no()}
                  </p>
                </div>
                <button
                  type="button"
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

              <div className="bg-slate-50 p-3 rounded text-xs text-slate-700 flex flex-wrap gap-x-6 gap-y-1 font-mono">
                <div>
                  {m.common_login()}:{" "}
                  <strong className="text-slate-900">{group.login}</strong>
                </div>
                <div>
                  {m.common_password()}:{" "}
                  <strong className="text-slate-900">{group.password}</strong>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  {m.sa_groups_title()}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {courses.map((course) => {
                    const isAssigned = (group.course_ids || []).includes(course.id);
                    return (
                      <button
                        type="button"
                        key={course.id}
                        onClick={() =>
                          handleToggleCourse(group.id, course.id, group.course_ids)
                        }
                        className={`p-2.5 rounded-lg border text-xs text-left transition flex items-center space-x-2 ${
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
                        <span className="min-w-0">
                          <span className="block truncate">{course.title}</span>
                          <span className="block font-mono text-[10px] text-slate-400 font-normal">
                            {course.code}
                            {course.owner_tc_id === user.tc_id
                              ? ` · ${m.tccms_own_badge()}`
                              : ` · ${m.tccms_catalog_badge()}`}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {newOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 my-8">
            <h3 className="font-bold text-base text-slate-900">
              {m.sa_create_group()}
            </h3>
            <p className="text-xs text-slate-500">
              {m.sa_groups_sub()}
            </p>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">{m.cadet_group_label()}</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">{m.cadet_group()}</label>
                  <input
                    type="text"
                    required
                    value={form.group_code}
                    onChange={(e) => setForm({ ...form, group_code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">{m.cadet_enterprise()}</label>
                  <select
                    value={form.enterprise_id}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        enterprise_id: e.target.value ? Number(e.target.value) : "",
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1 bg-white"
                  >
                    <option value="">{m.common_no()}</option>
                    {enterprises.map((ent) => (
                      <option key={ent.id} value={ent.id}>
                        {ent.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700">
                  {m.cadet_enterprise()}
                </label>
                <input
                  type="text"
                  value={form.new_enterprise_name}
                  onChange={(e) =>
                    setForm({ ...form, new_enterprise_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">{m.common_login()}</label>
                  <input
                    type="text"
                    required
                    value={form.login}
                    onChange={(e) => setForm({ ...form, login: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">{m.common_password()}</label>
                  <input
                    type="text"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded mt-1 font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">
                  {m.sa_groups_title()}
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-200 rounded p-2">
                  {courses.length === 0 ? (
                    <p className="text-slate-400">{m.tccms_empty()}</p>
                  ) : (
                    courses.map((course) => (
                      <label
                        key={course.id}
                        className="flex items-start gap-2 py-1 text-slate-700"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 accent-blue-600"
                          checked={form.course_ids.includes(course.id)}
                          onChange={() => toggleFormCourse(course.id)}
                        />
                        <span>
                          {course.title}
                          <span className="block text-slate-400 font-mono">
                            {course.code}
                          </span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewOpen(false)}
                  className="px-4 py-2 border rounded text-slate-700"
                >
                  {m.common_cancel()}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded font-semibold disabled:opacity-60"
                >
                  {saving ? m.common_loading() : m.sa_create_group()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
