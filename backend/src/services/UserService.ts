import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import { Errors } from '@src/models/common/types';
import User,{ IUser, IUserCreate, IUserPublic } from '@src/models/User.model';
import UserRepo from '@src/repos/UserRepo';


/******************************************************************************
                                   Functions
******************************************************************************/

/**
 * Get all users.
 */
function getAll(): Promise<IUserPublic[]> {
  return UserRepo.getAll();
}

/**
 * Search users by query string.
 */
function search(query: string): Promise<IUserPublic[]> {
  return UserRepo.search(query);
}

/**
 * Add one user.
 */
function addOne(user: IUserCreate): Promise<IUserPublic> {
  return UserRepo.add(user);
}

/**
 * Update one user.
 */
async function updateOne(user: IUser): Promise<IUserPublic> {
  const persists = await UserRepo.persists(user.id);
  if (!persists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  const updated = await UserRepo.update(user);
  return updated;
}

async function deleteOne(id: number): Promise<void> {
  const exists = await UserRepo.persists(id);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return UserRepo.delete(id);
}

/******************************************************************************
                             Employee Statistics Services
******************************************************************************/

/**
 * Get overview of employee performance metrics, KPIs, and revenue sales.
 */
async function getEmployeeOverviewStats(userId: number) {
  const exists = await UserRepo.persists(userId);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return UserRepo.getEmployeeOverviewStats(userId);
}

/**
 * Get detailed monthly productivity and target metrics for an employee.
 */
async function getEmployeeMonthlyStats(userId: number, month?: number, year?: number) {
  const exists = await UserRepo.persists(userId);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return UserRepo.getEmployeeMonthlyStats(userId, month, year);
}

/**
 * Get employee sales revenue and customer distribution broken down by territory (Location).
 */
async function getEmployeeLocationStats(userId: number, month: string, year: string, province?: string) {
  const exists = await UserRepo.persists(userId);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return UserRepo.getEmployeeLocationStats(userId, month, year, province);
}

async function getEmployeeTopProducts(userId: number) {
  const exists = await UserRepo.persists(userId);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return UserRepo.getEmployeeTopProducts(userId);
}

async function getEmployeeStatusBreakdown(userId: number, month: string, year: string, province?: string) {
  const exists = await UserRepo.persists(userId);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return UserRepo.getEmployeeStatusBreakdown(userId, month, year, province);
}

async function getEmployeeRecentSalesTimeline(userId: number, month: string, year: string, province?: string) {
  const exists = await UserRepo.persists(userId);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return UserRepo.getEmployeeRecentSalesTimeline(userId, month, year, province);
}

async function getSellerOverviewStats(sellerId: number, month: string, year: string, province?: string) {
  const exists = await UserRepo.persists(sellerId);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return UserRepo.getSellerOverviewStats(sellerId, month, year, province);
}

async function getSellerMonthlyStats(sellerId: number, month?: number, year?: number) {
  const exists = await UserRepo.persists(sellerId);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return UserRepo.getSellerMonthlyStats(sellerId, month, year);
}

async function getEmployeeTopDebtors(userId: number, province?: string) {
  const exists = await UserRepo.persists(userId);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return UserRepo.getEmployeeTopDebtors(userId, province);
}

/**
 * [SHIPPER] Get overall delivery trip stats and total physical COD cash collected.
 */
async function getShipperOverviewStats(shipperId: number) {
  const exists = await UserRepo.persists(shipperId);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return UserRepo.getShipperOverviewStats(shipperId);
}

/**
 * [SHIPPER] Get monthly tracking data for successful handovers and aggregated cash returns.
 */
async function getShipperMonthlyStats(shipperId: number, month?: number, year?: number) {
  const exists = await UserRepo.persists(shipperId);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return UserRepo.getShipperMonthlyStats(shipperId, month, year);
}

/******************************************************************************
                                   Export default
******************************************************************************/

export default {
  getAll,
  search,
  addOne,
  updateOne,
  delete: deleteOne,
  getEmployeeOverviewStats,
  getEmployeeMonthlyStats,
  getEmployeeLocationStats,
  getEmployeeTopProducts,
  getEmployeeStatusBreakdown,
  getEmployeeRecentSalesTimeline,
  getSellerOverviewStats,
  getSellerMonthlyStats,
  getEmployeeTopDebtors,
  getShipperOverviewStats,
  getShipperMonthlyStats,
} as const;