import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { authMiddleware } from '../middleware/auth.js';

export const testsRouter = Router();

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
  const stmt = db.prepare(`
    SELECT id, course_id, text, options_json
    FROM questions
    WHERE course_id = ?
    ORDER BY id ASC
  `);
  const rows = stmt.all(courseId) as any[];
  const cadetQuestions = rows.map(r => ({
    id: r.id,
    course_id: r.course_id,
    text: r.text,
    options: JSON.parse(r.options_json)
  }));

  return res.json(cadetQuestions);
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
  const courseStmt = db.prepare('SELECT title FROM courses WHERE id = ?');
  const course = courseStmt.get(courseId) as any;

  if (!course) {
    return res.status(404).json({ error: 'Курс не найден' });
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

  // Генерируем уникальный официальный номер протокола
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const randomCode = Math.floor(1000 + Math.random() * 9000);
  const protocol_id = `ПР-${year}/${month}-${randomCode}`;

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


  return res.json({
    protocol_id,
    cadet_fio: session.cadet_fio,
    course_title: course.title,
    score,
    max_score,
    percentage,
    passed: passed === 1,
    cheat_flags: Number(cheat_flags),
    completed_at: now.toISOString(),
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
