import prisma from '../prisma';
import type { tblphonecodes as PhoneCodeModel } from '@prisma/client';

export interface PhoneCodeEntity {
  id: number;
  number: string | null;
  type: number | null;
  active: number | null;
  timestamp: Date | null;
}

const mapToEntity = (p: PhoneCodeModel): PhoneCodeEntity => ({
  id: p.code_id,
  number: p.code_num,
  type: p.code_type,
  active: p.code_active,
  timestamp: p.code_ts,
});

export const getAll = async (): Promise<PhoneCodeEntity[]> => {
  const rows = await prisma.tblphonecodes.findMany({ orderBy: { code_num: 'asc' } });
  return rows.map(mapToEntity);
};

export const getById = async (id: number | string): Promise<PhoneCodeEntity | null> => {
  const p = await prisma.tblphonecodes.findUnique({ where: { code_id: Number(id) } });
  return p ? mapToEntity(p) : null;
};

export interface CreatePhoneCodeInput {
  number: string;
  type: number;
  userId?: number;
}

export const create = async ({
  number,
  type,
  userId,
}: CreatePhoneCodeInput): Promise<PhoneCodeEntity | null> => {
  const existing = await prisma.tblphonecodes.findFirst({
    where: { code_num: number, code_type: type },
  });
  if (existing) throw new Error('PHONE_CODE_EXISTS');

  const created = await prisma.tblphonecodes.create({
    data: { code_num: number, code_type: type, code_userid: userId },
  });
  return getById(created.code_id);
};

export interface UpdatePhoneCodeInput {
  number?: string;
  type?: number;
  active?: number;
  userId?: number;
}

export const update = async (
  id: number | string,
  { number, type, active, userId }: UpdatePhoneCodeInput
): Promise<PhoneCodeEntity | null> => {
  try {
    await prisma.tblphonecodes.update({
      where: { code_id: Number(id) },
      data: { code_num: number, code_type: type, code_active: active, code_userid: userId },
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
    await prisma.tblphonecodes.delete({ where: { code_id: Number(id) } });
    return true;
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2025') return false;
    throw err;
  }
};
