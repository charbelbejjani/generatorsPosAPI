import prisma from '../prisma';
import { Prisma } from '@prisma/client';

// ─── Monthly Schedule Report ──────────────────────────────────────────────────

export interface MonthlyScheduleRow {
  clientId: number;
  clientName: string;
  ampValue: number | null;
  ampNum: number | null;
  pdAmt: number;
  dollarAmt: number;
  paidCurrency: boolean | null;
  isPaid: boolean;
  previousRemainingAmt: number | null;
  zoneId: number | null;
  zoneZgId: number | null;
  zoneName: string | null;
  schedule: string;
}

export interface MonthlyScheduleSummary {
  totalPaidLbp: number;
  totalPaidDollar: number;
  totalUnpaidLbp: number;
  totalUnpaidDollarEquiv: number;
  totalPreviousRemaining: number;
}

export interface MonthlyScheduleResult {
  rows: MonthlyScheduleRow[];
  summary: MonthlyScheduleSummary;
}

export const monthlyScheduleReport = async (
  schId: number,
  zoneGroupId?: number,
  hasException?: number,  // 0 = no exception, 1 = has exception
  beforeDate?: string,    // YYYY-MM-DD — clamp paid status to this date
  beforeSchId?: number,   // lower bound for remaining-balance subquery (default 7 in legacy)
): Promise<MonthlyScheduleResult> => {
  const zoneFilter = zoneGroupId !== undefined
    ? Prisma.sql`AND zg.zg_id = ${zoneGroupId}`
    : Prisma.empty;

  const exceptFilter = hasException !== undefined
    ? Prisma.sql`AND p.pd_client_extra = ${hasException === 1}`
    : Prisma.empty;

  // Remaining-balance subquery: schedule lower bound
  const beforeSchFilter = beforeSchId !== undefined
    ? Prisma.sql`AND pd.pd_sch_id >= ${beforeSchId}`
    : Prisma.sql`AND pd.pd_sch_id >= 7`;

  // If beforeDate: exclude payments made after that date from the "remaining" total
  const remainingBeforeDateFilter = beforeDate
    ? Prisma.sql`AND (pd.pd_paid = 0 OR (pd.pd_paid = 1 AND DATE(pd.pd_paid_ts) > ${beforeDate}))`
    : Prisma.empty;

  // Conditional paid-status columns depending on beforeDate
  const paidStatusSelect = beforeDate
    ? Prisma.sql`
        IF(p.pd_paid = 1 AND DATE(p.pd_paid_ts) <= ${beforeDate}, 1, 0) AS is_paid,
        IF(DATE(p.pd_paid_ts) <= ${beforeDate}, p.pd_paid_currency, NULL) AS pd_paid_currency`
    : Prisma.sql`
        CAST(p.pd_paid AS UNSIGNED) AS is_paid,
        p.pd_paid_currency`;

  const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT
      a.amp_num,
      ${paidStatusSelect},
      CONCAT_WS(' ', p.pd_client_first_name, p.pd_client_middle_name, p.pd_client_last_name) AS client_name,
      p.pd_amt,
      remainingClients.allAmt AS previous_remaining_amt,
      p.pd_client_id AS client_id,
      a.amp_value,
      CONCAT_WS(' - ', s.sch_month, s.sch_year) AS schedule_label,
      CEIL(p.pd_amt / NULLIF(p.pd_dollar_rate, 0)) AS dollar_amt,
      z.zone_name,
      z.zone_id,
      z.zone_zg_id
    FROM payments_details p
    LEFT JOIN (
      SELECT SUM(pd.pd_amt) AS allAmt, pd.pd_client_id AS clientId
      FROM payments_details pd
      WHERE pd.pd_active = 1
        ${beforeSchFilter}
        AND pd.pd_sch_id < ${schId}
        ${remainingBeforeDateFilter}
      GROUP BY pd.pd_client_id
      HAVING SUM(pd.pd_amt) > 0
    ) AS remainingClients ON remainingClients.clientId = p.pd_client_id
    INNER JOIN tblschedule s ON s.sch_id = p.pd_sch_id
    INNER JOIN amperage ap ON ap.amp_id = p.pd_client_pay_amp_id
    INNER JOIN amperage a ON a.amp_id = p.pd_client_amp_id
    INNER JOIN zones z ON z.zone_id = p.pd_client_zone_id
    INNER JOIN zones_groups zg ON zg.zg_id = z.zone_zg_id
    WHERE p.pd_active = 1
      AND p.pd_sch_id = ${schId}
      ${zoneFilter}
      ${exceptFilter}
    ORDER BY zg.zg_desc, z.zone_order, p.pd_client_order_num
  `);

  const mapped: MonthlyScheduleRow[] = rows.map(r => ({
    clientId: Number(r.client_id),
    clientName: r.client_name ?? '',
    ampValue: r.amp_value != null ? Number(r.amp_value) : null,
    ampNum: r.amp_num != null ? Number(r.amp_num) : null,
    pdAmt: Number(r.pd_amt ?? 0),
    dollarAmt: Number(r.dollar_amt ?? 0),
    paidCurrency: r.pd_paid_currency != null ? Boolean(Number(r.pd_paid_currency)) : null,
    isPaid: Boolean(Number(r.is_paid ?? 0)),
    previousRemainingAmt: r.previous_remaining_amt != null ? Number(r.previous_remaining_amt) : null,
    zoneId: r.zone_id != null ? Number(r.zone_id) : null,
    zoneZgId: r.zone_zg_id != null ? Number(r.zone_zg_id) : null,
    zoneName: r.zone_name ?? null,
    schedule: r.schedule_label ?? '',
  }));

  const summary: MonthlyScheduleSummary = {
    totalPaidLbp: 0,
    totalPaidDollar: 0,
    totalUnpaidLbp: 0,
    totalUnpaidDollarEquiv: 0,
    totalPreviousRemaining: 0,
  };

  for (const row of mapped) {
    if (row.isPaid) {
      if (row.paidCurrency === true) {
        summary.totalPaidDollar += row.dollarAmt;
      } else {
        summary.totalPaidLbp += row.pdAmt;
      }
    } else {
      summary.totalUnpaidLbp += row.pdAmt;
      summary.totalUnpaidDollarEquiv += row.dollarAmt;
    }
    if (row.previousRemainingAmt) {
      summary.totalPreviousRemaining += row.previousRemainingAmt;
    }
  }

  return { rows: mapped, summary };
};

// ─── Collection (Remaining) Report ───────────────────────────────────────────

export interface CollectionRow {
  clientId: number;
  clientName: string;
  totalAmt: number;
  zoneId: number | null;
  zoneZgId: number | null;
  zoneName: string | null;
}

export interface CollectionResult {
  rows: CollectionRow[];
  totalAmt: number;
}

/**
 * Matches collection_report.php.
 * Shows clients who have unpaid (or doubtful) balances from previous schedules,
 * where the payment timestamp falls in the month after the selected schedule.
 *
 * @param type  1 = Loans (تحصيل), 2 = Doubtful (ديون هالكة) — stored in pd_paid
 */
export const collectionReport = async (
  schId: number,
  type: number,         // 1 or 2
  schIdMin?: number,
  hasException?: number,
  beforeDate?: string,
): Promise<CollectionResult> => {
  const minSchFilter = schIdMin !== undefined
    ? Prisma.sql`AND p.pd_sch_id >= ${schIdMin}`
    : Prisma.empty;

  const exceptFilter = hasException !== undefined
    ? Prisma.sql`AND p.pd_client_extra = ${hasException === 1}`
    : Prisma.empty;

  const beforeDateFilter = beforeDate
    ? Prisma.sql`AND DATE(p.pd_paid_ts) <= ${beforeDate}`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT
      CONCAT_WS(' ', p.pd_client_first_name, p.pd_client_middle_name, p.pd_client_last_name) AS client_name,
      SUM(p.pd_amt) AS allAmt,
      p.pd_client_id AS client_id,
      z.zone_id,
      z.zone_name,
      z.zone_zg_id
    FROM payments_details p
    INNER JOIN clients c ON c.client_id = p.pd_client_id
    INNER JOIN zones z ON z.zone_id = p.pd_client_zone_id
    INNER JOIN zones_groups zg ON zg.zg_id = z.zone_zg_id
    WHERE
      MONTH(p.pd_paid_ts) = MONTH(
        (SELECT DATE(CONCAT(s.sch_year, '-', LPAD(s.sch_month, 2, '0'), '-01'))
         FROM tblschedule s WHERE s.sch_id = ${schId}) + INTERVAL 1 MONTH
      )
      AND YEAR(p.pd_paid_ts) = YEAR(
        (SELECT DATE(CONCAT(s.sch_year, '-', LPAD(s.sch_month, 2, '0'), '-01'))
         FROM tblschedule s WHERE s.sch_id = ${schId}) + INTERVAL 1 MONTH
      )
      AND p.pd_active = 1
      AND p.pd_sch_id < ${schId}
      ${minSchFilter}
      AND p.pd_paid = ${type}
      ${exceptFilter}
      ${beforeDateFilter}
    GROUP BY p.pd_client_id
    HAVING SUM(p.pd_amt) > 0
    ORDER BY zg.zg_desc, z.zone_order, p.pd_client_order_num
  `);

  const mapped: CollectionRow[] = rows.map(r => ({
    clientId: Number(r.client_id),
    clientName: r.client_name ?? '',
    totalAmt: Number(r.allAmt ?? 0),
    zoneId: r.zone_id != null ? Number(r.zone_id) : null,
    zoneZgId: r.zone_zg_id != null ? Number(r.zone_zg_id) : null,
    zoneName: r.zone_name ?? null,
  }));

  const totalAmt = mapped.reduce((sum, r) => sum + r.totalAmt, 0);
  return { rows: mapped, totalAmt };
};

// ─── Aadad (Meter Readings) Report ───────────────────────────────────────────

export interface AadadRow {
  clientId: number;
  clientName: string;
  ampValue: number | null;
  oldReading: number | null;
  newReading: number | null;
  hasAadad: boolean;
  exceptionFlag: number;
  highlight: boolean; // aadad client with missing or unchanged reading (yellow in PHP)
  zoneId: number | null;
  zoneZgId: number | null;
  zoneName: string | null;
}

export const aadadReport = async (): Promise<AadadRow[]> => {
  const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT
      c.client_id,
      CONCAT_WS(' ', c.client_first_name, c.client_middle_name, c.client_last_name) AS client_name,
      ap.amp_value,
      CAST(c.client_aadad AS UNSIGNED) AS client_aadad,
      c.client_excep_flg,
      IF(c.new_addad = 0 OR c.new_addad IS NULL OR c.new_addad = '', NULL, c.new_addad) AS new_addad,
      IF(c.old_addad = 0 OR c.old_addad IS NULL OR c.old_addad = '', NULL, c.old_addad) AS old_addad,
      z.zone_id,
      z.zone_name,
      z.zone_zg_id
    FROM clients c
    INNER JOIN amperage ap ON ap.amp_id = c.client_pay_amp_id
    INNER JOIN zones z ON z.zone_id = c.client_zone_id
    INNER JOIN zones_groups zg ON zg.zg_id = z.zone_zg_id
    WHERE c.client_active = 1
    ORDER BY zg.zg_desc, z.zone_order, c.client_order_num
  `);

  return rows.map(r => {
    const hasAadad = Boolean(Number(r.client_aadad ?? 0));
    const exceptionFlag = Number(r.client_excep_flg ?? 0);
    const newReading = r.new_addad != null ? Number(r.new_addad) : null;
    const oldReading = r.old_addad != null ? Number(r.old_addad) : null;
    // Highlight: aadad client, no exception override, and reading is null or unchanged
    const highlight = hasAadad && exceptionFlag === 0 && (newReading === null || newReading === oldReading);

    return {
      clientId: Number(r.client_id),
      clientName: r.client_name ?? '',
      ampValue: r.amp_value != null ? Number(r.amp_value) : null,
      oldReading,
      newReading,
      hasAadad,
      exceptionFlag,
      highlight,
      zoneId: r.zone_id != null ? Number(r.zone_id) : null,
      zoneZgId: r.zone_zg_id != null ? Number(r.zone_zg_id) : null,
      zoneName: r.zone_name ?? null,
    };
  });
};
