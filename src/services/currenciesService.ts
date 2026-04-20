import prisma from '../prisma';
import type { tblcurrencies as CurrencyModel } from '@prisma/client';

export interface CurrencyEntity {
  id: number;
  description: string | null;
  symbol: string | null;
  active: boolean | null;
  timestamp: Date | null;
}

const mapToEntity = (c: CurrencyModel): CurrencyEntity => ({
  id: c.curr_id,
  description: c.curr_desc,
  symbol: c.curr_symbol,
  active: c.curr_active,
  timestamp: c.curr_ts,
});

export const getAll = async (): Promise<CurrencyEntity[]> => {
  const rows = await prisma.tblcurrencies.findMany({ orderBy: { curr_id: 'desc' } });
  return rows.map(mapToEntity);
};

export const getById = async (id: number | string): Promise<CurrencyEntity | null> => {
  const c = await prisma.tblcurrencies.findUnique({ where: { curr_id: Number(id) } });
  return c ? mapToEntity(c) : null;
};

export interface CreateCurrencyInput {
  description: string;
  symbol: string;
  active?: boolean;
  userId?: number;
}

export const create = async ({
  description,
  symbol,
  active = true,
  userId,
}: CreateCurrencyInput): Promise<CurrencyEntity | null> => {
  const existing = await prisma.tblcurrencies.findFirst({ where: { curr_desc: description } });
  if (existing) throw new Error('CURRENCY_EXISTS');

  const created = await prisma.tblcurrencies.create({
    data: { curr_desc: description, curr_symbol: symbol, curr_active: active, curr_userid: userId },
  });
  return getById(created.curr_id);
};

export interface UpdateCurrencyInput {
  symbol?: string;
  active?: boolean;
  userId?: number;
}

export const update = async (
  id: number | string,
  { symbol, active, userId }: UpdateCurrencyInput
): Promise<CurrencyEntity | null> => {
  try {
    await prisma.tblcurrencies.update({
      where: { curr_id: Number(id) },
      data: { curr_symbol: symbol, curr_active: active, curr_userid: userId },
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
    await prisma.tblcurrencies.delete({ where: { curr_id: Number(id) } });
    return true;
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2025') return false;
    throw err;
  }
};
