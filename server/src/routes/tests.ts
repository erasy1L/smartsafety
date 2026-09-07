import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { authMiddleware } from '../middleware/auth.js';

export const testsRouter = Router();

export const TEST_ABORT_REMARK =
  'Тест аннулирован: курсант покинул экзамен (перезагрузка страницы или переход назад).';

function generateProtocolId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const randomCode = Math.floor(1000 + Math.random() * 9000);
  return `ПР-${year}/${month}-${randomCode}`;
}

function requireCadetIdentity(session: { cadet_fio?: string | null; group_id?: number; tc_id?: number }) {
  if (!session.cadet_fio) {
    return 'Ошибка идентификации: ФИО курсанта не зарегистрировано в сессии';
  }
  return null;
}

function getAttempt(cadetFio: string, groupId: number, courseId: number) {
  return db.prepare(`
    SELECT * FROM test_attempts
    WHERE cadet_fio = ? AND group_id = ? AND course_id = ?
  `).get(cadetFio, groupId, courseId) as any;
}

function getCourseTitle(courseId: number) {
  const course = db.prepare('SELECT title FROM courses WHERE id = ?').get(courseId) as any;
  return course?.title as string | undefined;
}

function questionsForCadet(courseId: number) {
  const rows = db.prepare(`
    SELECT id, course_id, text, options_json
    FROM questions
    WHERE course_id = ?
    ORDER BY id ASC
  `).all(courseId) as any[];
  return rows.map(r => ({
    id: r.id,
    course_id: r.course_id,
    text: r.text,
    options: JSON.parse(r.options_json)
  }));
}

function formatResultPayload(row: any, courseTitle: string) {
  let review = [];
  try {
    review = row.review_json ? JSON.parse(row.review_json) : [];
  } catch {
    review = [];
  }
  return {
    protocol_id: row.protocol_id,
    cadet_fio: row.cadet_fio,
    course_title: courseTitle,
    score: row.score,
    max_score: row.max_score,
    percentage: row.percentage,
    passed: row.passed === 1,
    cheat_flags: row.cheat_flags || 0,
    completed_at: row.completed_at,
    remark: row.remark || null,
    aborted: Boolean(row.remark),
    review
  };
}

function loadResultPayload(resultId: number, courseId: number) {
  const row = db.prepare('SELECT * FROM test_results WHERE id = ?').get(resultId) as any;
  if (!row) return null;
  const title = getCourseTitle(courseId) || '';
  return formatResultPayload(row, title);
}

function voidInProgressAttempt(session: { cadet_fio: string; group_id: number; tc_id: number }, courseId: number) {
  const attempt = getAttempt(session.cadet_fio, session.group_id, courseId);
  if (!attempt || attempt.status !== 'in_progress') {
    return attempt?.status === 'voided' && attempt.result_id
      ? loadResultPayload(attempt.result_id, courseId)
      : null;
  }

  const courseTitle = getCourseTitle(courseId);
  if (!courseTitle) return null;

  const questions = db.prepare(`
    SELECT id, text, options_json, correct_option_index, explanation
    FROM questions
    WHERE course_id = ?
    ORDER BY id ASC
  `).all(courseId) as any[];

  const review = questions.map(q => ({
    question_id: q.id,
    text: q.text,
    options: JSON.parse(q.options_json),
    selected_option: undefined,
    correct_option: q.correct_option_index,
    is_correct: false,
    explanation: q.explanation
  }));

  const maxScore = questions.length;
  const protocolId = generateProtocolId();
  const now = new Date().toISOString();

  db.exec('BEGIN');
  try {
    const insert = db.prepare(`
      INSERT INTO test_results (
        protocol_id, cadet_fio, group_id, course_id, tc_id,
        score, max_score, percentage, passed, cheat_flags,
        answers_json, review_json, remark, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = insert.run(
      protocolId,
      session.cadet_fio,
      session.group_id,
      courseId,
      session.tc_id,
      0,
      maxScore,
      0,
      0,
      1,
      JSON.stringify({}),
      JSON.stringify(review),
      TEST_ABORT_REMARK,
      now
    );

    db.prepare(`
      UPDATE test_attempts SET status = 'voided', result_id = ? WHERE id = ?
    `).run(Number(info.lastInsertRowid), attempt.id);

    db.exec('COMMIT');

    return {
      protocol_id: protocolId,
      cadet_fio: session.cadet_fio,
      course_title: courseTitle,
      score: 0,
      max_score: maxScore,
      percentage: 0,
      passed: false,
      cheat_flags: 1,
      completed_at: now,
      remark: TEST_ABORT_REMARK,
      aborted: true,
      review
    };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// GET /api/tests/for-course/:courseId - Получение вопросов теста (БЕЗ правильных ответов)
testsRouter.get('/for-course/:courseId', authMiddleware(), (req: Request, res: Response) => {
  const session = req.session!;
  const courseId = Number(req.params.courseId);

  // Для курсанта проверяем доступ и обязательное ФИО
  if (session.role === 'cadet') {
    if (!session.cadet_fio) {
      return res.status(403).json({
        error: 'Доступ к тестированию заблокирован. Пожалуйста, укажите ваше полное ФИО.'
      });
    }

    const checkStmt = db.prepare('SELECT 1 FROM group_courses WHERE group_id = ? AND course_id = ?');
    const allowed = checkStmt.get(session.group_id!, courseId);
    if (!allowed) {
      return res.status(403).json({ error: 'Тест недоступен для вашей учебной группы' });
    }
  }

  // Если супер-админ — возвращаем с правильными ответами для CMS
  if (session.role === 'super_admin') {
    const stmt = db.prepare(`
      SELECT id, course_id, text, options_json, correct_option_index, explanation
      FROM questions
      WHERE course_id = ?
      ORDER BY id ASC
    `);
    const rows = stmt.all(courseId) as any[];
    const questions = rows.map(r => ({
      ...r,
      options: JSON.parse(r.options_json)
    }));
    return res.json(questions);
  }

  // Для курсанта — строго БЕЗ поля correct_option_index и explanation!
  const cadetQuestions = questionsForCadet(courseId);

  return res.json(cadetQuestions);
});

// POST /api/tests/start — фиксация начала экзамена; повторный вход аннулирует незавершённую попытку
testsRouter.post('/start', authMiddleware(['cadet']), (req: Request, res: Response) => {
  const session = req.session!;
  const identityError = requireCadetIdentity(session);
  if (identityError) {
    return res.status(403).json({ error: identityError });
  }

  const courseId = Number(req.body.course_id);
  const forceNew = Boolean(req.body.force_new);
  if (!courseId) {
    return res.status(400).json({ error: 'Не указан курс' });
  }

  const courseTitle = getCourseTitle(courseId);
  if (!courseTitle) {
    return res.status(404).json({ error: 'Курс не найден' });
  }

  const allowed = db.prepare('SELECT 1 FROM group_courses WHERE group_id = ? AND course_id = ?')
    .get(session.group_id!, courseId);
  if (!allowed) {
    return res.status(403).json({ error: 'Тест недоступен для вашей учебной группы' });
  }

  const questions = questionsForCadet(courseId);
  if (questions.length === 0) {
    return res.status(400).json({ error: 'В данном курсе еще нет контрольных вопросов' });
  }

  const attempt = getAttempt(session.cadet_fio!, session.group_id!, courseId);

  if (!forceNew) {
    if (attempt?.status === 'in_progress') {
      const result = voidInProgressAttempt(
        { cadet_fio: session.cadet_fio!, group_id: session.group_id!, tc_id: session.tc_id! },
        courseId
      );
      return res.json({ status: 'voided', result });
    }
    if (attempt?.status === 'voided' && attempt.result_id) {
      const result = loadResultPayload(attempt.result_id, courseId);
      return res.json({ status: 'voided', result });
    }
  } else if (attempt) {
    if (attempt.status === 'in_progress') {
      voidInProgressAttempt(
        { cadet_fio: session.cadet_fio!, group_id: session.group_id!, tc_id: session.tc_id! },
        courseId
      );
    }
    db.prepare('DELETE FROM test_attempts WHERE cadet_fio = ? AND group_id = ? AND course_id = ?')
      .run(session.cadet_fio!, session.group_id!, courseId);
  }

  db.prepare(`
    INSERT INTO test_attempts (cadet_fio, group_id, course_id, tc_id, status)
    VALUES (?, ?, ?, ?, 'in_progress')
  `).run(session.cadet_fio!, session.group_id!, courseId, session.tc_id!);

  return res.json({ status: 'started', questions });
});

// POST /api/tests/abandon — выход из экзамена: попытка провалена с замечанием
testsRouter.post('/abandon', authMiddleware(['cadet']), (req: Request, res: Response) => {
  const session = req.session!;
  const identityError = requireCadetIdentity(session);
  if (identityError) {
    return res.status(403).json({ error: identityError });
  }

  const courseId = Number(req.body.course_id);
  if (!courseId) {
    return res.status(400).json({ error: 'Не указан курс' });
  }

  const result = voidInProgressAttempt(
    { cadet_fio: session.cadet_fio!, group_id: session.group_id!, tc_id: session.tc_id! },
    courseId
  );

  if (!result) {
    return res.json({ status: 'idle' });
  }

  return res.json({ status: 'voided', result });
});

// POST /api/tests/submit - Прием результатов, серверный подсчет баллов, фиксация протокола
testsRouter.post('/submit', authMiddleware(['cadet']), (req: Request, res: Response) => {
  const session = req.session!;
  const { course_id, answers, cheat_flags = 0 } = req.body;

  if (!session.cadet_fio) {
    return res.status(403).json({
      error: 'Ошибка идентификации: ФИО курсанта не зарегистрировано в сессии'
    });
  }

  const courseId = Number(course_id);
  const courseTitle = getCourseTitle(courseId);

  if (!courseTitle) {
    return res.status(404).json({ error: 'Курс не найден' });
  }

  const attempt = getAttempt(session.cadet_fio, session.group_id!, courseId);
  if (attempt?.status === 'voided' && attempt.result_id) {
    const result = loadResultPayload(attempt.result_id, courseId);
    return res.status(409).json({
      error: TEST_ABORT_REMARK,
      status: 'voided',
      result
    });
  }

  // Запрашиваем правильные ответы из базы данных
  const questionsStmt = db.prepare(`
    SELECT id, text, options_json, correct_option_index, explanation
    FROM questions
    WHERE course_id = ?
    ORDER BY id ASC
  `);
  const questions = questionsStmt.all(courseId) as any[];

  if (questions.length === 0) {
    return res.status(400).json({ error: 'В данном курсе еще нет контрольных вопросов' });
  }

  let score = 0;
  const review = [];

  for (const q of questions) {
    const selected = answers ? answers[q.id] : undefined;
    const isCorrect = selected !== undefined && Number(selected) === q.correct_option_index;
    if (isCorrect) {
      score++;
    }

    const options = JSON.parse(q.options_json);
    review.push({
      question_id: q.id,
      text: q.text,
      options,
      selected_option: selected,
      correct_option: q.correct_option_index,
      is_correct: isCorrect,
      explanation: q.explanation
    });
  }

  const max_score = questions.length;
  const percentage = Math.round((score / max_score) * 1000) / 10; // e.g. 83.3%
  const passed = percentage >= 80 ? 1 : 0; // 80% порог по нормам РК

  const protocol_id = generateProtocolId();
  const now = new Date();

  const insertResult = db.prepare(`
    INSERT INTO test_results (
      protocol_id, cadet_fio, group_id, course_id, tc_id, score, max_score, percentage, passed, cheat_flags, answers_json, review_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertResult.run(
    protocol_id,
    session.cadet_fio,
    session.group_id!,
    courseId,
    session.tc_id!,
    score,
    max_score,
    percentage,
    passed,
    Number(cheat_flags) || 0,
    JSON.stringify(answers || {}),
    JSON.stringify(review)
  );

  db.prepare('DELETE FROM test_attempts WHERE cadet_fio = ? AND group_id = ? AND course_id = ?')
    .run(session.cadet_fio, session.group_id!, courseId);

  return res.json({
    protocol_id,
    cadet_fio: session.cadet_fio,
    course_title: courseTitle,
    score,
    max_score,
    percentage,
    passed: passed === 1,
    cheat_flags: Number(cheat_flags),
    completed_at: now.toISOString(),
    remark: null,
    aborted: false,
    review
  });
});

// POST /api/tests/questions (Супер-Админ) - Добавление нового вопроса
testsRouter.post('/questions', authMiddleware(['super_admin']), (req: Request, res: Response) => {
  const { course_id, text, options, correct_option_index, explanation } = req.body;

  if (!course_id || !text || !Array.isArray(options) || correct_option_index === undefined) {
    return res.status(400).json({ error: 'Пожалуйста, заполните форму вопроса корректно' });
  }

  const stmt = db.prepare(`
    INSERT INTO questions (course_id, text, options_json, correct_option_index, explanation)
    VALUES (?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    Number(course_id),
    text,
    JSON.stringify(options),
    Number(correct_option_index),
    explanation || ''
  );

  return res.status(201).json({ id: info.lastInsertRowid, message: 'Вопрос успешно добавлен' });
});

// DELETE /api/tests/questions/:id (Супер-Админ) - Удаление вопроса
testsRouter.delete('/questions/:id', authMiddleware(['super_admin']), (req: Request, res: Response) => {
  const questionId = Number(req.params.id);
  const stmt = db.prepare('DELETE FROM questions WHERE id = ?');
  const info = stmt.run(questionId);

  if (info.changes === 0) {
    return res.status(404).json({ error: 'Вопрос не найден' });
  }

  return res.json({ message: 'Вопрос удален' });
});
