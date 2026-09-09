import { db } from '../db/db.js';

export const BILLING_MONTHLY = 185000;
export const BILLING_ANNUAL = 1776000;
export const VAT_RATE = 0.12;

export const BILLING_PROVIDER = {
  legal_name: 'ТОО «SmartSafety Technologies»',
  bin: '220940018932',
  address: 'Республика Казахстан, г. Алматы',
  bank: 'АО «Народный Банк Казахстана»',
  bik: 'HSBKKZKX',
  iik: 'KZ356010131000123456',
  kbe: '17',
  knp: '851',
  phone: '+7 (727) 349-55-10',
  email: 'billing@smartsafety.kz'
};

export type BillingPeriod = 'monthly' | 'annual';

export function vatAmount(gross: number) {
  return gross - Math.round(gross / (1 + VAT_RATE));
}

export function todayIso(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateRu(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const formatted = new Date(y, m - 1, d).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  return /г\.?\s*$/.test(formatted) ? formatted.trim() : `${formatted} г.`;
}

function lastDayOfMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function isLastDayOfMonth(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return d === lastDayOfMonth(y, m - 1);
}

export function addMonthsSnap(iso: string, months: number) {
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const ty = target.getUTCFullYear();
  const tm = target.getUTCMonth();
  const last = lastDayOfMonth(ty, tm);
  const day = isLastDayOfMonth(iso) ? last : Math.min(d, last);
  return `${ty}-${String(tm + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function addDaysIso(iso: string, days: number) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

export function daysUntil(iso: string, from = todayIso()) {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = iso.split('-').map(Number);
  const a = Date.UTC(y1, m1 - 1, d1);
  const b = Date.UTC(y2, m2 - 1, d2);
  return Math.round((b - a) / 86400000);
}

export function planLabel(plan: string) {
  return plan === 'annual' ? 'Ежегодный' : 'Ежемесячный';
}

export function statusFromDays(days: number) {
  if (days < 0) return { status: 'expired', label: 'Срок истёк' };
  if (days <= 14) return { status: 'expiring', label: 'Срок истекает' };
  return { status: 'active', label: 'Действует' };
}

export function documentStatusLabel(status: string) {
  if (status === 'paid') return 'Оплачен';
  if (status === 'overdue') return 'Просрочен';
  if (status === 'cancelled') return 'Аннулирован';
  return 'Выставлен';
}

export function nextDocNumber(issuedAt = todayIso()) {
  const [y, m] = issuedAt.split('-');
  const prefix = `СЧ-${y}/${m}-`;
  const row = db.prepare(`
    SELECT doc_number FROM billing_documents
    WHERE doc_number LIKE ?
    ORDER BY id DESC LIMIT 1
  `).get(`${prefix}%`) as { doc_number: string } | undefined;
  let seq = 1001;
  if (row) {
    const part = Number(row.doc_number.slice(prefix.length));
    if (Number.isFinite(part)) seq = part + 1;
  }
  return `${prefix}${seq}`;
}

export function contractNumberFor(tcId: number) {
  return `Д-SS-${String(tcId).padStart(3, '0')}-2026`;
}

export function createDefaultSubscription(
  tcId: number,
  options?: { from?: string; plan?: BillingPeriod }
) {
  const existing = db.prepare('SELECT id FROM subscriptions WHERE tc_id = ?').get(tcId);
  if (existing) return;
  const from = options?.from || todayIso();
  const plan: BillingPeriod = options?.plan === 'monthly' ? 'monthly' : 'annual';
  const until = addMonthsSnap(from, plan === 'monthly' ? 1 : 12);
  db.prepare(`
    INSERT INTO subscriptions (
      tc_id, plan, valid_from, valid_until, auto_renew, contract_number, monthly_amount, annual_amount
    ) VALUES (?, ?, ?, ?, 0, ?, ?, ?)
  `).run(tcId, plan, from, until, contractNumberFor(tcId), BILLING_MONTHLY, BILLING_ANNUAL);
}

export function getSubscriptionRow(tcId: number) {
  return db.prepare(`
    SELECT s.*, tc.name as tc_name, tc.bin as tc_bin, tc.city as tc_city,
           tc.contact_email as tc_email, tc.contact_phone as tc_phone
    FROM subscriptions s
    JOIN training_centers tc ON tc.id = s.tc_id
    WHERE s.tc_id = ?
  `).get(tcId) as any;
}

export function listDocuments(tcId: number) {
  return db.prepare(`
    SELECT * FROM billing_documents
    WHERE tc_id = ?
    ORDER BY issued_at DESC, id DESC
  `).all(tcId) as any[];
}

export function assembleBilling(tcId: number) {
  const row = getSubscriptionRow(tcId);
  if (!row) return null;

  const days = daysUntil(row.valid_until);
  const st = statusFromDays(days);
  const currentAmount = row.plan === 'annual' ? row.annual_amount : row.monthly_amount;

  return {
    provider: BILLING_PROVIDER,
    tariffs: {
      monthly: {
        period: 'monthly',
        title: 'Ежемесячный',
        duration: '1 календарный месяц',
        amount: BILLING_MONTHLY,
        vat: vatAmount(BILLING_MONTHLY),
        note: 'Счёт выставляется за каждый календарный месяц. Срок доступа исчисляется от даты окончания текущего периода.'
      },
      annual: {
        period: 'annual',
        title: 'Ежегодный',
        duration: '12 календарных месяцев',
        amount: BILLING_ANNUAL,
        vat: vatAmount(BILLING_ANNUAL),
        note: 'Соответствует десяти ежемесячным платежам. Срок доступа — один календарный год от даты окончания текущего периода.'
      }
    },
    subscription: {
      tc_id: row.tc_id,
      tc_name: row.tc_name,
      tc_bin: row.tc_bin,
      tc_city: row.tc_city,
      tc_email: row.tc_email,
      tc_phone: row.tc_phone,
      contract_number: row.contract_number,
      plan: row.plan as BillingPeriod,
      plan_label: planLabel(row.plan),
      valid_from: row.valid_from,
      valid_until: row.valid_until,
      valid_from_label: formatDateRu(row.valid_from),
      valid_until_label: formatDateRu(row.valid_until),
      days_remaining: days,
      status: st.status,
      status_label: st.label,
      auto_renew: row.auto_renew === 1,
      monthly_amount: row.monthly_amount,
      annual_amount: row.annual_amount,
      current_amount: currentAmount,
      current_vat: vatAmount(currentAmount)
    },
    documents: listDocuments(tcId).map((doc) => ({
      ...doc,
      amount_label: doc.amount,
      vat_amount: doc.vat_amount,
      period_label: planLabel(doc.period),
      status_label: documentStatusLabel(doc.status),
      issued_at_label: formatDateRu(doc.issued_at),
      due_at_label: formatDateRu(doc.due_at),
      paid_at_label: doc.paid_at ? formatDateRu(doc.paid_at) : null,
      period_from_label: formatDateRu(doc.period_from),
      period_to_label: formatDateRu(doc.period_to)
    }))
  };
}

export function previewExtension(validUntil: string, period: BillingPeriod) {
  const today = todayIso();
  const stillActive = validUntil >= today;
  const base = stillActive ? validUntil : today;
  const period_to = period === 'annual' ? addMonthsSnap(base, 12) : addMonthsSnap(base, 1);
  const amount = period === 'annual' ? BILLING_ANNUAL : BILLING_MONTHLY;
  return {
    period,
    period_from: stillActive ? addDaysIso(validUntil, 1) : today,
    period_to,
    amount,
    vat: vatAmount(amount)
  };
}

export function applyExtension(tcId: number, period: BillingPeriod) {
  const row = getSubscriptionRow(tcId);
  if (!row) {
    const err = new Error('Договор на использование платформы не найден') as Error & { status?: number };
    err.status = 404;
    throw err;
  }

  const preview = previewExtension(row.valid_until, period);
  const issued = todayIso();
  const due = addDaysIso(issued, 10);
  const docNumber = nextDocNumber(issued);
  const description = period === 'annual'
    ? `Продление ежегодной лицензии. Срок доступа по ${formatDateRu(preview.period_to)} включительно.`
    : `Продление ежемесячной лицензии. Срок доступа по ${formatDateRu(preview.period_to)} включительно.`;

  db.exec('BEGIN');
  try {
    db.prepare(`
      INSERT INTO billing_documents (
        tc_id, doc_number, kind, period, amount, vat_amount,
        period_from, period_to, issued_at, due_at, paid_at, status, description
      ) VALUES (?, ?, 'extension', ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?)
    `).run(
      tcId,
      docNumber,
      period,
      preview.amount,
      preview.vat,
      preview.period_from,
      preview.period_to,
      issued,
      due,
      issued,
      description
    );

    db.prepare(`
      UPDATE subscriptions
      SET plan = ?, valid_until = ?, updated_at = CURRENT_TIMESTAMP
      WHERE tc_id = ?
    `).run(period, preview.period_to, tcId);

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  return assembleBilling(tcId);
}

export function setAutoRenew(tcId: number, enabled: boolean) {
  const info = db.prepare(`
    UPDATE subscriptions SET auto_renew = ?, updated_at = CURRENT_TIMESTAMP WHERE tc_id = ?
  `).run(enabled ? 1 : 0, tcId);
  if (info.changes === 0) {
    const err = new Error('Договор на использование платформы не найден') as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  return assembleBilling(tcId);
}

export function listSubscriptionsOverview() {
  const rows = db.prepare(`
    SELECT s.*, tc.name as tc_name, tc.bin as tc_bin, tc.city as tc_city
    FROM subscriptions s
    JOIN training_centers tc ON tc.id = s.tc_id
    ORDER BY s.valid_until ASC, tc.name ASC
  `).all() as any[];

  return rows.map((row) => {
    const days = daysUntil(row.valid_until);
    const st = statusFromDays(days);
    return {
      tc_id: row.tc_id,
      tc_name: row.tc_name,
      tc_bin: row.tc_bin,
      tc_city: row.tc_city,
      contract_number: row.contract_number,
      plan: row.plan,
      plan_label: planLabel(row.plan),
      valid_until: row.valid_until,
      valid_until_label: formatDateRu(row.valid_until),
      days_remaining: days,
      status: st.status,
      status_label: st.label,
      auto_renew: row.auto_renew === 1,
      current_amount: row.plan === 'annual' ? row.annual_amount : row.monthly_amount
    };
  });
}
