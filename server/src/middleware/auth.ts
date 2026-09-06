import { Request, Response, NextFunction } from 'express';
import { db } from '../db/db.js';
import { AuthSession, UserRole } from '../types.js';

declare global {
  namespace Express {
    interface Request {
      session?: AuthSession;
    }
  }
}

export function authMiddleware(requiredRoles?: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Требуется авторизация в системе' });
    }

    const token = authHeader.split(' ')[1];
    const stmt = db.prepare(`
      SELECT s.*, tc.name as tc_name, g.name as group_name
      FROM sessions s
      LEFT JOIN training_centers tc ON s.tc_id = tc.id
      LEFT JOIN groups g ON s.group_id = g.id
      WHERE s.token = ?
    `);

    const session = stmt.get(token) as (AuthSession & { tc_name?: string; group_name?: string }) | undefined;

    if (!session) {
      return res.status(401).json({ error: 'Сессия истекла или недействительна. Пожалуйста, выполните вход снова' });
    }

    if (requiredRoles && !requiredRoles.includes(session.role)) {
      return res.status(403).json({ error: 'Недостаточно прав для выполнения данной операции' });
    }

    req.session = session;
    next();
  };
}
