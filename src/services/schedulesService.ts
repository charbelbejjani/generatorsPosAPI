import prisma from '../prisma';
import type { tblschedule as ScheduleModel } from '@prisma/client';

export interface ScheduleEntity {
  id: number;
  month: number | null;
  year: number | null;
  description: string | null;
  active: boolean | null;
  cost: number | null;
  kwCost: number | null;
  dollarRate: number | null;
  timestamp: Date | null;
}

const mapToEntity = (s: ScheduleModel): ScheduleEntity => ({
  id: s.sch_id,
  month: s.sch_month,
  year: s.sch_year,
  description: s.sch_desc,
  active: s.sch_active,
  cost: s.sch_cost,
  kwCost: s.sch_kw_cost,
  dollarRate: s.sch_dollar_rate,
  timestamp: s.sch_ts,
});

export const getAll = async (): Promise<ScheduleEntity[]> => {
  const rows = await prisma.tblschedule.findMany({
    orderBy: { sch_id: 'desc' },
  });
  return rows.map(mapToEntity);
};

export const getById = async (id: number | string): Promise<ScheduleEntity | null> => {
  const s = await prisma.tblschedule.findUnique({ where: { sch_id: Number(id) } });
  return s ? mapToEntity(s) : null;
};

export interface CreateScheduleInput {
  month: number;
  year: number;
  description?: string;
  cost?: number;
  kwCost?: number;
  dollarRate?: number;
  active?: boolean;
  userId?: number;
}

export const create = async ({
  month,
  year,
  description,
  cost,
  kwCost,
  dollarRate,
  active = true,
  userId,
}: CreateScheduleInput): Promise<ScheduleEntity | null> => {
  const existing = await prisma.tblschedule.findFirst({
    where: { sch_month: month, sch_year: year },
  });
  if (existing) throw new Error('SCHEDULE_EXISTS');

  const created = await prisma.tblschedule.create({
    data: {
      sch_month: month,
      sch_year: year,
      sch_desc: description,
      sch_cost: cost,
      sch_kw_cost: kwCost,
      sch_dollar_rate: dollarRate,
      sch_active: active,
      sch_userid: userId,
    },
  });
  return getById(created.sch_id);
};

export interface UpdateScheduleInput {
  description?: string;
  cost?: number;
  kwCost?: number;
  dollarRate?: number;
  active?: boolean;
  userId?: number;
}

export const update = async (
  id: number | string,
  { description, cost, kwCost, dollarRate, active, userId }: UpdateScheduleInput
): Promise<ScheduleEntity | null> => {
  try {
    await prisma.tblschedule.update({
      where: { sch_id: Number(id) },
      data: {
        sch_desc: description,
        sch_cost: cost,
        sch_kw_cost: kwCost,
        sch_dollar_rate: dollarRate,
        sch_active: active,
        sch_userid: userId,
      },
    });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2025') return null;
    throw err;
  }

  return getById(id);
};

export const remove = async (id: number | string): Promise<boolean> => {
  try {
    await prisma.tblschedule.delete({ where: { sch_id: Number(id) } });
    return true;
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2025') return false;
    throw err;
  }
};
