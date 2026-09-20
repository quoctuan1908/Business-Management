import { Roles } from '@src/common/constants/roles';
import { ToolContext } from '@src/models/common/types';
import ActivityDetailService from '@src/services/ActivityDetailService';
import ActivityService from '@src/services/ActivityService';
import BankAccountService from '@src/services/BankAccountService';
import CustomerService from '@src/services/CustomerService';
import ImportDetailService from '@src/services/ImportDetailService';
import ImportService from '@src/services/ImportService';
import InvoiceService from '@src/services/InvoiceService';
import LocationService from '@src/services/LocationService';
import ProductService from '@src/services/ProductService';
import SalaryService from '@src/services/SalaryService';
import SupplierService from '@src/services/SupplierService';
import UserService from '@src/services/UserService';
import { resolveEmployeeDataScope } from '@src/services/employee-scope';
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

  getOverviewStats: async ({ userId }, ctx) => {
    const scope = parseSellerScope(userId);
    assertSellerStatsAccess(ctx.sessionUser, scope);
    return await UserService.getEmployeeOverviewStats(userId);
  },

  getMonthlyStats: async ({ userId, month, year }, ctx) => {
    const scope = parseSellerScope(userId);
    assertSellerStatsAccess(ctx.sessionUser, scope);
    return await UserService.getEmployeeMonthlyStats(userId, month, year);
  },

  getTopProducts: async ({ userId }, ctx) => {
    const scope = parseSellerScope(userId);
    assertSellerStatsAccess(ctx.sessionUser, scope);
    return await UserService.getEmployeeTopProducts(userId);
  },

  getSellerMonthlyStats: async ({ userId, month, year }, ctx) => {
    const scope = parseSellerScope(userId);
    assertSellerStatsAccess(ctx.sessionUser, scope);
    return await UserService.getSellerMonthlyStats(userId, month, year);
  },

  getLocationStats: async ({ userId, month, year, province, ward, date }, ctx) => {
    const scope = parseSellerScope(userId); 
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

  getEmployeeTopDebtors: async ({ userId, province, ward }, ctx) => {
    const scope = parseSellerScope(userId);
    assertSellerStatsAccess(ctx.sessionUser, scope);
    return await UserService.getEmployeeTopDebtors(scope, province, ward);
  },

  getShipperOverviewStats: async ({ userId, month, year, date }, ctx) => {
    assertOwnUserStatsAccess(ctx.sessionUser, userId);
    return await UserService.getShipperOverviewStats(userId, month, year, date);
  },

  getShipperMonthlyStats: async ({ userId, month, year, date }, ctx) => {
    assertOwnUserStatsAccess(ctx.sessionUser, userId);
    return await UserService.getShipperMonthlyStats(userId, month, year, date);
  },

  getMapStatus: async ({ date }, _ctx) => {
    return await UserService.getMapStatusByActivities(date);
  },

  // ====================== Salary ============================

  getAllSalaries: async (_args, ctx) => {
  if (ctx.sessionUser.role !== Roles.ADMIN) {
    throw new Error('Chỉ admin mới xem được bảng lương');
  }
  return await SalaryService.getAll();
  },

  getSalaryByUserId: async ({ userId }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN && ctx.sessionUser.userId !== userId) {
      throw new Error('Không có quyền xem lương của người khác');
    }
    return await SalaryService.getByUserId(userId);
  },

  getSalaryOne: async ({ id }, ctx) => {
  const salary = await SalaryService.getOne(id);
  if (ctx.sessionUser.role !== Roles.ADMIN && ctx.sessionUser.userId !== salary.userId) {
    throw new Error('Không có quyền xem bản ghi lương này');
  }
  return salary;
  },

  addSalary: async (args, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được tạo bản ghi lương');
    }
    return await SalaryService.addOne(args);
  },

  updateSalary: async (args, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được cập nhật bản ghi lương');
    }
    return await SalaryService.updateOne(args);
  },

  deleteSalary: async ({ id }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được xóa bản ghi lương');
    }
    return await SalaryService.delete(id);
  },

  calculatePayroll: async ({ month, year, commissionRate }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được chạy tính lương tự động');
    }
    return await SalaryService.calculateAutomatedPayroll(month, year, commissionRate);
  },

  getAllSuppliers: async (_args, ctx) => {
    return await SupplierService.getAll();
  },

  getSupplierOne: async ({ id }, ctx) => {
    return await SupplierService.getOne(id);
  },

  addSupplier: async (args, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được thêm nhà cung cấp');
    }
    return await SupplierService.addOne(args);
  },

  updateSupplier: async (args, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được cập nhật nhà cung cấp');
    }
    return await SupplierService.updateOne(args);
  },

  deleteSupplier: async ({ id }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được xóa nhà cung cấp');
    }
    return await SupplierService.delete(id);
  },

  getAllProducts: async (_args, ctx) => {
    return await ProductService.getAll();
  },

  getProductOne: async ({ id }, ctx) => {
    return await ProductService.getOne(id);
  },

  addProduct: async (args, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được thêm sản phẩm');
    }
    return await ProductService.addOne(args);
  },

  updateProduct: async (args, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được cập nhật sản phẩm');
    }
    return await ProductService.updateOne(args);
  },

  deleteProduct: async ({ id }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được xóa sản phẩm');
    }
    return await ProductService.delete(id);
  },


  getAllLocations: async (_args, ctx) => {
    return await LocationService.getAll();
  },

  getLocationOne: async ({ id }, ctx) => {
    return await LocationService.getOne(id);
  },

  addLocation: async (args, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được thêm địa bàn');
    }
    return await LocationService.addOne(args);
  },

  updateLocation: async (args, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được cập nhật địa bàn');
    }
    return await LocationService.updateOne(args);
  },

  deleteLocation: async ({ id }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được xóa địa bàn');
    }
    return await LocationService.delete(id);
  },

  syncCanThoLocations: async (_args, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được đồng bộ địa bàn');
    }
    return await LocationService.syncCanThoFromApi();
  },  

  getAllInvoices: async (_args, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới xem được danh sách toàn bộ hóa đơn');
    }
    return await InvoiceService.getAll();
  },

  addInvoice: async (args, ctx) => {
    return await InvoiceService.addOne(args);
  },

  updateInvoice: async (args, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được cập nhật hóa đơn');
    }
    return await InvoiceService.updateOne(args);
  },

  deleteInvoice: async ({ id }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được xóa hóa đơn');
    }
    return await InvoiceService.delete(id);
  },  


  getAllImports: async (_args, ctx) => {
    return await ImportService.getAll();
  },

  getImportOne: async ({ id }, ctx) => {
    return await ImportService.getOne(id);
  },

  addImport: async (args, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được tạo phiếu nhập hàng');
    }
    return await ImportService.addOne(args);
  },

  updateImport: async ({ id, ...rest }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được cập nhật phiếu nhập hàng');
    }
    return await ImportService.updateOne(id, rest);
  },

  deleteImport: async ({ id }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được xóa phiếu nhập hàng');
    }
    return await ImportService.delete(id);
  },

  deleteImportWithStockRollback: async ({ id }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được xóa phiếu nhập kèm hoàn tồn kho');
    }
    return await ImportService.deleteWithStockRollback(id);
  },

  getImportDetailsByImport: async ({ importId }, ctx) => {
    return await ImportDetailService.getByImport(importId);
  },

  addImportDetail: async (args, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được thêm chi tiết phiếu nhập');
    }
    return await ImportDetailService.addOne(args);
  },

  updateImportDetail: async (args, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được cập nhật chi tiết phiếu nhập');
    }
    return await ImportDetailService.updateOne(args);
  },

  deleteImportDetail: async ({ importId, productId }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được xóa chi tiết phiếu nhập');
    }
    return await ImportDetailService.delete(importId, productId);
  },  


  getAllCustomers: async (_args, ctx) => {
    const scope = await resolveEmployeeDataScope(ctx.sessionUser);
    return await CustomerService.getAll(scope);
  },

  getPendingApprovalCustomers: async (_args, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới xem được danh sách khách hàng chờ duyệt');
    }
    return await CustomerService.getPendingApproval();
  },

  getCustomerOne: async ({ id }, ctx) => {
    const scope = await resolveEmployeeDataScope(ctx.sessionUser);
    return await CustomerService.getOne(id, scope);
  },

  getCustomerAccount: async ({ customerId }, ctx) => {
    const scope = await resolveEmployeeDataScope(ctx.sessionUser);
    return await CustomerService.getAccount(customerId, scope);
  },

  addCustomer: async (args, ctx) => {
    const scope = await resolveEmployeeDataScope(ctx.sessionUser);
    return await CustomerService.addOne(args, scope);
  },

  updateCustomer: async (args, ctx) => {
    const scope = await resolveEmployeeDataScope(ctx.sessionUser);
    return await CustomerService.updateOne(args, scope);
  },

  approveCustomer: async ({ id }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được duyệt khách hàng');
    }
    return await CustomerService.approveCustomer(id);
  },

  deleteCustomer: async ({ id }, ctx) => {
    const scope = await resolveEmployeeDataScope(ctx.sessionUser);
    return await CustomerService.delete(id, scope);
  },

  receiveCustomerPayment: async ({ customerId, amount, method }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được ghi nhận thanh toán khách hàng');
    }
    const scope = await resolveEmployeeDataScope(ctx.sessionUser);
    return await CustomerService.receivePayment(customerId, { amount, method }, scope);
  },


  getAllBankAccounts: async (_args, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới xem được danh sách toàn bộ tài khoản ngân hàng');
    }
    return await BankAccountService.getAll();
  },

  getBankAccountByUserId: async ({ userId }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN && ctx.sessionUser.userId !== userId) {
      throw new Error('Không có quyền xem tài khoản ngân hàng của người khác');
    }
    return await BankAccountService.getByUserId(userId);
  },

  addBankAccount: async ({ userId, bankName, accountNumber }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN && ctx.sessionUser.userId !== userId) {
      throw new Error('Không có quyền thêm tài khoản ngân hàng cho người khác');
    }
    return await BankAccountService.addOne({ userId, bankName, accountNumber });
  },

  upsertBankAccount: async ({ userId, bankName, accountNumber }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN && ctx.sessionUser.userId !== userId) {
      throw new Error('Không có quyền sửa tài khoản ngân hàng của người khác');
    }
    return await BankAccountService.upsertOne(userId, { bankName, accountNumber });
  },

  deleteBankAccount: async ({ userId }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được xóa tài khoản ngân hàng');
    }
    return await BankAccountService.deleteByUserId(userId);
  },  


  getAllActivities: async (_args, ctx) => {
    const scope = await resolveEmployeeDataScope(ctx.sessionUser);
    return await ActivityService.getAll(scope);
  },

  getActivityOne: async ({ id }, ctx) => {
    const scope = await resolveEmployeeDataScope(ctx.sessionUser);
    return await ActivityService.getOne(id, scope);
  },

  addActivity: async (args, ctx) => {
    const scope = await resolveEmployeeDataScope(ctx.sessionUser);
    return await ActivityService.addOne(args, scope);
  },

  updateActivity: async ({ id, ...rest }, ctx) => {
    const scope = await resolveEmployeeDataScope(ctx.sessionUser);
    return await ActivityService.updateOne(id, rest, scope);
  },

  confirmActivityOrder: async ({ activityId }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được xác nhận đơn hàng');
    }
    const scope = await resolveEmployeeDataScope(ctx.sessionUser);
    return await ActivityService.confirmOrder(activityId, scope);
  },

  advanceActivityStatus: async ({ activityId, applyCustomerBalance }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được chuyển trạng thái đơn hàng');
    }
    const scope = await resolveEmployeeDataScope(ctx.sessionUser);
    return await ActivityService.advanceStatus(activityId, scope, { applyCustomerBalance });
  },

  deleteActivity: async ({ id }, ctx) => {
    if (ctx.sessionUser.role !== Roles.ADMIN) {
      throw new Error('Chỉ admin mới được xóa đơn hàng');
    }
    const scope = await resolveEmployeeDataScope(ctx.sessionUser);
    return await ActivityService.delete(id, scope);
  },  


  getActivityDetailsByActivity: async ({ activityId }, ctx) => {
    const scope = await resolveEmployeeDataScope(ctx.sessionUser);
    return await ActivityDetailService.getByActivity(activityId, scope);
  },

  addActivityDetail: async (args, ctx) => {
    const scope = await resolveEmployeeDataScope(ctx.sessionUser);
    return await ActivityDetailService.addOne(args, scope);
  },

  updateActivityDetail: async (args, ctx) => {
    const scope = await resolveEmployeeDataScope(ctx.sessionUser);
    return await ActivityDetailService.updateOne(args, scope);
  },

  deleteActivityDetail: async ({ activityId, productId }, ctx) => {
    const scope = await resolveEmployeeDataScope(ctx.sessionUser);
    return await ActivityDetailService.delete(activityId, productId, scope);
  },


  
};