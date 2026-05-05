import prisma from '../prisma';

export interface PageRightEntity {
  pageId: number;
  pageName: string | null;
  hasControls: boolean;
  permission: number; // 0 = no access, 1=read, 2=edit, 3=add, 4=delete
}

export interface SectionRightsEntity {
  sectionId: number | null;
  sectionName: string | null;
  pages: PageRightEntity[];
}

export const getRightsByGroup = async (groupId: number): Promise<SectionRightsEntity[]> => {
  const pages = await prisma.pages.findMany({
    where: { pageactive: true },
    include: {
      section_pages_sectionTosection: true,
      users_rights: {
        where: { ur_groupid: groupId },
      },
      tblcontrols: {
        where: { control_active: true },
        select: { control_id: true },
      },
    },
    orderBy: [
      { section_pages_sectionTosection: { secorder: 'asc' } },
      { pagename: 'asc' },
    ],
  });

  const sectionMap = new Map<number | null, SectionRightsEntity>();

  for (const page of pages) {
    const secId = page.section;
    const secName = page.section_pages_sectionTosection?.secname ?? null;
    const right = page.users_rights[0];

    const pageEntry: PageRightEntity = {
      pageId: page.pageid,
      pageName: page.pagename,
      hasControls: page.tblcontrols.length > 0,
      permission: right?.ur_permission ?? 0,
    };

    if (!sectionMap.has(secId)) {
      sectionMap.set(secId, {
        sectionId: secId,
        sectionName: secName,
        pages: [],
      });
    }

    sectionMap.get(secId)!.pages.push(pageEntry);
  }

  return Array.from(sectionMap.values());
};

export interface SaveRightInput {
  pageId: number;
  permission: number; // 1=read, 2=edit, 3=add, 4=delete
}

export const saveRights = async (
  groupId: number,
  rights: SaveRightInput[]
): Promise<void> => {
  // Validate group exists
  const group = await prisma.users_groups.findUnique({ where: { groupid: groupId } });
  if (!group) throw new Error('GROUP_NOT_FOUND');

  await prisma.$transaction(async (tx) => {
    // Delete all existing rights for this group
    await tx.users_rights.deleteMany({ where: { ur_groupid: groupId } });

    // Insert new rights (skip permission=0 entries)
    const validRights = rights.filter((r) => r.permission >= 1 && r.permission <= 4);
    if (validRights.length > 0) {
      await tx.users_rights.createMany({
        data: validRights.map((r) => ({
          ur_pageid: r.pageId,
          ur_groupid: groupId,
          ur_permission: r.permission,
        })),
      });
    }
  });
};

export interface ControlRightEntity {
  controlId: number;
  controlName: string | null;
  hasAccess: boolean;
}

export const getControlsByPageAndGroup = async (
  pageId: number,
  groupId: number
): Promise<ControlRightEntity[]> => {
  const controls = await prisma.tblcontrols.findMany({
    where: { control_page_id: pageId, control_active: true },
    include: {
      tblusers_controls: {
        where: { uc_grp_id: groupId },
      },
    },
    orderBy: { control_name: 'asc' },
  });

  return controls.map((c) => ({
    controlId: c.control_id,
    controlName: c.control_name,
    hasAccess: c.tblusers_controls.length > 0,
  }));
};

export const saveControls = async (
  groupId: number,
  pageId: number,
  controlIds: number[]
): Promise<void> => {
  // Validate group and page exist
  const group = await prisma.users_groups.findUnique({ where: { groupid: groupId } });
  if (!group) throw new Error('GROUP_NOT_FOUND');

  const page = await prisma.pages.findUnique({ where: { pageid: pageId } });
  if (!page) throw new Error('PAGE_NOT_FOUND');

  // Get all controls belonging to this page to scope deletion correctly
  const pageControls = await prisma.tblcontrols.findMany({
    where: { control_page_id: pageId },
    select: { control_id: true },
  });
  const pageControlIds = pageControls.map((c) => c.control_id);

  await prisma.$transaction(async (tx) => {
    // Delete existing controls for this group+page
    if (pageControlIds.length > 0) {
      await tx.tblusers_controls.deleteMany({
        where: {
          uc_grp_id: groupId,
          uc_control_id: { in: pageControlIds },
        },
      });
    }

    // Insert new controls
    const validIds = controlIds.filter((id) => pageControlIds.includes(id));
    if (validIds.length > 0) {
      await tx.tblusers_controls.createMany({
        data: validIds.map((id) => ({
          uc_grp_id: groupId,
          uc_control_id: id,
        })),
      });
    }
  });
};
