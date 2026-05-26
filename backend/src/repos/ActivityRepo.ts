import { IActivity, IActivityWrite } from '@src/models/Activity.model';

import { OrderStatusCodes } from '@src/common/constants/order-status';
import { activityWriteToPrismaData, toActivity } from './common/mappers';
import prisma from './common/prisma';

/******************************************************************************
                                Functions
******************************************************************************/

async function getOne(id: number): Promise<IActivity | null> {
  const row = await prisma.activity.findUnique({
    where: { activity_id: id },
  });
  return row ? toActivity(row) : null;
}

async function persists(id: number): Promise<boolean> {
  const count = await prisma.activity.count({ where: { activity_id: id } });
  return count > 0;
}

async function getByInvoiceId(invoiceId: number): Promise<IActivity | null> {
  const row = await prisma.activity.findUnique({
    where: { invoice_id: invoiceId },
  });
  return row ? toActivity(row) : null;
}

async function getAll(): Promise<IActivity[]> {
  const rows = await prisma.activity.findMany({
    orderBy: { activity_id: 'asc' },
  });
  return rows.map(toActivity);
}

async function addDraft(input: IActivityWrite): Promise<IActivity> {
  const row = await prisma.activity.create({
    data: {
      ...activityWriteToPrismaData(input),
      status: OrderStatusCodes.DRAFT,
    },
  });
  return toActivity(row);
}

async function update(
  id: number,
  input: IActivityWrite,
  status?: string,
): Promise<IActivity> {
  const row = await prisma.activity.update({
    where: { activity_id: id },
    data: {
      ...activityWriteToPrismaData(input),
      ...(status ? { status } : {}),
    },
  });
  return toActivity(row);
}

async function linkInvoice(
  activityId: number,
  invoiceId: number,
  status: string,
): Promise<IActivity> {
  const row = await prisma.activity.update({
    where: { activity_id: activityId },
    data: { invoice_id: invoiceId, status },
  });
  return toActivity(row);
}

async function setStatus(activityId: number, status: string): Promise<IActivity> {
  const row = await prisma.activity.update({
    where: { activity_id: activityId },
    data: { status },
  });
  return toActivity(row);
}

async function delete_(id: number): Promise<void> {
  await prisma.activity.delete({ where: { activity_id: id } });
}

async function countByCustomer(customerId: number): Promise<number> {
  return prisma.activity.count({ where: { customer_id: customerId } });
}

async function countByUser(userId: number): Promise<number> {
  return prisma.activity.count({ where: { user_id: userId } });
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  getOne,
  persists,
  getByInvoiceId,
  getAll,
  addDraft,
  update,
  linkInvoice,
  setStatus,
  delete: delete_,
  countByCustomer,
  countByUser,
} as const;
