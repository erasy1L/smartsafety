import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import crypto from 'node:crypto';
import { authMiddleware } from '../middleware/auth.js';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: 'Пожалуйста, укажите логин и пароль' });
  }

  const cleanLogin = String(login).trim();
  const cleanPassword = String(password).trim();

  // 1. Проверяем в таблице пользователей (Супер-Админ или Администратор УЦ)
  const userStmt = db.prepare(`
    SELECT u.*, tc.name as tc_name
    FROM users u
    LEFT JOIN training_centers tc ON u.tc_id = tc.id
    WHERE u.login = ?
  `);
  const user = userStmt.get(cleanLogin) as any;

  if (user && user.password === cleanPassword) {
    const token = crypto.randomUUID();
    const insertSession = db.prepare(`
      INSERT INTO sessions (token, role, user_id, login, full_name, tc_id, group_id, cadet_fio)
      VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)
    `);
    insertSession.run(token, user.role, user.id, user.login, user.full_name, user.tc_id);

    return res.json({
      token,
      role: user.role,
      login: user.login,
      full_name: user.full_name,
      tc_id: user.tc_id,
      tc_name: user.tc_name || 'Платформа SmartSafety'
    });
  }

  // 2. Проверяем в таблице групп (Курсантский групповой доступ)
  const groupStmt = db.prepare(`
    SELECT g.*, tc.name as tc_name, e.name as enterprise_name
    FROM groups g
    JOIN training_centers tc ON g.tc_id = tc.id
    LEFT JOIN enterprises e ON g.enterprise_id = e.id
    WHERE g.login = ? AND g.active = 1
  `);
  const group = groupStmt.get(cleanLogin) as any;

  if (group && group.password === cleanPassword) {
    const token = crypto.randomUUID();
    const insertSession = db.prepare(`
      INSERT INTO sessions (token, role, user_id, login, full_name, tc_id, group_id, cadet_fio)
      VALUES (?, 'cadet', NULL, ?, ?, ?, ?, NULL)
    `);
    insertSession.run(token, group.login, group.name, group.tc_id, group.id);

    return res.json({
      token,
      role: 'cadet',
      login: group.login,
      group_id: group.id,
      group_name: group.name,
      group_code: group.group_code,
      enterprise_name: group.enterprise_name,
      tc_id: group.tc_id,
      tc_name: group.tc_name,
      cadet_fio: null // Требуется обязательный ввод ФИО!
    });
  }

  return res.status(401).json({ error: 'Неверные идентификационные данные. Доступ в систему запрещен.' });
});

// POST /api/auth/cadet/fio - Обязательное указание ФИО курсанта перед началом обучения
authRouter.post('/cadet/fio', authMiddleware(['cadet']), (req: Request, res: Response) => {
  const { fio } = req.body;
  const cleanFio = String(fio || '').trim();

  if (!cleanFio || cleanFio.length < 3) {
    return res.status(400).json({ error: 'Пожалуйста, введите ваше полное ФИО (не менее 3 символов)' });
  }

  const token = req.session!.token;
  const updateSession = db.prepare(`
    UPDATE sessions SET cadet_fio = ? WHERE token = ?
  `);
  updateSession.run(cleanFio, token);

  return res.json({
    success: true,
    cadet_fio: cleanFio,
    message: 'ФИО курсанта успешно зарегистрировано в текущей экзаменационной сессии'
  });
});

// GET /api/auth/me - Проверка статуса авторизации
authRouter.get('/me', authMiddleware(), (req: Request, res: Response) => {
  const session = req.session!;
  res.json({
    role: session.role,
    login: session.login,
    full_name: session.full_name,
    tc_id: session.tc_id,
    tc_name: session.tc_name,
    group_id: session.group_id,
    group_name: session.group_name,
    cadet_fio: session.cadet_fio
  });
});

// POST /api/auth/logout
authRouter.post('/logout', authMiddleware(), (req: Request, res: Response) => {
  const token = req.session!.token;
  const deleteSession = db.prepare('DELETE FROM sessions WHERE token = ?');
  deleteSession.run(token);
  res.json({ success: true, message: 'Выход из системы выполнен' });
});

// GET /api/auth/demo-credentials - Список демонстрационных аккаунтов для быстрого тестирования
authRouter.get('/demo-credentials', (_req: Request, res: Response) => {
  res.json({
    cadet: [
      {
        title: 'Курсант БиОТ (ТОО КазМунайПром)',
        login: 'kursant_biot',
        password: '123',
        group: 'Группа БиОТ-401',
        description: 'Доступ только к курсу по Охране труда'
      },
      {
        title: 'Курсант ПБ (АО Самрук-Энерго)',
        login: 'kursant_prombez',
        password: '123',
        group: 'Группа ПБ-102',
        description: 'Доступ только к курсу по ПромБезопасности'
      }
    ],
    tc_admin: [
      {
        title: 'Учебный Центр «Қорғау-Сапа» (Алматы)',
        login: 'admin_qorgau',
        password: 'qorgau123',
        description: 'Просмотр результатов своих групп, выгрузка в Excel'
      },
      {
        title: 'УЦ «ПромБезопасность Казахстан»',
        login: 'admin_prombez',
        password: 'prom123',
        description: 'Просмотр аналитики и протоколов своего УЦ'
      }
    ],
    super_admin: [
      {
        title: 'Главный Администратор платформы SmartSafety',
        login: 'superadmin',
        password: 'admin2026',
        description: 'Полный доступ: CMS курсов, тестов, УЦ и групп'
      }
    ]
  });
});
