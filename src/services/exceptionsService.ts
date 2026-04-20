import prisma from '../prisma';
import type { exceptions as ExceptionModel } from '@prisma/client';

export interface ExceptionEntity {
  id: number;
  name: string | null;
}

const mapToEntity = (row: ExceptionModel): ExceptionEntity => ({
  id: row.exp_id,
  name: row.exp_name,
});

export const getAll = async (): Promise<ExceptionEntity[]> => {
  const rows = await prisma.exceptions.findMany({ orderBy: { exp_id: 'desc' } });
  return rows.map(mapToEntity);
};

export const getById = async (id: number | string): Promise<ExceptionEntity | null> => {
  const row = await prisma.exceptions.findUnique({ where: { exp_id: Number(id) } });
  return row ? mapToEntity(row) : null;
};
