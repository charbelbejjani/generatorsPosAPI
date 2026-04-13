import prisma from '../prisma';
import * as passwordHelper from '../utils/passwordHelper';

export interface UserSummary {
  userid: number;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  email: string | null;
  active: boolean | null;
  group_id: number | null;
  locked: boolean | null;
}

const USER_SELECT = {
  userid: true,
  first_name: true,
  last_name: true,
  username: true,
  email: true,
  active: true,
  group_id: true,
  locked: true,
} as const;

export const getAll = async (): Promise<UserSummary[]> => {
  return prisma.users.findMany({ select: USER_SELECT, orderBy: { userid: 'desc' } });
};

export const getById = async (id: number | string): Promise<UserSummary | null> => {
  return prisma.users.findUnique({ where: { userid: Number(id) }, select: USER_SELECT });
};

export interface CreateUserInput {
  first_name: string;
  last_name?: string;
  username: string;
  password: string;
  email?: string;
  group_id?: number;
}

export const create = async ({
  first_name,
  last_name,
  username,
  password,
  email,
  group_id,
}: CreateUserInput): Promise<number> => {
  const hashedPassword = await passwordHelper.hashPassword(password);
  const created = await prisma.users.create({
    data: { first_name, last_name, username, password: hashedPassword, email, group_id, active: true },
  });
  return created.userid;
};

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  username?: string;
  password?: string;
  email?: string;
  group_id?: number;
  active?: boolean;
}

export const update = async (id: number, input: UpdateUserInput): Promise<UserSummary | null> => {
  const data: any = {};
  if (input.first_name !== undefined) data.first_name = input.first_name;
  if (input.last_name  !== undefined) data.last_name  = input.last_name;
  if (input.username   !== undefined) data.username   = input.username;
  if (input.email      !== undefined) data.email      = input.email;
  if (input.group_id   !== undefined) data.group_id   = input.group_id;
  if (input.active     !== undefined) data.active     = input.active;
  if (input.password) {
    data.password = await passwordHelper.hashPassword(input.password);
  }
  try {
    await prisma.users.update({ where: { userid: Number(id) }, data });
  } catch (err: any) {
    if (err?.code === 'P2025') return null;
    throw err;
  }
  return getById(id);
};

export const remove = async (id: number): Promise<boolean> => {
  try {
    await prisma.users.delete({ where: { userid: Number(id) } });
    return true;
  } catch (err: any) {
    if (err?.code === 'P2025') return false;
    throw err;
  }
};
