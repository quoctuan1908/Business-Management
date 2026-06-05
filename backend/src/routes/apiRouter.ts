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

/******************************************************************************
                                Setup
******************************************************************************/

const apiRouter = Router();

const auth = authMiddleware.auth;
const adminOnly = [auth, authMiddleware.authorize(Roles.ADMIN)];

const userRouter = Router();
userRouter.get(Paths.Users.Get, adminOnly, UserRoutes.getAll);
userRouter.get(Paths.Users.Search, adminOnly, UserRoutes.search);
userRouter.post(Paths.Users.Add, adminOnly, UserRoutes.add);
userRouter.put(Paths.Users.Update, adminOnly, UserRoutes.update);
userRouter.delete(Paths.Users.Delete, adminOnly, UserRoutes.delete);
userRouter.get(Paths.Users.GetOne, UserRoutes.getOne);

userRouter.get(Paths.Users.StatsOverview, UserRoutes.getOverviewStats);
userRouter.get(Paths.Users.StatsMonthly, UserRoutes.getMonthlyStats);
userRouter.get(Paths.Users.StatsLocations, UserRoutes.getLocationStats);
userRouter.get(Paths.Users.StatsTopProducts, UserRoutes.getTopProducts);
userRouter.get(Paths.Users.StatsStatusBreakdown, UserRoutes.getStatusBreakdown);
userRouter.get(Paths.Users.StatsRecentSales, UserRoutes.getRecentSalesTimeline);
userRouter.get(Paths.Users.StatsSellerOverview, UserRoutes.getSellerOverviewStats);
userRouter.get(Paths.Users.StatsSellerMonthly, UserRoutes.getSellerMonthlyStats);
userRouter.get(Paths.Users.StatsSellerTopDebtors, UserRoutes.getEmployeeTopDebtors);
userRouter.get(Paths.Users.StatsShipperOverview, UserRoutes.getShipperOverviewStats);
userRouter.get(Paths.Users.StatsShipperMonthly, UserRoutes.getShipperMonthlyStats);
apiRouter.use(Paths.Users._, userRouter);

const salaryRouter = Router();
salaryRouter.use(...adminOnly);
salaryRouter.get(Paths.Salaries.GetAll, SalaryRoutes.getAll);
salaryRouter.get(Paths.Salaries.GetByUserId, SalaryRoutes.getByUserId);
salaryRouter.get(Paths.Salaries.GetOne, SalaryRoutes.getOne);
salaryRouter.post(Paths.Salaries.Add, SalaryRoutes.add);
salaryRouter.put(Paths.Salaries.Update, SalaryRoutes.update);
salaryRouter.delete(Paths.Salaries.Delete, SalaryRoutes.delete);
apiRouter.use(Paths.Salaries._, salaryRouter);

const productRouter = Router();
productRouter.get(Paths.Products.Get, auth, ProductRoutes.getAll);
productRouter.get(Paths.Products.GetOne, auth, ProductRoutes.getOne);
productRouter.post(Paths.Products.Add, ...adminOnly, ProductRoutes.add);
productRouter.put(Paths.Products.Update, ...adminOnly, ProductRoutes.update);
productRouter.delete(Paths.Products.Delete, ...adminOnly, ProductRoutes.delete);
apiRouter.use(Paths.Products._, productRouter);

const locationRouter = Router();
locationRouter.get(Paths.Locations.Get, auth, LocationRoutes.getAll);
locationRouter.get(Paths.Locations.GetOne, auth, LocationRoutes.getOne);
locationRouter.post(Paths.Locations.Add, ...adminOnly, LocationRoutes.add);
locationRouter.put(Paths.Locations.Update, ...adminOnly, LocationRoutes.update);
locationRouter.delete(Paths.Locations.Delete, ...adminOnly, LocationRoutes.delete);
locationRouter.post(Paths.Locations.SyncCanTho, ...adminOnly, LocationRoutes.syncCanTho);
apiRouter.use(Paths.Locations._, locationRouter);

const customerRouter = Router();
customerRouter.get(Paths.Customers.Get, auth, CustomerRoutes.getAll);
customerRouter.get(Paths.Customers.GetOne, auth, CustomerRoutes.getOne);
customerRouter.get(Paths.Customers.Account, ...adminOnly, CustomerRoutes.getAccount);
customerRouter.post(
  Paths.Customers.ReceivePayment,
  ...adminOnly,
  CustomerRoutes.receivePayment,
);
customerRouter.post(Paths.Customers.Add, ...adminOnly, CustomerRoutes.add);
customerRouter.put(Paths.Customers.Update, ...adminOnly, CustomerRoutes.update);
customerRouter.delete(Paths.Customers.Delete, ...adminOnly, CustomerRoutes.delete);
apiRouter.use(Paths.Customers._, customerRouter);

const invoiceRouter = Router();
invoiceRouter.use(...adminOnly);
invoiceRouter.get(Paths.Invoices.Get, InvoiceRoutes.getAll);
invoiceRouter.get(Paths.Invoices.GetOne, InvoiceRoutes.getOne);
invoiceRouter.post(Paths.Invoices.Add, InvoiceRoutes.add);
invoiceRouter.put(Paths.Invoices.Update, InvoiceRoutes.update);
invoiceRouter.delete(Paths.Invoices.Delete, InvoiceRoutes.delete);
apiRouter.use(Paths.Invoices._, invoiceRouter);

const orderStatusRouter = Router();
orderStatusRouter.get(Paths.OrderStatuses.Get, auth, OrderStatusRoutes.getAll);
apiRouter.use(Paths.OrderStatuses._, orderStatusRouter);

const activityRouter = Router();
activityRouter.get(Paths.Activities.Get, auth, ActivityRoutes.getAll);
activityRouter.get(Paths.Activities.GetOne, auth, ActivityRoutes.getOne);
activityRouter.post(Paths.Activities.Add, auth, ActivityRoutes.add);
activityRouter.put(Paths.Activities.Update, auth, ActivityRoutes.update);
activityRouter.delete(Paths.Activities.Delete, ...adminOnly, ActivityRoutes.delete);
activityRouter.post(Paths.Activities.Confirm, ...adminOnly, ActivityRoutes.confirm);
activityRouter.post(
  Paths.Activities.AdvanceStatus,
  ...adminOnly,
  ActivityRoutes.advanceStatus,
);
activityRouter.get(
  Paths.Activities.DetailsGet,
  auth,
  ActivityDetailRoutes.getByActivity,
);
activityRouter.post(Paths.Activities.DetailsAdd, auth, ActivityDetailRoutes.add);
activityRouter.put(
  Paths.Activities.DetailsUpdate,
  auth,
  ActivityDetailRoutes.update,
);
activityRouter.delete(
  Paths.Activities.DetailsDelete,
  auth,
  ActivityDetailRoutes.delete,
);
activityRouter.get(
  Paths.Activities.PaymentSummary,
  ...adminOnly,
  PaymentRoutes.getSummary,
);
activityRouter.get(
  Paths.Activities.PaymentsList,
  ...adminOnly,
  PaymentRoutes.listByActivity,
);
activityRouter.post(
  Paths.Activities.PaymentsApplyBalance,
  ...adminOnly,
  PaymentRoutes.applyBalance,
);
activityRouter.post(Paths.Activities.PaymentsAdd, ...adminOnly, PaymentRoutes.record);
activityRouter.delete(
  Paths.Activities.PaymentsDelete,
  ...adminOnly,
  PaymentRoutes.delete,
);
apiRouter.use(Paths.Activities._, activityRouter);

const authRouter = Router();
authRouter.post(Paths.Auth.Login, AuthRoutes.login);
authRouter.post(Paths.Auth.Refresh, AuthRoutes.refresh);
authRouter.get(Paths.Auth.Logout, AuthRoutes.logout);
authRouter.post(Paths.Auth.Register, AuthRoutes.register);
authRouter.get(Paths.Auth.Check, AuthRoutes.check);
apiRouter.use(Paths.Auth._, authRouter);

/******************************************************************************
                                Export
******************************************************************************/

export default apiRouter;
