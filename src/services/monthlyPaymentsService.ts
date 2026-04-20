import prisma from '../prisma';
import { Prisma } from '@prisma/client';

export interface GenerateResult {
  inserted: number;
}

export const generate = async (
  schId: number,
  userId: number,
  isAadad?: number // 0 = not aadad, 1 = is aadad, undefined = all
): Promise<GenerateResult> => {
  // Check schedule exists and is active (matches PHP: WHERE sch_id=:sch AND sch_active=1)
  debugger
  const schedule = await prisma.tblschedule.findFirst({
    where: { sch_id: schId, sch_active: true },
  });
  if (!schedule) throw new Error('SCHEDULE_NOT_FOUND');

  // Execute the INSERT-SELECT. Two branches: with or without isAadad filter.
  // Matches PHP monthly_payments.php INSERT logic exactly.
  // Clients already having an active payment for this schedule are skipped via NOT IN.
  let inserted: number;

  if (isAadad === 0 || isAadad === 1) {
    inserted = await prisma.$executeRaw(Prisma.sql`
      INSERT INTO payments_details (
        pd_client_id,
        pd_sch_id,
        pd_userid,
        pd_amt,
        pd_client_first_name,
        pd_client_middle_name,
        pd_client_last_name,
        pd_client_mobile,
        pd_client_address,
        pd_client_zone_id,
        pd_client_amp_id,
        pd_client_pay_amp_id,
        pd_client_excep_flg,
        pd_client_excep_amt,
        pd_client_gender,
        pd_client_is_taxable,
        pd_client_order_num,
        pd_client_title,
        pd_client_extra,
        pd_client_old_aadad,
        pd_client_new_aadad,
        pd_client_aadad,
        pd_amp_min_kw_value,
        pd_dollar_rate,
        pd_amp_fixed_amount
      )
      SELECT
        c.client_id,
        ${schId},
        ${userId},
        IF(c.client_aadad = 1,
          IF(c.client_excep_flg = 2,
            c.client_excep_amt,
            IF(ap.amp_apply_min_kw = 0,
              CEIL((((c.new_addad - COALESCE(c.old_addad, 0)) * s.sch_kw_cost) + COALESCE(ap.amp_fix_amount, 0)) / 1000) * 1000,
              CEIL(((IF((c.new_addad - COALESCE(c.old_addad, 0)) > ap.amp_min_kw_value,
                        (c.new_addad - COALESCE(c.old_addad, 0)),
                        ap.amp_min_kw_value) * s.sch_kw_cost) + COALESCE(ap.amp_fix_amount, 0)) / 1000) * 1000
            )
          ),
          IF(
            IF(c.client_excep_flg = 2,
              c.client_excep_amt,
              IF(c.client_excep_flg = 1,
                IF((ap.amp_value * s.sch_cost / 5) > c.client_excep_amt,
                  c.client_excep_amt,
                  CEIL((ap.amp_value * s.sch_cost / 5) / 1000) * 1000
                ),
                (ap.amp_value * s.sch_cost / 5)
              )
            ) BETWEEN 1 AND 15000,
            15000,
            IF(c.client_excep_flg = 2,
              c.client_excep_amt,
              IF(c.client_excep_flg = 1,
                IF((ap.amp_value * s.sch_cost / 5) > c.client_excep_amt,
                  c.client_excep_amt,
                  CEIL((ap.amp_value * s.sch_cost / 5) / 1000) * 1000
                ),
                CEIL((ap.amp_value * s.sch_cost / 5) / 1000) * 1000
              )
            )
          )
        ),
        c.client_first_name,
        c.client_middle_name,
        c.client_last_name,
        c.client_mobile,
        c.client_address,
        c.client_zone_id,
        c.client_amp_id,
        c.client_pay_amp_id,
        c.client_excep_flg,
        c.client_excep_amt,
        c.client_gender,
        c.client_is_taxable,
        c.client_order_num,
        c.client_title,
        c.client_extra,
        c.old_addad,
        c.new_addad,
        c.client_aadad,
        IF(ap.amp_apply_min_kw = 1, ap.amp_min_kw_value, NULL),
        s.sch_dollar_rate,
        ap.amp_fix_amount
      FROM clients c
      INNER JOIN tblschedule s ON s.sch_id = ${schId}
      INNER JOIN amperage ap ON ap.amp_id = c.client_pay_amp_id
      WHERE c.client_active = 1
        AND c.client_id NOT IN (
          SELECT pd_client_id FROM payments_details WHERE pd_sch_id = ${schId} AND pd_active = 1
        )
        AND c.client_aadad = ${isAadad}
    `);
  } else {
    inserted = await prisma.$executeRaw(Prisma.sql`
      INSERT INTO payments_details (
        pd_client_id,
        pd_sch_id,
        pd_userid,
        pd_amt,
        pd_client_first_name,
        pd_client_middle_name,
        pd_client_last_name,
        pd_client_mobile,
        pd_client_address,
        pd_client_zone_id,
        pd_client_amp_id,
        pd_client_pay_amp_id,
        pd_client_excep_flg,
        pd_client_excep_amt,
        pd_client_gender,
        pd_client_is_taxable,
        pd_client_order_num,
        pd_client_title,
        pd_client_extra,
        pd_client_old_aadad,
        pd_client_new_aadad,
        pd_client_aadad,
        pd_amp_min_kw_value,
        pd_dollar_rate,
        pd_amp_fixed_amount
      )
      SELECT
        c.client_id,
        ${schId},
        ${userId},
        IF(c.client_aadad = 1,
          IF(c.client_excep_flg = 2,
            c.client_excep_amt,
            IF(ap.amp_apply_min_kw = 0,
              CEIL((((c.new_addad - COALESCE(c.old_addad, 0)) * s.sch_kw_cost) + COALESCE(ap.amp_fix_amount, 0)) / 1000) * 1000,
              CEIL(((IF((c.new_addad - COALESCE(c.old_addad, 0)) > ap.amp_min_kw_value,
                        (c.new_addad - COALESCE(c.old_addad, 0)),
                        ap.amp_min_kw_value) * s.sch_kw_cost) + COALESCE(ap.amp_fix_amount, 0)) / 1000) * 1000
            )
          ),
          IF(
            IF(c.client_excep_flg = 2,
              c.client_excep_amt,
              IF(c.client_excep_flg = 1,
                IF((ap.amp_value * s.sch_cost / 5) > c.client_excep_amt,
                  c.client_excep_amt,
                  CEIL((ap.amp_value * s.sch_cost / 5) / 1000) * 1000
                ),
                (ap.amp_value * s.sch_cost / 5)
              )
            ) BETWEEN 1 AND 15000,
            15000,
            IF(c.client_excep_flg = 2,
              c.client_excep_amt,
              IF(c.client_excep_flg = 1,
                IF((ap.amp_value * s.sch_cost / 5) > c.client_excep_amt,
                  c.client_excep_amt,
                  CEIL((ap.amp_value * s.sch_cost / 5) / 1000) * 1000
                ),
                CEIL((ap.amp_value * s.sch_cost / 5) / 1000) * 1000
              )
            )
          )
        ),
        c.client_first_name,
        c.client_middle_name,
        c.client_last_name,
        c.client_mobile,
        c.client_address,
        c.client_zone_id,
        c.client_amp_id,
        c.client_pay_amp_id,
        c.client_excep_flg,
        c.client_excep_amt,
        c.client_gender,
        c.client_is_taxable,
        c.client_order_num,
        c.client_title,
        c.client_extra,
        c.old_addad,
        c.new_addad,
        c.client_aadad,
        IF(ap.amp_apply_min_kw = 1, ap.amp_min_kw_value, NULL),
        s.sch_dollar_rate,
        ap.amp_fix_amount
      FROM clients c
      INNER JOIN tblschedule s ON s.sch_id = ${schId}
      INNER JOIN amperage ap ON ap.amp_id = c.client_pay_amp_id
      WHERE c.client_active = 1
        AND c.client_id NOT IN (
          SELECT pd_client_id FROM payments_details WHERE pd_sch_id = ${schId} AND pd_active = 1
        )
    `);
  }

  return { inserted };
};
