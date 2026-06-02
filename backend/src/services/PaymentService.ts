import { Prisma } from '@prisma/client';

import { OrderStatusCodes } from '@src/common/constants/order-status';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import {
  PAYMENT_METHOD_CUSTOMER_BALANCE,
  PaymentStatusLabels,
  PaymentStatuses,
  type PaymentStatusCode,
} from '@src/common/constants/payment-status';
import { RouteError } from '@src/common/utils/route-errors';
import type { IPaymentRecordInput, IPaymentSummary } from '@src/models/Payment.model';
import ActivityRepo from '@src/repos/ActivityRepo';
import PaymentRepo from '@src/repos/PaymentRepo';
import { toPayment } from '@src/repos/common/mappers';
import prisma from '@src/repos/common/prisma';

const Errors = {
  ACTIVITY_NOT_FOUND: 'Activity not found',
  PAYMENT_NOT_FOUND: 'Payment not found',
  NO_INVOICE: 'Activity has no invoice yet',
  NOT_PROCESSING: 'Order is not in processing status',
  PAYMENTS_DEFERRED:
    'Payments are only saved when completing the order. Use advance to completed with pending payments.',
  INVALID_AMOUNT: 'Payment amount must be greater than zero',
  CUSTOMER_NOT_FOUND: 'Customer not found',
} as const;

type Tx = Prisma.TransactionClient;

export interface ISettlePaymentsOptions {
  pendingPayments: IPaymentRecordInput[];
  applyCustomerBalance?: boolean;
}

async function getInvoiceTotal(
  activityId: number,
  tx: Tx | typeof prisma = prisma,
): Promise<number> {
  const activity = await tx.activity.findUnique({
    where: { activity_id: activityId },
    include: { invoice: true },
  });
  if (!activity?.invoice) return 0;
  return Number(activity.invoice.total_amount);
}

async function sumPayments(activityId: number, tx: Tx | typeof prisma = prisma) {
  const agg = await tx.payment.aggregate({
    where: { activity_id: activityId },
    _sum: { paid_amount: true },
  });
  return Number(agg._sum.paid_amount ?? 0);
}

function resolvePaymentStatus(
  paidTotal: number,
  invoiceTotal: number,
): PaymentStatusCode {
  if (paidTotal <= 0) return PaymentStatuses.UNPAID;
  if (paidTotal >= invoiceTotal) return PaymentStatuses.PAID;
  return PaymentStatuses.PARTIAL;
}

export async function syncActivityPaymentStatus(
  activityId: number,
  tx: Tx | typeof prisma = prisma,
): Promise<PaymentStatusCode> {
  const invoiceTotal = await getInvoiceTotal(activityId, tx);
  if (invoiceTotal <= 0) {
    await PaymentRepo.setActivityPaymentStatus(activityId, PaymentStatuses.UNPAID, tx);
    return PaymentStatuses.UNPAID;
  }

  const paidTotal = await sumPayments(activityId, tx);
  const paymentStatus = resolvePaymentStatus(paidTotal, invoiceTotal);
  await PaymentRepo.setActivityPaymentStatus(activityId, paymentStatus, tx);
  return paymentStatus;
}

async function assertActivityProcessing(activityId: number) {
  const activity = await ActivityRepo.getOne(activityId);
  if (!activity) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.ACTIVITY_NOT_FOUND);
  }
  if (!activity.invoiceId) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.NO_INVOICE);
  }
  if (activity.status !== OrderStatusCodes.PROCESSING) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.NOT_PROCESSING);
  }
  return activity;
}

function rejectIfProcessingDeferred(activityId: number) {
  return ActivityRepo.getOne(activityId).then((activity) => {
    if (activity?.status === OrderStatusCodes.PROCESSING) {
      throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.PAYMENTS_DEFERRED);
    }
  });
}

async function applyCustomerBalanceInternal(
  activityId: number,
  customerId: number,
  tx: Tx,
): Promise<number> {
  const invoiceTotal = await getInvoiceTotal(activityId, tx);
  const paidTotal = await sumPayments(activityId, tx);
  const remaining = Math.max(0, invoiceTotal - paidTotal);
  if (remaining <= 0) return 0;

  const customer = await tx.customer.findUnique({
    where: { customer_id: customerId },
  });
  if (!customer) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.CUSTOMER_NOT_FOUND);
  }

  const balance = Number(customer.current_balance);
  const applyAmount = Math.min(balance, remaining);
  if (applyAmount <= 0) return 0;

  await tx.customer.update({
    where: { customer_id: customerId },
    data: { current_balance: { decrement: applyAmount } },
  });

  await tx.payment.create({
    data: {
      activity_id: activityId,
      paid_amount: applyAmount,
      payment_date: new Date(),
      method: PAYMENT_METHOD_CUSTOMER_BALANCE,
    },
  });

  return applyAmount;
}

async function recordPaymentEntryInternal(
  activityId: number,
  customerId: number,
  input: IPaymentRecordInput,
  tx: Tx,
): Promise<number> {
  if (input.paidAmount <= 0) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.INVALID_AMOUNT);
  }

  let remaining = Math.max(
    0,
    (await getInvoiceTotal(activityId, tx)) - (await sumPayments(activityId, tx)),
  );

  const paymentDate = input.paymentDate ? new Date(input.paymentDate) : new Date();
  let amountLeft = input.paidAmount;
  let excessToBalance = 0;

  if (remaining > 0 && amountLeft > 0) {
    const toOrder = Math.min(amountLeft, remaining);
    await tx.payment.create({
      data: {
        activity_id: activityId,
        paid_amount: toOrder,
        payment_date: paymentDate,
        method: input.method,
      },
    });
    amountLeft -= toOrder;
    remaining -= toOrder;
  }

  if (amountLeft > 0) {
    excessToBalance = amountLeft;
    await tx.customer.update({
      where: { customer_id: customerId },
      data: { current_balance: { increment: amountLeft } },
    });
  }

  return excessToBalance;
}

async function buildSummaryInTx(activityId: number, tx: Tx): Promise<IPaymentSummary> {
  const activity = await tx.activity.findUnique({ where: { activity_id: activityId } });
  if (!activity) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.ACTIVITY_NOT_FOUND);
  }

  const invoiceTotal = await getInvoiceTotal(activityId, tx);
  const paidTotal = await sumPayments(activityId, tx);
  const remaining = Math.max(0, invoiceTotal - paidTotal);
  const customer = await tx.customer.findUnique({
    where: { customer_id: activity.customer_id },
  });
  const paymentStatus = resolvePaymentStatus(paidTotal, invoiceTotal);
  const rows = await tx.payment.findMany({
    where: { activity_id: activityId },
    orderBy: { payment_date: 'asc' },
  });

  const isProcessing = activity.status === OrderStatusCodes.PROCESSING;

  return {
    activityId,
    invoiceTotal,
    paidTotal,
    remaining,
    customerBalance: Number(customer?.current_balance ?? 0),
    paymentStatus,
    paymentStatusLabel: PaymentStatusLabels[paymentStatus],
    canRecordPayment:
      isProcessing && invoiceTotal > 0,
    paymentsDeferred: isProcessing,
    payments: rows.map(toPayment),
  };
}

/** Ghi toàn bộ thanh toán tạm khi hoàn thành đơn (chỉ gọi từ advance → completed). */
async function settlePendingPayments(
  activityId: number,
  options: ISettlePaymentsOptions,
): Promise<IPaymentSummary> {
  const activity = await assertActivityProcessing(activityId);

  return prisma.$transaction(async (tx) => {
    if (options.applyCustomerBalance !== false) {
      await applyCustomerBalanceInternal(activityId, activity.customerId, tx);
    }

    for (const entry of options.pendingPayments) {
      await recordPaymentEntryInternal(
        activityId,
        activity.customerId,
        entry,
        tx,
      );
    }

    await syncActivityPaymentStatus(activityId, tx);
    return buildSummaryInTx(activityId, tx);
  });
}

async function getSummary(activityId: number): Promise<IPaymentSummary> {
  const activity = await ActivityRepo.getOne(activityId);
  if (!activity) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.ACTIVITY_NOT_FOUND);
  }

  const invoiceTotal = activity.invoiceId
    ? await getInvoiceTotal(activityId)
    : 0;
  const paidTotal = await sumPayments(activityId);
  const remaining = Math.max(0, invoiceTotal - paidTotal);

  const customer = await prisma.customer.findUnique({
    where: { customer_id: activity.customerId },
  });
  const customerBalance = Number(customer?.current_balance ?? 0);

  const paymentStatus = resolvePaymentStatus(paidTotal, invoiceTotal);
  const payments = await PaymentRepo.getByActivity(activityId);
  const isProcessing = activity.status === OrderStatusCodes.PROCESSING;

  return {
    activityId,
    invoiceTotal,
    paidTotal: isProcessing ? 0 : paidTotal,
    remaining: isProcessing ? invoiceTotal : remaining,
    customerBalance,
    paymentStatus: isProcessing ? PaymentStatuses.UNPAID : paymentStatus,
    paymentStatusLabel: isProcessing
      ? PaymentStatusLabels[PaymentStatuses.UNPAID]
      : PaymentStatusLabels[paymentStatus],
    canRecordPayment: isProcessing && invoiceTotal > 0,
    paymentsDeferred: isProcessing,
    payments: isProcessing ? [] : payments,
  };
}

async function getByActivity(activityId: number) {
  if (!(await ActivityRepo.persists(activityId))) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.ACTIVITY_NOT_FOUND);
  }
  return PaymentRepo.getByActivity(activityId);
}

async function applyCustomerBalance(activityId: number) {
  await rejectIfProcessingDeferred(activityId);
  const activity = await ActivityRepo.getOne(activityId);
  if (!activity) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.ACTIVITY_NOT_FOUND);
  }

  return prisma.$transaction(async (tx) => {
    const applied = await applyCustomerBalanceInternal(
      activityId,
      activity.customerId,
      tx,
    );
    const paymentStatus = await syncActivityPaymentStatus(activityId, tx);
    return { applied, paymentStatus, summary: await buildSummaryInTx(activityId, tx) };
  });
}

async function recordPayment(activityId: number, input: IPaymentRecordInput) {
  await rejectIfProcessingDeferred(activityId);
  const activity = await ActivityRepo.getOne(activityId);
  if (!activity) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.ACTIVITY_NOT_FOUND);
  }

  return prisma.$transaction(async (tx) => {
    if (input.applyCustomerBalance !== false) {
      await applyCustomerBalanceInternal(activityId, activity.customerId, tx);
    }

    const excessToBalance = await recordPaymentEntryInternal(
      activityId,
      activity.customerId,
      input,
      tx,
    );

    await syncActivityPaymentStatus(activityId, tx);
    const summary = await buildSummaryInTx(activityId, tx);
    const payments = await tx.payment.findMany({
      where: { activity_id: activityId },
      orderBy: { payment_id: 'desc' },
      take: 1,
    });
    const latestPayment = payments[0] ? toPayment(payments[0]) : null;

    return { payment: latestPayment, excessToBalance, summary };
  });
}

async function deleteOne(paymentId: number): Promise<void> {
  const row = await prisma.payment.findUnique({
    where: { payment_id: paymentId },
  });
  if (!row) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.PAYMENT_NOT_FOUND);
  }

  const activityId = row.activity_id;
  await rejectIfProcessingDeferred(activityId);

  await prisma.$transaction(async (tx) => {
    const activity = await tx.activity.findUnique({
      where: { activity_id: activityId },
    });
    if (!activity) return;

    if (row.method === PAYMENT_METHOD_CUSTOMER_BALANCE) {
      await tx.customer.update({
        where: { customer_id: activity.customer_id },
        data: { current_balance: { increment: Number(row.paid_amount) } },
      });
    }

    await tx.payment.delete({ where: { payment_id: paymentId } });
    await syncActivityPaymentStatus(activityId, tx);
  });
}

export { recordPaymentEntryInternal, sumPayments, resolvePaymentStatus };

export default {
  Errors,
  getSummary,
  getByActivity,
  applyCustomerBalance,
  recordPayment,
  settlePendingPayments,
  delete: deleteOne,
  syncActivityPaymentStatus,
} as const;
