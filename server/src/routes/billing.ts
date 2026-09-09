import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  applyExtension,
  assembleBilling,
  formatDateRu,
  listSubscriptionsOverview,
  previewExtension,
  setAutoRenew,
  type BillingPeriod
} from '../lib/billing.js';

export const billingRouter = Router();

function resolveTcId(req: Request) {
  const session = req.session!;
  if (session.role === 'tc_admin') {
    return session.tc_id!;
  }
  if (session.role === 'super_admin') {
    const fromQuery = Number(req.query.tc_id || req.body?.tc_id);
    return Number.isInteger(fromQuery) && fromQuery > 0 ? fromQuery : undefined;
  }
  return undefined;
}

billingRouter.get('/', authMiddleware(['tc_admin', 'super_admin']), (req: Request, res: Response) => {
  const session = req.session!;

  if (session.role === 'super_admin' && !req.query.tc_id) {
    return res.json({ overview: listSubscriptionsOverview() });
  }

  const tcId = resolveTcId(req);
  if (!tcId) {
    return res.status(400).json({ error: 'Укажите учебный центр' });
  }

  const payload = assembleBilling(tcId);
  if (!payload) {
    return res.status(404).json({ error: 'Договор на использование платформы не найден' });
  }
  return res.json(payload);
});

billingRouter.get('/preview', authMiddleware(['tc_admin', 'super_admin']), (req: Request, res: Response) => {
  const tcId = resolveTcId(req);
  const period = String(req.query.period || '') as BillingPeriod;
  if (!tcId) {
    return res.status(400).json({ error: 'Укажите учебный центр' });
  }
  if (period !== 'monthly' && period !== 'annual') {
    return res.status(400).json({ error: 'Укажите период продления: ежемесячный или ежегодный' });
  }
  const payload = assembleBilling(tcId);
  if (!payload) {
    return res.status(404).json({ error: 'Договор на использование платформы не найден' });
  }
  const preview = previewExtension(payload.subscription.valid_until, period);
  return res.json({
    ...preview,
    period_from_label: formatDateRu(preview.period_from),
    period_to_label: formatDateRu(preview.period_to)
  });
});

billingRouter.post('/extend', authMiddleware(['tc_admin', 'super_admin']), (req: Request, res: Response) => {
  const tcId = resolveTcId(req);
  const period = String(req.body?.period || '') as BillingPeriod;
  if (!tcId) {
    return res.status(400).json({ error: 'Укажите учебный центр' });
  }
  if (period !== 'monthly' && period !== 'annual') {
    return res.status(400).json({ error: 'Укажите период продления: ежемесячный или ежегодный' });
  }
  try {
    const payload = applyExtension(tcId, period);
    return res.json({
      message: `Продление зарегистрировано. Срок доступа установлен по ${payload?.subscription.valid_until_label} включительно.`,
      ...payload
    });
  } catch (err: any) {
    return res.status(err.status || 400).json({ error: err.message || 'Не удалось оформить продление' });
  }
});

billingRouter.patch('/auto-renew', authMiddleware(['tc_admin', 'super_admin']), (req: Request, res: Response) => {
  const tcId = resolveTcId(req);
  if (!tcId) {
    return res.status(400).json({ error: 'Укажите учебный центр' });
  }
  try {
    const payload = setAutoRenew(tcId, Boolean(req.body?.enabled));
    return res.json(payload);
  } catch (err: any) {
    return res.status(err.status || 400).json({ error: err.message || 'Не удалось изменить автопродление' });
  }
});
