import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { authMiddleware } from '../middleware/auth.js';

export const groupsRouter = Router();

const LOGIN_RE = /^[A-Za-z0-9._-]{3,32}$/;
const CODE_RE = /^[A-Za-z0-9._-]{2,24}$/;

function attachCourseIds(groups: any[]) {
  const gcStmt = db.prepare('SELECT course_id FROM group_courses WHERE group_id = ?');
  for (const group of groups) {
    group.course_ids = (gcStmt.all(group.id) as { course_id: number }[]).map((row) => row.course_id);
  }
  return groups;
}

function loginTaken(login: string) {
  const inUsers = db.prepare('SELECT 1 FROM users WHERE login = ?').get(login);
  const inGroups = db.prepare('SELECT 1 FROM groups WHERE login = ?').get(login);
  return Boolean(inUsers || inGroups);
}

function getOwnGroup(groupId: number, tcId: number) {
  return db.prepare('SELECT * FROM groups WHERE id = ? AND tc_id = ?').get(groupId, tcId) as any;
}

groupsRouter.get('/enterprises', authMiddleware(['tc_admin']), (req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT id, name, industry
    FROM enterprises
    WHERE tc_id = ?
    ORDER BY name ASC
  `).all(req.session!.tc_id!);
  res.json(rows);
});

groupsRouter.get('/', authMiddleware(['tc_admin']), (req: Request, res: Response) => {
  const groups = db.prepare(`
    SELECT g.*, tc.name as tc_name, e.name as enterprise_name
    FROM groups g
    JOIN training_centers tc ON g.tc_id = tc.id
    LEFT JOIN enterprises e ON g.enterprise_id = e.id
    WHERE g.tc_id = ?
    ORDER BY g.id DESC
  `).all(req.session!.tc_id!) as any[];

  res.json(attachCourseIds(groups));
});

groupsRouter.post('/', authMiddleware(['tc_admin']), (req: Request, res: Response) => {
  const session = req.session!;
  const tcId = session.tc_id!;
  const {
    name,
    group_code,
    login,
    password,
    enterprise_id,
    new_enterprise_name,
    course_ids = []
  } = req.body;

  if (!name || !group_code || !login || !password) {
    return res.status(400).json({ error: 'Заполните название, код, логин и пароль учебной группы' });
  }

  const cleanLogin = String(login).trim();
  const cleanCode = String(group_code).trim();
  const cleanPassword = String(password).trim();

  if (!CODE_RE.test(cleanCode)) {
    return res.status(400).json({ error: 'Код группы: латиница, цифры, точка, дефис или подчёркивание, 2–24 символа' });
  }
  if (!LOGIN_RE.test(cleanLogin)) {
    return res.status(400).json({ error: 'Логин группы: латиница, цифры, точка, дефис или подчёркивание, 3–32 символа' });
  }
  if (cleanPassword.length < 3) {
    return res.status(400).json({ error: 'Пароль группы должен содержать не менее 3 символов' });
  }
  if (loginTaken(cleanLogin)) {
    return res.status(400).json({ error: 'Этот логин уже используется' });
  }

  let enterpriseId: number | null = enterprise_id ? Number(enterprise_id) : null;
  const newName = String(new_enterprise_name || '').trim();

  if (newName) {
    const insertEnt = db.prepare(`
      INSERT INTO enterprises (name, tc_id, industry) VALUES (?, ?, ?)
    `);
    const info = insertEnt.run(newName, tcId, 'Заказчик УЦ');
    enterpriseId = Number(info.lastInsertRowid);
  } else if (enterpriseId) {
    const own = db.prepare('SELECT id FROM enterprises WHERE id = ? AND tc_id = ?').get(enterpriseId, tcId);
    if (!own) {
      return res.status(403).json({ error: 'Компания не принадлежит вашему учебному центру' });
    }
  }

  try {
    const insertGroup = db.prepare(`
      INSERT INTO groups (name, group_code, login, password, tc_id, enterprise_id, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    const groupInfo = insertGroup.run(
      String(name).trim(),
      cleanCode,
      cleanLogin,
      cleanPassword,
      tcId,
      enterpriseId
    );
    const groupId = Number(groupInfo.lastInsertRowid);

    if (Array.isArray(course_ids) && course_ids.length > 0) {
      const insertGc = db.prepare('INSERT INTO group_courses (group_id, course_id) VALUES (?, ?)');
      const courseExists = db.prepare('SELECT id FROM courses WHERE id = ?');
      for (const cid of course_ids) {
        const id = Number(cid);
        if (!courseExists.get(id)) continue;
        insertGc.run(groupId, id);
      }
    }

    return res.status(201).json({
      success: true,
      group_id: groupId,
      message: 'Учебная группа и логин доступа созданы'
    });
  } catch (err: any) {
    return res.status(400).json({
      error: 'Ошибка создания группы: ' + (err.message || 'логин или код группы уже используется')
    });
  }
});

groupsRouter.put('/:id/courses', authMiddleware(['tc_admin']), (req: Request, res: Response) => {
  const session = req.session!;
  const groupId = Number(req.params.id);
  const group = getOwnGroup(groupId, session.tc_id!);

  if (!group) {
    return res.status(404).json({ error: 'Группа не найдена или не принадлежит вашему учебному центру' });
  }

  const course_ids = Array.isArray(req.body.course_ids) ? req.body.course_ids : [];
  const courseExists = db.prepare('SELECT id FROM courses WHERE id = ?');

  try {
    db.prepare('DELETE FROM group_courses WHERE group_id = ?').run(groupId);
    const insertGc = db.prepare('INSERT INTO group_courses (group_id, course_id) VALUES (?, ?)');
    for (const cid of course_ids) {
      const id = Number(cid);
      if (!Number.isInteger(id) || id <= 0 || !courseExists.get(id)) continue;
      insertGc.run(groupId, id);
    }
    return res.json({ success: true, message: 'Матрица доступа группы обновлена' });
  } catch (err: any) {
    return res.status(400).json({ error: 'Ошибка обновления матрицы: ' + err.message });
  }
});
