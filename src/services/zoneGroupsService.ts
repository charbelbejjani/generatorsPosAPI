import prisma from '../prisma';
import type { zones_groups } from '@prisma/client';

export interface ZoneGroupEntity {
  id: number;
  name: string | null;
  description: string | null;
  active: boolean | null;
  timestamp: Date | null;
}

const mapToEntity = (zg: zones_groups): ZoneGroupEntity => ({
  id: zg.zg_id,
  name: zg.zg_name,
  description: zg.zg_desc,
  active: zg.zg_active,
  timestamp: zg.zg_ts,
});

export const getAll = async (): Promise<ZoneGroupEntity[]> => {
  const rows = await prisma.zones_groups.findMany({ orderBy: { zg_id: 'desc' } });
  return rows.map(mapToEntity);
};

export const getById = async (id: number | string): Promise<ZoneGroupEntity | null> => {
  const zg = await prisma.zones_groups.findUnique({ where: { zg_id: Number(id) } });
  return zg ? mapToEntity(zg) : null;
};

export interface CreateZoneGroupInput {
  name: string;
  description?: string;
  active?: boolean;
  userId?: number;
}

export const create = async ({
  name,
  description,
  active = true,
  userId,
}: CreateZoneGroupInput): Promise<ZoneGroupEntity | null> => {
  const existing = await prisma.zones_groups.findFirst({ where: { zg_name: name } });
  if (existing) throw new Error('ZONE_GROUP_EXISTS');

  const created = await prisma.zones_groups.create({
    data: { zg_name: name, zg_desc: description, zg_active: active, zg_userid: userId },
  });
  return getById(created.zg_id);
};

export interface UpdateZoneGroupInput {
  description?: string;
  active?: boolean;
  userId?: number;
}

export const update = async (
  id: number | string,
  { description, active, userId }: UpdateZoneGroupInput
): Promise<ZoneGroupEntity | null> => {
  if (active === false) {
    const z = await prisma.zones.findFirst({ where: { zone_zg_id: Number(id), zone_active: true } });
    if (z) throw new Error('CANNOT_DEACTIVATE_HAS_ACTIVE_ZONES');
  }

  try {
    await prisma.zones_groups.update({
      where: { zg_id: Number(id) },
      data: { zg_desc: description, zg_active: active, zg_userid: userId },
    });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2025') return null;
    throw err;
  }

  return getById(id);
};

export const remove = async (id: number | string): Promise<boolean> => {
  const z = await prisma.zones.findFirst({ where: { zone_zg_id: Number(id), zone_active: true } });
  if (z) throw new Error('CANNOT_DELETE_HAS_ACTIVE_ZONES');

  try {
    await prisma.zones_groups.update({ where: { zg_id: Number(id) }, data: { zg_active: false } });
    return true;
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2025') return false;
    throw err;
  }
};
