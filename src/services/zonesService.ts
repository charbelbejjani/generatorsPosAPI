import prisma from '../prisma';
import type { zones as ZoneModel } from '@prisma/client';

type ZoneEntity = {
  id: number;
  name: string | null;
  zoneGroupId: number | null;
  zoneGroupName: string | null;
  active: boolean | null;
  timestamp: Date | null;
};

const mapToEntity = (z: ZoneModel & { zones_groups?: { zg_name?: string | null } | null }): ZoneEntity => ({
  id: z.zone_id,
  name: z.zone_name ?? null,
  zoneGroupId: z.zone_zg_id ?? null,
  zoneGroupName: z.zones_groups?.zg_name ?? null,
  active: z.zone_active ?? null,
  timestamp: z.zone_ts ?? null
});

export const getAll = async (zoneGroupId: number | null = null): Promise<ZoneEntity[]> => {
  const zones = await prisma.zones.findMany({
    where: zoneGroupId ? { zone_zg_id: zoneGroupId } : undefined,
    include: { zones_groups: true },
    orderBy: { zone_id: 'desc' }
  });
  return zones.map(mapToEntity);
};

export const getById = async (id: number): Promise<ZoneEntity | null> => {
  const zone = await prisma.zones.findUnique({
    where: { zone_id: Number(id) },
    include: { zones_groups: true }
  });
  return zone ? mapToEntity(zone) : null;
};

export const create = async ({ name, zoneGroupId, active = true, userId }: { name: string; zoneGroupId: number; active?: boolean; userId?: number }): Promise<ZoneEntity | null> => {
  const zg = await prisma.zones_groups.findUnique({ where: { zg_id: zoneGroupId } });
  if (!zg || zg.zg_active !== true) throw new Error('ZONE_GROUP_NOT_FOUND');

  const existing = await prisma.zones.findFirst({ where: { zone_name: name, zone_zg_id: zoneGroupId } });
  if (existing) throw new Error('ZONE_EXISTS');

  const created = await prisma.zones.create({
    data: {
      zone_name: name,
      zone_zg_id: zoneGroupId,
      zone_active: active,
      zone_userid: userId
    }
  });

  return getById(created.zone_id);
};

export const update = async (id: number, { name, zoneGroupId, active, userId }: { name?: string; zoneGroupId?: number; active?: boolean; userId?: number }): Promise<ZoneEntity | null> => {
  if (zoneGroupId) {
    const zg = await prisma.zones_groups.findUnique({ where: { zg_id: zoneGroupId } });
    if (!zg || zg.zg_active !== true) throw new Error('ZONE_GROUP_NOT_FOUND');
  }

  if (active === false) {
    const client = await prisma.clients.findFirst({ where: { client_zone_id: Number(id), client_active: true } });
    if (client) throw new Error('CANNOT_DEACTIVATE_HAS_CLIENTS');
  }

  const data: any = {};
  if (name !== undefined) data.zone_name = name;
  if (zoneGroupId !== undefined) data.zone_zg_id = zoneGroupId;
  if (active !== undefined) data.zone_active = active;
  if (userId !== undefined) data.zone_userid = userId;

  try {
    await prisma.zones.update({ where: { zone_id: Number(id) }, data });
  } catch (err: any) {
    if (err?.code === 'P2025') return null;
    throw err;
  }

  return getById(id);
};

export const remove = async (id: number): Promise<boolean> => {
  const client = await prisma.clients.findFirst({ where: { client_zone_id: Number(id), client_active: true } });
  if (client) throw new Error('CANNOT_DELETE_HAS_CLIENTS');

  try {
    await prisma.zones.update({ where: { zone_id: Number(id) }, data: { zone_active: false } });
    return true;
  } catch (err: any) {
    if (err?.code === 'P2025') return false;
    throw err;
  }
};
