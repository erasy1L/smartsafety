import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Users,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  XCircle,
  Download,
  Filter,
  ShieldCheck,
  TrendingUp,
  Briefcase,
  BookOpen,
  Lock,
  RefreshCw,
  AlertTriangle,
  Eye,
  Printer,
  X,
  Info,
  FileText,
  Check,
  CalendarDays,
} from "lucide-react";
import { api } from "../api/client";
import {
  DataTable,
  DataTableColumn,
  SortDirection,
} from "../components/DataTable";
import { DEFAULT_PAGE_SIZE } from "../components/TablePagination";
import { HoverPopover } from "../components/HoverPopover";
import { TcCourseCms } from "../components/TcCourseCms";
import { BillingSection } from "../components/BillingSection";
import { TcGroupAccess } from "../components/TcGroupAccess";
import {
  Course,
  GroupItem,
  ReportResult,
  ReportResultsStats,
  UserSession,
} from "../types";
import { m } from "../paraglide/messages.js";

function countLabel(
  n: number,
  one: (inputs: { n: number }) => string,
  few: (inputs: { n: number }) => string,
  many: (inputs: { n: number }) => string
) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  const inputs = { n };
  if (abs > 10 && abs < 20) return many(inputs);
  if (last === 1) return one(inputs);
  if (last >= 2 && last <= 4) return few(inputs);
  return many(inputs);
}

interface TcAdminPortalProps {
  user: UserSession;
  onNavigate: (path: string) => void;
}

export const TcAdminPortal: React.FC<TcAdminPortalProps> = ({ user }) => {
  const isCompanyAdmin = user.role === "company_admin";
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [results, setResults] = useState<ReportResult[]>([]);
  const [resultsTotal, setResultsTotal] = useState(0);
  const [resultsStats, setResultsStats] = useState<ReportResultsStats | null>(
    null,
  );
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(
    undefined,
  );
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<
    number | undefined
  >(undefined);
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>(
    undefined,
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchFioInput, setSearchFioInput] = useState("");
  const [searchFio, setSearchFio] = useState("");
  const [passedFilter, setPassedFilter] = useState<string>("");
  const [scoreFrom, setScoreFrom] = useState("");
  const [scoreTo, setScoreTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortId, setSortId] = useState("completed_at");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portalTab, setPortalTab] = useState<
    "registry" | "cms" | "groups" | "billing"
  >("registry");

  // Selected result detail modal state
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const scoreFromNum =
    scoreFrom !== "" && Number.isFinite(Number(scoreFrom))
      ? Number(scoreFrom)
      : undefined;
  const scoreToNum =
    scoreTo !== "" && Number.isFinite(Number(scoreTo))
      ? Number(scoreTo)
      : undefined;

  const resultFilters = {
    groupId: selectedGroupId,
    enterpriseId: selectedEnterpriseId,
    courseId: selectedCourseId,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    searchFio,
    passed: passedFilter,
    scoreFrom: scoreFromNum,
    scoreTo: scoreToNum,
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [groupsData, coursesData, resultsData] = await Promise.all([
        api.getReportGroups(),
        api.getCourses(),
        api.getReportResults({
          ...resultFilters,
          page,
          pageSize,
          sortBy: sortId,
          sortDir,
        }),
      ]);
      setGroups(groupsData);
      setCourses(coursesData);
      setResults(resultsData.items);
      setResultsTotal(resultsData.total);
      setResultsStats(resultsData.stats);
      setPage(resultsData.page);
    } catch (err: any) {
      setError(err.message || m.tc_loading());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchFio((prev) => {
        const next = searchFioInput.trim();
        if (prev !== next) setPage(1);
        return next;
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchFioInput]);

  useEffect(() => {
    fetchData();
  }, [
    selectedGroupId,
    selectedEnterpriseId,
    selectedCourseId,
    dateFrom,
    dateTo,
    passedFilter,
    scoreFrom,
    scoreTo,
    searchFio,
    page,
    pageSize,
    sortId,
    sortDir,
  ]);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      await api.downloadExcel(resultFilters);
    } catch (err: any) {
      alert(err.message || m.common_error());
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setSelectedGroupId(undefined);
    setSelectedEnterpriseId(undefined);
    setSelectedCourseId(undefined);
    setDateFrom("");
    setDateTo("");
    setSearchFioInput("");
    setSearchFio("");
    setPassedFilter("");
    setScoreFrom("");
    setScoreTo("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    selectedGroupId ||
    selectedEnterpriseId ||
    selectedCourseId ||
    dateFrom ||
    dateTo ||
    searchFioInput ||
    passedFilter ||
    scoreFrom ||
    scoreTo,
  );

  const enterprises = useMemo(() => {
    const map = new Map<number, string>();
    for (const group of groups) {
      if (group.enterprise_id && group.enterprise_name) {
        map.set(group.enterprise_id, group.enterprise_name);
      }
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [groups]);

  // Click on row / protocol to view full details
  const handleRowClick = async (row: ReportResult) => {
    try {
      setLoadingDetail(true);
      const detail = await api.getResultDetails(row.id);
      setSelectedDetail(detail);
    } catch (err: any) {
      alert(err.message || m.common_error());
    } finally {
      setLoadingDetail(false);
    }
  };

  const totalCertified = resultsStats?.total ?? 0;
  const passedCount = resultsStats?.passedCount ?? 0;
  const passRate =
    totalCertified > 0 ? Math.round((passedCount / totalCertified) * 100) : 0;
  const uniqueEnterprises = resultsStats?.uniqueEnterprises ?? 0;
  const uniqueCount = resultsStats?.uniqueCount ?? 0;
  const repeatCount = resultsStats?.repeatCount ?? 0;
  const uniquePassed = resultsStats?.uniquePassed ?? 0;
  const repeatPassed = resultsStats?.repeatPassed ?? 0;

  const resultColumns: DataTableColumn<ReportResult>[] = [
    {
      id: "protocol_id",
      header: m.cadet_protocol(),
      width: 170,
      minWidth: 120,
      sortable: true,
      sortValue: (row) => row.protocol_id,
      render: (row) => (
        <span className="underline decoration-blue-300 underline-offset-2 flex items-center space-x-1 font-mono font-bold text-blue-700 group-hover:text-blue-900">
          <span>{row.protocol_id}</span>
          <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
        </span>
      ),
    },
    {
      id: "cadet_fio",
      header: m.cadet_fio_label(),
      width: 240,
      minWidth: 140,
      sortable: true,
      sortValue: (row) => row.cadet_fio,
      render: (row) => (
        <span className="font-bold text-slate-900">{row.cadet_fio}</span>
      ),
    },
    {
      id: "group",
      header: m.cadet_group_label(),
      width: 180,
      minWidth: 130,
      sortable: true,
      sortValue: (row) => row.group_name,
      render: (row) => (
        <span className="text-slate-900 font-semibold">{row.group_name}</span>
      ),
    },
    {
      id: "enterprise",
      header: m.tc_all_companies(),
      width: 180,
      minWidth: 120,
      sortable: true,
      sortValue: (row) => row.enterprise_name || m.common_no(),
      render: (row) => (
        <span className="text-slate-700">
          {row.enterprise_name || m.common_no()}
        </span>
      ),
    },
    {
      id: "course_title",
      header: m.tc_all_courses(),
      width: 240,
      minWidth: 140,
      sortable: true,
      sortValue: (row) => row.course_title,
      render: (row) => (
        <span
          className="block truncate text-slate-800"
          title={row.course_title}
        >
          {row.course_title}
        </span>
      ),
    },
    {
      id: "score",
      header: m.tc_pass_rate(),
      width: 130,
      minWidth: 100,
      align: "center",
      sortable: true,
      sortValue: (row) => row.percentage,
      render: (row) => (
        <div className="font-mono">
          <span className="font-bold text-base text-slate-900">
            {row.score}/{row.max_score}
          </span>
          <span className="text-sm text-slate-500 block">
            ({row.percentage}%)
          </span>
        </div>
      ),
    },
    {
      id: "status",
      header: m.tc_all_statuses(),
      width: 120,
      minWidth: 90,
      align: "center",
      sortable: true,
      sortValue: (row) => row.passed,
      render: (row) =>
        row.passed === 1 ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            {m.cadet_passed()}
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
            {m.cadet_failed()}
          </span>
        ),
    },
    {
      id: "completed_at",
      header: m.cadet_datetime(),
      width: 180,
      minWidth: 130,
      sortable: true,
      sortValue: (row) => new Date(row.completed_at).getTime(),
      render: (row) => (
        <span className="text-slate-500 text-xs whitespace-nowrap">
          {new Date(row.completed_at).toLocaleString("ru-RU")}
        </span>
      ),
    },
    {
      id: "anticheat",
      header: m.cadet_remarks(),
      width: 130,
      minWidth: 110,
      align: "center",
      sortable: true,
      sortValue: (row) => row.cheat_flags,
      render: (row) =>
        row.remark || row.cheat_flags > 0 ? (
          <span
            className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium"
            title={
              row.remark
                ? row.remark
                : m.cheat_blur()
            }
          >
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>
              {row.remark ? m.cadet_failed() : m.cadet_violations({ n: row.cheat_flags })}
            </span>
          </span>
        ) : (
          <span className="text-slate-400 text-[11px]">{m.common_no()}</span>
        ),
    },
    {
      id: "action",
      header: m.tc_more(),
      width: 140,
      minWidth: 110,
      align: "center",
      sortable: false,
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(row);
          }}
          className="px-4 py-1.5 bg-white group-hover:bg-blue-600 group-hover:text-white text-slate-700 border border-slate-300 group-hover:border-blue-600 rounded text-sm font-semibold inline-flex items-center space-x-1 transition shadow-sm"
        >
          <Eye className="w-3 h-3" />
          <span>{m.tc_more()}</span>
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* 1. TC Director Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-bold text-lg text-white tracking-tight">
                    {isCompanyAdmin
                      ? user.enterprise_name || m.header_company_fallback()
                      : user.tc_name || m.header_tc_fallback()}
                  </h1>
                  <span className="text-[11px] uppercase font-bold tracking-wider bg-slate-800 text-blue-300 px-2 py-0.5 rounded border border-slate-700">
                    {isCompanyAdmin
                      ? m.login_level3()
                      : m.login_level2()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isCompanyAdmin ? m.contacts_name() : m.contacts_name()}
                  <strong className="text-slate-200">{user.full_name}</strong>
                  {isCompanyAdmin
                    ? ` • ${m.tc_tab_analytics()}`
                    : ` • ${m.tc_tab_analytics()}`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-lg text-xs text-slate-300">
              {isCompanyAdmin ? (
                <Lock className="w-4 h-4 text-white shrink-0" />
              ) : (
                <BookOpen className="w-4 h-4 text-white shrink-0" />
              )}
              <div>
                <span className="font-semibold block text-slate-200">
                  {isCompanyAdmin
                    ? m.tccms_catalog()
                    : m.tc_tab_courses()}
                </span>
                <span className="text-xs text-slate-400">
                  {isCompanyAdmin
                    ? m.cadet_copy_protected()
                    : m.tccms_own_sub()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isCompanyAdmin && (
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8 flex">
            <button
              type="button"
              onClick={() => setPortalTab("registry")}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition ${
                portalTab === "registry"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {m.tc_tab_analytics()}
            </button>
            <button
              type="button"
              onClick={() => setPortalTab("cms")}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition ${
                portalTab === "cms"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {m.tc_tab_courses()}
            </button>
            <button
              type="button"
              onClick={() => setPortalTab("groups")}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition ${
                portalTab === "groups"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {m.tc_tab_groups()}
            </button>
            <button
              type="button"
              onClick={() => setPortalTab("billing")}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition ${
                portalTab === "billing"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {m.tc_tab_billing()}
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Analytics Dashboard */}
      <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {!isCompanyAdmin && portalTab === "cms" ? (
          <TcCourseCms user={user} onCatalogChanged={fetchData} />
        ) : !isCompanyAdmin && portalTab === "groups" ? (
          <TcGroupAccess user={user} onChanged={fetchData} />
        ) : !isCompanyAdmin && portalTab === "billing" ? (
          <BillingSection />
        ) : (
          <>
        {/* KPI Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <HoverPopover
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1 cursor-help"
            title={m.tc_certified()}
            text={m.tc_certified_hint()}
          >
            <div className="flex items-center justify-between text-slate-800 text-sm font-semibold">
              <span>{m.tc_certified()}</span>
              <Users className="w-5 h-5 text-slate-900" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {totalCertified}{" "}
              <span className="text-xs font-normal text-slate-400">{m.tc_people()}</span>
            </div>
            <div className="text-xs text-slate-500">
              {countLabel(uniqueCount, m.tc_unique_one, m.tc_unique_few, m.tc_unique_many)}
              {" · "}
              {countLabel(repeatCount, m.tc_repeat_one, m.tc_repeat_few, m.tc_repeat_many)}
            </div>
          </HoverPopover>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-800 text-sm font-semibold">
              <span>{m.tc_active_groups()}</span>
              <Briefcase className="w-5 h-5 text-slate-900" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {groups.length}
            </div>
            <div className="text-xs text-slate-500">
              {m.tc_groups_sub()}
            </div>
          </div>

          <HoverPopover
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1 cursor-help"
            title={m.tc_pass_rate()}
            text={m.tc_pass_hint()}
          >
            <div className="flex items-center justify-between text-slate-800 text-sm font-semibold">
              <span>{m.tc_pass_rate()}</span>
              <TrendingUp className="w-5 h-5 text-slate-900" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {passRate}%
            </div>
            <div className="text-xs text-slate-500">
              {m.tc_first_try({ n: uniquePassed })}
              {" · "}
              {m.tc_retake({ n: repeatPassed })}
            </div>
          </HoverPopover>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-800 text-sm font-semibold">
              <span>
                {isCompanyAdmin ? m.cadet_tc() : m.tc_companies()}
              </span>
              <Building2 className="w-5 h-5 text-slate-900" />
            </div>
            <div
              className={`font-extrabold text-slate-900 ${isCompanyAdmin ? "text-base sm:text-lg leading-snug" : "text-2xl sm:text-3xl font-mono"}`}
            >
              {isCompanyAdmin
                ? user.tc_name || m.header_tc_fallback()
                : uniqueEnterprises || 2}
            </div>
            <div className="text-xs text-slate-500">
              {isCompanyAdmin
                ? m.header_tc_fallback()
                : m.tc_companies_sub()}
            </div>
          </div>
        </div>

        {/* Filters & Export Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3 space-y-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {m.tc_tab_analytics()}
            </h2>
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {m.tc_all_statuses()}
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] font-semibold text-blue-700 hover:text-blue-900"
                >
                  {m.common_cancel()}
                </button>
              )}
            </div>
          </div>

          <div className="px-5 pb-4 flex justify-between gap-3">
            <div className="flex items-end gap-3 min-w-0 justify-between">
              <label className="flex flex-col gap-1 min-w-44">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 leading-none">
                  {m.cadet_group_label()}
                </span>
                <select
                  value={selectedGroupId || ""}
                  onChange={(e) => {
                    setPage(1);
                    setSelectedGroupId(
                      e.target.value ? Number(e.target.value) : undefined,
                    );
                  }}
                  className="h-9 w-full px-2.5 bg-white border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="">{m.tc_all_groups()}</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>

              {!isCompanyAdmin && (
                <label className="flex flex-col gap-1 min-w-44">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 leading-none">
                    {m.tc_all_companies()}
                  </span>
                  <select
                    value={selectedEnterpriseId || ""}
                    onChange={(e) => {
                      setPage(1);
                      setSelectedEnterpriseId(
                        e.target.value ? Number(e.target.value) : undefined,
                      );
                    }}
                    className="h-9 w-full px-2.5 bg-white border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="">{m.tc_all_companies()}</option>
                    {enterprises.map((ent) => (
                      <option key={ent.id} value={ent.id}>
                        {ent.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="flex flex-col gap-1 min-w-56">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 leading-none">
                  {m.tc_all_courses()}
                </span>
                <select
                  value={selectedCourseId || ""}
                  onChange={(e) => {
                    setPage(1);
                    setSelectedCourseId(
                      e.target.value ? Number(e.target.value) : undefined,
                    );
                  }}
                  className="h-9 w-full px-2.5 bg-white border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="">{m.tc_all_courses()}</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 min-w-52">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 leading-none">
                  {m.cadet_fio_label()}
                </span>
                <div className="relative">
                  <input
                    type="text"
                    value={searchFioInput}
                    onChange={(e) => setSearchFioInput(e.target.value)}
                    placeholder={m.fio_ph()}
                    className="h-9 w-full pl-8 pr-2.5 bg-white border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </label>

              <label className="flex flex-col gap-1 min-w-40">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 leading-none">
                  {m.tc_all_statuses()}
                </span>
                <select
                  value={passedFilter}
                  onChange={(e) => {
                    setPage(1);
                    setPassedFilter(e.target.value);
                  }}
                  className="h-9 w-full px-2.5 bg-white border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="">{m.tc_all_statuses()}</option>
                  <option value="1">{m.cadet_passed()}</option>
                  <option value="0">{m.cadet_failed()}</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 min-w-40">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 leading-none">
                  {m.tc_pass_rate()}
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={scoreFrom}
                    onChange={(e) => {
                      setPage(1);
                      setScoreFrom(e.target.value);
                    }}
                    placeholder={m.filter_from()}
                    className="h-9 w-full px-2.5 bg-white border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <span className="text-slate-400">—</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={scoreTo}
                    onChange={(e) => {
                      setPage(1);
                      setScoreTo(e.target.value);
                    }}
                    placeholder={m.filter_to()}
                    className="h-9 w-full px-2.5 bg-white border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </label>
            </div>
            <div className="flex items-end gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 leading-none flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {m.billing_period()}
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(e) => {
                      setPage(1);
                      setDateFrom(e.target.value);
                    }}
                    className="h-9 px-2.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <span className="text-slate-400 text-xs">—</span>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(e) => {
                      setPage(1);
                      setDateTo(e.target.value);
                    }}
                    className="h-9 px-2.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </label>

              <button
                onClick={handleExportExcel}
                disabled={exporting || resultsTotal === 0}
                className="h-9 px-4 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-md text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center justify-center space-x-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{exporting ? m.common_loading() : m.tc_excel()}</span>
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Detailed Results Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              {m.tc_loading()}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600 text-xs">{error}</div>
          ) : resultsTotal === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-semibold text-sm">
                {m.common_no()}
              </p>
              <p className="text-xs text-slate-400">
                {m.tc_all_groups()}
              </p>
            </div>
          ) : (
            <DataTable
              columns={resultColumns}
              rows={results}
              rowKey={(row) => row.id}
              defaultSort={{ id: "completed_at", direction: "desc" }}
              onRowClick={handleRowClick}
              toolbarLeft={
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <Info className="w-4 h-4 text-slate-700 shrink-0" />
                  <span>
                    {m.tc_more()} · {m.cadet_protocol()}
                  </span>
                  {loadingDetail && (
                    <span className="text-slate-700 font-semibold animate-pulse">
                      {m.common_loading()}
                    </span>
                  )}
                </div>
              }
              serverPagination={{
                page,
                pageSize,
                total: resultsTotal,
                sortId,
                sortDir,
                onPageChange: setPage,
                onPageSizeChange: (size) => {
                  setPage(1);
                  setPageSize(size);
                },
                onSortChange: (id, direction) => {
                  setPage(1);
                  setSortId(id);
                  setSortDir(direction);
                },
              }}
            />
          )}
        </div>
          </>
        )}
      </div>

      {/* 4. MODAL: DETAILED PROTOCOL AND QUESTION-BY-QUESTION REVIEW */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-sm tracking-tight text-white">
                      {m.cadet_protocol()}
                    </h3>
                    <span className="font-mono text-xs font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                      {selectedDetail.protocol_id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {m.cadet_tc_label()} {selectedDetail.tc_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-sm flex items-center space-x-1.5 transition"
                  title={m.cadet_print()}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{m.cadet_print()}</span>
                </button>
                <button
                  onClick={() => setSelectedDetail(null)}
                  className="text-slate-400 hover:text-white p-1 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Summary Status Strip */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  selectedDetail.passed === 1
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : "bg-red-50 border-red-200 text-red-950"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 ${
                      selectedDetail.passed === 1
                        ? "bg-emerald-600"
                        : "bg-red-600"
                    }`}
                  >
                    {selectedDetail.passed === 1 ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <XCircle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider block opacity-75">
                      {m.tc_all_statuses()}
                    </span>
                    <h4 className="text-lg font-extrabold tracking-tight">
                      {selectedDetail.passed === 1
                        ? m.cadet_passed()
                        : m.cadet_failed()}
                    </h4>
                    <p className="text-xs opacity-80">
                      {selectedDetail.passed === 1
                        ? m.cadet_passed()
                        : selectedDetail.remark
                          ? selectedDetail.remark
                          : m.cadet_failed()}
                    </p>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-slate-300/60 sm:pl-6 shrink-0 font-mono">
                  <div className="text-2xl font-extrabold">
                    {selectedDetail.score} / {selectedDetail.max_score}
                  </div>
                  <div className="text-xs font-semibold">
                    {m.cadet_score({ score: selectedDetail.score, max: selectedDetail.max_score, pct: selectedDetail.percentage })}
                  </div>
                </div>
              </div>

              {/* Cadet & Session Metadata Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                    {m.cadet_fio_label()}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedDetail.cadet_fio}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                    {m.cadet_group_label()}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {selectedDetail.group_name}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                    {m.cadet_enterprise()}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {selectedDetail.enterprise_name || m.common_no()}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                    {m.cadet_program()}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {selectedDetail.course_title}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                    {m.cadet_datetime()}
                  </span>
                  <span className="font-mono text-slate-900">
                    {new Date(selectedDetail.completed_at).toLocaleString(
                      "ru-RU",
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                    {m.cadet_remarks()}
                  </span>
                  <span
                    className={`font-semibold ${
                      selectedDetail.remark || selectedDetail.cheat_flags > 0
                        ? "text-amber-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {selectedDetail.remark
                      ? selectedDetail.remark
                      : selectedDetail.cheat_flags > 0
                        ? m.cadet_violations({ n: selectedDetail.cheat_flags })
                        : m.cadet_clean()}
                  </span>
                </div>
              </div>

              {/* Question-by-Question Detailed Review */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-slate-900" />
                    <span>{m.tc_review_title()}</span>
                  </h4>
                  <span className="text-xs text-slate-400">
                    {m.common_questions()}: {selectedDetail.review?.length || 0}
                  </span>
                </div>

                {selectedDetail.review && selectedDetail.review.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDetail.review.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border text-xs space-y-2.5 transition ${
                          item.is_correct
                            ? "bg-emerald-50/40 border-emerald-200"
                            : "bg-red-50/40 border-red-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-bold text-slate-900 leading-snug">
                            {m.cms_question_n({ n: idx + 1, text: item.text })}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                              item.is_correct
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-red-100 text-red-800 border border-red-200"
                            }`}
                          >
                            {item.is_correct
                              ? m.cadet_correct()
                              : m.cadet_incorrect()}
                          </span>
                        </div>

                        {/* Options breakdown */}
                        <div className="space-y-1.5 pl-2 border-l-2 border-slate-300">
                          {item.options.map((opt: string, optIdx: number) => {
                            const isChosen = optIdx === item.selected_option;
                            const isCorrectOpt = optIdx === item.correct_option;

                            let optClass =
                              "text-slate-600 bg-white/70 border-slate-200";
                            if (isCorrectOpt) {
                              optClass =
                                "bg-emerald-100 text-emerald-950 font-bold border-emerald-300";
                            } else if (isChosen && !isCorrectOpt) {
                              optClass =
                                "bg-red-100 text-red-950 font-medium line-through border-red-300";
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`p-2 rounded border text-xs flex items-center justify-between ${optClass}`}
                              >
                                <div className="flex items-center space-x-2">
                                  <span>
                                    {isCorrectOpt ? "✓" : isChosen ? "✗" : "•"}
                                  </span>
                                  <span>{opt}</span>
                                </div>
                                {isChosen && isCorrectOpt && (
                                  <span className="text-[11px] text-emerald-800 font-bold ml-2">
                                    {m.cadet_correct()}
                                  </span>
                                )}
                                {isChosen && !isCorrectOpt && (
                                  <span className="text-[11px] text-red-700 font-bold ml-2">
                                    {m.cadet_incorrect()}
                                  </span>
                                )}
                                {!isChosen && isCorrectOpt && (
                                  <span className="text-[11px] text-emerald-800 font-bold ml-2">
                                    {m.cms_correct()}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Legal citation / explanation */}
                        {item.explanation && (
                          <div className="pt-1 text-xs text-slate-600 bg-white/80 p-2 rounded border border-slate-200">
                            <strong className="text-slate-800">
                              {m.cadet_explanation()}{" "}
                            </strong>
                            <span>{item.explanation}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    {m.common_loading()}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                {m.cadet_protocol()}
              </span>
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-sm font-semibold transition"
              >
                {m.common_close()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
