import prisma from '../prisma';
import { Prisma } from '@prisma/client';

export interface ReceiptListItem {
  pd_id: number;
  pd_client_id: number | null;
  client_name: string;
  sch_date: string;
  status: string;
  cost: number | null;
  payment_date: Date | null;
  amp_value: number | null;
  pay_val: number | null;
  zone_name: string | null;
}

export const getBySchedule = async (
  schId: number,
  zoneGroupId?: number
): Promise<ReceiptListItem[]> => {
  if (zoneGroupId !== undefined) {
    return prisma.$queryRaw<ReceiptListItem[]>(Prisma.sql`
      SELECT
        pd.pd_id,
        pd.pd_client_id,
        CONCAT_WS(' ', pd.pd_client_first_name, pd.pd_client_middle_name, pd.pd_client_last_name) AS client_name,
        CONCAT_WS(' - ', s.sch_month, s.sch_year) AS sch_date,
        CONCAT(
          IF(pd.pd_print = 1, 'Printed', 'Not printed'),
          ' / ',
          IF(pd.pd_paid = 1, 'Paid', 'Not paid')
        ) AS status,
        pd.pd_amt AS cost,
        pd.pd_paid_ts AS payment_date,
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
        AND pd.pd_sch_id = ${schId}
        AND pd.pd_client_zone_id IN (SELECT zone_id FROM zones WHERE zone_zg_id = ${zoneGroupId})
      ORDER BY
        zg.zg_name,
        SUBSTR(z.zone_name, 1, 1),
        CONVERT(SUBSTR(z.zone_name, 2, LENGTH(z.zone_name) - 1), UNSIGNED INTEGER),
        pd.pd_client_order_num
    `);
  }

  return prisma.$queryRaw<ReceiptListItem[]>(Prisma.sql`
    SELECT
      pd.pd_id,
      pd.pd_client_id,
      CONCAT_WS(' ', pd.pd_client_first_name, pd.pd_client_middle_name, pd.pd_client_last_name) AS client_name,
      CONCAT_WS(' - ', s.sch_month, s.sch_year) AS sch_date,
      CONCAT(
        IF(pd.pd_print = 1, 'Printed', 'Not printed'),
        ' / ',
        IF(pd.pd_paid = 1, 'Paid', 'Not paid')
      ) AS status,
      pd.pd_amt AS cost,
      pd.pd_paid_ts AS payment_date,
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
      AND pd.pd_sch_id = ${schId}
    ORDER BY
      zg.zg_name,
      SUBSTR(z.zone_name, 1, 1),
      CONVERT(SUBSTR(z.zone_name, 2, LENGTH(z.zone_name) - 1), UNSIGNED INTEGER),
      pd.pd_client_order_num
  `);
};

export type BulkAction = 1 | 2 | 3;
// 1 = undo payment  (pd_paid=0, clear paid fields)
// 2 = undo print    (pd_print=0, clear print fields + serial)
// 3 = delete        (pd_active=0)

export interface BulkActionResult {
  affected: number;
}

export const bulkAction = async (
  pdIds: number[],
  action: BulkAction
): Promise<BulkActionResult> => {
  if (pdIds.length === 0) return { affected: 0 };

  let result: { count: number };

  if (action === 1) {
    result = await prisma.payments_details.updateMany({
      where: { pd_id: { in: pdIds }, pd_active: true },
      data: { pd_paid: false, pd_paid_userid: null, pd_paid_ts: null },
    });
  } else if (action === 2) {
    result = await prisma.payments_details.updateMany({
      where: { pd_id: { in: pdIds }, pd_active: true },
      data: { pd_print: false, pd_print_userid: null, pd_print_ts: null, pd_serial: null },
    });
  } else {
    result = await prisma.payments_details.updateMany({
      where: { pd_id: { in: pdIds }, pd_active: true },
      data: { pd_active: false },
    });
  }

  return { affected: result.count };
};
