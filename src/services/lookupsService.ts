import prisma from '../prisma';

export interface ZoneLookup {
  zone_id: number;
  zone_name: string | null;
  zone_zg_id: number | null;
}

export interface ZoneGroupLookup {
  zg_id: number;
  zg_name: string | null;
}

export interface AmperageLookup {
  amp_id: number;
  amp_value: number | null;
  amp_desc: string | null;
  amp_fix_amount: number | null;
}

export interface ExceptionLookup {
  exp_id: number;
  exp_name: string | null;
}

export interface UserGroupLookup {
  groupid: number;
  groupname: string | null;
}

export const getActiveZones = async (): Promise<ZoneLookup[]> => {
  return prisma.zones.findMany({
    where: { zone_active: true },
    select: { zone_id: true, zone_name: true, zone_zg_id: true },
    orderBy: { zone_name: 'asc' },
  });
};

export const getActiveZoneGroups = async (): Promise<ZoneGroupLookup[]> => {
  return prisma.zones_groups.findMany({
    where: { zg_active: true },
    select: { zg_id: true, zg_name: true },
    orderBy: { zg_name: 'asc' },
  });
};

export const getActiveAmperages = async (): Promise<AmperageLookup[]> => {
  return prisma.amperage.findMany({
    where: { amp_active: true },
    select: { amp_id: true, amp_value: true, amp_desc: true, amp_fix_amount: true },
    orderBy: { amp_value: 'asc' },
  });
};

export const getActiveExceptions = async (): Promise<ExceptionLookup[]> => {
  return prisma.exceptions.findMany({
    select: { exp_id: true, exp_name: true },
    orderBy: { exp_name: 'asc' },
  });};

export const getActiveUserGroups = async (): Promise<UserGroupLookup[]> => {
  return prisma.users_groups.findMany({
    where: { group_active: true },
    select: { groupid: true, groupname: true },
    orderBy: { groupname: 'asc' },
  });
};

export interface SectionLookup {
  secid: number;
  secname: string | null;
}

export const getAllSections = async (): Promise<SectionLookup[]> => {
  return prisma.section.findMany({
    select: { secid: true, secname: true },
    orderBy: { secorder: 'asc' },
  });
};

export interface ScheduleLookup {
  sch_id: number;
  sch_month: number | null;
  sch_year: number | null;
  sch_label: string;
}

export const getSchedules = async (): Promise<ScheduleLookup[]> => {
  const rows = await prisma.tblschedule.findMany({
    select: { sch_id: true, sch_month: true, sch_year: true },
    orderBy: { sch_id: 'desc' },
  });
  return rows.map((s) => ({
    sch_id: s.sch_id,
    sch_month: s.sch_month,
    sch_year: s.sch_year,
    sch_label: `${s.sch_month} - ${s.sch_year}`,
  }));
};
