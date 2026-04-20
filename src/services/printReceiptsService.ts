import prisma from '../prisma';
import { Prisma } from '@prisma/client';

export interface UnprintedReceipt {
  pd_id: number;
  client_name: string;
  sch_date: string;
  cost: number;
  amp_value: number | null;
  pay_val: number | null;
  zone_name: string | null;
}

export interface ReceiptData {
  pd_id: number;
  printing_date: string | null;
  client_name: string;
  sch_date: string;
  cost: number | null;
  amp_value: number | null;
  pay_val: number | null;
  zone_name: string | null;
  pd_serial: string | null;
  pd_client_aadad: boolean | null;
  pd_client_old_aadad: number | null;
  pd_client_new_aadad: number | null;
  amp_fix_amount: number | null;
  sch_kw_cost: number | null;
  pd_amp_min_kw_value: number | null;
  pd_dollar_rate: number | null;
  dollar_amt: number | null;
  pd_amp_fixed_amount: number;
}

export const getUnprinted = async (zoneGroupId?: number): Promise<UnprintedReceipt[]> => {
  if (zoneGroupId !== undefined) {
    return prisma.$queryRaw<UnprintedReceipt[]>(Prisma.sql`
      SELECT
        pd.pd_id,
        CONCAT_WS(' ', pd.pd_client_first_name, pd.pd_client_middle_name, pd.pd_client_last_name) AS client_name,
        CONCAT_WS(' - ', s.sch_month, s.sch_year) AS sch_date,
        pd.pd_amt AS cost,
        a.amp_value,
        ap.amp_value AS pay_val,
        z.zone_name
      FROM payments_details pd
      INNER JOIN tblschedule s ON s.sch_id = pd.pd_sch_id
      INNER JOIN amperage ap ON ap.amp_id = pd.pd_client_pay_amp_id
      INNER JOIN amperage a ON a.amp_id = pd.pd_client_amp_id
      INNER JOIN zones z ON z.zone_id = pd.pd_client_zone_id
      INNER JOIN zones_groups zg ON zg.zg_id = z.zone_zg_id
      WHERE pd.pd_active = 1
        AND pd.pd_print = 0
        AND pd.pd_amt <> 0
        AND pd.pd_client_zone_id IN (SELECT zone_id FROM zones WHERE zone_zg_id = ${zoneGroupId})
      ORDER BY
        zg.zg_name,
        SUBSTR(z.zone_name, 1, 1),
        CONVERT(SUBSTR(z.zone_name, 2, LENGTH(z.zone_name) - 1), UNSIGNED INTEGER),
        pd.pd_client_order_num
    `);
  }

  return prisma.$queryRaw<UnprintedReceipt[]>(Prisma.sql`
    SELECT
      pd.pd_id,
      CONCAT_WS(' ', pd.pd_client_first_name, pd.pd_client_middle_name, pd.pd_client_last_name) AS client_name,
      CONCAT_WS(' - ', s.sch_month, s.sch_year) AS sch_date,
      pd.pd_amt AS cost,
      a.amp_value,
      ap.amp_value AS pay_val,
      z.zone_name
    FROM payments_details pd
    INNER JOIN tblschedule s ON s.sch_id = pd.pd_sch_id
    INNER JOIN amperage ap ON ap.amp_id = pd.pd_client_pay_amp_id
    INNER JOIN amperage a ON a.amp_id = pd.pd_client_amp_id
    INNER JOIN zones z ON z.zone_id = pd.pd_client_zone_id
    INNER JOIN zones_groups zg ON zg.zg_id = z.zone_zg_id
    WHERE pd.pd_active = 1
      AND pd.pd_print = 0
      AND pd.pd_amt <> 0
    ORDER BY
      zg.zg_name,
      SUBSTR(z.zone_name, 1, 1),
      CONVERT(SUBSTR(z.zone_name, 2, LENGTH(z.zone_name) - 1), UNSIGNED INTEGER),
      pd.pd_client_order_num
  `);
};

export interface MarkPrintedResult {
  printed: number[];
}

export const markPrinted = async (pdIds: number[], userId: number): Promise<MarkPrintedResult> => {
  const printed: number[] = [];
  const currentYear = new Date().getFullYear();

  for (const pdId of pdIds) {
    const payment = await prisma.payments_details.findFirst({
      where: { pd_id: pdId, pd_active: true, pd_print: false },
      select: { pd_id: true },
    });
    if (!payment) continue;

    let serialRow = await prisma.serial_numbering.findFirst({
      where: { sn_year: currentYear },
    });

    if (!serialRow) {
      serialRow = await prisma.serial_numbering.create({
        data: { sn_prefix: 'BP', sn_year: currentYear, sn_serial: 1 },
      });
    }

    const currentSerial = serialRow.sn_serial ?? 1;

    await prisma.serial_numbering.update({
      where: { sn_id: serialRow.sn_id },
      data: { sn_serial: { increment: 1 } },
    });

    const serial = `${serialRow.sn_prefix ?? 'BP'}${serialRow.sn_year ?? currentYear}${String(currentSerial).padStart(6, '0')}`;

    await prisma.payments_details.update({
      where: { pd_id: pdId },
      data: {
        pd_serial: serial,
        pd_print: true,
        pd_print_ts: new Date(),
        pd_print_userid: userId,
      },
    });

    printed.push(pdId);
  }

  return { printed };
};

export const deleteReceipt = async (pdId: number): Promise<void> => {
  const payment = await prisma.payments_details.findFirst({
    where: { pd_id: pdId, pd_active: true },
    select: { pd_id: true, pd_print: true },
  });

  if (!payment) throw new Error('NOT_FOUND');
  if (payment.pd_print) throw new Error('ALREADY_PRINTED');

  await prisma.payments_details.update({
    where: { pd_id: pdId },
    data: { pd_active: false },
  });
};

export const getReceiptData = async (pdId: number): Promise<ReceiptData | null> => {
  const rows = await prisma.$queryRaw<ReceiptData[]>(Prisma.sql`
    SELECT
      pd.pd_id,
      DATE(pd.pd_print_ts) AS printing_date,
      pd.pd_client_aadad,
      pd.pd_client_old_aadad,
      pd.pd_client_new_aadad,
      ap.amp_fix_amount,
      s.sch_kw_cost,
      CONCAT_WS(' ', pd.pd_client_title, pd.pd_client_first_name, pd.pd_client_middle_name, pd.pd_client_last_name) AS client_name,
      CONCAT_WS(' ', s.sch_desc, s.sch_year) AS sch_date,
      pd.pd_amt AS cost,
      a.amp_value,
      ap.amp_value AS pay_val,
      z.zone_name,
      pd.pd_serial,
      pd.pd_amp_min_kw_value,
      CEIL(pd.pd_amt / pd.pd_dollar_rate) AS dollar_amt,
      pd.pd_dollar_rate,
      COALESCE(pd.pd_amp_fixed_amount, 0) AS pd_amp_fixed_amount
    FROM payments_details pd
    INNER JOIN tblschedule s ON s.sch_id = pd.pd_sch_id
    INNER JOIN amperage ap ON ap.amp_id = pd.pd_client_pay_amp_id
    INNER JOIN amperage a ON a.amp_id = pd.pd_client_amp_id
    INNER JOIN zones z ON z.zone_id = pd.pd_client_zone_id
    WHERE pd.pd_id = ${pdId}
  `);

  return rows[0] ?? null;
};
