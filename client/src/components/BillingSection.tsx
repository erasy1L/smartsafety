import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { m } from "../paraglide/messages.js";
import { getLocale } from "../paraglide/runtime.js";
import {
  BillingDocument,
  BillingPayload,
  BillingSubscription,
} from "../types";

function formatKzt(amount: number) {
  const loc = getLocale() === "kk" ? "kk-KZ" : getLocale() === "en" ? "en-US" : "ru-RU";
  return `${new Intl.NumberFormat(loc).format(amount)} ₸`;
}

function dayLabel(n: number) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return m.day_many();
  if (last === 1) return m.day_one();
  if (last >= 2 && last <= 4) return m.day_few();
  return m.day_many();
}

function daysPhrase(n: number) {
  const abs = Math.abs(n);
  if (n < 0) return m.billing_expired_ago({ n: abs, days: dayLabel(abs) });
  if (n === 0) return m.billing_expires_today();
  return m.billing_days_left({ n, days: dayLabel(abs) });
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-1 sm:gap-4 py-2.5 border-b border-slate-100">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm text-slate-900">{value}</div>
    </div>
  );
}

interface BillingSectionProps {
  tcId?: number;
}

export const BillingSection: React.FC<BillingSectionProps> = ({ tcId }) => {
  const [data, setData] = useState<BillingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [period, setPeriod] = useState<"monthly" | "annual">("annual");
  const [preview, setPreview] = useState<{
    period_from_label: string;
    period_to_label: string;
    amount: number;
    vat: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await api.getBilling(tcId);
      if (!payload.subscription) {
        setError(m.billing_no_contract());
        setData(null);
        return;
      }
      setData(payload);
      setPeriod(payload.subscription.plan);
    } catch (err: any) {
      setError(err.message || m.billing_load_error());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tcId]);

  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    api
      .previewBillingExtension(period, tcId)
      .then((p) => {
        if (!cancelled) setPreview(p);
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [period, data?.subscription.valid_until, tcId]);

  const handleExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    const confirmed = window.confirm(
      `${m.billing_extend_title()}: ${period === "annual" ? m.billing_annual() : m.billing_monthly()}. ` +
        `${preview?.period_to_label || ""} ${m.sa_inclusive()}. ` +
        `${formatKzt(preview?.amount ?? 0)}`,
    );
    if (!confirmed) return;
    try {
      setSaving(true);
      const result = await api.extendBilling(period, tcId);
      setData(result);
      setNotice(result.message || m.billing_extend_text());
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAutoRenew = async (enabled: boolean) => {
    try {
      setSaving(true);
      const result = await api.setBillingAutoRenew(enabled, tcId);
      setData(result);
      setNotice(enabled ? m.billing_autorenew_on() : m.billing_autorenew_off());
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-sm text-slate-500">
        {m.common_loading()}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-red-800">
        {error || m.billing_load_error()}
      </div>
    );
  }

  const sub: BillingSubscription = data.subscription;

  return (
    <div className="space-y-6 text-slate-800">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
          {m.sa_billing_title()}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 max-w-3xl">
          {m.sa_billing_sub()}
        </p>
      </div>

      {notice && (
        <div className="border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800">
          {notice}
        </div>
      )}

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-900">
            {m.billing_card()}
          </h3>
        </div>
        <div className="px-5 py-2">
          <Row label={m.billing_contract()} value={<span className="font-mono">{sub.contract_number}</span>} />
          <Row label={m.sa_col_tc()} value={sub.tc_name} />
          <Row label={m.common_bin()} value={<span className="font-mono">{sub.tc_bin}</span>} />
          <Row label={m.billing_tariff()} value={sub.plan_label} />
          <Row label={m.billing_valid_from()} value={sub.valid_from_label} />
          <Row
            label={m.sa_col_until()}
            value={
              <span>
                <strong>{sub.valid_until_label}</strong>
                <span className="text-slate-500"> {m.sa_inclusive()}</span>
              </span>
            }
          />
          <Row
            label={m.sa_col_status()}
            value={
              <span>
                {daysPhrase(sub.days_remaining)}
                <span className="text-slate-500"> · {sub.status_label}</span>
              </span>
            }
          />
          <Row
            label={m.billing_current_amount()}
            value={`${formatKzt(sub.current_amount)} (${formatKzt(sub.current_vat)})`}
          />
          <Row
            label={m.billing_auto_renew()}
            value={sub.auto_renew ? m.common_yes() : m.common_no()}
          />
        </div>
        {sub.status === "expired" && (
          <div className="px-5 py-3 border-t border-slate-200 text-sm text-slate-800 bg-slate-50">
            {m.billing_extend_text()}
          </div>
        )}
        {sub.status === "expiring" && (
          <div className="px-5 py-3 border-t border-slate-200 text-sm text-slate-800 bg-slate-50">
            {m.billing_extend_title()}
          </div>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-900">{m.billing_tariffs()}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-semibold">{m.billing_period()}</th>
                <th className="px-5 py-3 font-semibold">{m.billing_monthly()}</th>
                <th className="px-5 py-3 font-semibold">{m.billing_annual()}</th>
              </tr>
            </thead>
            <tbody className="text-slate-800">
              <tr className="border-b border-slate-100">
                <td className="px-5 py-3 text-slate-500">{m.billing_duration()}</td>
                <td className="px-5 py-3">{data.tariffs.monthly.duration}</td>
                <td className="px-5 py-3">{data.tariffs.annual.duration}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-5 py-3 text-slate-500">{m.billing_amount()}</td>
                <td className="px-5 py-3 font-medium">{formatKzt(data.tariffs.monthly.amount)}</td>
                <td className="px-5 py-3 font-medium">{formatKzt(data.tariffs.annual.amount)}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-5 py-3 text-slate-500">{m.billing_vat()}</td>
                <td className="px-5 py-3">{formatKzt(data.tariffs.monthly.vat)}</td>
                <td className="px-5 py-3">{formatKzt(data.tariffs.annual.vat)}</td>
              </tr>
              <tr>
                <td className="px-5 py-3 text-slate-500 align-top">{m.billing_note()}</td>
                <td className="px-5 py-3 text-xs leading-relaxed text-slate-600">
                  {data.tariffs.monthly.note}
                </td>
                <td className="px-5 py-3 text-xs leading-relaxed text-slate-600">
                  {data.tariffs.annual.note}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-900">{m.billing_extend_title()}</h3>
        </div>
        <form onSubmit={handleExtend} className="p-5 space-y-4">
          <p className="text-sm leading-relaxed text-slate-600">
            {m.billing_extend_text()}
          </p>
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              {m.billing_period()}
            </legend>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="radio"
                name="billing-period"
                className="mt-1 accent-slate-800"
                checked={period === "monthly"}
                onChange={() => setPeriod("monthly")}
              />
              <span>
                <span className="font-medium text-slate-900">{m.billing_monthly()}</span>
                <span className="block text-slate-500 text-xs mt-0.5">
                  {m.billing_monthly_sub({ amount: formatKzt(data.tariffs.monthly.amount) })}
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="radio"
                name="billing-period"
                className="mt-1 accent-slate-800"
                checked={period === "annual"}
                onChange={() => setPeriod("annual")}
              />
              <span>
                <span className="font-medium text-slate-900">{m.billing_annual()}</span>
                <span className="block text-slate-500 text-xs mt-0.5">
                  {m.billing_annual_sub({ amount: formatKzt(data.tariffs.annual.amount) })}
                </span>
              </span>
            </label>
          </fieldset>

          {preview && (
            <div className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm space-y-1">
              <div>
                {preview.period_from_label} — <strong>{preview.period_to_label}</strong>{" "}
                {m.sa_inclusive()}
              </div>
              <div>
                {formatKzt(preview.amount)} · {formatKzt(preview.vat)}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-semibold rounded-md"
            >
              {saving ? m.common_loading() : m.billing_extend_title()}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleAutoRenew(!sub.auto_renew)}
              className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-medium rounded-md"
            >
              {sub.auto_renew ? m.billing_disable_autorenew() : m.billing_enable_autorenew()}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-900">{m.billing_docs()}</h3>
        </div>
        {data.documents.length === 0 ? (
          <div className="px-5 py-8 text-sm text-slate-500">
            {m.sa_billing_empty()}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-semibold">{m.billing_doc_number()}</th>
                  <th className="px-4 py-3 font-semibold">{m.billing_issued()}</th>
                  <th className="px-4 py-3 font-semibold">{m.billing_period()}</th>
                  <th className="px-4 py-3 font-semibold">{m.billing_duration()}</th>
                  <th className="px-4 py-3 font-semibold">{m.billing_amount()}</th>
                  <th className="px-4 py-3 font-semibold">{m.billing_due()}</th>
                  <th className="px-4 py-3 font-semibold">{m.sa_col_status()}</th>
                </tr>
              </thead>
              <tbody>
                {data.documents.map((doc: BillingDocument) => (
                  <tr key={doc.id} className="border-b border-slate-100 align-top">
                    <td className="px-4 py-3 font-mono text-slate-900 whitespace-nowrap">
                      {doc.doc_number}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{doc.issued_at_label}</td>
                    <td className="px-4 py-3">{doc.period_label}</td>
                    <td className="px-4 py-3">
                      {doc.period_from_label} — {doc.period_to_label}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {formatKzt(doc.amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{doc.due_at_label}</td>
                    <td className="px-4 py-3">
                      {doc.status_label}
                      {doc.paid_at_label ? (
                        <span className="block text-slate-500 mt-0.5">
                          {doc.paid_at_label}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-900">
            {m.contacts_requisites()}
          </h3>
        </div>
        <div className="px-5 py-2">
          <Row label={m.contacts_legal_name()} value={data.provider.legal_name} />
          <Row label={m.common_bin()} value={<span className="font-mono">{data.provider.bin}</span>} />
          <Row label={m.billing_bank()} value={data.provider.bank} />
          <Row label={m.billing_bik()} value={<span className="font-mono">{data.provider.bik}</span>} />
          <Row label={m.billing_iik()} value={<span className="font-mono">{data.provider.iik}</span>} />
          <Row label={m.billing_kbe()} value={data.provider.kbe} />
          <Row label={m.billing_knp()} value={data.provider.knp} />
          <Row label={m.billing_purpose()} value={`${sub.contract_number}`} />
        </div>
        <div className="px-5 py-3 border-t border-slate-200 text-xs leading-relaxed text-slate-500">
          {data.provider.email}, {data.provider.phone}
        </div>
      </section>
    </div>
  );
};
