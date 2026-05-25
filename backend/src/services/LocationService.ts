import { CAN_THO_PROVINCE_NAME } from '@src/common/constants/provinces-api';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import { ILocation } from '@src/models/Location.model';
import LocationRepo from '@src/repos/LocationRepo';

/******************************************************************************
                                Constants
******************************************************************************/

const Errors = {
  LOCATION_NOT_FOUND: 'Location not found',
  LOCATION_IN_USE: 'Cannot delete location that has customers',
  ONLY_CAN_THO: 'Only locations in Thành phố Cần Thơ are allowed',
} as const;

/******************************************************************************
                                Functions
******************************************************************************/

function assertCanThoProvince(province: string) {
  if (province !== CAN_THO_PROVINCE_NAME) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.ONLY_CAN_THO);
  }
}

async function getAll() {
  return LocationRepo.getAll();
}

async function getOne(id: number) {
  const location = await LocationRepo.getOne(id);
  if (!location) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.LOCATION_NOT_FOUND);
  }
  return location;
}

async function addOne(location: ILocation) {
  assertCanThoProvince(location.province);
  return LocationRepo.add(location);
}

async function updateOne(location: ILocation) {
  const exists = await LocationRepo.persists(location.id);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.LOCATION_NOT_FOUND);
  }
  assertCanThoProvince(location.province);
  return LocationRepo.update(location);
}

async function deleteOne(id: number): Promise<void> {
  const exists = await LocationRepo.persists(id);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.LOCATION_NOT_FOUND);
  }

  const customerCount = await LocationRepo.countCustomersByLocation(id);
  if (customerCount > 0) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.LOCATION_IN_USE);
  }

  return LocationRepo.delete(id);
}

async function syncCanThoFromApi() {
  return LocationRepo.syncCanThoFromApi();
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
  syncCanThoFromApi,
} as const;
