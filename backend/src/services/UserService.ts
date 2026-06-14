import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { AuthErrors as Errors } from '@src/common/constants/service-errors';
import { RouteError } from '@src/common/utils/route-errors';
import User,{ IUser, IUserCreate, IUserPublic } from '@src/models/User.model';
import ActivityRepo from '@src/repos/ActivityRepo';
import UserRepo, { type SellerScope } from '@src/repos/UserRepo';
import {
  assertOwnUserStatsAccess,
  assertSellerStatsAccess,
  parseSellerScope,
} from '@src/services/stats-access';
/******************************************************************************
                                   Functions
******************************************************************************/

/**
 * Get all users.
 */
async function getOne(username: string): Promise<IUser | null> {
  return UserRepo.getOne(username);
}

/**
 * Get all users.
 */
function getAll(): Promise<IUserPublic[]> {
  return UserRepo.getAll();
}

/**
 * Get all unactivated users.
 */
function getAllUnactivated(): Promise<IUserPublic[]> {
  return UserRepo.getAllUnactivated();
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
async function getEmployeeLocationStats(scope: SellerScope, month: string, year: string, province?: string, ward?: string) {
  return UserRepo.getEmployeeLocationStats(scope, month, year, province, ward);
}

async function getEmployeeTopProducts(userId: number) {
  const exists = await UserRepo.persists(userId);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return UserRepo.getEmployeeTopProducts(userId);
}

async function getEmployeeStatusBreakdown(scope: SellerScope, month: string, year: string, province?: string, ward?: string) {
  return UserRepo.getEmployeeStatusBreakdown(scope, month, year, province, ward);
}

async function getEmployeeRecentSalesTimeline(scope: SellerScope, month: string, year: string, province?: string, ward?: string) {
  return UserRepo.getEmployeeRecentSalesTimeline(scope, month, year, province, ward);
}

async function getSellerOverviewStats(scope: SellerScope, month: string, year: string, province?: string, ward?: string) {
  return UserRepo.getSellerOverviewStats(scope, month, year, province, ward);
}

async function getSellerMonthlyStats(sellerId: number, month?: number, year?: number) {
  const exists = await UserRepo.persists(sellerId);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return UserRepo.getSellerMonthlyStats(sellerId, month, year);
}

async function getEmployeeTopDebtors(scope: SellerScope, province?: string, ward?: string) {
  return UserRepo.getEmployeeTopDebtors(scope, province, ward);
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

/**
 * [MAP] Validate input parameters and coordinate business logic for fetching territory scheduling statistics.
 */
async function getMapStatusByActivities(dateString: string) {
  if (!dateString || isNaN(Date.parse(dateString))) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, 'A valid date string (YYYY-MM-DD) is required.');
  }
  return UserRepo.getMapStatusByActivities(dateString);
}

/******************************************************************************
                                   Export default
******************************************************************************/

export default {
  Errors,
  getOne,
  getAll,
  getAllUnactivated,
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
  getMapStatusByActivities
} as const;