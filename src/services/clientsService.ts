import prisma from '../prisma';

export interface ClientEntity {
  id: number;
  orderNumber: number | null;
  title: string | null,
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  fullName: string;
  zoneId: number | null;
  zoneName: string | null;
  amperageId: number | null;
  amperageValue: number | null;
  paymentAmperageId: number | null;
  paymentAmperageValue: number | null;
  exceptionId: number | null;
  exceptionName: string | null;
  exceptionAmt: number | 0;
  mobile: string | null;
  address: string | null;
  active: boolean | null;
  isAadad: boolean | null;
  timestamp: Date | null;
  oldAaddad: number | null;
  newAaddad: number | null;
  gender: number | null;
}

type ClientWithRelations = Awaited<ReturnType<typeof fetchClientWithRelations>>;

async function fetchClientWithRelations(id: number) {
  return prisma.clients.findUnique({
    where: { client_id: id },
    include: {
      zones: true,
      amperage_clients_client_amp_idToamperage: true,
      amperage_clients_client_pay_amp_idToamperage: true,
      exceptions: true,
    },
  });
}

const mapToEntity = (c: NonNullable<ClientWithRelations>): ClientEntity => ({
  id: c.client_id,
  orderNumber: c.client_order_num,
  title: c.client_title,
  firstName: c.client_first_name,
  middleName: c.client_middle_name,
  lastName: c.client_last_name,
  fullName: [c.client_first_name, c.client_middle_name, c.client_last_name]
    .filter(Boolean)
    .join(' '),
  zoneId: c.client_zone_id,
  zoneName: c.zones ? c.zones.zone_name : null,
  amperageId: c.client_amp_id,
  amperageValue: c.amperage_clients_client_amp_idToamperage
    ? c.amperage_clients_client_amp_idToamperage.amp_value
    : null,
  paymentAmperageId: c.client_pay_amp_id,
  paymentAmperageValue: c.amperage_clients_client_pay_amp_idToamperage
    ? c.amperage_clients_client_pay_amp_idToamperage.amp_value
    : null,
  exceptionId: c.client_excep_flg,
  exceptionName: c.exceptions ? c.exceptions.exp_name : null,
  exceptionAmt: c.client_excep_amt ? c.client_excep_amt : 0,
  mobile: c.client_mobile,
  address: c.client_address,
  active: c.client_active,
  isAadad: c.client_aadad ?? null,
  timestamp: c.client_ts,
  oldAaddad: c.old_addad,
  newAaddad: c.new_addad,
  gender: c.client_gender,
});

export interface GetAllOptions {
  zoneId?: number;
  search?: string;
  activeOnly?: boolean;
}

export const getAll = async ({
  zoneId,
  search,
  activeOnly = false,
}: GetAllOptions = {}): Promise<ClientEntity[]> => {

  const where: Record<string, unknown> = {};
  if (zoneId) where.client_zone_id = zoneId;
  if (activeOnly) where.client_active = true;

  if (search) {
    where.OR = [
      { client_first_name: { contains: search } },
      { client_middle_name: { contains: search } },
      { client_last_name: { contains: search } },
      { client_order_num: { contains: search } },
      { client_mobile: { contains: search } },
    ];
  }


  const data = await prisma.clients.findMany({
    where,
    include: {
      zones: true,
      amperage_clients_client_amp_idToamperage: true,
      amperage_clients_client_pay_amp_idToamperage: true,
      exceptions: true,
    },
    orderBy: { client_id: 'desc' },
  });


  return data.map(mapToEntity);
};

export const getById = async (id: number | string): Promise<ClientEntity | null> => {
  const client = await fetchClientWithRelations(Number(id));
  return client ? mapToEntity(client) : null;
};

export const getNextOrderNumber = async (zoneId: number): Promise<number> => {
  const res = await prisma.clients.aggregate({
    _max: { client_order_num: true },
    where: { client_zone_id: zoneId },
  });
  return (res._max.client_order_num ?? 0) + 1;
};

export interface CreateClientInput {
  orderNumber?: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  zoneId: number;
  amperageId?: number;
  paymentAmperageId?: number;
  exceptionId?: number;
  mobile?: string;
  address?: string;
  active?: boolean;
  userId?: number;
}

export const create = async (input: CreateClientInput): Promise<ClientEntity | null> => {
  const {
    zoneId, amperageId, paymentAmperageId, exceptionId,
    firstName, middleName, lastName, mobile, address, active = true, userId,
  } = input;
  let { orderNumber } = input;

  const zone = await prisma.zones.findUnique({ where: { zone_id: zoneId } });
  if (!zone || zone.zone_active !== true) throw new Error('ZONE_NOT_FOUND');

  if (amperageId) {
    const a = await prisma.amperage.findUnique({ where: { amp_id: amperageId } });
    if (!a || a.amp_active !== true) throw new Error('AMPERAGE_NOT_FOUND');
  }
  if (paymentAmperageId) {
    const pa = await prisma.amperage.findUnique({ where: { amp_id: paymentAmperageId } });
    if (!pa || pa.amp_active !== true) throw new Error('PAYMENT_AMPERAGE_NOT_FOUND');
  }
  if (exceptionId) {
    const e = await prisma.exceptions.findUnique({ where: { exp_id: exceptionId } });
    if (!e) throw new Error('EXCEPTION_NOT_FOUND');
  }

  if (!orderNumber) orderNumber = await getNextOrderNumber(zoneId);

  const created = await prisma.clients.create({
    data: {
      client_order_num: orderNumber,
      client_first_name: firstName ?? null,
      client_middle_name: middleName ?? null,
      client_last_name: lastName ?? null,
      client_zone_id: zoneId,
      client_amp_id: amperageId ?? null,
      client_pay_amp_id: paymentAmperageId ?? null,
      client_excep_flg: exceptionId ?? null,
      client_mobile: mobile ?? null,
      client_address: address ?? null,
      client_active: active,
      client_userid: userId,
    },
  });
  return getById(created.client_id);
};

export interface UpdateClientInput {
  orderNumber?: number;
  title?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: string;
  zoneId?: number;
  amperageId?: number;
  paymentAmperageId?: number;
  exceptionId?: number;
  exceptionAmount?: number;
  mobile?: string;
  address?: string;
  active?: boolean;
  isAaddad?: boolean;
  userId?: number;
}

export const update = async (
  id: number | string,
  input: UpdateClientInput
): Promise<ClientEntity | null> => {
  const {
    orderNumber, title, firstName, middleName, lastName, gender,
    zoneId, amperageId, paymentAmperageId, exceptionId, exceptionAmount,
    mobile, address, active, userId, isAaddad
  } = input;

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.client_title = title;
  if (firstName !== undefined) data.client_first_name = firstName;
  if (middleName !== undefined) data.client_middle_name = middleName;
  if (lastName !== undefined) data.client_last_name = lastName;
  if (mobile !== undefined) data.client_mobile = mobile;
  if (gender !== undefined) data.client_gender = gender;
  if (zoneId !== undefined) data.client_zone_id = zoneId;
  if (orderNumber !== undefined) data.client_order_num = orderNumber;
  if (amperageId !== undefined) data.client_amp_id = amperageId;
  if (paymentAmperageId !== undefined) data.client_pay_amp_id = paymentAmperageId;
  if (exceptionId !== undefined) data.client_excep_flg = exceptionId;
  if (exceptionAmount !== undefined) data.client_excep_amt = exceptionAmount;
  if (address !== undefined) data.client_address = address;
  if (active !== undefined) data.client_active = active;
  if (isAaddad !== undefined) data.client_aadad = isAaddad;
  if (userId !== undefined) data.client_userid = userId;

  if (Object.keys(data).length === 0) return getById(id);

  try {
    await prisma.clients.update({ where: { client_id: Number(id) }, data });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2025') return null;
    throw err;
  }
  return getById(id);
};

export const remove = async (id: number | string): Promise<boolean> => {
  try {
    await prisma.clients.update({ where: { client_id: Number(id) }, data: { client_active: false } });
    return true;
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'P2025') return false;
    throw err;
  }
};
