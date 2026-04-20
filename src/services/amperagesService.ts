import prisma from '../prisma';
import type { amperage as AmperageModel } from '@prisma/client';

export interface AmperageEntity {
  id: number;
  value: number | null;
  description: string | null;
  number: number | null;
  active: boolean | null;
  timestamp: Date | null;
  fixedAmount: number | null;
  minKwValue: number | null;
  applyMinKw: boolean | null;
}

const mapToEntity = (a: AmperageModel): AmperageEntity => ({
  id: a.amp_id,
  value: a.amp_value,
  description: a.amp_desc,
  number: a.amp_num,
  active: a.amp_active,
  timestamp: a.amp_ts,
  fixedAmount: a.amp_fix_amount,
  minKwValue: a.amp_min_kw_value,
  applyMinKw: a.amp_apply_min_kw,
});

export const getAll = async (): Promise<AmperageEntity[]> => {
  const rows = await prisma.amperage.findMany({ orderBy: { amp_id: 'desc' } });
  return rows.map(mapToEntity);
};

export const getById = async (id: number | string): Promise<AmperageEntity | null> => {
  const a = await prisma.amperage.findUnique({ where: { amp_id: Number(id) } });
  return a ? mapToEntity(a) : null;
};

export interface CreateAmperageInput {
  value: number;
  description?: string;
  fixedAmount?: number;
  active?: boolean;
  userId?: number;
}

export const create = async ({
  value,
  description,
  fixedAmount,
  active = true,
  userId,
}: CreateAmperageInput): Promise<AmperageEntity | null> => {
  const existing = await prisma.amperage.findFirst({ where: { amp_value: value } });
  if (existing) throw new Error('AMPERAGE_EXISTS');

  const created = await prisma.amperage.create({
    data: { amp_value: value, amp_desc: description, amp_fix_amount: fixedAmount, amp_active: active, amp_userid: userId },
  });
  return getById(created.amp_id);
};

export interface UpdateAmperageInput {
  description?: string;
  fixedAmount?: number;
  active?: boolean;
  userId?: number;
}

export const update = async (
  id: number | string,
  { description, fixedAmount, active, userId }: UpdateAmperageInput
): Promise<AmperageEntity | null> => {
  if (active === false) {
    const client = await prisma.clients.findFirst({
      where: {
        OR: [{ client_amp_id: Number(id) }, { client_pay_amp_id: Number(id) }],
        client_active: true,
      },
    });
    if (client) throw new Error('CANNOT_DEACTIVATE_HAS_CLIENTS');
  }

  try {
    await prisma.amperage.update({
      where: { amp_id: Number(id) },
      data: { amp_desc: description, amp_fix_amount: fixedAmount, amp_active: active, amp_userid: userId },
    });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2025') return null;
    throw err;
  }

  return getById(id);
};

export const remove = async (id: number | string): Promise<boolean> => {
  const client = await prisma.clients.findFirst({
    where: { OR: [{ client_amp_id: Number(id) }, { client_pay_amp_id: Number(id) }] },
  });
  if (client) throw new Error('CANNOT_DELETE_HAS_CLIENTS');

  try {
    await prisma.amperage.update({ where: { amp_id: Number(id) }, data: { amp_active: false } });
    return true;
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2025') return false;
    throw err;
  }
};
