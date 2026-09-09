import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { createDefaultSubscription, daysUntil, formatDateRu, planLabel, statusFromDays } from '../lib/billing.js';
import { hashUserPassword } from '../lib/passwords.js';

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
           (SELECT COUNT(*) FROM test_results tr WHERE tr.tc_id = tc.id) as certified_count,
           s.plan as subscription_plan,
           s.valid_until as subscription_valid_until,
           s.auto_renew as subscription_auto_renew,
           s.contract_number
    FROM training_centers tc
    LEFT JOIN subscriptions s ON s.tc_id = tc.id
    ORDER BY tc.id DESC
  `);

  const rows = stmt.all() as any[];
  res.json(rows.map((row) => {
    const until = row.subscription_valid_until as string | null;
    const days = until ? daysUntil(until) : null;
    const status = days === null ? null : statusFromDays(days);
    return {
      ...row,
      plan_label: row.subscription_plan ? planLabel(row.subscription_plan) : null,
      valid_until_label: until ? formatDateRu(until) : null,
      subscription_status_label: status?.label || 'Договор не оформлен',
      days_remaining: days
    };
  }));
});

// POST /api/admin/training-centers - Создание нового УЦ и аккаунта администратора УЦ
adminRouter.post('/training-centers', (req: Request, res: Response) => {
  const { name, bin, city, contact_phone, contact_email, admin_login, admin_password, admin_name, plan } = req.body;

  if (!name || !bin || !city || !admin_login || !admin_password) {
    return res.status(400).json({ error: 'Пожалуйста, заполните все обязательные поля для регистрации УЦ' });
  }

  const billingPlan = plan === 'monthly' ? 'monthly' : 'annual';

  try {
    const insertTc = db.prepare(`
      INSERT INTO training_centers (name, bin, city, contact_phone, contact_email, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    const tcInfo = insertTc.run(name, bin, city, contact_phone || '', contact_email || '');
    const tcId = Number(tcInfo.lastInsertRowid);

    const insertUser = db.prepare(`
      INSERT INTO users (login, password, role, tc_id, full_name)
      VALUES (?, ?, 'tc_admin', ?, ?)
    `);
    insertUser.run(
      String(admin_login).trim(),
      hashUserPassword(String(admin_password).trim()),
      tcId,
      admin_name || `Администратор ${name}`
    );

    createDefaultSubscription(tcId, { plan: billingPlan });

    res.status(201).json({ success: true, tc_id: tcId, message: 'Учебный центр и административный аккаунт созданы' });
  } catch (err: any) {
    res.status(400).json({ error: 'Ошибка создания УЦ: ' + (err.message || 'Логин администратора уже занят') });
  }
});

adminRouter.patch('/training-centers/:id/active', (req: Request, res: Response) => {
  const tcId = Number(req.params.id);
  const active = req.body?.active === true || req.body?.active === 1 ? 1 : 0;

  const existing = db.prepare('SELECT id FROM training_centers WHERE id = ?').get(tcId);
  if (!existing) {
    return res.status(404).json({ error: 'Учебный центр не найден' });
  }

  db.prepare('UPDATE training_centers SET active = ? WHERE id = ?').run(active, tcId);

  if (active === 0) {
    db.prepare(`
      DELETE FROM sessions
      WHERE tc_id = ? AND role IN ('tc_admin', 'company_admin', 'cadet')
    `).run(tcId);
  }

  res.json({
    success: true,
    active,
    message: active ? 'Доступ учебного центра включён' : 'Доступ учебного центра приостановлен'
  });
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

const LOGIN_RE = /^[A-Za-z0-9._-]{3,32}$/;

function platformLoginTaken(login: string) {
  return Boolean(
    db.prepare('SELECT 1 FROM users WHERE login = ?').get(login) ||
    db.prepare('SELECT 1 FROM groups WHERE login = ?').get(login)
  );
}

adminRouter.get('/super-admins', (_req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT id, login, full_name, created_at
    FROM users
    WHERE role = 'super_admin'
    ORDER BY id ASC
  `).all();
  res.json(rows);
});

adminRouter.post('/super-admins', (req: Request, res: Response) => {
  const login = String(req.body?.login || '').trim();
  const password = String(req.body?.password || '').trim();
  const fullName = String(req.body?.full_name || '').trim();

  if (!login || !password || !fullName) {
    return res.status(400).json({ error: 'Укажите логин, пароль и ФИО администратора платформы' });
  }
  if (!LOGIN_RE.test(login)) {
    return res.status(400).json({ error: 'Логин: латиница, цифры, точка, дефис или подчёркивание, 3–32 символа' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Пароль администратора должен содержать не менее 8 символов' });
  }
  if (fullName.length < 3) {
    return res.status(400).json({ error: 'Укажите полное ФИО администратора' });
  }
  if (platformLoginTaken(login)) {
    return res.status(400).json({ error: 'Этот логин уже используется' });
  }

  try {
    const info = db.prepare(`
      INSERT INTO users (login, password, role, tc_id, enterprise_id, full_name)
      VALUES (?, ?, 'super_admin', NULL, NULL, ?)
    `).run(login, hashUserPassword(password), fullName);

    return res.status(201).json({
      success: true,
      id: Number(info.lastInsertRowid),
      message: 'Администратор платформы создан'
    });
  } catch (err: any) {
    return res.status(400).json({ error: 'Ошибка создания администратора: ' + (err.message || 'логин уже занят') });
  }
});

adminRouter.delete('/super-admins/:id', (req: Request, res: Response) => {
  const session = req.session!;
  const id = Number(req.params.id);
  const target = db.prepare(`
    SELECT id, login, role FROM users WHERE id = ? AND role = 'super_admin'
  `).get(id) as { id: number; login: string; role: string } | undefined;

  if (!target) {
    return res.status(404).json({ error: 'Администратор платформы не найден' });
  }
  if (target.login === session.login || target.id === session.user_id) {
    return res.status(400).json({ error: 'Нельзя удалить собственную учётную запись' });
  }

  const count = (db.prepare(`
    SELECT COUNT(*) as count FROM users WHERE role = 'super_admin'
  `).get() as { count: number }).count;
  if (count <= 1) {
    return res.status(400).json({ error: 'Нельзя удалить последнего администратора платформы' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
  return res.json({ success: true, message: 'Администратор платформы удалён' });
});
