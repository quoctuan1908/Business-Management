import { Roles } from '@src/common/constants/roles';
import { ToolContext } from '@src/models/common/types';
import UserService from '@src/services/UserService';
import { assertOwnUserStatsAccess, assertSellerStatsAccess, parseSellerScope } from '@src/services/stats-access';


export const toolRegistry: Record<string, (args: any, ctx: ToolContext) => Promise<unknown>> = {

  getUserProfile: async (_args, ctx) => {
    return await UserService.getOne(ctx.sessionUser.username);
  },

  getAllUsers: async (_args, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) throw new Error('Chỉ admin mới xem được danh sách toàn bộ user');
    return await UserService.getAll();
  },

  getAllUnactivatedUsers: async (_args, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) throw new Error('Chỉ admin mới xem được danh sách user chưa kích hoạt');
    return await UserService.getAllUnactivated();
  },

  searchUsers: async ({ query }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) throw new Error('Chỉ admin mới được tìm kiếm user');
    return await UserService.search(query);
  },

  // --- Thống kê nhân viên: route gốc KHÔNG check quyền, giữ nguyên đúng như vậy ---
  getOverviewStats: async ({ userId }, _ctx) => {
    return await UserService.getEmployeeOverviewStats(userId);
  },

  getMonthlyStats: async ({ userId, month, year }, _ctx) => {
    return await UserService.getEmployeeMonthlyStats(userId, month, year);
  },

  getTopProducts: async ({ userId }, _ctx) => {
    return await UserService.getEmployeeTopProducts(userId);
  },

  // --- Các hàm dùng "seller scope": route gốc check assertSellerStatsAccess ---
  getLocationStats: async ({ userId, month, year, province, ward, date }, ctx) => {
    const scope = parseSellerScope(userId); // userId ở đây là string, giống resolveSellerScope
    assertSellerStatsAccess(ctx.sessionUser, scope);
    return await UserService.getEmployeeLocationStats(scope, month ?? 'all', year ?? 'all', province, ward, date);
  },

  getStatusBreakdown: async ({ userId, month, year, province, ward, date }, ctx) => {
    const scope = parseSellerScope(userId);
    assertSellerStatsAccess(ctx.sessionUser, scope);
    return await UserService.getEmployeeStatusBreakdown(scope, month ?? 'all', year ?? 'all', province, ward, date);
  },

  getRecentSalesTimeline: async ({ userId, month, year, province, ward, date }, ctx) => {
    const scope = parseSellerScope(userId);
    assertSellerStatsAccess(ctx.sessionUser, scope);
    return await UserService.getEmployeeRecentSalesTimeline(scope, month ?? 'all', year ?? 'all', province, ward, date);
  },

  getSellerOverviewStats: async ({ userId, month, year, province, ward, date }, ctx) => {
    const scope = parseSellerScope(userId);
    assertSellerStatsAccess(ctx.sessionUser, scope);
    return await UserService.getSellerOverviewStats(scope, month ?? 'all', year ?? 'all', province, ward, date);
  },

  // --- route gốc KHÔNG check quyền (khác với getShipperMonthlyStats) ---
  getSellerMonthlyStats: async ({ userId, month, year }, _ctx) => {
    return await UserService.getSellerMonthlyStats(userId, month, year);
  },

  getEmployeeTopDebtors: async ({ userId, province, ward }, ctx) => {
    const scope = parseSellerScope(userId);
    assertSellerStatsAccess(ctx.sessionUser, scope);
    return await UserService.getEmployeeTopDebtors(scope, province, ward);
  },

  // --- Shipper: route gốc CÓ check assertOwnUserStatsAccess ---
  getShipperOverviewStats: async ({ userId, month, year, date }, ctx) => {
    assertOwnUserStatsAccess(ctx.sessionUser, userId);
    return await UserService.getShipperOverviewStats(userId, month, year, date);
  },

  getShipperMonthlyStats: async ({ userId, month, year, date }, ctx) => {
    assertOwnUserStatsAccess(ctx.sessionUser, userId);
    return await UserService.getShipperMonthlyStats(userId, month, year, date);
  },

  // --- route gốc comment out check admin, giữ nguyên hiện trạng ---
  getMapStatus: async ({ date }, _ctx) => {
    return await UserService.getMapStatusByActivities(date);
  },
};