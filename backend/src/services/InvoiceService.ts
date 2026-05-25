import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import { IInvoice } from '@src/models/Invoice.model';
import ActivityRepo from '@src/repos/ActivityRepo';
import InvoiceRepo from '@src/repos/InvoiceRepo';

/******************************************************************************
                                Constants
******************************************************************************/

const Errors = {
  INVOICE_NOT_FOUND: 'Invoice not found',
  INVOICE_LINKED_TO_ACTIVITY: 'Cannot delete invoice linked to an activity',
} as const;

/******************************************************************************
                                Functions
******************************************************************************/

async function getAll() {
  return InvoiceRepo.getAll();
}

async function getOne(id: number) {
  const invoice = await InvoiceRepo.getOne(id);
  if (!invoice) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.INVOICE_NOT_FOUND);
  }
  return invoice;
}

async function addOne(invoice: IInvoice) {
  return InvoiceRepo.add(invoice);
}

async function updateOne(invoice: IInvoice) {
  const exists = await InvoiceRepo.persists(invoice.id);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.INVOICE_NOT_FOUND);
  }
  return InvoiceRepo.update(invoice);
}

async function deleteOne(id: number): Promise<void> {
  const exists = await InvoiceRepo.persists(id);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.INVOICE_NOT_FOUND);
  }

  const linked = await InvoiceRepo.isLinkedToActivity(id);
  if (linked) {
    throw new RouteError(
      HttpStatusCodes.BAD_REQUEST,
      Errors.INVOICE_LINKED_TO_ACTIVITY,
    );
  }

  return InvoiceRepo.delete(id);
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
} as const;
