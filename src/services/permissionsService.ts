import prisma from '../prisma';

export interface PermissionMap {
  [pageId: number]: number;
}

export interface FullPermissionData {
  permissions: PermissionMap;
  pages: number[];
  controls: number[];
}

export const getUserPermissions = async (groupId: number): Promise<PermissionMap> => {
  const rows = await prisma.users_rights.findMany({
    where: { ur_groupid: groupId },
    include: { pages: true },
    orderBy: { ur_pageid: 'asc' },
  });

  const permissions: PermissionMap = {};
  rows.forEach((r) => {
    if (r.ur_pageid !== null) {
      permissions[r.ur_pageid] = r.ur_permission ?? 0;
    }
  });
  return permissions;
};

export const getAccessiblePages = async (groupId: number): Promise<number[]> => {
  const rows = await prisma.users_rights.findMany({
    where: { ur_groupid: groupId },
    select: { ur_pageid: true },
  });
  return rows.map((r) => r.ur_pageid).filter((id): id is number => id !== null);
};

export const getUserControls = async (groupId: number): Promise<number[]> => {
  const rows = await prisma.tblusers_controls.findMany({
    where: { uc_grp_id: groupId },
    include: { tblcontrols: true },
  });
  return rows.map((r) => r.uc_control_id).filter((id): id is number => id !== null);
};

export const hasPermission = async (
  groupId: number,
  pageId: number,
  requiredPermission: number
): Promise<boolean> => {
  const row = await prisma.users_rights.findFirst({
    where: { ur_groupid: groupId, ur_pageid: pageId },
  });
  if (!row) return false;
  return (row.ur_permission ?? 0) >= requiredPermission;
};

export const getFullPermissionData = async (groupId: number): Promise<FullPermissionData> => {
  const [permissions, pages, controls] = await Promise.all([
    getUserPermissions(groupId),
    getAccessiblePages(groupId),
    getUserControls(groupId),
  ]);
  return { permissions, pages, controls };
};

export const getPageIdByIdentifier = async (identifier: string): Promise<number | null> => {
  const page = await prisma.pages.findFirst({
    where: { OR: [{ pagename: identifier }, { pageurl: identifier }] },
    select: { pageid: true },
  });
  return page ? page.pageid : null;
};
