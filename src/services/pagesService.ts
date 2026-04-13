import prisma from '../prisma';

export interface PageEntity {
  id: number;
  name: string | null;
  url: string | null;
  sectionId: number | null;
  sectionName: string | null;
  active: boolean | null;
}

const mapToEntity = (
  p: {
    pageid: number;
    pagename: string | null;
    pageurl: string | null;
    section: number | null;
    pageactive: boolean | null;
    section_pages_sectionTosection: { secname: string | null } | null;
  }
): PageEntity => ({
  id: p.pageid,
  name: p.pagename,
  url: p.pageurl,
  sectionId: p.section,
  sectionName: p.section_pages_sectionTosection?.secname ?? null,
  active: p.pageactive,
});

export const getAll = async (): Promise<PageEntity[]> => {
  const rows = await prisma.pages.findMany({
    include: { section_pages_sectionTosection: true },
    orderBy: [{ section_pages_sectionTosection: { secname: 'asc' } }, { pagename: 'asc' }],
  });
  return rows.map(mapToEntity);
};

export const getById = async (id: number | string): Promise<PageEntity | null> => {
  const p = await prisma.pages.findUnique({
    where: { pageid: Number(id) },
    include: { section_pages_sectionTosection: true },
  });
  return p ? mapToEntity(p) : null;
};

export interface CreatePageInput {
  name: string;
  url: string;
  sectionId: number;
}

export const create = async ({ name, url, sectionId }: CreatePageInput): Promise<PageEntity | null> => {
  const existing = await prisma.pages.findFirst({ where: { pagename: name } });
  if (existing) throw new Error('PAGE_EXISTS');

  const created = await prisma.pages.create({
    data: { pagename: name, pageurl: url, section: sectionId },
  });
  return getById(created.pageid);
};

export interface UpdatePageInput {
  name?: string;
  url?: string;
  sectionId?: number;
  active?: boolean;
}

export const update = async (
  id: number | string,
  { name, url, sectionId, active }: UpdatePageInput
): Promise<PageEntity | null> => {
  try {
    await prisma.pages.update({
      where: { pageid: Number(id) },
      data: {
        pagename: name,
        pageurl: url,
        section: sectionId,
        pageactive: active,
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
  const hasRights = await prisma.users_rights.findFirst({ where: { ur_pageid: Number(id) } });
  if (hasRights) throw new Error('CANNOT_DELETE_HAS_RIGHTS');

  try {
    await prisma.pages.delete({ where: { pageid: Number(id) } });
    return true;
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2025') return false;
    throw err;
  }
};
