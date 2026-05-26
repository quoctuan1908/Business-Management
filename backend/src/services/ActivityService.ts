import { OrderStatusCodes } from '@src/common/constants/order-status';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import { IActivityWrite } from '@src/models/Activity.model';
import ActivityDetailRepo from '@src/repos/ActivityDetailRepo';
import ActivityRepo from '@src/repos/ActivityRepo';
import CustomerRepo from '@src/repos/CustomerRepo';
import OrderStatusRepo from '@src/repos/OrderStatusRepo';
import UserRepo from '@src/repos/UserRepo';
import { invoiceToPrismaData, toOrderStatus } from '@src/repos/common/mappers';
import prisma from '@src/repos/common/prisma';

const Errors = {
  ACTIVITY_NOT_FOUND: 'Activity not found',
  USER_NOT_FOUND: 'User not found',
  CUSTOMER_NOT_FOUND: 'Customer not found',
  INVALID_STATUS: 'Invalid order status',
  ORDER_NOT_DRAFT: 'Order can only be edited in draft status',
  ORDER_EMPTY: 'Order must have at least one product line',
  NO_NEXT_STATUS: 'No next status available',
  STATUS_IS_TERMINAL: 'Order is already in a terminal status',
  MUST_CONFIRM_FIRST: 'Confirm the order before advancing status',
} as const;

async function assertUserAndCustomer(input: IActivityWrite) {
  if (!(await UserRepo.persists(input.userId))) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.USER_NOT_FOUND);
  }
  if (!(await CustomerRepo.persists(input.customerId))) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.CUSTOMER_NOT_FOUND);
  }
}

async function assertDraft(activityId: number) {
  const activity = await ActivityRepo.getOne(activityId);
  if (!activity) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.ACTIVITY_NOT_FOUND);
  }
  if (activity.status !== OrderStatusCodes.DRAFT) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.ORDER_NOT_DRAFT);
  }
  return activity;
}

async function getAll() {
  return ActivityRepo.getAll();
}

async function getOne(id: number) {
  const activity = await ActivityRepo.getOne(id);
  if (!activity) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.ACTIVITY_NOT_FOUND);
  }
  return activity;
}

async function addOne(input: IActivityWrite) {
  await assertUserAndCustomer(input);
  return ActivityRepo.addDraft(input);
}

async function updateOne(id: number, input: IActivityWrite) {
  await assertDraft(id);
  await assertUserAndCustomer(input);
  return ActivityRepo.update(id, input);
}

async function confirmOrder(activityId: number) {
  await assertDraft(activityId);
  const detailCount = await prisma.activityDetail.count({
    where: { activity_id: activityId },
  });
  if (detailCount === 0) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.ORDER_EMPTY);
  }

  const total = await ActivityDetailRepo.sumLineTotals(activityId);
  const invoice = await prisma.invoice.create({
    data: invoiceToPrismaData({
      totalAmount: total,
      date: new Date(),
      status: 'unpaid',
    }),
  });

  const updated = await ActivityRepo.linkInvoice(
    activityId,
    invoice.invoice_id,
    OrderStatusCodes.CONFIRMED,
  );

  return { activity: updated, invoiceId: invoice.invoice_id };
}

async function advanceStatus(activityId: number) {
  const activity = await ActivityRepo.getOne(activityId);
  if (!activity) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.ACTIVITY_NOT_FOUND);
  }

  if (activity.status === OrderStatusCodes.DRAFT) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.MUST_CONFIRM_FIRST);
  }

  const currentRow = await OrderStatusRepo.getByCode(activity.status);
  if (!currentRow) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.INVALID_STATUS);
  }
  const current = toOrderStatus(currentRow);
  if (current.isTerminal) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.STATUS_IS_TERMINAL);
  }

  const nextRow = await OrderStatusRepo.getNext(activity.status);
  if (!nextRow) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.NO_NEXT_STATUS);
  }
  const next = toOrderStatus(nextRow);

  const updated = await ActivityRepo.setStatus(activityId, next.statusCode);
  return {
    activity: updated,
    previousStatus: current.statusCode,
    nextStatus: next.statusCode,
    nextStatusName: next.statusName,
  };
}

async function deleteOne(id: number): Promise<void> {
  const activity = await ActivityRepo.getOne(id);
  if (!activity) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.ACTIVITY_NOT_FOUND);
  }

  if (activity.invoiceId) {
    await prisma.invoice.delete({ where: { invoice_id: activity.invoiceId } });
  }
  return ActivityRepo.delete(id);
}

export default {
  Errors,
  getAll,
  getOne,
  addOne,
  updateOne,
  confirmOrder,
  advanceStatus,
  delete: deleteOne,
} as const;
