import { ICustomer } from '@src/models/Customer.model';

import { customerToPrismaData, toCustomer } from './common/mappers';
import prisma from './common/prisma';

/******************************************************************************
                                Functions
******************************************************************************/

async function getOne(id: number): Promise<ICustomer | null> {
  const row = await prisma.customer.findUnique({
    where: { customer_id: id },
  });
  return row ? toCustomer(row) : null;
}

async function persists(id: number): Promise<boolean> {
  const count = await prisma.customer.count({ where: { customer_id: id } });
  return count > 0;
}

async function getAll(): Promise<ICustomer[]> {
  const rows = await prisma.customer.findMany({
    orderBy: { customer_id: 'asc' },
  });
  return rows.map(toCustomer);
}

async function add(customer: ICustomer): Promise<ICustomer> {
  const row = await prisma.customer.create({
    data: customerToPrismaData(customer),
  });
  return toCustomer(row);
}

async function update(customer: ICustomer): Promise<ICustomer> {
  const row = await prisma.customer.update({
    where: { customer_id: customer.id },
    data: customerToPrismaData(customer),
  });
  return toCustomer(row);
}

async function delete_(id: number): Promise<void> {
  await prisma.customer.delete({ where: { customer_id: id } });
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  getOne,
  persists,
  getAll,
  add,
  update,
  delete: delete_,
} as const;
