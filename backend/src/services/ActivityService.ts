import { OrderStatusCodes } from '@src/common/constants/order-status';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { PaymentStatuses } from '@src/common/constants/payment-status';
import { ActivityErrors as Errors } from '@src/common/constants/service-errors';
import { RouteError } from '@src/common/utils/route-errors';
import { IActivityWrite } from '@src/models/Activity.model';
import type { IPaymentRecordInput } from '@src/models/Payment.model';
import ActivityDetailRepo from '@src/repos/ActivityDetailRepo';
import ActivityRepo from '@src/repos/ActivityRepo';
import CustomerRepo from '@src/repos/CustomerRepo';
import OrderStatusRepo from '@src/repos/OrderStatusRepo';
import UserRepo from '@src/repos/UserRepo';
import { invoiceToPrismaData, toActivity, toOrderStatus } from '@src/repos/common/mappers';
import prisma from '@src/repos/common/prisma';
import ActivityStockService from '@src/services/activity-stock';
import { settlePendingPaymentsInTx } from '@src/services/PaymentService';

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

  return prisma.$transaction(async (tx) => {
    const locked = await tx.activity.findUnique({
      where: { activity_id: activityId },
    });
    if (!locked || locked.status !== OrderStatusCodes.DRAFT) {
      throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.ORDER_NOT_DRAFT);
    }

    await ActivityStockService.validateStockForConfirmedOrder(activityId, tx);

    const total = await ActivityDetailRepo.sumLineTotals(activityId);
    const invoice = await tx.invoice.create({
      data: invoiceToPrismaData({
        totalAmount: total,
        date: new Date(),
      }),
    });

    const row = await tx.activity.update({
      where: { activity_id: activityId },
      data: {
        invoice_id: invoice.invoice_id,
        status: OrderStatusCodes.CONFIRMED,
        payment_status: PaymentStatuses.UNPAID,
      },
    });

    return { activity: toActivity(row), invoiceId: invoice.invoice_id };
  });
}

export interface IAdvanceStatusOptions {
  pendingPayments?: IPaymentRecordInput[];
  applyCustomerBalance?: boolean;
}

async function advanceStatus(
  activityId: number,
  options?: IAdvanceStatusOptions,
) {
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

  let updated;

  if (
    current.statusCode === OrderStatusCodes.PROCESSING &&
    next.statusCode === OrderStatusCodes.COMPLETED
  ) {
    updated = await prisma.$transaction(async (tx) => {
      const locked = await tx.activity.findUnique({
        where: { activity_id: activityId },
      });
      if (!locked) {
        throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.ACTIVITY_NOT_FOUND);
      }
      if (locked.status !== OrderStatusCodes.PROCESSING) {
        throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.INVALID_STATUS);
      }

      await ActivityStockService.deductStockForCompletedOrder(activityId, tx);
      await settlePendingPaymentsInTx(
        activityId,
        locked.customer_id,
        {
          pendingPayments: options?.pendingPayments ?? [],
          applyCustomerBalance: options?.applyCustomerBalance,
        },
        tx,
      );

      const row = await tx.activity.update({
        where: { activity_id: activityId },
        data: { status: next.statusCode },
      });
      return toActivity(row);
    });
  } else {
    updated = await ActivityRepo.setStatus(activityId, next.statusCode);
  }

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
