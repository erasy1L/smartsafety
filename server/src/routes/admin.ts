import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { authMiddleware } from '../middleware/auth.js';

export const adminRouter = Router();

// Все эндпоинты adminRouter доступны ТОЛЬКО супер-админу
adminRouter.use(authMiddleware(['super_admin']));

// GET /api/admin/stats - Сводные показатели платформы
adminRouter.get('/stats', (_req: Request, res: Response) => {
  const tcsCount = (db.prepare('SELECT COUNT(*) as count FROM training_centers').get() as any).count;
  const groupsCount = (db.prepare('SELECT COUNT(*) as count FROM groups').get() as any).count;
  const coursesCount = (db.prepare('SELECT COUNT(*) as count FROM courses').get() as any).count;
  const testsCount = (db.prepare('SELECT COUNT(*) as count FROM test_results').get() as any).count;
  const passedCount = (db.prepare('SELECT COUNT(*) as count FROM test_results WHERE passed = 1').get() as any).count;

  const passRate = testsCount > 0 ? Math.round((passedCount / testsCount) * 100) : 0;

  res.json({
    total_training_centers: tcsCount,
    total_groups: groupsCount,
    total_courses: coursesCount,
    total_tests_completed: testsCount,
    pass_rate: passRate
  });
});

// GET /api/admin/training-centers - Список всех УЦ
adminRouter.get('/training-centers', (_req: Request, res: Response) => {
  const stmt = db.prepare(`
    SELECT tc.*,
           (SELECT COUNT(*) FROM groups g WHERE g.tc_id = tc.id) as groups_count,
           (SELECT COUNT(*) FROM test_results tr WHERE tr.tc_id = tc.id) as certified_count
    FROM training_centers tc
    ORDER BY tc.id DESC
  `);
  res.json(stmt.all());
});

// POST /api/admin/training-centers - Создание нового УЦ и аккаунта администратора УЦ
adminRouter.post('/training-centers', (req: Request, res: Response) => {
  const { name, bin, city, contact_phone, contact_email, admin_login, admin_password, admin_name } = req.body;

  if (!name || !bin || !city || !admin_login || !admin_password) {
    return res.status(400).json({ error: 'Пожалуйста, заполните все обязательные поля для регистрации УЦ' });
  }

  try {
    const insertTc = db.prepare(`
      INSERT INTO training_centers (name, bin, city, contact_phone, contact_email)
      VALUES (?, ?, ?, ?, ?)
    `);
    const tcInfo = insertTc.run(name, bin, city, contact_phone || '', contact_email || '');
    const tcId = Number(tcInfo.lastInsertRowid);

    const insertUser = db.prepare(`
      INSERT INTO users (login, password, role, tc_id, full_name)
      VALUES (?, ?, 'tc_admin', ?, ?)
    `);
    insertUser.run(
      String(admin_login).trim(),
      String(admin_password).trim(),
      tcId,
      admin_name || `Администратор ${name}`
    );

    res.status(201).json({ success: true, tc_id: tcId, message: 'Учебный центр и административный аккаунт созданы' });
  } catch (err: any) {
    res.status(400).json({ error: 'Ошибка создания УЦ: ' + (err.message || 'Логин администратора уже занят') });
  }
});

// GET /api/admin/groups - Список всех групп со связанными курсами
adminRouter.get('/groups', (_req: Request, res: Response) => {
  const stmt = db.prepare(`
    SELECT g.*, tc.name as tc_name, e.name as enterprise_name
    FROM groups g
    JOIN training_centers tc ON g.tc_id = tc.id
    LEFT JOIN enterprises e ON g.enterprise_id = e.id
    ORDER BY g.id DESC
  `);
  const groups = stmt.all() as any[];

  // Получаем привязанные курсы для каждой группы
  const gcStmt = db.prepare(`
    SELECT course_id FROM group_courses WHERE group_id = ?
  `);

  for (const g of groups) {
    const courses = gcStmt.all(g.id) as any[];
    g.course_ids = courses.map(c => c.course_id);
  }

  res.json(groups);
});

// POST /api/admin/groups - Создание новой учебной группы с генерацией логина и привязкой курсов
adminRouter.post('/groups', (req: Request, res: Response) => {
  const { name, group_code, login, password, tc_id, enterprise_id, course_ids = [] } = req.body;

  if (!name || !group_code || !login || !password || !tc_id) {
    return res.status(400).json({ error: 'Заполните обязательные параметры группы (название, код, логин, пароль, УЦ)' });
  }

  try {
    const insertGroup = db.prepare(`
      INSERT INTO groups (name, group_code, login, password, tc_id, enterprise_id, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    const groupInfo = insertGroup.run(
      name,
      group_code,
      String(login).trim(),
      String(password).trim(),
      Number(tc_id),
      enterprise_id ? Number(enterprise_id) : null
    );
    const groupId = Number(groupInfo.lastInsertRowid);

    // Привязываем курсы
    if (Array.isArray(course_ids) && course_ids.length > 0) {
      const insertGc = db.prepare('INSERT INTO group_courses (group_id, course_id) VALUES (?, ?)');
      for (const cid of course_ids) {
        insertGc.run(groupId, Number(cid));
      }
    }

    res.status(201).json({ success: true, group_id: groupId, message: 'Учебная группа успешно создана' });
  } catch (err: any) {
    res.status(400).json({ error: 'Ошибка создания группы: ' + (err.message || 'логин или код группы уже используется') });
  }
});

// PUT /api/admin/groups/:id/courses - Обновление матрицы привязки курсов к группе
adminRouter.put('/groups/:id/courses', (req: Request, res: Response) => {
  const groupId = Number(req.params.id);
  const { course_ids = [] } = req.body;

  try {
    db.prepare('DELETE FROM group_courses WHERE group_id = ?').run(groupId);

    if (Array.isArray(course_ids) && course_ids.length > 0) {
      const insertGc = db.prepare('INSERT INTO group_courses (group_id, course_id) VALUES (?, ?)');
      for (const cid of course_ids) {
        insertGc.run(groupId, Number(cid));
      }
    }

    res.json({ success: true, message: 'Привязка курсов к группе обновлена' });
  } catch (err: any) {
    res.status(400).json({ error: 'Ошибка обновления курсов группы: ' + err.message });
  }
});
