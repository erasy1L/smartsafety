import React, { useState, useEffect } from 'react';
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
  Lock,
  RefreshCw,
  AlertTriangle,
  Eye,
  Printer,
  X,
  Info,
  FileText,
  Check
} from 'lucide-react';
import { api } from '../api/client';
import { DataTable, DataTableColumn, SortDirection } from '../components/DataTable';
import { DEFAULT_PAGE_SIZE } from '../components/TablePagination';
import { HoverPopover } from '../components/HoverPopover';
import { GroupItem, ReportResult, ReportResultsStats, UserSession } from '../types';

function ruCount(n: number, one: string, few: string, many: string) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return `${n} ${many}`;
  if (last === 1) return `${n} ${one}`;
  if (last >= 2 && last <= 4) return `${n} ${few}`;
  return `${n} ${many}`;
}

interface TcAdminPortalProps {
  user: UserSession;
  onNavigate: (path: string) => void;
}

export const TcAdminPortal: React.FC<TcAdminPortalProps> = ({ user }) => {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [results, setResults] = useState<ReportResult[]>([]);
  const [resultsTotal, setResultsTotal] = useState(0);
  const [resultsStats, setResultsStats] = useState<ReportResultsStats | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(undefined);
  const [searchFio, setSearchFio] = useState('');
  const [passedFilter, setPassedFilter] = useState<string>('');
  const [scoreFrom, setScoreFrom] = useState('');
  const [scoreTo, setScoreTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortId, setSortId] = useState('completed_at');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected result detail modal state
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);


  // Load Groups and Test Results for this TC
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [groupsData, resultsData] = await Promise.all([
        api.getReportGroups(),
        api.getReportResults({
          groupId: selectedGroupId,
          searchFio,
          passed: passedFilter,
          scoreFrom: scoreFrom !== '' && Number.isFinite(Number(scoreFrom)) ? Number(scoreFrom) : undefined,
          scoreTo: scoreTo !== '' && Number.isFinite(Number(scoreTo)) ? Number(scoreTo) : undefined,
          page,
          pageSize,
          sortBy: sortId,
          sortDir
        })
      ]);
      setGroups(groupsData);
      setResults(resultsData.items);
      setResultsTotal(resultsData.total);
      setResultsStats(resultsData.stats);
      setPage(resultsData.page);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки аналитики');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedGroupId, passedFilter, scoreFrom, scoreTo, page, pageSize, sortId, sortDir]);

  // Handle live search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (page !== 1) {
      setPage(1);
      return;
    }
    fetchData();
  };

  // Download Excel
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      await api.downloadExcel(selectedGroupId);
    } catch (err: any) {
      alert(err.message || 'Ошибка выгрузки Excel');
    } finally {
      setExporting(false);
    }
  };

  // Click on row / protocol to view full details
  const handleRowClick = async (row: ReportResult) => {
    try {
      setLoadingDetail(true);
      const detail = await api.getResultDetails(row.id);
      setSelectedDetail(detail);
    } catch (err: any) {
      alert(err.message || 'Ошибка загрузки подробных данных протокола');
    } finally {
      setLoadingDetail(false);
    }
  };

  const totalCertified = resultsStats?.total ?? 0;
  const passedCount = resultsStats?.passedCount ?? 0;
  const passRate = totalCertified > 0 ? Math.round((passedCount / totalCertified) * 100) : 0;
  const uniqueEnterprises = resultsStats?.uniqueEnterprises ?? 0;
  const uniqueCount = resultsStats?.uniqueCount ?? 0;
  const repeatCount = resultsStats?.repeatCount ?? 0;
  const uniquePassed = resultsStats?.uniquePassed ?? 0;
  const repeatPassed = resultsStats?.repeatPassed ?? 0;

  const resultColumns: DataTableColumn<ReportResult>[] = [
    {
      id: 'protocol_id',
      header: '№ Протокола',
      width: 170,
      minWidth: 120,
      sortable: true,
      sortValue: row => row.protocol_id,
      render: row => (
        <span className="underline decoration-blue-300 underline-offset-2 flex items-center space-x-1 font-mono font-bold text-blue-700 group-hover:text-blue-900">
          <span>{row.protocol_id}</span>
          <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
        </span>
      )
    },
    {
      id: 'cadet_fio',
      header: 'Введенное ФИО курсанта',
      width: 240,
      minWidth: 140,
      sortable: true,
      sortValue: row => row.cadet_fio,
      render: row => <span className="font-bold text-slate-900">{row.cadet_fio}</span>
    },
    {
      id: 'group',
      header: 'Учебная группа / Компания',
      width: 230,
      minWidth: 150,
      sortable: true,
      sortValue: row => `${row.group_name} ${row.enterprise_name || ''}`,
      render: row => (
        <div>
          <div className="text-slate-900 font-semibold">{row.group_name}</div>
          {row.enterprise_name && (
            <div className="text-[11px] text-slate-500">{row.enterprise_name}</div>
          )}
        </div>
      )
    },
    {
      id: 'course_title',
      header: 'Название курса',
      width: 240,
      minWidth: 140,
      sortable: true,
      sortValue: row => row.course_title,
      render: row => (
        <span className="block truncate text-slate-800" title={row.course_title}>
          {row.course_title}
        </span>
      )
    },
    {
      id: 'score',
      header: 'Баллы за тест',
      width: 130,
      minWidth: 100,
      align: 'center',
      sortable: true,
      sortValue: row => row.percentage,
      render: row => (
        <div className="font-mono">
          <span className="font-bold text-base text-slate-900">
            {row.score}/{row.max_score}
          </span>
          <span className="text-sm text-slate-500 block">({row.percentage}%)</span>
        </div>
      )
    },
    {
      id: 'status',
      header: 'Статус',
      width: 120,
      minWidth: 90,
      align: 'center',
      sortable: true,
      sortValue: row => row.passed,
      render: row =>
        row.passed === 1 ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            СДАН
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
            НЕ СДАН
          </span>
        )
    },
    {
      id: 'completed_at',
      header: 'Дата / Время',
      width: 180,
      minWidth: 130,
      sortable: true,
      sortValue: row => new Date(row.completed_at).getTime(),
      render: row => (
        <span className="text-slate-500 text-xs whitespace-nowrap">
          {new Date(row.completed_at).toLocaleString('ru-RU')}
        </span>
      )
    },
    {
      id: 'anticheat',
      header: 'Античит',
      width: 110,
      minWidth: 90,
      align: 'center',
      sortable: true,
      sortValue: row => row.cheat_flags,
      render: row =>
        row.cheat_flags > 0 ? (
          <span
            className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium"
            title={`Курсант переключал вкладку браузера ${row.cheat_flags} раз(а)`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>{row.cheat_flags} зам.</span>
          </span>
        ) : (
          <span className="text-slate-400 text-[11px]">Чисто</span>
        )
    },
    {
      id: 'action',
      header: 'Действие',
      width: 140,
      minWidth: 110,
      align: 'center',
      sortable: false,
      render: row => (
        <button
          onClick={e => {
            e.stopPropagation();
            handleRowClick(row);
          }}
          className="px-4 py-1.5 bg-white group-hover:bg-blue-600 group-hover:text-white text-slate-700 border border-slate-300 group-hover:border-blue-600 rounded text-sm font-semibold inline-flex items-center space-x-1 transition shadow-sm"
        >
          <Eye className="w-3 h-3" />
          <span>Подробнее</span>
        </button>
      )
    }
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
                    {user.tc_name || 'Кабинет Учебного Центра'}
                  </h1>
                  <span className="text-[11px] uppercase font-bold tracking-wider bg-slate-800 text-blue-300 px-2 py-0.5 rounded border border-slate-700">
                    Уровень 2: Администратор УЦ
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Руководитель: <strong className="text-slate-200">{user.full_name}</strong> • Электронный реестр экзаменационных протоколов
                </p>
              </div>
            </div>

            {/* Read-Only Regulatory Compliance Notice */}
            <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-lg text-xs text-slate-300">
              <Lock className="w-4 h-4 text-white shrink-0" />
              <div>
                <span className="font-semibold block text-slate-200">Режим «Только просмотр»:</span>
                <span className="text-xs text-slate-400">Содержимое курсов защищено платформой от изменений</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Analytics Dashboard */}
      <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* KPI Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <HoverPopover
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1 cursor-help"
            title="Всего аттестовано"
            text="Счётчик считает все завершённые экзамены в реестре. Уникальная сдача — первая попытка курсанта по конкретному курсу. Повторная — каждая следующая попытка того же курсанта по тому же курсу."
          >
            <div className="flex items-center justify-between text-slate-800 text-sm font-semibold">
              <span>Всего аттестовано</span>
              <Users className="w-5 h-5 text-slate-900" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {totalCertified} <span className="text-xs font-normal text-slate-400">чел.</span>
            </div>
            <div className="text-xs text-slate-500">
              {ruCount(uniqueCount, 'уникальный', 'уникальных', 'уникальных')}
              {' · '}
              {ruCount(repeatCount, 'повторная', 'повторные', 'повторных')}
            </div>
          </HoverPopover>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-800 text-sm font-semibold">
              <span>Активных групп</span>
              <Briefcase className="w-5 h-5 text-slate-900" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {groups.length}
            </div>
            <div className="text-xs text-slate-500">Курируемые потоки обучения</div>
          </div>

          <HoverPopover
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1 cursor-help"
            title="Успешная сдача"
            text="Доля протоколов со статусом «Сдан» среди всех завершённых экзаменов. «С первого раза» — успешная первая попытка курсанта по курсу. «Повторно» — успешная пересдача того же курса."
          >
            <div className="flex items-center justify-between text-slate-800 text-sm font-semibold">
              <span>Успешная сдача</span>
              <TrendingUp className="w-5 h-5 text-slate-900" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {passRate}%
            </div>
            <div className="text-xs text-slate-500">
              {uniquePassed} с первого раза
              {' · '}
              {repeatPassed} повторно
            </div>
          </HoverPopover>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-800 text-sm font-semibold">
              <span>Компаний-клиентов</span>
              <Building2 className="w-5 h-5 text-slate-900" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {uniqueEnterprises || 2}
            </div>
            <div className="text-xs text-slate-500">ТОО и АО на обслуживании УЦ</div>
          </div>
        </div>

        {/* Filters & Export Bar */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Результаты проверки знаний курсантов
              </h2>
              <p className="text-xs text-slate-500">
                Детальный реестр протоколов с привязкой к ФИО, группе и компании-заказчику
              </p>
            </div>

            {/* EXCEL EXPORT BUTTON */}
            <button
              onClick={handleExportExcel}
              disabled={exporting || resultsTotal === 0}
              className="px-4 py-3 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-lg text-sm font-bold uppercase tracking-wider transition shadow-sm flex items-center justify-center space-x-2 shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{exporting ? 'Генерация файла...' : 'Выгрузить в Excel (.xlsx)'}</span>
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filter Controls Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            {/* Group selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Фильтр по учебной группе:
              </label>
              <select
                value={selectedGroupId || ''}
                onChange={e => {
                  setPage(1);
                  setSelectedGroupId(e.target.value ? Number(e.target.value) : undefined);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="">Все учебные группы ({groups.length})</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} {g.enterprise_name ? `(${g.enterprise_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Search by Cadet FIO */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Поиск по введенному ФИО:
              </label>
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchFio}
                  onChange={e => setSearchFio(e.target.value)}
                  placeholder="Фамилия или имя..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </form>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Статус аттестации:
              </label>
              <select
                value={passedFilter}
                onChange={e => {
                  setPage(1);
                  setPassedFilter(e.target.value);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="">Все статусы (сданные и несданные)</option>
                <option value="1">Только успешно сданные (≥ 80%)</option>
                <option value="0">Не прошедшие проверку (&lt; 80%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Баллы за тест:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={scoreFrom}
                  onChange={e => {
                    setPage(1);
                    setScoreFrom(e.target.value);
                  }}
                  placeholder="От"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                <span className="text-slate-400 shrink-0">—</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={scoreTo}
                  onChange={e => {
                    setPage(1);
                    setScoreTo(e.target.value);
                  }}
                  placeholder="До"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Detailed Results Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              Загрузка протоколов...
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600 text-xs">
              {error}
            </div>
          ) : resultsTotal === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-semibold text-sm">По заданным фильтрам протоколов не найдено</p>
              <p className="text-xs text-slate-400">
                Измените параметры поиска или выберите другую учебную группу
              </p>
            </div>
          ) : (
            <DataTable
              columns={resultColumns}
              rows={results}
              rowKey={row => row.id}
              defaultSort={{ id: 'completed_at', direction: 'desc' }}
              onRowClick={handleRowClick}
              toolbarLeft={
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <Info className="w-4 h-4 text-slate-700 shrink-0" />
                  <span>
                    Нажмите на строку или кнопку <strong>«Подробнее»</strong>, чтобы открыть официальный протокол
                  </span>
                  {loadingDetail && (
                    <span className="text-slate-700 font-semibold animate-pulse">
                      Загрузка протокола...
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
                onPageSizeChange: size => {
                  setPage(1);
                  setPageSize(size);
                },
                onSortChange: (id, direction) => {
                  setPage(1);
                  setSortId(id);
                  setSortDir(direction);
                }
              }}
            />
          )}
        </div>
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
                      Электронный протокол проверки знаний
                    </h3>
                    <span className="font-mono text-xs font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                      {selectedDetail.protocol_id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Учебный центр: {selectedDetail.tc_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-sm flex items-center space-x-1.5 transition"
                  title="Печать"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Печать</span>
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
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-red-50 border-red-200 text-red-950'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 ${
                      selectedDetail.passed === 1 ? 'bg-emerald-600' : 'bg-red-600'
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
                      Статус аттестации
                    </span>
                    <h4 className="text-lg font-extrabold tracking-tight">
                      {selectedDetail.passed === 1
                        ? 'АТТЕСТАЦИЯ ПРОЙДЕНА (СДАН)'
                        : 'АТТЕСТАЦИЯ НЕ ПРОЙДЕНА (НЕ СДАН)'}
                    </h4>
                    <p className="text-xs opacity-80">
                      {selectedDetail.passed === 1
                        ? 'Результат соответствует требованиям ст. 79 ТК РК и Приказу МЗСР РК № 1019.'
                        : 'Набрано менее 80% правильных ответов. Требуется повторный инструктаж.'}
                    </p>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-slate-300/60 sm:pl-6 shrink-0 font-mono">
                  <div className="text-2xl font-extrabold">
                    {selectedDetail.score} / {selectedDetail.max_score}
                  </div>
                  <div className="text-xs font-semibold">
                    {selectedDetail.percentage}% верных ответов
                  </div>
                </div>
              </div>

              {/* Cadet & Session Metadata Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                    Введенное ФИО курсанта:
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedDetail.cadet_fio}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                    Учебная группа:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {selectedDetail.group_name}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                    Предприятие-заказчик:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {selectedDetail.enterprise_name || 'Индивидуально'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                    Программа курса:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {selectedDetail.course_title}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                    Дата и время фиксации:
                  </span>
                  <span className="font-mono text-slate-900">
                    {new Date(selectedDetail.completed_at).toLocaleString('ru-RU')}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                    Контроль прокторинга:
                  </span>
                  <span
                    className={`font-semibold ${
                      selectedDetail.cheat_flags > 0 ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {selectedDetail.cheat_flags > 0
                      ? `⚠️ Зафиксировано ${selectedDetail.cheat_flags} переключение(й) вкладки`
                      : '✓ Без нарушений (фокус не терялся)'}
                  </span>
                </div>
              </div>

              {/* Question-by-Question Detailed Review */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-slate-900" />
                    <span>Повопросный отчет и разбор ответов курсанта</span>
                  </h4>
                  <span className="text-xs text-slate-400">
                    Всего вопросов: {selectedDetail.review?.length || 0}
                  </span>
                </div>

                {selectedDetail.review && selectedDetail.review.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDetail.review.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border text-xs space-y-2.5 transition ${
                          item.is_correct
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-red-50/40 border-red-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-bold text-slate-900 leading-snug">
                            Вопрос №{idx + 1}: {item.text}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                              item.is_correct
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            {item.is_correct ? '✓ Правильно (+1 балл)' : '✗ Ошибка (0 баллов)'}
                          </span>
                        </div>

                        {/* Options breakdown */}
                        <div className="space-y-1.5 pl-2 border-l-2 border-slate-300">
                          {item.options.map((opt: string, optIdx: number) => {
                            const isChosen = optIdx === item.selected_option;
                            const isCorrectOpt = optIdx === item.correct_option;

                            let optClass = 'text-slate-600 bg-white/70 border-slate-200';
                            if (isCorrectOpt) {
                              optClass = 'bg-emerald-100 text-emerald-950 font-bold border-emerald-300';
                            } else if (isChosen && !isCorrectOpt) {
                              optClass = 'bg-red-100 text-red-950 font-medium line-through border-red-300';
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`p-2 rounded border text-xs flex items-center justify-between ${optClass}`}
                              >
                                <div className="flex items-center space-x-2">
                                  <span>{isCorrectOpt ? '✓' : isChosen ? '✗' : '•'}</span>
                                  <span>{opt}</span>
                                </div>
                                {isChosen && isCorrectOpt && (
                                  <span className="text-[11px] text-emerald-800 font-bold ml-2">
                                    (Выбор курсанта — верно)
                                  </span>
                                )}
                                {isChosen && !isCorrectOpt && (
                                  <span className="text-[11px] text-red-700 font-bold ml-2">
                                    (Выбор курсанта — ошибка)
                                  </span>
                                )}
                                {!isChosen && isCorrectOpt && (
                                  <span className="text-[11px] text-emerald-800 font-bold ml-2">
                                    (Правильный ответ)
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Legal citation / explanation */}
                        {item.explanation && (
                          <div className="pt-1 text-xs text-slate-600 bg-white/80 p-2 rounded border border-slate-200">
                            <strong className="text-slate-800">Нормативное обоснование РК: </strong>
                            <span>{item.explanation}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    Повопросный отчет формируется методическим отделом.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Цифровой след зафиксирован в защищенной базе SmartSafety РК
              </span>
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-sm font-semibold transition"
              >
                Закрыть окно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

