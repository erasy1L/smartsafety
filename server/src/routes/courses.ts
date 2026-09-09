import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  assignCourseToTcGroups,
  canWriteCourse,
  COURSE_CODE_RE,
  getCourseById,
  normalizeSlidesJson
} from '../lib/courseAccess.js';

export const coursesRouter = Router();

function writeForbidden(res: Response) {
  return res.status(403).json({ error: 'Можно изменять только курсы, созданные вашим учебным центром' });
}

// GET /api/courses
coursesRouter.get('/', authMiddleware(), (req: Request, res: Response) => {
  const session = req.session!;

  if (session.role === 'cadet') {
    // Курсант видит ТОЛЬКО курсы, закрепленные за его учебной группой!
    const stmt = db.prepare(`
      SELECT c.id, c.title, c.category, c.code, c.description, c.duration_hours,
             c.created_at, c.owner_tc_id,
             (SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id) as question_count
      FROM courses c
      INNER JOIN group_courses gc ON gc.course_id = c.id
      WHERE gc.group_id = ?
      ORDER BY c.id ASC
    `);
    const courses = stmt.all(session.group_id!);
    return res.json(courses);
  }

  if (session.role === 'company_admin') {
    const stmt = db.prepare(`
      SELECT DISTINCT c.id, c.title, c.category, c.code, c.description, c.duration_hours,
             c.created_at, c.owner_tc_id,
             (SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id) as question_count
      FROM courses c
      INNER JOIN group_courses gc ON gc.course_id = c.id
      INNER JOIN groups g ON g.id = gc.group_id
      WHERE g.enterprise_id = ?
      ORDER BY c.id ASC
    `);
    return res.json(stmt.all(session.enterprise_id!));
  }

  // Для администраторов УЦ и Супер-Админа
  const stmt = db.prepare(`
    SELECT c.*,
           tc.name as owner_tc_name,
           (SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id) as question_count
    FROM courses c
    LEFT JOIN training_centers tc ON tc.id = c.owner_tc_id
    ORDER BY c.id ASC
  `);
  const courses = stmt.all();
  return res.json(courses);
});

// PUT /api/courses/:id/groups — назначение курса группам УЦ
coursesRouter.put('/:id/groups', authMiddleware(['tc_admin', 'super_admin']), (req: Request, res: Response) => {
  const session = req.session!;
  const courseId = Number(req.params.id);
  const course = getCourseById(courseId);

  if (!course) {
    return res.status(404).json({ error: 'Курс не найден' });
  }
  if (!canWriteCourse(session, course)) {
    return writeForbidden(res);
  }

  const tcId = session.role === 'tc_admin' ? session.tc_id! : Number(req.body.tc_id || course.owner_tc_id);
  if (!tcId) {
    return res.status(400).json({ error: 'Укажите учебный центр для назначения групп' });
  }

  try {
    assignCourseToTcGroups(courseId, tcId, req.body.group_ids);
    return res.json({ success: true, message: 'Курс назначен учебным группам' });
  } catch (err: any) {
    return res.status(err.status || 400).json({ error: err.message || 'Ошибка назначения групп' });
  }
});

// GET /api/courses/:id
coursesRouter.get('/:id', authMiddleware(), (req: Request, res: Response) => {
  const session = req.session!;
  const courseId = Number(req.params.id);

  if (session.role === 'cadet') {
    const checkStmt = db.prepare(`
      SELECT 1 FROM group_courses WHERE group_id = ? AND course_id = ?
    `);
    const allowed = checkStmt.get(session.group_id!, courseId);
    if (!allowed) {
      return res.status(403).json({ error: 'Доступ к данному курсу ограничен для вашей учебной группы' });
    }
  }

  const stmt = db.prepare(`
    SELECT c.*,
           (SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id) as question_count
    FROM courses c
    WHERE c.id = ?
  `);
  const course = stmt.get(courseId) as any;

  if (!course) {
    return res.status(404).json({ error: 'Курс не найден' });
  }

  try {
    course.slides = JSON.parse(course.slides_json);
  } catch (e) {
    course.slides = [];
  }

  return res.json(course);
});

// POST /api/courses
coursesRouter.post('/', authMiddleware(['super_admin', 'tc_admin']), (req: Request, res: Response) => {
  const session = req.session!;
  const { title, category, code, description, duration_hours, slides, text_content, video_url, group_ids } = req.body;

  if (!title || !code) {
    return res.status(400).json({ error: 'Название курса и код обязательны' });
  }
  if (!COURSE_CODE_RE.test(String(code).trim())) {
    return res.status(400).json({
      error: 'Код курса: латиница, цифры, точка, дефис или подчёркивание, 2–32 символа. Пример: BIOT-KZ-2026'
    });
  }

  const ownerTcId = session.role === 'tc_admin' ? session.tc_id! : (req.body.owner_tc_id ? Number(req.body.owner_tc_id) : null);
  const slidesJson = normalizeSlidesJson(slides, title);

  try {
    const stmt = db.prepare(`
      INSERT INTO courses (title, category, code, description, duration_hours, slides_json, text_content, video_url, owner_tc_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      String(title).trim(),
      category || 'Охрана труда',
      String(code).trim(),
      description || '',
      Number(duration_hours) || 40,
      slidesJson,
      text_content || '',
      video_url || '',
      ownerTcId
    );
    const courseId = Number(info.lastInsertRowid);

    if (session.role === 'tc_admin' && Array.isArray(group_ids) && group_ids.length > 0) {
      assignCourseToTcGroups(courseId, session.tc_id!, group_ids);
    }

    return res.status(201).json({ id: courseId, message: 'Курс успешно создан' });
  } catch (err: any) {
    return res.status(400).json({ error: 'Ошибка создания курса: ' + (err.message || 'код курса должен быть уникальным') });
  }
});

// PUT /api/courses/:id
coursesRouter.put('/:id', authMiddleware(['super_admin', 'tc_admin']), (req: Request, res: Response) => {
  const session = req.session!;
  const courseId = Number(req.params.id);
  const existing = getCourseById(courseId);

  if (!existing) {
    return res.status(404).json({ error: 'Курс не найден' });
  }
  if (!canWriteCourse(session, existing)) {
    return writeForbidden(res);
  }

  const { title, category, code, description, duration_hours, slides, text_content, video_url } = req.body;
  if (!title || !code) {
    return res.status(400).json({ error: 'Название курса и код обязательны' });
  }
  if (!COURSE_CODE_RE.test(String(code).trim())) {
    return res.status(400).json({
      error: 'Код курса: латиница, цифры, точка, дефис или подчёркивание, 2–32 символа. Пример: BIOT-KZ-2026'
    });
  }

  const slidesJson = normalizeSlidesJson(slides ?? existing.slides_json, title);

  try {
    const stmt = db.prepare(`
      UPDATE courses
      SET title = ?, category = ?, code = ?, description = ?, duration_hours = ?, slides_json = ?, text_content = ?, video_url = ?
      WHERE id = ?
    `);

    stmt.run(
      String(title).trim(),
      category || existing.category,
      String(code).trim(),
      description ?? existing.description,
      Number(duration_hours) || existing.duration_hours,
      slidesJson,
      text_content ?? existing.text_content,
      video_url ?? existing.video_url,
      courseId
    );

    return res.json({ message: 'Курс успешно обновлен' });
  } catch (err: any) {
    return res.status(400).json({ error: 'Ошибка обновления курса: ' + (err.message || 'код курса должен быть уникальным') });
  }
});

// DELETE /api/courses/:id
coursesRouter.delete('/:id', authMiddleware(['super_admin', 'tc_admin']), (req: Request, res: Response) => {
  const session = req.session!;
  const courseId = Number(req.params.id);
  const existing = getCourseById(courseId);

  if (!existing) {
    return res.status(404).json({ error: 'Курс не найден' });
  }
  if (!canWriteCourse(session, existing)) {
    return writeForbidden(res);
  }

  const stmt = db.prepare('DELETE FROM courses WHERE id = ?');
  stmt.run(courseId);
  return res.json({ message: 'Курс успешно удален' });
});
