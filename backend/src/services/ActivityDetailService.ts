import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import { IActivityDetail } from '@src/models/ActivityDetail.model';
import ActivityDetailRepo from '@src/repos/ActivityDetailRepo';
import ActivityRepo from '@src/repos/ActivityRepo';
import ProductRepo from '@src/repos/ProductRepo';
import { isOrderEditable } from '@src/common/constants/order-status';
import prisma from '@src/repos/common/prisma';

/******************************************************************************
                                Constants
******************************************************************************/

const Errors = {
  ACTIVITY_NOT_FOUND: 'Activity not found',
  PRODUCT_NOT_FOUND: 'Product not found',
  DETAIL_NOT_FOUND: 'Activity detail not found',
  DETAIL_ALREADY_EXISTS: 'Product already exists in this activity order',
  INVALID_QUANTITY: 'Quantity must be greater than 0',
  ORDER_NOT_DRAFT: 'Order lines can only be changed in draft status',
} as const;

async function assertDraftOrder(activityId: number) {
  const activity = await ActivityRepo.getOne(activityId);
  if (!activity) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.ACTIVITY_NOT_FOUND);
  }
  if (!isOrderEditable(activity.status)) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.ORDER_NOT_DRAFT);
  }
}

/******************************************************************************
                                Functions
******************************************************************************/

async function syncInvoiceTotal(activityId: number) {
  const invoiceId = await ActivityDetailRepo.getActivityInvoiceId(activityId);
  if (!invoiceId) return;

  const total = await ActivityDetailRepo.sumLineTotals(activityId);
  await prisma.invoice.update({
    where: { invoice_id: invoiceId },
    data: { total_amount: total },
  });
}

async function getByActivity(activityId: number) {
  if (!(await ActivityRepo.persists(activityId))) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.ACTIVITY_NOT_FOUND);
  }
  return ActivityDetailRepo.getByActivity(activityId);
}

async function addOne(detail: IActivityDetail) {
  await assertDraftOrder(detail.activityId);
  if (!(await ProductRepo.persists(detail.productId))) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.PRODUCT_NOT_FOUND);
  }
  if (detail.quantity <= 0) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.INVALID_QUANTITY);
  }
  if (await ActivityDetailRepo.exists(detail.activityId, detail.productId)) {
    throw new RouteError(
      HttpStatusCodes.BAD_REQUEST,
      Errors.DETAIL_ALREADY_EXISTS,
    );
  }

  const created = await ActivityDetailRepo.add(detail);
  await syncInvoiceTotal(detail.activityId);
  return created;
}

async function updateOne(detail: IActivityDetail) {
  await assertDraftOrder(detail.activityId);
  if (!(await ActivityDetailRepo.exists(detail.activityId, detail.productId))) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.DETAIL_NOT_FOUND);
  }
  if (detail.quantity <= 0) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.INVALID_QUANTITY);
  }

  const updated = await ActivityDetailRepo.update(detail);
  await syncInvoiceTotal(detail.activityId);
  return updated;
}

async function deleteOne(activityId: number, productId: number): Promise<void> {
  await assertDraftOrder(activityId);
  if (!(await ActivityDetailRepo.exists(activityId, productId))) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.DETAIL_NOT_FOUND);
  }
  await ActivityDetailRepo.delete(activityId, productId);
  await syncInvoiceTotal(activityId);
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  Errors,
  getByActivity,
  addOne,
  updateOne,
  delete: deleteOne,
} as const;
