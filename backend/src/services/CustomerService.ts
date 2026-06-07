import { Prisma } from '@prisma/client';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import {
  PaymentStatusLabels,
  PaymentStatuses,
} from '@src/common/constants/payment-status';
import { CustomerErrors as Errors } from '@src/common/constants/service-errors';
import { RouteError } from '@src/common/utils/route-errors';
import type {
  ICustomerAccount,
  ICustomerOrderRow,
  ICustomerReceivePaymentInput,
  ICustomerReceivePaymentResult,
} from '@src/models/CustomerAccount.model';
import { ICustomer } from '@src/models/Customer.model';
import ActivityRepo from '@src/repos/ActivityRepo';
import CustomerRepo from '@src/repos/CustomerRepo';
import LocationRepo from '@src/repos/LocationRepo';
import prisma from '@src/repos/common/prisma';
import PaymentService, {
  recordPaymentEntryInternal,
  resolvePaymentStatus,
  sumPayments,
} from '@src/services/PaymentService';

async function assertLocationExists(locationId: number) {
  const exists = await LocationRepo.persists(locationId);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.LOCATION_NOT_FOUND);
  }
}

async function getAll() {
  return CustomerRepo.getAll();
}

async function getOne(id: number) {
  const customer = await CustomerRepo.getOne(id);
  if (!customer) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.CUSTOMER_NOT_FOUND);
  }
  return customer;
}

async function addOne(customer: ICustomer) {
  await assertLocationExists(customer.locationId);
  return CustomerRepo.add(customer);
}

async function updateOne(customer: ICustomer) {
  const exists = await CustomerRepo.persists(customer.id);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.CUSTOMER_NOT_FOUND);
  }
  await assertLocationExists(customer.locationId);
  return CustomerRepo.update(customer);
}

async function deleteOne(id: number): Promise<void> {
  const exists = await CustomerRepo.persists(id);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.CUSTOMER_NOT_FOUND);
  }

  const activityCount = await ActivityRepo.countByCustomer(id);
  if (activityCount > 0) {
    throw new RouteError(
      HttpStatusCodes.BAD_REQUEST,
      Errors.CUSTOMER_HAS_ACTIVITIES,
    );
  }

  return CustomerRepo.delete(id);
}

type DbClient = Prisma.TransactionClient | typeof prisma;

async function buildOrderRows(
  customerId: number,
  db: DbClient = prisma,
): Promise<ICustomerOrderRow[]> {
  const activities = await db.activity.findMany({
    where: {
      customer_id: customerId,
      invoice_id: { not: null },
    },
    include: { invoice: true },
    orderBy: [{ created_at: 'asc' }, { activity_id: 'asc' }],
  });

  const orders: ICustomerOrderRow[] = [];
  for (const act of activities) {
    const invoiceTotal = Number(act.invoice?.total_amount ?? 0);
    const paidTotal = await sumPayments(act.activity_id, db);
    const remaining = Math.max(0, invoiceTotal - paidTotal);
    const paymentStatus = resolvePaymentStatus(paidTotal, invoiceTotal);

    orders.push({
      activityId: act.activity_id,
      activityDate: act.activity_date,
      createdAt: act.created_at,
      status: act.status,
      paymentStatus,
      paymentStatusLabel: PaymentStatusLabels[paymentStatus],
      invoiceTotal,
      paidTotal,
      remaining,
    });
  }
  return orders;
}

async function getAccount(customerId: number): Promise<ICustomerAccount> {
  const customer = await getOne(customerId);
  const orders = await buildOrderRows(customerId);
  const totalDebt = orders.reduce((sum, o) => sum + o.remaining, 0);

  return {
    customer,
    currentBalance: customer.currentBalance,
    totalDebt,
    orders,
  };
}

async function receivePayment(
  customerId: number,
  input: ICustomerReceivePaymentInput,
): Promise<ICustomerReceivePaymentResult> {
  if (input.amount <= 0) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.INVALID_AMOUNT);
  }
  if (!input.method?.trim()) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.INVALID_METHOD);
  }

  await getOne(customerId);

  return prisma.$transaction(async (tx) => {
    const activities = await tx.activity.findMany({
      where: {
        customer_id: customerId,
        invoice_id: { not: null },
      },
      include: { invoice: true },
      orderBy: [{ created_at: 'asc' }, { activity_id: 'asc' }],
    });

    const allocations: ICustomerReceivePaymentResult['allocations'] = [];
    let left = input.amount;
    let excessToBalance = 0;

    for (const act of activities) {
      if (left <= 0) break;

      const invoiceTotal = Number(act.invoice?.total_amount ?? 0);
      const paidTotal = await sumPayments(act.activity_id, tx);
      const remaining = Math.max(0, invoiceTotal - paidTotal);
      if (remaining <= 0) continue;

      const paymentStatus = resolvePaymentStatus(paidTotal, invoiceTotal);
      if (paymentStatus === PaymentStatuses.PAID) continue;

      const pay = Math.min(left, remaining);
      await recordPaymentEntryInternal(
        act.activity_id,
        customerId,
        {
          paidAmount: pay,
          method: input.method.trim(),
          paymentDate: new Date(),
        },
        tx,
      );
      await PaymentService.syncActivityPaymentStatus(act.activity_id, tx);
      left -= pay;
      allocations.push({ activityId: act.activity_id, paidAmount: pay });
    }

    if (left > 0) {
      excessToBalance = left;
      await tx.customer.update({
        where: { customer_id: customerId },
        data: { current_balance: { increment: left } },
      });
    }

    const customerRow = await tx.customer.findUnique({
      where: { customer_id: customerId },
    });
    if (!customerRow) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.CUSTOMER_NOT_FOUND);
    }

    const customer = await CustomerRepo.getOne(customerId);
    if (!customer) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.CUSTOMER_NOT_FOUND);
    }

    const orders = await buildOrderRows(customerId, tx);
    const totalDebt = orders.reduce((sum, o) => sum + o.remaining, 0);

    return {
      allocations,
      excessToBalance,
      account: {
        customer,
        currentBalance: Number(customerRow.current_balance),
        totalDebt,
        orders,
      },
    };
  });
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  Errors,
  getAll,
  getOne,
  addOne,
  updateOne,
  delete: deleteOne,
  getAccount,
  receivePayment,
} as const;
