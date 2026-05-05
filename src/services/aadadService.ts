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

// ─── Zone-data (UpdateAaddadData page) ────────────────────────────────────────

export interface ZoneDataClient {
  clientId: number;
  clientName: string;
  oldAadad: number | null;
  newAadad: number | null;
}

export interface ZoneDataResult {
  clients: ZoneDataClient[];
  nextZoneId: number | null;
}

export const getZoneData = async (zoneId: number, updateData: number): Promise<ZoneDataResult> => {
  const rows = await prisma.clients.findMany({
    where: { client_zone_id: zoneId, client_active: true, client_aadad: true },
    orderBy: { client_order_num: 'asc' },
    select: {
      client_id: true,
      client_first_name: true,
      client_middle_name: true,
      client_last_name: true,
      old_addad: true,
      new_addad: true,
    },
  });

  const clients: ZoneDataClient[] = rows.map(r => {
    const name = [r.client_first_name, r.client_middle_name, r.client_last_name]
      .filter(Boolean).join(' ');
    // ADD mode (0): old field shows new_addad (readonly), new field is blank
    // UPDATE mode (1): old field shows old_addad, new field shows new_addad
    const oldAadad = updateData === 0 ? r.new_addad : r.old_addad;
    const newAadad = updateData === 0 ? null : r.new_addad;
    return { clientId: r.client_id, clientName: name, oldAadad, newAadad };
  });

  // Next zone: zone_name is like "A1" — increment the numeric suffix
  const zone = await prisma.zones.findUnique({ where: { zone_id: zoneId } });
  let nextZoneId: number | null = null;
  if (zone?.zone_name) {
    const match = zone.zone_name.match(/^([A-Za-z]+)(\d+)$/);
    if (match) {
      const nextName = match[1] + (parseInt(match[2], 10) + 1);
      const nextZone = await prisma.zones.findFirst({ where: { zone_name: nextName } });
      nextZoneId = nextZone?.zone_id ?? null;
    }
  }

  return { clients, nextZoneId };
};

// ─── Save zone data ───────────────────────────────────────────────────────────

export interface SaveClient {
  clientId: number;
  clientOldAadad: string | number | null;
  clientNewAadad: string | number | null;
}

export const saveZoneData = async (clients: SaveClient[]): Promise<{ updatedCount: number }> => {
  let count = 0;
  await prisma.$transaction(async (tx) => {
    for (const data of clients) {
      if (data.clientNewAadad === '' || data.clientNewAadad === null || data.clientNewAadad === undefined) continue;
      const newVal = parseInt(String(data.clientNewAadad), 10);
      if (isNaN(newVal)) continue;
      const oldVal = (data.clientOldAadad !== '' && data.clientOldAadad !== null)
        ? parseInt(String(data.clientOldAadad), 10)
        : null;
      await tx.clients.updateMany({
        where: { client_id: data.clientId },
        data: {
          old_addad: (oldVal !== null && !isNaN(oldVal)) ? oldVal : undefined,
          new_addad: newVal,
        },
      });
      count++;
    }
  });
  return { updatedCount: count };
};
