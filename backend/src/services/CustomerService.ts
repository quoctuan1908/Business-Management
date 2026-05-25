import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import { ICustomer } from '@src/models/Customer.model';
import ActivityRepo from '@src/repos/ActivityRepo';
import CustomerRepo from '@src/repos/CustomerRepo';
import LocationRepo from '@src/repos/LocationRepo';

/******************************************************************************
                                Constants
******************************************************************************/

const Errors = {
  CUSTOMER_NOT_FOUND: 'Customer not found',
  LOCATION_NOT_FOUND: 'Location not found',
  CUSTOMER_HAS_ACTIVITIES: 'Cannot delete customer that has activities',
} as const;

/******************************************************************************
                                Functions
******************************************************************************/

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
