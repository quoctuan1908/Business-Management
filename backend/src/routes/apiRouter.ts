import { Router } from 'express';

import Paths from '@src/common/constants/Paths';
import { Roles } from '@src/common/constants/roles';

import ActivityDetailRoutes from './ActivityDetailRoutes';
import ActivityRoutes from './ActivityRoutes';
import PaymentRoutes from './PaymentRoutes';
import OrderStatusRoutes from './OrderStatusRoutes';
import CustomerRoutes from './CustomerRoutes';
import InvoiceRoutes from './InvoiceRoutes';
import LocationRoutes from './LocationRoutes';
import ProductRoutes from './ProductRoutes';
import UserRoutes from './UserRoutes';
import AuthRoutes from './AuthRoutes';
import authMiddleware from '@src/middlewares/authMiddleware';
import SalaryRoutes from './SalaryRoutes';
import SupplierRoutes from './SupplierRoutes';
import ImportRoutes from './ImportRoutes';
import ImportDetailRoutes from './ImportDetailRoutes';
import EmployeeLocationRoutes from './EmployeeLocationRoutes';
import rateLimiters from '@src/middlewares/rateLimitMiddleware';
import BankAccountRoutes from './BankAccountRoutes';
import ChatRoutes from './chatbot/ChatRoutes';
import BackupRoutes from './BackupRoutes';

/******************************************************************************
                                Setup
******************************************************************************/

const apiRouter = Router();

const auth = authMiddleware.auth;

const admin = authMiddleware.authorize(Roles.ADMIN);

/******************************************************************************
                                Users
******************************************************************************/

const userRouter = Router();
userRouter.get(Paths.Users.Profile, rateLimiters.default, auth, UserRoutes.getProfile);
userRouter.get(Paths.Users.Get, rateLimiters.default, adminOnly, UserRoutes.getAll);
userRouter.get(Paths.Users.GetUnactivated, rateLimiters.default, adminOnly, UserRoutes.getAllUnactivated);
userRouter.get(Paths.Users.Search, rateLimiters.default, adminOnly, UserRoutes.search);
userRouter.post(Paths.Users.Add, rateLimiters.auth, adminOnly, UserRoutes.add);
userRouter.put(Paths.Users.Update, rateLimiters.auth, adminOnly, UserRoutes.update);
userRouter.delete(Paths.Users.Delete, rateLimiters.auth, adminOnly, UserRoutes.delete);
userRouter.get(Paths.Users.GetOne, rateLimiters.default, adminOnly, UserRoutes.getOne);

userRouter.get(Paths.Users.StatsOverview, rateLimiters.default, auth, UserRoutes.getOverviewStats);
userRouter.get(Paths.Users.StatsMonthly, rateLimiters.default, auth, UserRoutes.getMonthlyStats);
userRouter.get(Paths.Users.StatsLocations, rateLimiters.default, auth, UserRoutes.getLocationStats);
userRouter.get(Paths.Users.StatsTopProducts, rateLimiters.default, auth, UserRoutes.getTopProducts);
userRouter.get(Paths.Users.StatsStatusBreakdown, rateLimiters.default, auth, UserRoutes.getStatusBreakdown);
userRouter.get(Paths.Users.StatsRecentSales, rateLimiters.default, auth, UserRoutes.getRecentSalesTimeline);
userRouter.get(Paths.Users.StatsSellerOverview, rateLimiters.default, auth, UserRoutes.getSellerOverviewStats);
userRouter.get(Paths.Users.StatsSellerRevenueSeries, rateLimiters.default, auth, UserRoutes.getSellerRevenueSeries);
userRouter.get(Paths.Users.StatsSellerMonthly, rateLimiters.default, auth, UserRoutes.getSellerMonthlyStats);
userRouter.get(Paths.Users.StatsSellerTopDebtors, rateLimiters.default, auth, UserRoutes.getEmployeeTopDebtors);
userRouter.get(Paths.Users.StatsShipperOverview, rateLimiters.default, auth, UserRoutes.getShipperOverviewStats);
userRouter.get(Paths.Users.StatsShipperMonthly, rateLimiters.default, auth, UserRoutes.getShipperMonthlyStats);
userRouter.get(Paths.Users.StatsMap, rateLimiters.default, auth, UserRoutes.getMapStatus);
apiRouter.use(Paths.Users._, userRouter);

/******************************************************************************
                                Salaries
******************************************************************************/

const salaryRouter = Router();
salaryRouter.use(auth, rateLimiters.default);
salaryRouter.get(Paths.Salaries.GetAll, admin, SalaryRoutes.getAll);
salaryRouter.get(Paths.Salaries.GetByUserId, SalaryRoutes.getByUserId);
salaryRouter.get(Paths.Salaries.GetOne, SalaryRoutes.getOne);
salaryRouter.post(Paths.Salaries.Add, admin, SalaryRoutes.add);
salaryRouter.put(Paths.Salaries.Update, admin, SalaryRoutes.update);
salaryRouter.delete(Paths.Salaries.Delete, admin, SalaryRoutes.delete);
salaryRouter.post(Paths.Salaries.Calculate, admin, SalaryRoutes.calculatePayroll);
apiRouter.use(Paths.Salaries._, salaryRouter);

/******************************************************************************
                                Suppliers
******************************************************************************/

const supplierRouter = Router();
supplierRouter.use(auth, rateLimiters.default);
supplierRouter.get(Paths.Suppliers.Get, SupplierRoutes.getAll);
supplierRouter.get(Paths.Suppliers.GetOne, SupplierRoutes.getOne);
supplierRouter.post(Paths.Suppliers.Add, admin, SupplierRoutes.add);
supplierRouter.put(Paths.Suppliers.Update, admin, SupplierRoutes.update);
supplierRouter.delete(Paths.Suppliers.Delete, admin, SupplierRoutes.delete);
apiRouter.use(Paths.Suppliers._, supplierRouter);

/******************************************************************************
                                Imports
******************************************************************************/

const importRouter = Router();
importRouter.use(rateLimiters.default);
importRouter.get(Paths.Imports.Get, auth, ImportRoutes.getAll);
importRouter.get(Paths.Imports.Export, auth, ImportRoutes.exportExcel);
importRouter.get(Paths.Imports.GetOne, auth, ImportRoutes.getOne);
importRouter.post(Paths.Imports.Add, ...adminOnly, ImportRoutes.add);
importRouter.put(Paths.Imports.Update, ...adminOnly, ImportRoutes.update);
importRouter.delete(Paths.Imports.Delete, ...adminOnly, ImportRoutes.delete);
importRouter.get(Paths.Imports.DetailsGet, auth, ImportDetailRoutes.getByImport);
importRouter.post(Paths.Imports.DetailsAdd, ...adminOnly, ImportDetailRoutes.add);
importRouter.put(Paths.Imports.DetailsUpdate, ...adminOnly, ImportDetailRoutes.update);
importRouter.delete(Paths.Imports.DetailsDelete, ...adminOnly, ImportDetailRoutes.delete);
apiRouter.use(Paths.Imports._, importRouter);

/******************************************************************************
                                Products
******************************************************************************/

const productRouter = Router();
productRouter.use(auth, rateLimiters.default);
productRouter.get(Paths.Products.Get, ProductRoutes.getAll);
productRouter.get(Paths.Products.GetOne, ProductRoutes.getOne);
productRouter.post(Paths.Products.Add, admin, ProductRoutes.add);
productRouter.put(Paths.Products.Update, admin, ProductRoutes.update);
productRouter.delete(Paths.Products.Delete, admin, ProductRoutes.delete);
apiRouter.use(Paths.Products._, productRouter);

/******************************************************************************
                                Locations
******************************************************************************/

const locationRouter = Router();
locationRouter.use(auth, rateLimiters.default);
locationRouter.get(Paths.Locations.Get, LocationRoutes.getAll);
locationRouter.get(Paths.Locations.GetOne, LocationRoutes.getOne);
locationRouter.post(Paths.Locations.Add, admin, LocationRoutes.add);
locationRouter.put(Paths.Locations.Update, admin, LocationRoutes.update);
locationRouter.delete(Paths.Locations.Delete, admin, LocationRoutes.delete);

locationRouter.post(Paths.Locations.SyncCanTho, rateLimiters.heavy, admin, LocationRoutes.syncCanTho);
apiRouter.use(Paths.Locations._, locationRouter);

/******************************************************************************
                            Employee Locations
******************************************************************************/

const employeeLocationRouter = Router();
employeeLocationRouter.use(auth, rateLimiters.default);
employeeLocationRouter.get(Paths.EmployeeLocations.GetAll, EmployeeLocationRoutes.getAll);
employeeLocationRouter.get(Paths.EmployeeLocations.GetAvailable, EmployeeLocationRoutes.getAvailable);
employeeLocationRouter.get(Paths.EmployeeLocations.GetByUser, EmployeeLocationRoutes.getByUserId);
employeeLocationRouter.put(Paths.EmployeeLocations.SetByUser, admin, EmployeeLocationRoutes.setByUserId);
employeeLocationRouter.post(Paths.EmployeeLocations.Assign, admin, EmployeeLocationRoutes.assign);
employeeLocationRouter.delete(Paths.EmployeeLocations.Unassign, admin, EmployeeLocationRoutes.unassign);
apiRouter.use(Paths.EmployeeLocations._, employeeLocationRouter);

/******************************************************************************
                                Customers
******************************************************************************/

const customerRouter = Router();
customerRouter.use(auth, rateLimiters.default);
customerRouter.get(Paths.Customers.Get, CustomerRoutes.getAll);
customerRouter.get(Paths.Customers.GetPendingApproval, admin, CustomerRoutes.getPendingApproval);
customerRouter.get(Paths.Customers.GetOne, CustomerRoutes.getOne);
customerRouter.get(Paths.Customers.Account, CustomerRoutes.getAccount);
customerRouter.post(Paths.Customers.ReceivePayment, admin, CustomerRoutes.receivePayment);
customerRouter.post(Paths.Customers.Add, CustomerRoutes.add);
customerRouter.put(Paths.Customers.Update, admin, CustomerRoutes.update);
customerRouter.delete(Paths.Customers.Delete, admin, CustomerRoutes.delete);
customerRouter.post(Paths.Customers.Approve, admin, CustomerRoutes.approve);
apiRouter.use(Paths.Customers._, customerRouter);

/******************************************************************************
                                Invoices
******************************************************************************/

const invoiceRouter = Router();
invoiceRouter.use(auth, rateLimiters.default);
invoiceRouter.get(Paths.Invoices.Get, InvoiceRoutes.getAll);
invoiceRouter.get(Paths.Invoices.GetOne, InvoiceRoutes.getOne);
invoiceRouter.post(Paths.Invoices.Add, InvoiceRoutes.add);
invoiceRouter.put(Paths.Invoices.Update, admin, InvoiceRoutes.update);
invoiceRouter.delete(Paths.Invoices.Delete, admin, InvoiceRoutes.delete);
apiRouter.use(Paths.Invoices._, invoiceRouter);

/******************************************************************************
                                Order Statuses
******************************************************************************/

const orderStatusRouter = Router();
orderStatusRouter.use(auth, rateLimiters.default);
orderStatusRouter.get(Paths.OrderStatuses.Get, OrderStatusRoutes.getAll);
apiRouter.use(Paths.OrderStatuses._, orderStatusRouter);

/******************************************************************************
                                Activities
******************************************************************************/

const activityRouter = Router();
activityRouter.use(auth, rateLimiters.default);
activityRouter.get(Paths.Activities.Get, ActivityRoutes.getAll);

activityRouter.get(Paths.Activities.Export, rateLimiters.heavy, ActivityRoutes.exportExcel);
activityRouter.get(Paths.Activities.GetOne, ActivityRoutes.getOne);
activityRouter.post(Paths.Activities.Add, ActivityRoutes.add);
activityRouter.put(Paths.Activities.Update, ActivityRoutes.update);
activityRouter.delete(Paths.Activities.Delete, admin, ActivityRoutes.delete);
activityRouter.post(Paths.Activities.Confirm, admin, ActivityRoutes.confirm);
activityRouter.post(Paths.Activities.AdvanceStatus, admin, ActivityRoutes.advanceStatus);

activityRouter.get(Paths.Activities.DetailsGet, ActivityDetailRoutes.getByActivity);
activityRouter.post(Paths.Activities.DetailsAdd, ActivityDetailRoutes.add);
activityRouter.put(Paths.Activities.DetailsUpdate, ActivityDetailRoutes.update);
activityRouter.delete(Paths.Activities.DetailsDelete, ActivityDetailRoutes.delete);

activityRouter.get(Paths.Activities.PaymentSummary, admin, PaymentRoutes.getSummary);
activityRouter.get(Paths.Activities.PaymentsList, admin, PaymentRoutes.listByActivity);
activityRouter.post(Paths.Activities.PaymentsApplyBalance, admin, PaymentRoutes.applyBalance);
activityRouter.post(Paths.Activities.PaymentsAdd, admin, PaymentRoutes.record);
activityRouter.delete(Paths.Activities.PaymentsDelete, admin, PaymentRoutes.delete);
apiRouter.use(Paths.Activities._, activityRouter);

/******************************************************************************
                                Auth
******************************************************************************/

const authRouter = Router();
authRouter.post(Paths.Auth.Login, rateLimiters.loginByIp, rateLimiters.login, AuthRoutes.login);
authRouter.post(Paths.Auth.Refresh, rateLimiters.public, AuthRoutes.refresh);
authRouter.get(Paths.Auth.Logout, rateLimiters.public, AuthRoutes.logout);
authRouter.post(Paths.Auth.Register, rateLimiters.register, AuthRoutes.register);
authRouter.get(Paths.Auth.Check, rateLimiters.public, AuthRoutes.check);
authRouter.get(Paths.Auth.VerifyEmail, rateLimiters.public, AuthRoutes.verifyEmail);
authRouter.post(Paths.Auth.ForgotPassword, rateLimiters.forgotPassword, AuthRoutes.forgotPassword);
authRouter.post(Paths.Auth.ResetPassword, rateLimiters.resetPassword, AuthRoutes.resetPassword);
apiRouter.use(Paths.Auth._, authRouter);

/******************************************************************************
                                Bank Accounts
******************************************************************************/

const bankAccountRouter = Router();
bankAccountRouter.use(auth, rateLimiters.default);
bankAccountRouter.get(Paths.BankAccount.GetAll, admin, BankAccountRoutes.getAll);
bankAccountRouter.get(Paths.BankAccount.GetByUserId, BankAccountRoutes.getByUserId);
bankAccountRouter.post(Paths.BankAccount.Add, BankAccountRoutes.add);
bankAccountRouter.put(Paths.BankAccount.Upsert, BankAccountRoutes.upsert);
bankAccountRouter.delete(Paths.BankAccount.Delete, admin, BankAccountRoutes.delete);
apiRouter.use(Paths.BankAccount._, bankAccountRouter);

/******************************************************************************
                                Chatbot
******************************************************************************/

const chatRouter = Router();
chatRouter.use(auth, rateLimiters.chatbot, rateLimiters.chatbotDaily);
chatRouter.post(Paths.ChatBot.Complete, ChatRoutes.complete);
apiRouter.use(Paths.ChatBot._, chatRouter);

const backupRouter = Router();
backupRouter.get(Paths.Backup.Export, ...adminOnly, BackupRoutes.exportBackup);
backupRouter.post(Paths.Backup.Restore, ...adminOnly, BackupRoutes.restore);
apiRouter.use(Paths.Backup._, backupRouter);

/******************************************************************************
                                Export
******************************************************************************/

export default apiRouter;