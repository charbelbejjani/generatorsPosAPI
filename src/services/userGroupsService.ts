import prisma from '../prisma';
import type { users_groups as UserGroupModel } from '@prisma/client';

export interface UserGroupEntity {
  id: number;
  name: string | null;
  active: boolean | null;
}

const mapToEntity = (g: UserGroupModel): UserGroupEntity => ({
  id: g.groupid,
  name: g.groupname,
  active: g.group_active,
});

export const getAll = async (): Promise<UserGroupEntity[]> => {
  const rows = await prisma.users_groups.findMany({ orderBy: { groupid: 'desc' } });
  return rows.map(mapToEntity);
};

export const getById = async (id: number | string): Promise<UserGroupEntity | null> => {
  const g = await prisma.users_groups.findUnique({ where: { groupid: Number(id) } });
  return g ? mapToEntity(g) : null;
};

export interface CreateUserGroupInput {
  name: string;
  active?: boolean;
}

export const create = async ({
  name,
  active = true,
}: CreateUserGroupInput): Promise<UserGroupEntity | null> => {
  const existing = await prisma.users_groups.findFirst({ where: { groupname: name } });
  if (existing) throw new Error('USER_GROUP_EXISTS');

  const created = await prisma.users_groups.create({
    data: { groupname: name, group_active: active },
  });
  return getById(created.groupid);
};

export interface UpdateUserGroupInput {
  name?: string;
  active?: boolean;
}

export const update = async (
  id: number | string,
  { name, active }: UpdateUserGroupInput
): Promise<UserGroupEntity | null> => {
  // PHP logic: if deactivating (active=false) and users are assigned → reject
  if (active === false) {
    const assignedUser = await prisma.users.findFirst({ where: { group_id: Number(id) } });
    if (assignedUser) throw new Error('CANNOT_DEACTIVATE_HAS_USERS');
  }

  try {
    await prisma.users_groups.update({
      where: { groupid: Number(id) },
      data: { groupname: name, group_active: active },
    });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2025') return null;
    throw err;
  }

  return getById(id);
};

export const remove = async (id: number | string): Promise<boolean> => {
  const assignedUser = await prisma.users.findFirst({ where: { group_id: Number(id) } });
  if (assignedUser) throw new Error('CANNOT_DELETE_HAS_USERS');

  try {
    await prisma.users_groups.delete({ where: { groupid: Number(id) } });
    return true;
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2025') return false;
    throw err;
  }
};
