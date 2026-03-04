import prisma from '../prisma';

export interface ClientReading {
  clientId: number;
  clientName: string;
  orderNumber: number | null;
  oldReading: number | null;
  newReading: number | null;
  consumption: number;
}

export interface ReadingUpdate {
  clientId: number;
  newReading: number;
}

export interface ZoneStatistics {
  totalClients: number;
  totalConsumption: number;
  avgConsumption: number;
  minConsumption: number;
  maxConsumption: number;
}

export interface MoveResult {
  success: boolean;
  updatedCount: number;
}

const mapToReading = (c: {
  client_id: number;
  client_first_name: string | null;
  client_middle_name: string | null;
  client_last_name: string | null;
  client_order_num: number | null;
  old_addad: number | null;
  new_addad: number | null;
}): ClientReading => ({
  clientId: c.client_id,
  clientName: [c.client_first_name, c.client_middle_name, c.client_last_name]
    .filter(Boolean)
    .join(' '),
  orderNumber: c.client_order_num,
  oldReading: c.old_addad,
  newReading: c.new_addad,
  consumption: (c.new_addad ?? 0) - (c.old_addad ?? 0),
});

export const getByZone = async (zoneId: number): Promise<ClientReading[]> => {
  const rows = await prisma.clients.findMany({
    where: { client_zone_id: zoneId, client_active: true },
    orderBy: { client_order_num: 'asc' },
    select: {
      client_id: true,
      client_first_name: true,
      client_middle_name: true,
      client_last_name: true,
      client_order_num: true,
      old_addad: true,
      new_addad: true,
    },
  });
  return rows.map(mapToReading);
};

export const bulkUpdateByZone = async (
  zoneId: number,
  readings: ReadingUpdate[],
  userId: number
): Promise<boolean> => {
  return prisma.$transaction(async (tx) => {
    for (const reading of readings) {
      await tx.clients.updateMany({
        where: { client_id: reading.clientId, client_zone_id: zoneId, client_active: true },
        data: { new_addad: reading.newReading, client_userid: userId },
      });
    }
    return true;
  });
};

export const moveNewToOld = async (userId: number): Promise<MoveResult> => {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`UPDATE clients SET old_addad = new_addad, client_userid = ${userId} WHERE client_active = 1`;
    const result = await tx.clients.count({ where: { client_active: true } });
    return { success: true, updatedCount: result };
  });
};

export interface RawStatRow {
  totalClients: bigint | number;
  totalConsumption: number | null;
  avgConsumption: number | null;
  minConsumption: number | null;
  maxConsumption: number | null;
}

export const getZoneStatistics = async (zoneId: number): Promise<ZoneStatistics> => {
  const res = await prisma.$queryRawUnsafe<RawStatRow[]>(
    `SELECT COUNT(*) as totalClients, SUM(new_addad - old_addad) as totalConsumption, AVG(new_addad - old_addad) as avgConsumption, MIN(new_addad - old_addad) as minConsumption, MAX(new_addad - old_addad) as maxConsumption FROM clients WHERE client_zone_id = ? AND client_active = 1`,
    zoneId
  );
  const row = res[0] ?? {};
  return {
    totalClients: Number(row.totalClients ?? 0),
    totalConsumption: Number(row.totalConsumption ?? 0),
    avgConsumption: Number(row.avgConsumption ?? 0),
    minConsumption: Number(row.minConsumption ?? 0),
    maxConsumption: Number(row.maxConsumption ?? 0),
  };
};
