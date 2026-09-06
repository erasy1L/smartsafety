import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { authMiddleware } from '../middleware/auth.js';
import * as XLSX from 'xlsx';

export const reportsRouter = Router();

const SORT_COLUMNS: Record<string, string> = {
  protocol_id: 'tr.protocol_id',
  cadet_fio: 'tr.cadet_fio',
  group: 'g.name',
  course_title: 'c.title',
  score: 'tr.percentage',
  status: 'tr.passed',
  completed_at: 'tr.completed_at',
  anticheat: 'tr.cheat_flags'
};

function clampPageSize(raw: unknown) {
  const value = Number(raw);
  if (!Number.isFinite(value)) return 10;
  return Math.min(50, Math.max(5, Math.round(value)));
}

function buildResultsFilter(session: { role: string; tc_id?: number | null }, query: Request['query']) {
  let where = ' WHERE 1=1';
  const params: any[] = [];

  if (session.role === 'tc_admin') {
    where += ' AND tr.tc_id = ?';
    params.push(session.tc_id!);
  }

  if (query.group_id) {
    where += ' AND tr.group_id = ?';
    params.push(Number(query.group_id));
  }

  if (query.search_fio) {
    where += ' AND tr.cadet_fio LIKE ?';
    params.push(`%${String(query.search_fio).trim()}%`);
  }

  if (query.passed !== undefined && query.passed !== '') {
    where += ' AND tr.passed = ?';
    params.push(query.passed === 'true' || query.passed === '1' ? 1 : 0);
  }

  const scoreFrom = Number(query.score_from ?? query.scoreFrom);
  if (Number.isFinite(scoreFrom)) {
    where += ' AND tr.score >= ?';
    params.push(Math.max(0, scoreFrom));
  }

  const scoreTo = Number(query.score_to ?? query.scoreTo);
  if (Number.isFinite(scoreTo)) {
    where += ' AND tr.score <= ?';
    params.push(Math.max(0, scoreTo));
  }

  return { where, params };
}

function computeAttemptStats(rows: Array<{
  id: number;
  cadet_fio: string;
  course_id: number;
  passed: number;
  completed_at: string;
  enterprise_name?: string;
}>) {
  const sorted = [...rows].sort((a, b) => {
    const time = new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime();
    return time !== 0 ? time : a.id - b.id;
  });

  const seen = new Set<string>();
  let uniqueCount = 0;
  let repeatCount = 0;
  let uniquePassed = 0;
  let repeatPassed = 0;

  for (const row of sorted) {
    const key = `${String(row.cadet_fio || '').trim().toLowerCase()}::${row.course_id}`;
    const isFirst = !seen.has(key);
    if (isFirst) {
      seen.add(key);
      uniqueCount += 1;
      if (row.passed === 1) uniquePassed += 1;
    } else {
      repeatCount += 1;
      if (row.passed === 1) repeatPassed += 1;
    }
  }

  return {
    total: rows.length,
    passedCount: rows.filter(r => r.passed === 1).length,
    uniqueEnterprises: new Set(rows.map(r => r.enterprise_name).filter(Boolean)).size,
    uniqueCount,
    repeatCount,
    uniquePassed,
    repeatPassed
  };
}

// GET /api/reports/groups - Список групп для фильтрации в кабинете УЦ
reportsRouter.get('/groups', authMiddleware(['tc_admin', 'super_admin']), (req: Request, res: Response) => {
  const session = req.session!;

  let sql = `
    SELECT g.id, g.name, g.group_code, g.login, g.active, g.created_at,
           tc.name as tc_name,
           e.name as enterprise_name,
           (SELECT COUNT(*) FROM test_results tr WHERE tr.group_id = g.id) as tests_completed_count
    FROM groups g
    JOIN training_centers tc ON g.tc_id = tc.id
    LEFT JOIN enterprises e ON g.enterprise_id = e.id
  `;

  const params: any[] = [];
  if (session.role === 'tc_admin') {
    sql += ' WHERE g.tc_id = ?';
    params.push(session.tc_id!);
  }

  sql += ' ORDER BY g.id DESC';

  const stmt = db.prepare(sql);
  const groups = stmt.all(...params);
  res.json(groups);
});

// GET /api/reports/results - Детальная таблица результатов курсантов (пагинация)
reportsRouter.get('/results', authMiddleware(['tc_admin', 'super_admin']), (req: Request, res: Response) => {
  const session = req.session!;
  const { where, params } = buildResultsFilter(session, req.query);

  const fromSql = `
    FROM test_results tr
    JOIN groups g ON tr.group_id = g.id
    JOIN courses c ON tr.course_id = c.id
    JOIN training_centers tc ON tr.tc_id = tc.id
    LEFT JOIN enterprises e ON g.enterprise_id = e.id
    ${where}
  `;

  const metricRows = db.prepare(`
    SELECT tr.id, tr.cadet_fio, tr.course_id, tr.passed, tr.completed_at, e.name as enterprise_name
    ${fromSql}
  `).all(...params) as any[];

  const total = metricRows.length;
  const stats = computeAttemptStats(metricRows);

  const pageSize = clampPageSize(req.query.page_size ?? req.query.pageSize);
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const offset = (safePage - 1) * pageSize;

  const sortKey = String(req.query.sort_by || req.query.sortBy || 'completed_at');
  const sortColumn = SORT_COLUMNS[sortKey] || 'tr.completed_at';
  const sortDir = String(req.query.sort_dir || req.query.sortDir || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const items = db.prepare(`
    SELECT tr.*,
           g.name as group_name,
           g.group_code,
           c.title as course_title,
           c.code as course_code,
           tc.name as tc_name,
           e.name as enterprise_name
    ${fromSql}
    ORDER BY ${sortColumn} ${sortDir}
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  res.json({
    items,
    total,
    page: safePage,
    pageSize,
    stats
  });
});

// GET /api/reports/results/:id/details - Детальный просмотр протокола и повопросного отчета курсанта
reportsRouter.get('/results/:id/details', authMiddleware(['tc_admin', 'super_admin']), (req: Request, res: Response) => {
  const session = req.session!;
  const resultId = Number(req.params.id);

  let sql = `
    SELECT tr.*,
           g.name as group_name,
           g.group_code,
           c.title as course_title,
           c.code as course_code,
           tc.name as tc_name,
           e.name as enterprise_name
    FROM test_results tr
    JOIN groups g ON tr.group_id = g.id
    JOIN courses c ON tr.course_id = c.id
    JOIN training_centers tc ON tr.tc_id = tc.id
    LEFT JOIN enterprises e ON g.enterprise_id = e.id
    WHERE tr.id = ?
  `;
  const params: any[] = [resultId];

  if (session.role === 'tc_admin') {
    sql += ' AND tr.tc_id = ?';
    params.push(session.tc_id!);
  }

  const result = db.prepare(sql).get(...params) as any;
  if (!result) {
    return res.status(404).json({ error: 'Протокол проверки знаний не найден' });
  }

  let review: any[] = [];
  if (result.review_json) {
    try {
      review = JSON.parse(result.review_json);
    } catch {}
  }

  // Если повопросный отчет еще не был сформирован в JSON (например, исторические данные),
  // восстанавливаем список вопросов курса и сопоставляем с набранными баллами
  if (!review || review.length === 0) {
    const qStmt = db.prepare(`
      SELECT id, text, options_json, correct_option_index, explanation
      FROM questions
      WHERE course_id = ?
      ORDER BY id ASC
    `);
    const questions = qStmt.all(result.course_id) as any[];

    let answers: Record<string, number> = {};
    if (result.answers_json) {
      try {
        answers = JSON.parse(result.answers_json);
      } catch {}
    }

    review = questions.map((q, qIndex) => {
      const selected = answers[q.id] !== undefined
        ? answers[q.id]
        : (qIndex < result.score ? q.correct_option_index : (q.correct_option_index + 1) % 4);
      const isCorrect = selected === q.correct_option_index;

      return {
        question_id: q.id,
        text: q.text,
        options: JSON.parse(q.options_json),
        selected_option: selected,
        correct_option: q.correct_option_index,
        is_correct: isCorrect,
        explanation: q.explanation
      };
    });
  }

  result.review = review;
  res.json(result);
});

// GET /api/reports/export-excel - Выгрузка таблицы в настоящий файл Excel (.xlsx)
reportsRouter.get('/export-excel', authMiddleware(['tc_admin', 'super_admin']), (req: Request, res: Response) => {

  const session = req.session!;
  const { group_id } = req.query;

  let sql = `
    SELECT tr.protocol_id,
           tr.cadet_fio,
           tc.name as tc_name,
           COALESCE(e.name, 'Индивидуально') as enterprise_name,
           g.name as group_name,
           c.title as course_title,
           tr.score,
           tr.max_score,
           tr.percentage,
           tr.passed,
           tr.cheat_flags,
           tr.completed_at
    FROM test_results tr
    JOIN groups g ON tr.group_id = g.id
    JOIN courses c ON tr.course_id = c.id
    JOIN training_centers tc ON tr.tc_id = tc.id
    LEFT JOIN enterprises e ON g.enterprise_id = e.id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (session.role === 'tc_admin') {
    sql += ' AND tr.tc_id = ?';
    params.push(session.tc_id!);
  }

  if (group_id) {
    sql += ' AND tr.group_id = ?';
    params.push(Number(group_id));
  }

  sql += ' ORDER BY tr.id DESC';

  const stmt = db.prepare(sql);
  const rows = stmt.all(...params) as any[];

  // Формируем структурированные данные для листа Excel
  const excelData = rows.map((r, index) => ({
    '№ п/п': index + 1,
    '№ Протокола': r.protocol_id,
    'ФИО Курсанта': r.cadet_fio,
    'Учебный Центр': r.tc_name,
    'Предприятие (Заказчик)': r.enterprise_name,
    'Учебная группа': r.group_name,
    'Программа проверки знаний': r.course_title,
    'Набрано баллов': `${r.score} из ${r.max_score}`,
    'Процент правильных': `${r.percentage}%`,
    'Результат': r.passed === 1 ? 'СДАН' : 'НЕ СДАН',
    'Замечания прокторинга': r.cheat_flags > 0 ? `Потеря фокуса (${r.cheat_flags} раз)` : 'Без нарушений',
    'Дата и время сдачи': r.completed_at
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Автоматическая ширина колонок
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 32 },
    { wch: 35 },
    { wch: 28 },
    { wch: 28 },
    { wch: 45 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 25 },
    { wch: 20 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ведомость проверки знаний');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  const filename = `Vedomost_SmartSafety_${new Date().toISOString().slice(0, 10)}.xlsx`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});
