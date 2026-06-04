import { isNonEmptyString, isNumber, isString } from 'jet-validators';
import { transform } from 'jet-validators/utils';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import User from '@src/models/User.model';
import UserService from '@src/services/UserService';

import { Req, Res } from './common/express-types';
import parseReq from './common/parseReq';
import UserModel from '@src/models/User.model';
import { RouteError } from '@src/common/utils/route-errors';
import { ISessionUser } from '@src/models/common/types';
import JwtUtils from '@src/common/utils/session-authenticate';
import EnvVars from '@src/common/constants/env';

/******************************************************************************
                                   Constants
******************************************************************************/

const reqValidators = {
  add: parseReq({ user: User.isComplete }),
  update: parseReq({ user: User.isComplete }),
  getOne: parseReq({ username: transform(String, isString) }),
  delete: parseReq({ id: transform(Number, isNumber) }),
  search: parseReq({ query: isString }),
  authenticate: parseReq({ 
    username: isNonEmptyString, 
    password: isNonEmptyString 
  }),
  getStats: parseReq({ userId: transform(Number, isNumber) }),
  // Validator for parsing optional query strings along with the userId parameter
  getMonthlyStats: parseReq({
    userId: transform(Number, isNumber),
    month: transform((val) => (val !== undefined ? Number(val) : undefined), (val) => val === undefined || isNumber(val)),
    year: transform((val) => (val !== undefined ? Number(val) : undefined), (val) => val === undefined || isNumber(val)),
  }),
} as const;

/******************************************************************************
                                   Functions
******************************************************************************/


/**
 * Get one user by id.
 * @route GET /api/users/profile
 */
async function getOne(req: Req, res: Res) {
  const token = req.cookies?.accessToken;

  if (!token) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, 'No session found. Please login.');
  }

  try {
    const sessionUser = await JwtUtils.verifyToken(token, EnvVars.JwtTokenKey) as ISessionUser;
    console.log(sessionUser)
    if (!sessionUser || !sessionUser.username) {
      throw new RouteError(HttpStatusCodes.UNAUTHORIZED, 'Invalid session token');
    }
    const userProfile = await UserService.getOne(sessionUser.username);

    if (!userProfile) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, 'User profile not found');
    }
    return res.status(HttpStatusCodes.OK).json({ user: userProfile });

  } catch (error) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, 'Session expired or invalid');
  }
}

/**
 * Get all users.
 * @route GET /api/users/all
 */
async function getAll(_: Req, res: Res) {
  const users = await UserService.getAll();
  res.status(HttpStatusCodes.OK).json({ users });
}

/**
 * Search users by full_name, username, department, email, or phone_number.
 * @route GET /api/users/search?query=...
 */
async function search(req: Req, res: Res) {
  const { query } = reqValidators.search(req.query);
  const users = await UserService.search(query);
  res.status(HttpStatusCodes.OK).json({ users });
}

/**
 * Add one user.
 * @route POST /api/users/add
 */
async function add(req: Req, res: Res) {
  const validatedUser = UserModel.newCreate(req.body.user);
  const created = await UserService.addOne(validatedUser);
  res.status(HttpStatusCodes.CREATED).json({ user: created });
}

/**
 * Update one user.
 * @route PUT /api/users/update
 */
async function update(req: Req, res: Res) {
  const { user } = reqValidators.update(req.body);
  const updated = await UserService.updateOne(user);
  res.status(HttpStatusCodes.OK).json({ user: updated });
}

/**
 * Delete one user (Soft delete).
 * @route DELETE /api/users/delete/:id
 */
async function delete_(req: Req, res: Res) {
  const { id } = reqValidators.delete(req.params);
  await UserService.delete(id);
  res.status(HttpStatusCodes.OK).end();
}

/******************************************************************************
                             Employee Statistics Routes
******************************************************************************/

/**
 * Get overview of employee performance metrics and KPIs.
 * @route GET /api/users/stats/overview/:userId
 */
async function getOverviewStats(req: Req, res: Res) {
  const { userId } = reqValidators.getStats(req.params);
  const stats = await UserService.getEmployeeOverviewStats(userId);
  res.status(HttpStatusCodes.OK).json(stats);
}

/**
 * Get detailed monthly productivity and target metrics for an employee.
 * @route GET /api/users/stats/monthly/:userId?month=...&year=...
 */
async function getMonthlyStats(req: Req, res: Res) {
  const { userId, month, year } = reqValidators.getMonthlyStats({ ...req.params, ...req.query });
  const stats = await UserService.getEmployeeMonthlyStats(userId, month, year);
  res.status(HttpStatusCodes.OK).json(stats);
}

/**
 * Get employee sales revenue broken down by territory (Location).
 * @route GET /api/users/stats/locations/:userId
 */
async function getLocationStats(req: Req, res: Res) {
  const { userId } = reqValidators.getStats(req.params);
  const { month, year, province } = req.query as Record<string, string>;
  const stats = await UserService.getEmployeeLocationStats(userId, month, year, province);
  res.status(HttpStatusCodes.OK).json({ locations: stats });
}

/**
 * Get the top 5 best-selling products for a specific employee.
 * @route GET /api/users/stats/top-products/:userId
 */
async function getTopProducts(req: Req, res: Res) {
  const { userId } = reqValidators.getStats(req.params);
  const stats = await UserService.getEmployeeTopProducts(userId);
  res.status(HttpStatusCodes.OK).json({ products: stats });
}

/**
 * Get the current sales funnel status distribution breakdown for an employee.
 * @route GET /api/users/stats/status-breakdown/:userId
 */
async function getStatusBreakdown(req: Req, res: Res) {
  const { userId } = reqValidators.getStats(req.params);
  const { month, year, province } = req.query as Record<string, string>;
  const stats = await UserService.getEmployeeStatusBreakdown(userId, month, year, province);
  res.status(HttpStatusCodes.OK).json({ breakdown: stats });
}

/**
 * Get the chronological history timeline of recent successful sales activities.
 * @route GET /api/users/stats/recent-sales/:userId
 */
async function getRecentSalesTimeline(req: Req, res: Res) {
  const { userId } = reqValidators.getStats(req.params);
  const { month, year, province } = req.query as Record<string, string>;
  const stats = await UserService.getEmployeeRecentSalesTimeline(userId, month, year, province);
  res.status(HttpStatusCodes.OK).json({ timeline: stats });
}

/******************************************************************************
                             Seller Role Statistics Routes
******************************************************************************/

/**
 * [SELLER] Get overview metrics of signed contracts and managed customer outstanding debts.
 * @route GET /api/users/stats/seller/overview/:userId
 */
async function getSellerOverviewStats(req: Req, res: Res) {
  const { userId } = reqValidators.getStats(req.params);
  const { month, year, province } = req.query as Record<string, string>;
  const stats = await UserService.getSellerOverviewStats(userId, month, year, province);
  res.status(HttpStatusCodes.OK).json(stats);
}

/**
 * [SELLER] Get monthly contract volume and pending revenue growth analytics.
 * @route GET /api/users/stats/seller/monthly/:userId
 */
async function getSellerMonthlyStats(req: Req, res: Res) {
  const { userId } = reqValidators.getStats(req.params);
  const month = req.query.month ? parseInt(req.query.month as string) : undefined;
  const year = req.query.year ? parseInt(req.query.year as string) : undefined;
  const stats = await UserService.getSellerMonthlyStats(userId, month, year);
  res.status(HttpStatusCodes.OK).json(stats);
}

/**
 * [SELLER] Get top 5 clients holding the highest outstanding financial accounts.
 * @route GET /api/users/stats/seller/top-debtors/:userId
 */
async function getEmployeeTopDebtors(req: Req, res: Res) {
  const { userId } = reqValidators.getStats(req.params);
  const { province } = req.query as Record<string, string>;
  const stats = await UserService.getEmployeeTopDebtors(userId, province);
  res.status(HttpStatusCodes.OK).json({ debtors: stats });
}


/******************************************************************************
                             Shipper Role Statistics Routes
******************************************************************************/

/**
 * [SHIPPER] Get overall delivery trip stats and total physical COD cash collected.
 * @route GET /api/users/stats/shipper/overview/:userId
 */
async function getShipperOverviewStats(req: Req, res: Res) {
  const { userId } = reqValidators.getStats(req.params);
  const stats = await UserService.getShipperOverviewStats(userId);
  res.status(HttpStatusCodes.OK).json(stats);
}

/**
 * [SHIPPER] Get monthly tracking data for successful handovers and aggregated cash returns.
 * @route GET /api/users/stats/shipper/monthly/:userId?month=...&year=...
 */
async function getShipperMonthlyStats(req: Req, res: Res) {
  const { userId, month, year } = reqValidators.getMonthlyStats({ ...req.params, ...req.query });
  const stats = await UserService.getShipperMonthlyStats(userId, month, year);
  res.status(HttpStatusCodes.OK).json(stats);
}

/******************************************************************************
                                   Export default
******************************************************************************/

export default {
  getOne,
  getAll,
  search,
  add,
  update,
  delete: delete_,

  getOverviewStats,
  getMonthlyStats,
  getLocationStats,
  getTopProducts,
  getStatusBreakdown,
  getRecentSalesTimeline,
  getSellerOverviewStats,
  getSellerMonthlyStats,
  getEmployeeTopDebtors,
  getShipperOverviewStats,
  getShipperMonthlyStats,
} as const;