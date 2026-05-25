import { Router } from 'express';

import Paths from '@src/common/constants/Paths';

import ActivityDetailRoutes from './ActivityDetailRoutes';
import ActivityRoutes from './ActivityRoutes';
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

const userRouter = Router();
userRouter.use(authMiddleware.auth);
userRouter.get(Paths.Users.Get, UserRoutes.getAll);
userRouter.get(Paths.Users.Search, UserRoutes.search);
userRouter.post(Paths.Users.Add, UserRoutes.add);
userRouter.put(Paths.Users.Update, UserRoutes.update);
userRouter.delete(Paths.Users.Delete, UserRoutes.delete);
apiRouter.use(Paths.Users._, userRouter);

const salaryRouter = Router();
salaryRouter.use(authMiddleware.auth);
salaryRouter.get(Paths.Salaries.GetByUserId, SalaryRoutes.getByUserId);
salaryRouter.get(Paths.Salaries.GetOne, SalaryRoutes.getOne);
salaryRouter.post(Paths.Salaries.Add, SalaryRoutes.add);
salaryRouter.put(Paths.Salaries.Update, SalaryRoutes.update);
salaryRouter.delete(Paths.Salaries.Delete, SalaryRoutes.delete);
apiRouter.use(Paths.Salaries._, salaryRouter);

const productRouter = Router();
productRouter.get(Paths.Products.Get, ProductRoutes.getAll);
productRouter.get(Paths.Products.GetOne, ProductRoutes.getOne);
productRouter.post(Paths.Products.Add, ProductRoutes.add);
productRouter.put(Paths.Products.Update, ProductRoutes.update);
productRouter.delete(Paths.Products.Delete, ProductRoutes.delete);
apiRouter.use(Paths.Products._, productRouter);

const locationRouter = Router();
locationRouter.get(Paths.Locations.Get, LocationRoutes.getAll);
locationRouter.get(Paths.Locations.GetOne, LocationRoutes.getOne);
locationRouter.post(Paths.Locations.Add, LocationRoutes.add);
locationRouter.put(Paths.Locations.Update, LocationRoutes.update);
locationRouter.delete(Paths.Locations.Delete, LocationRoutes.delete);
locationRouter.post(Paths.Locations.SyncCanTho, LocationRoutes.syncCanTho);
apiRouter.use(Paths.Locations._, locationRouter);

const customerRouter = Router();
customerRouter.get(Paths.Customers.Get, CustomerRoutes.getAll);
customerRouter.get(Paths.Customers.GetOne, CustomerRoutes.getOne);
customerRouter.post(Paths.Customers.Add, CustomerRoutes.add);
customerRouter.put(Paths.Customers.Update, CustomerRoutes.update);
customerRouter.delete(Paths.Customers.Delete, CustomerRoutes.delete);
apiRouter.use(Paths.Customers._, customerRouter);

const invoiceRouter = Router();
invoiceRouter.get(Paths.Invoices.Get, InvoiceRoutes.getAll);
invoiceRouter.get(Paths.Invoices.GetOne, InvoiceRoutes.getOne);
invoiceRouter.post(Paths.Invoices.Add, InvoiceRoutes.add);
invoiceRouter.put(Paths.Invoices.Update, InvoiceRoutes.update);
invoiceRouter.delete(Paths.Invoices.Delete, InvoiceRoutes.delete);
apiRouter.use(Paths.Invoices._, invoiceRouter);

const orderStatusRouter = Router();
orderStatusRouter.get(Paths.OrderStatuses.Get, OrderStatusRoutes.getAll);
apiRouter.use(Paths.OrderStatuses._, orderStatusRouter);

const activityRouter = Router();
activityRouter.get(Paths.Activities.Get, ActivityRoutes.getAll);
activityRouter.post(Paths.Activities.DetailsAdd, ActivityDetailRoutes.add);
activityRouter.put(Paths.Activities.DetailsUpdate, ActivityDetailRoutes.update);
activityRouter.delete(
  Paths.Activities.DetailsDelete,
  ActivityDetailRoutes.delete,
);
activityRouter.get(Paths.Activities.DetailsGet, ActivityDetailRoutes.getByActivity);
activityRouter.post(Paths.Activities.Confirm, ActivityRoutes.confirm);
activityRouter.post(Paths.Activities.AdvanceStatus, ActivityRoutes.advanceStatus);
activityRouter.get(Paths.Activities.GetOne, ActivityRoutes.getOne);
activityRouter.post(Paths.Activities.Add, ActivityRoutes.add);
activityRouter.put(Paths.Activities.Update, ActivityRoutes.update);
activityRouter.delete(Paths.Activities.Delete, ActivityRoutes.delete);
apiRouter.use(Paths.Activities._, activityRouter);

const authRouter = Router();
authRouter.post(Paths.Auth.Login, AuthRoutes.login);
authRouter.get(Paths.Auth.Refresh, AuthRoutes.refresh);
authRouter.get(Paths.Auth.Logout, AuthRoutes.logout);
authRouter.post(Paths.Auth.Register, AuthRoutes.register)
apiRouter.use(Paths.Auth._, authRouter);


/******************************************************************************
                                Export
******************************************************************************/

export default apiRouter;
