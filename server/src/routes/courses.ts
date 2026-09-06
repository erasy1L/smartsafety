import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { authMiddleware } from '../middleware/auth.js';

export const coursesRouter = Router();

// GET /api/courses
coursesRouter.get('/', authMiddleware(), (req: Request, res: Response) => {
  const session = req.session!;

  if (session.role === 'cadet') {
    // Курсант видит ТОЛЬКО курсы, закрепленные за его учебной группой!
    const stmt = db.prepare(`
      SELECT c.id, c.title, c.category, c.code, c.description, c.duration_hours,
             c.created_at,
             (SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id) as question_count
      FROM courses c
      INNER JOIN group_courses gc ON gc.course_id = c.id
      WHERE gc.group_id = ?
      ORDER BY c.id ASC
    `);
    const courses = stmt.all(session.group_id!);
    return res.json(courses);
  }

  // Для администраторов УЦ и Супер-Админа
  const stmt = db.prepare(`
    SELECT c.*,
           (SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id) as question_count
    FROM courses c
    ORDER BY c.id ASC
  `);
  const courses = stmt.all();
  return res.json(courses);
});

// GET /api/courses/:id
coursesRouter.get('/:id', authMiddleware(), (req: Request, res: Response) => {
  const session = req.session!;
  const courseId = Number(req.params.id);

  if (session.role === 'cadet') {
    // Проверяем, закреплен ли курс за группой курсанта
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

// POST /api/courses (Супер-Админ)
coursesRouter.post('/', authMiddleware(['super_admin']), (req: Request, res: Response) => {
  const { title, category, code, description, duration_hours, slides, text_content, video_url } = req.body;

  if (!title || !code) {
    return res.status(400).json({ error: 'Название курса и код обязательны' });
  }

  const slidesJson = typeof slides === 'string' ? slides : JSON.stringify(slides || []);

  try {
    const stmt = db.prepare(`
      INSERT INTO courses (title, category, code, description, duration_hours, slides_json, text_content, video_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      title,
      category || 'Общий БиОТ',
      code,
      description || '',
      Number(duration_hours) || 40,
      slidesJson,
      text_content || '',
      video_url || ''
    );

    return res.status(201).json({ id: info.lastInsertRowid, message: 'Курс успешно создан' });
  } catch (err: any) {
    return res.status(400).json({ error: 'Ошибка создания курса: ' + (err.message || 'код курса должен быть уникальным') });
  }
});

// PUT /api/courses/:id (Супер-Админ)
coursesRouter.put('/:id', authMiddleware(['super_admin']), (req: Request, res: Response) => {
  const courseId = Number(req.params.id);
  const { title, category, code, description, duration_hours, slides, text_content, video_url } = req.body;

  const slidesJson = typeof slides === 'string' ? slides : JSON.stringify(slides || []);

  const stmt = db.prepare(`
    UPDATE courses
    SET title = ?, category = ?, code = ?, description = ?, duration_hours = ?, slides_json = ?, text_content = ?, video_url = ?
    WHERE id = ?
  `);

  const info = stmt.run(
    title,
    category,
    code,
    description,
    Number(duration_hours),
    slidesJson,
    text_content,
    video_url,
    courseId
  );

  if (info.changes === 0) {
    return res.status(404).json({ error: 'Курс не найден' });
  }

  return res.json({ message: 'Курс успешно обновлен' });
});

// DELETE /api/courses/:id (Супер-Админ)
coursesRouter.delete('/:id', authMiddleware(['super_admin']), (req: Request, res: Response) => {
  const courseId = Number(req.params.id);
  const stmt = db.prepare('DELETE FROM courses WHERE id = ?');
  const info = stmt.run(courseId);

  if (info.changes === 0) {
    return res.status(404).json({ error: 'Курс не найден' });
  }

  return res.json({ message: 'Курс успешно удален' });
});
